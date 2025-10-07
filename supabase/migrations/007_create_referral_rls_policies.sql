-- =====================================================
-- ROW LEVEL SECURITY POLICIES - REFERRAL SYSTEM
-- Fecha: 6 de octubre de 2025
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE referral_program_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrers ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_commissions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS: referral_program_config
-- =====================================================

-- Todos pueden leer la configuración
CREATE POLICY "Anyone can read config"
  ON referral_program_config
  FOR SELECT
  USING (true);

-- Solo admins pueden modificar
CREATE POLICY "Only admins can modify config"
  ON referral_program_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- =====================================================
-- POLÍTICAS: referrers
-- =====================================================

-- Admins pueden ver todos los referidores
CREATE POLICY "Admins can view all referrers"
  ON referrers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Los referidores pueden ver su propia info
CREATE POLICY "Referrers can view own info"
  ON referrers
  FOR SELECT
  USING (user_id = auth.uid());

-- Solo admins pueden crear/modificar referidores
CREATE POLICY "Only admins can manage referrers"
  ON referrers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- =====================================================
-- POLÍTICAS: referrals
-- =====================================================

-- Admins pueden ver todas las referencias
CREATE POLICY "Admins can view all referrals"
  ON referrals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Los referidores pueden ver sus propias referencias
CREATE POLICY "Referrers can view own referrals"
  ON referrals
  FOR SELECT
  USING (
    referrer_id IN (
      SELECT id FROM referrers WHERE user_id = auth.uid()
    )
  );

-- Solo admins pueden crear/modificar referencias
CREATE POLICY "Only admins can manage referrals"
  ON referrals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- =====================================================
-- POLÍTICAS: referral_commissions
-- =====================================================

-- Admins pueden ver todas las comisiones
CREATE POLICY "Admins can view all commissions"
  ON referral_commissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Los referidores pueden ver sus propias comisiones
CREATE POLICY "Referrers can view own commissions"
  ON referral_commissions
  FOR SELECT
  USING (
    referrer_id IN (
      SELECT id FROM referrers WHERE user_id = auth.uid()
    )
  );

-- Las comisiones se crean automáticamente por trigger
CREATE POLICY "Only triggers can create commissions"
  ON referral_commissions
  FOR INSERT
  WITH CHECK (false);

-- Solo admins pueden modificar comisiones (casos especiales)
CREATE POLICY "Only admins can modify commissions"
  ON referral_commissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
