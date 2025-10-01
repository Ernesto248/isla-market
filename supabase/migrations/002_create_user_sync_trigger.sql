-- =====================================================
-- Migration: Crear trigger para sincronizar usuarios
-- =====================================================
-- Este trigger copia automáticamente los datos de auth.users 
-- a public.users cuando un nuevo usuario se registra

-- Paso 1: Crear la función que maneja nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    TRIM(CONCAT(
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      ' ',
      COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    )),
    'customer'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Paso 2: Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Paso 3: Crear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Paso 4: Agregar comentarios para documentación
COMMENT ON FUNCTION public.handle_new_user() IS 
  'Automatically creates/updates a user record in public.users when a new user signs up in auth.users. Extracts first_name and last_name from raw_user_meta_data to build full_name.';

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 
  'Syncs new auth users to public.users table with their full name from metadata';

-- =====================================================
-- Verificación (opcional)
-- =====================================================
-- Puedes ejecutar esto después para verificar que el trigger existe:
-- SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';
