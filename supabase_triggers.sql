-- ==========================================
-- TRIGGER: Sincronizar usuarios de Auth con tabla users
-- ==========================================
-- Este trigger se ejecuta automáticamente cuando:
-- 1. Se crea un nuevo usuario en auth.users (registro)
-- 2. Se actualiza el user_metadata de un usuario

-- PASO 1: Crear la función que maneja la sincronización
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar el usuario en la tabla public.users
  -- Combinando first_name y last_name en full_name
  INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data->>'first_name' || ' ' || NEW.raw_user_meta_data->>'last_name'),
      (NEW.raw_user_meta_data->>'full_name'),
      ''
    ),
    'customer',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(
      (NEW.raw_user_meta_data->>'first_name' || ' ' || NEW.raw_user_meta_data->>'last_name'),
      (NEW.raw_user_meta_data->>'full_name'),
      public.users.full_name
    ),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 2: Crear el trigger en auth.users
-- Se ejecuta DESPUÉS de INSERT o UPDATE
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- MIGRACIÓN: Actualizar usuarios existentes
-- ==========================================
-- Este script actualiza los usuarios que ya existen
-- y que no tienen full_name en la tabla users

-- Actualizar usuarios existentes desde auth.users
UPDATE public.users
SET full_name = COALESCE(
  (
    SELECT 
      COALESCE(
        (auth_users.raw_user_meta_data->>'first_name' || ' ' || auth_users.raw_user_meta_data->>'last_name'),
        (auth_users.raw_user_meta_data->>'full_name'),
        SPLIT_PART(auth_users.email, '@', 1)
      )
    FROM auth.users auth_users
    WHERE auth_users.id = users.id
  ),
  full_name
)
WHERE full_name IS NULL OR full_name = '';

-- ==========================================
-- VERIFICACIÓN
-- ==========================================
-- Ejecutar estas queries para verificar que funciona:

-- 1. Ver usuarios en auth con su metadata
-- SELECT 
--   id,
--   email,
--   raw_user_meta_data->>'first_name' as first_name,
--   raw_user_meta_data->>'last_name' as last_name,
--   raw_user_meta_data->>'full_name' as full_name_meta,
--   created_at
-- FROM auth.users
-- ORDER BY created_at DESC
-- LIMIT 10;

-- 2. Ver usuarios en public.users con full_name
-- SELECT 
--   id,
--   email,
--   full_name,
--   role,
--   created_at
-- FROM public.users
-- ORDER BY created_at DESC
-- LIMIT 10;

-- 3. Ver si hay usuarios sin full_name
-- SELECT COUNT(*)
-- FROM public.users
-- WHERE full_name IS NULL OR full_name = '';
