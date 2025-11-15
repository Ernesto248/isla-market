-- =====================================================
-- PREVENIR COMISIONES EN ÓRDENES YA PAGADAS
-- Fecha: 15 de noviembre de 2025
-- Descripción: Evitar que órdenes que YA están en estado
--              "pagado" o "entregado" reciban comisiones
--              cuando se les asigna un nuevo referidor
-- =====================================================

CREATE OR REPLACE FUNCTION create_referral_commission()
RETURNS TRIGGER AS $$
DECLARE
  referral_record RECORD;
  existing_commission_id UUID;
BEGIN
  -- IMPORTANTE: Solo procesar si el estado CAMBIÓ a "pagado" o "entregado"
  -- NO procesar si ya estaba en esos estados (evita reasignaciones)
  IF TG_OP = 'UPDATE' AND OLD.status IN ('pagado', 'entregado') THEN
    -- Si la orden YA estaba pagada/entregada, NO hacer nada
    RAISE NOTICE 'Orden % ya estaba en estado %, no se crea/modifica comisión', 
      NEW.id, OLD.status;
    RETURN NEW;
  END IF;
  
  -- Solo procesar cuando el estado es pagado o entregado
  IF NEW.status NOT IN ('pagado', 'entregado') THEN
    RETURN NEW;
  END IF;
  
  -- Verificar si ya existe una comisión para esta orden
  -- Si existe, NO crear otra (protección extra además de ON CONFLICT)
  SELECT id INTO existing_commission_id
  FROM referral_commissions
  WHERE order_id = NEW.id
  LIMIT 1;
  
  IF existing_commission_id IS NOT NULL THEN
    RAISE NOTICE 'Orden % ya tiene comisión existente (%), no se crea nueva', 
      NEW.id, existing_commission_id;
    RETURN NEW;
  END IF;
  
  -- Buscar si el usuario que hizo la orden tiene un referidor activo
  SELECT r.*, rf.user_id as referrer_user_id
  INTO referral_record
  FROM referrals r
  JOIN referrers rf ON r.referrer_id = rf.id
  WHERE r.referred_user_id = NEW.user_id
    AND r.is_active = true
    AND r.expires_at > NOW()
    AND rf.is_active = true
  LIMIT 1;
  
  -- Si NO existe un referidor válido, no crear comisión
  IF NOT FOUND THEN
    RAISE NOTICE 'Orden % del usuario % no tiene referidor activo válido', 
      NEW.id, NEW.user_id;
    RETURN NEW;
  END IF;
  
  -- Crear la comisión (solo si pasó todas las validaciones anteriores)
  INSERT INTO referral_commissions (
    referral_id,
    referrer_id,
    order_id,
    referred_user_id,
    order_total,
    commission_rate,
    commission_amount
  ) VALUES (
    referral_record.id,
    referral_record.referrer_id,
    NEW.id,
    NEW.user_id,
    NEW.total_amount,
    referral_record.commission_rate,
    NEW.total_amount * (referral_record.commission_rate / 100)
  )
  ON CONFLICT (order_id) DO NOTHING;
  
  -- Actualizar estadísticas de la referencia
  UPDATE referrals
  SET 
    total_orders = total_orders + 1,
    total_spent = total_spent + NEW.total_amount,
    total_commission_generated = total_commission_generated + 
      (NEW.total_amount * (referral_record.commission_rate / 100)),
    last_order_at = NOW()
  WHERE id = referral_record.id;
  
  RAISE NOTICE 'Comisión creada exitosamente para orden % (%.2f CUP, comisión: %.2f CUP)', 
    NEW.id, 
    NEW.total_amount,
    NEW.total_amount * (referral_record.commission_rate / 100);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger
DROP TRIGGER IF EXISTS trg_create_referral_commission ON orders;
CREATE TRIGGER trg_create_referral_commission
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_referral_commission();

COMMENT ON FUNCTION create_referral_commission() IS 
  'Crea comisión SOLO cuando una orden CAMBIA su estado a pagado/entregado. 
   NO crea comisiones si la orden YA estaba pagada/entregada (evita que 
   asignar un nuevo referidor genere comisiones en órdenes antiguas pagadas).';
