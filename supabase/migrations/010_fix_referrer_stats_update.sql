-- =====================================================
-- FIX: Actualizar estadísticas de referidores desde comisiones
-- Fecha: 7 de octubre de 2025
-- =====================================================

-- Crear función para actualizar estadísticas del referidor desde comisiones
CREATE OR REPLACE FUNCTION update_referrer_stats_from_commission()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar estadísticas del referidor sumando todas sus comisiones
  UPDATE referrers r
  SET 
    total_orders = (
      SELECT COUNT(DISTINCT rc.order_id) 
      FROM referral_commissions rc 
      WHERE rc.referrer_id = r.id
    ),
    total_sales = (
      SELECT COALESCE(SUM(rc.order_total), 0) 
      FROM referral_commissions rc 
      WHERE rc.referrer_id = r.id
    ),
    total_commissions = (
      SELECT COALESCE(SUM(rc.commission_amount), 0) 
      FROM referral_commissions rc 
      WHERE rc.referrer_id = r.id
    )
  WHERE r.id = NEW.referrer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger que se ejecute después de insertar una comisión
DROP TRIGGER IF EXISTS trg_update_referrer_stats_from_commission ON referral_commissions;
CREATE TRIGGER trg_update_referrer_stats_from_commission
  AFTER INSERT ON referral_commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_referrer_stats_from_commission();

-- Actualizar manualmente las estadísticas de todos los referidores existentes
UPDATE referrers r
SET 
  total_orders = (
    SELECT COUNT(DISTINCT rc.order_id) 
    FROM referral_commissions rc 
    WHERE rc.referrer_id = r.id
  ),
  total_sales = (
    SELECT COALESCE(SUM(rc.order_total), 0) 
    FROM referral_commissions rc 
    WHERE rc.referrer_id = r.id
  ),
  total_commissions = (
    SELECT COALESCE(SUM(rc.commission_amount), 0) 
    FROM referral_commissions rc 
    WHERE rc.referrer_id = r.id
  );

-- Actualizar total_referrals basado en la tabla referrals
UPDATE referrers r
SET 
  total_referrals = (
    SELECT COUNT(*) 
    FROM referrals rf 
    WHERE rf.referrer_id = r.id
  ),
  active_referrals = (
    SELECT COUNT(*) 
    FROM referrals rf 
    WHERE rf.referrer_id = r.id 
      AND rf.is_active = true 
      AND rf.expires_at > NOW()
  );
