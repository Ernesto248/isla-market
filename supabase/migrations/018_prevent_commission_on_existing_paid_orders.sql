-- =====================================================
-- PREVENIR COMISIONES EN ÓRDENES YA PAGADAS
-- Fecha: 15 de noviembre de 2025
-- Descripción: Evitar que se creen comisiones para órdenes
--              que ya estaban en estado "pagado" o "entregado"
--              al momento de asignar un nuevo referidor
-- =====================================================

-- Recrear función con validación mejorada
CREATE OR REPLACE FUNCTION create_referral_commission()
RETURNS TRIGGER AS $$
DECLARE
  referral_record RECORD;
  existing_commission_id UUID;
BEGIN
  -- Solo procesar si:
  -- 1. Es un INSERT y el nuevo estado es pagado/entregado, O
  -- 2. Es un UPDATE y el estado cambió DESDE otro estado HACIA pagado/entregado
  IF (TG_OP = 'INSERT' AND NEW.status IN ('pagado', 'entregado')) OR
     (TG_OP = 'UPDATE' AND NEW.status IN ('pagado', 'entregado') AND OLD.status NOT IN ('pagado', 'entregado')) THEN
    
    -- IMPORTANTE: Verificar si ya existe una comisión para esta orden
    -- Esto previene que órdenes que ya estaban pagadas (pero sin referidor)
    -- generen comisiones al asignar un nuevo referidor posteriormente
    SELECT id INTO existing_commission_id
    FROM referral_commissions
    WHERE order_id = NEW.id
    LIMIT 1;
    
    -- Si ya existe una comisión, no hacer nada
    IF existing_commission_id IS NOT NULL THEN
      RAISE NOTICE 'Orden % ya tiene comisión asignada (%), no se crea nueva', 
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
    
    -- Si existe un referidor válido, crear la comisión
    IF FOUND THEN
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
        total_commission_generated = total_commission_generated + (NEW.total_amount * (referral_record.commission_rate / 100)),
        last_order_at = NOW()
      WHERE id = referral_record.id;
      
      RAISE NOTICE 'Comisión creada para orden %, referrer: %, monto: %', 
        NEW.id, referral_record.referrer_id, NEW.total_amount * (referral_record.commission_rate / 100);
    ELSE
      RAISE NOTICE 'Orden % no tiene referidor activo, no se crea comisión', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear trigger
DROP TRIGGER IF EXISTS trg_create_referral_commission ON orders;
CREATE TRIGGER trg_create_referral_commission
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_referral_commission();

-- =====================================================
-- Documentación
-- =====================================================
COMMENT ON FUNCTION create_referral_commission() IS 
  'Crea comisión cuando una orden cambia a estado pagado/entregado.
   Verifica explícitamente que NO exista ya una comisión para la orden,
   evitando que órdenes pagadas sin referidor generen comisiones al
   asignar un nuevo referidor posteriormente.
   Solo procesa transiciones de estado: pendiente/cancelado -> pagado/entregado';
