-- =====================================================
-- TRIGGERS PARA SISTEMA DE REFERIDOS
-- Fecha: 6 de octubre de 2025
-- =====================================================

-- =====================================================
-- 1. TRIGGER: Prevenir auto-referencia
-- =====================================================
CREATE OR REPLACE FUNCTION prevent_self_referral()
RETURNS TRIGGER AS $$
DECLARE
  referrer_user_id UUID;
BEGIN
  -- Obtener el user_id del referidor
  SELECT user_id INTO referrer_user_id
  FROM referrers
  WHERE id = NEW.referrer_id;
  
  -- Verificar que no sea el mismo usuario
  IF referrer_user_id = NEW.referred_user_id THEN
    RAISE EXCEPTION 'Un usuario no puede referirse a sí mismo';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_self_referral
  BEFORE INSERT OR UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_referral();

-- =====================================================
-- 2. TRIGGER: Calcular fecha de expiración automática
-- =====================================================
CREATE OR REPLACE FUNCTION set_referral_expiry()
RETURNS TRIGGER AS $$
DECLARE
  duration INTEGER;
BEGIN
  -- Obtener duration_months del referidor
  SELECT duration_months INTO duration
  FROM referrers
  WHERE id = NEW.referrer_id;
  
  -- Calcular expires_at
  NEW.expires_at := NEW.created_at + (duration || ' months')::INTERVAL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_referral_expiry
  BEFORE INSERT ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION set_referral_expiry();

-- =====================================================
-- 3. TRIGGER: Actualizar estadísticas del referidor
-- =====================================================
CREATE OR REPLACE FUNCTION update_referrer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Nueva referencia: incrementar contadores
    UPDATE referrers
    SET 
      total_referrals = total_referrals + 1,
      active_referrals = active_referrals + 1
    WHERE id = NEW.referrer_id;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Si cambió is_active, ajustar contadores
    IF OLD.is_active != NEW.is_active THEN
      UPDATE referrers
      SET active_referrals = active_referrals + CASE WHEN NEW.is_active THEN 1 ELSE -1 END
      WHERE id = NEW.referrer_id;
    END IF;
    
    -- Actualizar estadísticas de ventas
    IF OLD.total_orders != NEW.total_orders OR 
       OLD.total_spent != NEW.total_spent OR 
       OLD.total_commission_generated != NEW.total_commission_generated THEN
      
      UPDATE referrers r
      SET 
        total_orders = (SELECT COALESCE(SUM(total_orders), 0) FROM referrals WHERE referrer_id = r.id),
        total_sales = (SELECT COALESCE(SUM(total_spent), 0) FROM referrals WHERE referrer_id = r.id),
        total_commissions = (SELECT COALESCE(SUM(total_commission_generated), 0) FROM referrals WHERE referrer_id = r.id)
      WHERE r.id = NEW.referrer_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_referrer_stats
  AFTER INSERT OR UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_referrer_stats();

-- =====================================================
-- 4. TRIGGER: Crear comisión cuando orden se marca como "pagado"
-- =====================================================
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

CREATE TRIGGER trg_create_referral_commission
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_referral_commission();
