# 🗄️ Migraciones de Base de Datos - Supabase

## 📚 Índice de Migraciones

### ✅ 001 - Actualizar Usuarios Existentes (YA EJECUTADO)

**Archivo:** `001_update_existing_users.sql`  
**Estado:** ✅ COMPLETADO  
**Descripción:** Actualiza el campo `full_name` de los usuarios existentes tomando los datos de `auth.users.raw_user_meta_data`

**Resultado:**

- ✅ Ernesto Leonard (ernestoleonard8@gmail.com)
- ✅ Jenifer Casalis (jenicasalis04@icloud.com)

---

### 🔄 002 - Crear Trigger de Sincronización (PENDIENTE)

**Archivo:** `002_create_user_sync_trigger.sql`  
**Estado:** 🔄 PENDIENTE DE EJECUTAR  
**Descripción:** Crea un trigger que automáticamente copia los datos de nuevos usuarios desde `auth.users` a `public.users` cuando se registran

**Lo que hace:**

1. Crea la función `handle_new_user()` que:
   - Extrae `first_name` y `last_name` de `user_metadata`
   - Construye el `full_name` completo
   - Inserta/actualiza el registro en `public.users`
2. Crea el trigger `on_auth_user_created` que se ejecuta automáticamente después de cada registro

---

## 📝 Cómo Ejecutar la Migración 002

### Paso 1: Acceder a Supabase Dashboard

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto: **isla-market**

### Paso 2: Abrir SQL Editor

1. En el menú lateral izquierdo, haz clic en **"SQL Editor"**
2. Haz clic en el botón **"+ New query"** (arriba a la derecha)

### Paso 3: Ejecutar el Script

1. **Copia** todo el contenido del archivo `002_create_user_sync_trigger.sql`
2. **Pégalo** en el editor SQL de Supabase
3. Haz clic en **"Run"** o presiona `Ctrl+Enter` (Windows/Linux) o `Cmd+Enter` (Mac)

### Paso 4: Verificar el Resultado

Deberías ver:

```
Success. No rows returned
```

### Paso 5: Verificar que el Trigger Existe

Ejecuta esta query para verificar:

```sql
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

Deberías ver una fila con el trigger configurado.

---

## 🧪 Cómo Probar que Funciona

### Test 1: Registrar un nuevo usuario

1. Ve a la página de registro de tu app
2. Crea un nuevo usuario con nombre y apellido
3. Inicia sesión
4. Ve a la página de órdenes en el admin
5. ✅ El nombre del usuario debería aparecer correctamente

### Test 2: Verificar en la base de datos

Ejecuta esta query en Supabase SQL Editor:

```sql
SELECT
  u.email,
  u.full_name,
  au.raw_user_meta_data->>'first_name' as metadata_first_name,
  au.raw_user_meta_data->>'last_name' as metadata_last_name
FROM public.users u
JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at DESC
LIMIT 5;
```

Deberías ver que `full_name` coincide con `first_name + last_name` de metadata.

---

## 🔧 Solución de Problemas

### Error: "must be owner of relation users"

**Causa:** No tienes permisos suficientes para crear triggers en `auth.users`

**Solución:**

1. Asegúrate de estar usando el **Service Role Key** (no el anon key)
2. Ejecuta el script desde el SQL Editor de Supabase Dashboard (tiene permisos completos)

### El trigger no se ejecuta

**Verificar que existe:**

```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

**Eliminar y recrear:**

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
-- Luego ejecuta de nuevo el script 002
```

### Los nuevos usuarios no tienen full_name

**Verificar los metadatos:**

```sql
SELECT id, email, raw_user_meta_data
FROM auth.users
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

Asegúrate de que `raw_user_meta_data` contenga `first_name` y `last_name`.

---

## 📊 Estado Actual

| Migración                        | Estado        | Fecha Ejecución | Notas                            |
| -------------------------------- | ------------- | --------------- | -------------------------------- |
| 001_update_existing_users.sql    | ✅ Completado | 2025-10-01      | Actualizó 2 usuarios existentes  |
| 002_create_user_sync_trigger.sql | 🔄 Pendiente  | -               | Ejecutar manualmente en Supabase |

---

## 💡 Mantenimiento

### Actualizar usuarios manualmente

Si necesitas actualizar el `full_name` de usuarios específicos:

```sql
-- Actualizar un usuario específico
UPDATE public.users
SET full_name = 'Nombre Completo'
WHERE email = 'usuario@ejemplo.com';

-- Actualizar todos los usuarios desde metadata
UPDATE public.users
SET full_name = TRIM(CONCAT(
  (SELECT raw_user_meta_data->>'first_name' FROM auth.users WHERE id = users.id),
  ' ',
  (SELECT raw_user_meta_data->>'last_name' FROM auth.users WHERE id = users.id)
))
WHERE full_name IS NULL OR full_name = '';
```

### Eliminar el trigger

Si necesitas eliminar el trigger (por ejemplo, para actualizarlo):

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
```

---

**Última actualización:** 2025-10-01  
**Responsable:** Sistema de Migraciones Automáticas
