# 🔧 Guía: Sincronizar Nombres de Usuarios

## 📋 Problema Identificado

Los nombres de los usuarios no se están guardando correctamente en la base de datos:

### ❌ **Situación Actual:**

1. Cuando un usuario se registra, su `first_name` y `last_name` se guardan en `user_metadata` de Supabase Auth
2. La tabla `public.users` tiene una columna `full_name`, pero está vacía
3. Las órdenes muestran el username del email en lugar del nombre completo

### ✅ **Situación Deseada:**

1. Al registrarse, el nombre completo debe guardarse en `public.users.full_name`
2. Las órdenes deben mostrar "Ernesto Leonard" en lugar de "ernestoleonard8"

---

## 🎯 Solución: Trigger de Base de Datos

Hemos creado un **trigger automático** en Supabase que:

1. ✅ Se ejecuta cuando un nuevo usuario se registra
2. ✅ Copia `first_name + last_name` del metadata a la tabla `users`
3. ✅ Actualiza usuarios existentes que no tienen `full_name`

---

## 🚀 Pasos para Implementar

### Paso 1: Acceder al SQL Editor de Supabase

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto (isla-market)
3. En el menú lateral, haz clic en **"SQL Editor"**
4. Haz clic en **"New query"**

### Paso 2: Ejecutar el Script SQL

1. Abre el archivo `supabase_triggers.sql` en VS Code
2. **Copia TODO el contenido** del archivo
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **"Run"** (o presiona Cmd/Ctrl + Enter)

Deberías ver un mensaje de éxito:

```
Success. No rows returned
```

### Paso 3: Verificar que Funcionó

Ejecuta esta query en el SQL Editor para ver los usuarios:

```sql
SELECT
  u.id,
  u.email,
  u.full_name,
  u.role,
  au.raw_user_meta_data->>'first_name' as metadata_first_name,
  au.raw_user_meta_data->>'last_name' as metadata_last_name
FROM public.users u
LEFT JOIN auth.users au ON au.id = u.id
ORDER BY u.created_at DESC;
```

**Resultado esperado:**

```
| email                    | full_name        | metadata_first_name | metadata_last_name |
|--------------------------|------------------|---------------------|-------------------|
| ernestoleonard8@gmail.com| Ernesto Leonard  | Ernesto            | Leonard           |
| jenicasalis04@icloud.com | Jenica Salis     | Jenica             | Salis             |
```

---

## 📊 ¿Qué hace el Trigger?

### 1. **Función `handle_new_user()`**

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
```

Esta función:

- Se ejecuta automáticamente cuando se crea o actualiza un usuario en `auth.users`
- Extrae `first_name` y `last_name` del `user_metadata`
- Los combina en `full_name`
- Inserta o actualiza el registro en `public.users`

### 2. **Trigger `on_auth_user_created`**

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
```

Este trigger:

- Se activa DESPUÉS de cada INSERT o UPDATE en `auth.users`
- Llama a la función `handle_new_user()`
- Sincroniza los datos automáticamente

### 3. **Migración de Datos Existentes**

```sql
UPDATE public.users SET full_name = ...
```

Este script:

- Actualiza todos los usuarios existentes que no tienen `full_name`
- Extrae los nombres del `user_metadata`
- Si no existe metadata, usa el username del email

---

## 🧪 Probar el Trigger

### Test 1: Registrar un nuevo usuario

1. Ve a tu app: http://localhost:3000
2. Haz clic en "Registrarse"
3. Llena el formulario:
   - Nombre: Carlos
   - Apellido: Díaz
   - Email: carlos@test.com
   - Contraseña: test123
4. Verifica en Supabase:

```sql
SELECT id, email, full_name FROM public.users WHERE email = 'carlos@test.com';
```

**Resultado esperado:**

```
| email           | full_name    |
|-----------------|--------------|
| carlos@test.com | Carlos Díaz  |
```

### Test 2: Crear una orden

1. Crea una orden con el nuevo usuario
2. Ve a `/admin/orders`
3. La columna "Cliente" debe mostrar "Carlos Díaz" ✅

---

## 🔍 Troubleshooting

### Problema: "function handle_new_user() does not exist"

**Solución:** Asegúrate de ejecutar TODO el script, no solo partes.

### Problema: Los nombres siguen mostrando el email

**Solución 1:** Ejecuta la migración manual:

```sql
UPDATE public.users
SET full_name = (
  SELECT
    COALESCE(
      (auth_users.raw_user_meta_data->>'first_name' || ' ' || auth_users.raw_user_meta_data->>'last_name'),
      SPLIT_PART(users.email, '@', 1)
    )
  FROM auth.users auth_users
  WHERE auth_users.id = users.id
)
WHERE full_name IS NULL OR full_name = '';
```

**Solución 2:** Verifica que el trigger existe:

```sql
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

### Problema: Error de permisos

Si ves un error de permisos, ejecuta:

```sql
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT SELECT ON auth.users TO postgres;
```

---

## 📝 Notas Importantes

### 1. **El trigger es permanente**

Una vez ejecutado, el trigger quedará activo para siempre. No necesitas volver a ejecutarlo.

### 2. **Usuarios nuevos vs existentes**

- **Usuarios nuevos:** Se sincronizan automáticamente ✅
- **Usuarios existentes:** Se actualizaron con el script de migración ✅

### 3. **Si editas el perfil**

Si creas un endpoint para que los usuarios editen su perfil, recuerda actualizar también `public.users.full_name`

Ejemplo:

```typescript
// app/api/profile/update/route.ts
await supabaseAdmin
  .from("users")
  .update({ full_name: `${firstName} ${lastName}` })
  .eq("id", userId);
```

---

## ✅ Checklist de Verificación

Después de ejecutar el script:

- [ ] El trigger `on_auth_user_created` existe en Supabase
- [ ] La función `handle_new_user()` existe en Supabase
- [ ] Todos los usuarios existentes tienen `full_name` (no NULL)
- [ ] Al registrar un nuevo usuario, aparece su nombre completo
- [ ] En `/admin/orders` se muestran los nombres completos
- [ ] En la página de detalle de orden se muestra el nombre del cliente

---

## 🎉 Resultado Final

### Antes:

- Lista de órdenes: "ernestoleonard8", "jenicasalis04"
- Detalle de orden: "N/A"

### Después:

- Lista de órdenes: "Ernesto Leonard", "Jenica Salis"
- Detalle de orden: "Ernesto Leonard"

---

**¿Necesitas ayuda?** Si tienes algún problema ejecutando el script, avísame y te guío paso a paso.
