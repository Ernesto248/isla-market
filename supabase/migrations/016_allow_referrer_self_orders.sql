-- =====================================================
-- PERMITIR PEDIDOS DE REFERIDORES PROPIOS
-- Fecha: 8 de noviembre de 2025
-- Descripción: Permitir que los referidores hagan pedidos
--              y se asignen sus propias comisiones
-- =====================================================

-- =====================================================
-- 0. Agregar columna faltante si no existe
-- =====================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referrers' AND column_name = 'last_commission_at'
  ) THEN
    ALTER TABLE referrers ADD COLUMN last_commission_at TIMESTAMP;
  END IF;
END $$;

-- =====================================================
-- 1. Modificar trigger para permitir auto-referencia
-- =====================================================
DROP TRIGGER IF EXISTS trg_prevent_self_referral ON referrals;
DROP FUNCTION IF EXISTS prevent_self_referral();

-- Nueva función que permite auto-referencia
CREATE OR REPLACE FUNCTION validate_referral()
RETURNS TRIGGER AS $$
DECLARE
  referrer_user_id UUID;
BEGIN
  -- Obtener el user_id del referidor
  SELECT user_id INTO referrer_user_id
  FROM referrers
  WHERE id = NEW.referrer_id;
  
  -- Ya no validamos auto-referencia, permitimos que un referidor
  -- se referencie a sí mismo para sus propias órdenes
  
  -- Solo validamos que el referidor existe y está activo
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Referidor no encontrado';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_referral
  BEFORE INSERT OR UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION validate_referral();

-- =====================================================
-- 2. Función para auto-asignar referidor en primera orden
-- =====================================================
CREATE OR REPLACE FUNCTION auto_assign_referrer_on_order()
RETURNS TRIGGER AS $$
DECLARE
  referrer_record RECORD;
  existing_referral RECORD;
BEGIN
  -- Solo procesar en INSERT de órdenes
  IF TG_OP = 'INSERT' THEN
    
    -- Verificar si el usuario es un referidor activo
    SELECT * INTO referrer_record
    FROM referrers
    WHERE user_id = NEW.user_id
      AND is_active = true;
    
    -- Si es un referidor activo
    IF FOUND THEN
      -- Verificar si ya existe una relación de auto-referencia
      SELECT * INTO existing_referral
      FROM referrals
      WHERE referrer_id = referrer_record.id
        AND referred_user_id = NEW.user_id;
      
      -- Si no existe, crear la auto-referencia
      IF NOT FOUND THEN
        INSERT INTO referrals (
          referrer_id,
          referred_user_id,
          referral_code,
          commission_rate,
          expires_at,
          is_active
        ) VALUES (
          referrer_record.id,
          NEW.user_id,
          referrer_record.referral_code,
          referrer_record.commission_rate,
          NOW() + (referrer_record.duration_months || ' months')::INTERVAL,
          true
        );
        
        -- Log para debugging
        RAISE NOTICE 'Auto-referencia creada para referidor: % (código: %)', 
          NEW.user_id, referrer_record.referral_code;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger que se ejecuta ANTES de crear comisiones
-- Esto asegura que la auto-referencia existe antes de calcular comisiones
CREATE TRIGGER trg_auto_assign_referrer_on_order
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_referrer_on_order();

-- =====================================================
-- 3. Crear auto-referencias para referidores existentes
-- =====================================================
-- Este script crea automáticamente relaciones de auto-referencia
-- para todos los referidores activos que aún no tienen una

INSERT INTO referrals (
  referrer_id,
  referred_user_id,
  referral_code,
  commission_rate,
  expires_at,
  is_active
)
SELECT 
  r.id as referrer_id,
  r.user_id as referred_user_id,
  r.referral_code,
  r.commission_rate,
  NOW() + (r.duration_months || ' months')::INTERVAL as expires_at,
  true as is_active
FROM referrers r
WHERE r.is_active = true
  AND NOT EXISTS (
    SELECT 1 
    FROM referrals ref 
    WHERE ref.referrer_id = r.id 
      AND ref.referred_user_id = r.user_id
  );

-- =====================================================
-- 4. Comentarios y documentación
-- =====================================================
COMMENT ON FUNCTION auto_assign_referrer_on_order() IS 
  'Crea automáticamente una auto-referencia cuando un referidor hace su primera orden. 
   Esto permite que los referidores ganen comisiones en sus propias compras.';

COMMENT ON FUNCTION validate_referral() IS 
  'Valida que el referidor existe. Permite auto-referencias para que los referidores 
   puedan hacer pedidos y ganar sus propias comisiones.';

