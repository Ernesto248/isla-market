-- =====================================================
-- FIX: Hacer campos opcionales en tabla referrals
-- Fecha: 7 de octubre de 2025
-- Descripción: Los campos referral_code y commission_rate deben ser opcionales
-- ya que se copian del referrer en el momento de creación
-- =====================================================

-- Hacer referral_code y commission_rate NULLABLE
ALTER TABLE referrals 
  ALTER COLUMN referral_code DROP NOT NULL,
  ALTER COLUMN commission_rate DROP NOT NULL;

-- Comentario explicativo
COMMENT ON COLUMN referrals.referral_code IS 'Código del referidor en el momento de creación del referral. Copiado de referrers.referral_code';
COMMENT ON COLUMN referrals.commission_rate IS 'Tasa de comisión del referidor en el momento de creación del referral. Copiado de referrers.commission_rate';
