-- =====================================================
-- REFERRAL PROGRAM - TABLAS PRINCIPALES
-- Fecha: 6 de octubre de 2025
-- Descripción: Sistema de referidos con asignación manual
-- =====================================================

-- 1. Tabla de configuración global del programa
CREATE TABLE IF NOT EXISTS referral_program_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  default_commission_rate DECIMAL(5,2) DEFAULT 3.00,
  default_duration_months INTEGER DEFAULT 6,
  is_program_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insertar configuración por defecto
INSERT INTO referral_program_config (default_commission_rate, default_duration_months, is_program_active)
VALUES (3.00, 6, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. Tabla de referidores
CREATE TABLE IF NOT EXISTS referrers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 3.00 NOT NULL,
  duration_months INTEGER DEFAULT 6 NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT,
  
  total_referrals INTEGER DEFAULT 0,
  active_referrals INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_sales DECIMAL(10,2) DEFAULT 0,
  total_commissions DECIMAL(10,2) DEFAULT 0,
  
  CONSTRAINT referral_code_format CHECK (referral_code ~ '^[A-Z0-9]{6,15}$'),
  CONSTRAINT commission_rate_range CHECK (commission_rate >= 0.01 AND commission_rate <= 50.00),
  CONSTRAINT duration_months_range CHECK (duration_months >= 1 AND duration_months <= 36)
);

CREATE INDEX idx_referrers_user_id ON referrers(user_id);
CREATE INDEX idx_referrers_code ON referrers(referral_code);
CREATE INDEX idx_referrers_active ON referrers(is_active);

-- =====================================================
-- 3. Tabla de relaciones referidor-referido
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES referrers(id) ON DELETE CASCADE NOT NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referral_code VARCHAR(20) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  total_commission_generated DECIMAL(10,2) DEFAULT 0,
  last_order_at TIMESTAMP,
  
  UNIQUE(referrer_id, referred_user_id)
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX idx_referrals_active ON referrals(is_active, expires_at);
CREATE INDEX idx_referrals_code ON referrals(referral_code);

-- =====================================================
-- 4. Tabla de comisiones generadas
CREATE TABLE IF NOT EXISTS referral_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_id UUID REFERENCES referrals(id) ON DELETE CASCADE NOT NULL,
  referrer_id UUID REFERENCES referrers(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  order_total DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(order_id)
);

CREATE INDEX idx_commissions_referrer ON referral_commissions(referrer_id);
CREATE INDEX idx_commissions_referral ON referral_commissions(referral_id);
CREATE INDEX idx_commissions_order ON referral_commissions(order_id);
CREATE INDEX idx_commissions_created ON referral_commissions(created_at);
