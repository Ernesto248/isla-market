-- =====================================================
-- ACTUALIZACIÓN: Corregir trigger de comisiones
-- Fecha: 7 de octubre de 2025
-- Descripción: Cambiar "paid" a "pagado" y "total" a "total_amount"
-- =====================================================

-- Eliminar trigger existente
DROP TRIGGER IF EXISTS trg_create_referral_commission ON orders;

-- Recrear función con valores corregidos
CREATE OR REPLACE FUNCTION create_referral_commission()
RETURNS TRIGGER AS $$
DECLARE
  referral_record RECORD;
BEGIN
  -- Solo procesar si el estado cambió a "pagado"
  IF NEW.status = 'pagado' AND (TG_OP = 'INSERT' OR OLD.status != 'pagado') THEN
    
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
