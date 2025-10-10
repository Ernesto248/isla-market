-- =====================================================
-- ACTUALIZACIÓN: Incluir órdenes "entregado" en comisiones
-- Fecha: 10 de octubre de 2025
-- Descripción: Modificar trigger para incluir status "entregado" además de "pagado"
-- =====================================================

-- Eliminar trigger existente
DROP TRIGGER IF EXISTS trg_create_referral_commission ON orders;

-- Recrear función para incluir status "entregado"
CREATE OR REPLACE FUNCTION create_referral_commission()
RETURNS TRIGGER AS $$
DECLARE
  referral_record RECORD;
BEGIN
  -- Procesar si el estado cambió a "pagado" o "entregado"
  IF (NEW.status IN ('pagado', 'entregado')) AND 
     (TG_OP = 'INSERT' OR OLD.status NOT IN ('pagado', 'entregado')) THEN
    
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
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear trigger
CREATE TRIGGER trg_create_referral_commission
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_referral_commission();

-- =====================================================
-- Actualizar trigger que actualiza estadísticas del referrer
-- =====================================================

-- Recrear función para actualizar estadísticas cuando se crea una comisión
-- incluyendo órdenes "entregado"
CREATE OR REPLACE FUNCTION update_referrer_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar estadísticas del referrer
  UPDATE referrers
  SET 
    total_referrals = (
      SELECT COUNT(DISTINCT referred_user_id)
      FROM referrals
      WHERE referrer_id = NEW.referrer_id
    ),
    total_orders = (
      SELECT COUNT(*)
      FROM referral_commissions
      WHERE referrer_id = NEW.referrer_id
    ),
    total_sales = (
      SELECT COALESCE(SUM(order_total), 0)
      FROM referral_commissions
      WHERE referrer_id = NEW.referrer_id
    ),
    total_commissions = (
      SELECT COALESCE(SUM(commission_amount), 0)
      FROM referral_commissions
      WHERE referrer_id = NEW.referrer_id
    ),
    last_commission_at = NOW()
  WHERE id = NEW.referrer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- El trigger ya existe, no es necesario recrearlo
-- Solo actualizamos la función

