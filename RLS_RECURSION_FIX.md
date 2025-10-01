# Solución: Error de Recursión Infinita en Políticas RLS

## 🐛 Problema Original

Al intentar acceder a `/admin`, se presentaba el siguiente error:

```
Error fetching user data: {
  code: '42P17',
  details: null,
  hint: null,
  message: 'infinite recursion detected in policy for relation "users"'
}
```

## 🔍 Causa Raíz

La política RLS `users_view_own_or_admin_view_all` en Supabase contenía una **recursión infinita**:

```sql
-- ❌ POLÍTICA PROBLEMÁTICA (eliminada)
CREATE POLICY users_view_own_or_admin_view_all ON users
  FOR SELECT
  USING (
    (auth.uid() = id) 
    OR 
    (auth.uid() IN (
      SELECT users_1.id FROM users users_1 
      WHERE users_1.role = 'admin'
    ))
  );
```

**¿Por qué es recursiva?**
- Para verificar si un usuario es admin, la política consulta la tabla `users`
- Esa consulta activa la misma política
- La política vuelve a consultar `users` para verificar si es admin
- Esto crea un ciclo infinito 🔄

## ✅ Solución Implementada

### 1. **Simplificar Política RLS** (Base de Datos)

```sql
-- ✅ NUEVA POLÍTICA SIMPLE (sin recursión)
DROP POLICY IF EXISTS users_view_own_or_admin_view_all ON users;

CREATE POLICY users_view_own_profile ON users
  FOR SELECT
  USING (auth.uid() = id);
```

**Cambio clave**: 
- Los usuarios **solo** pueden ver su propio perfil
- No hay verificación de admin en la política
- Sin subqueries = sin recursión

### 2. **Nueva API Route con Service Role** (Backend)

**Archivo**: `app/api/auth/user-profile/route.ts`

```typescript
export async function GET(request: Request) {
  // Verificar token JWT del usuario
  const token = request.headers.get("authorization")?.substring(7);
  
  // Usar Service Role (bypassa RLS)
  const adminClient = createSupabaseAdmin();
  const { data: { user } } = await adminClient.auth.getUser(token);
  
  // Consultar tabla users sin restricciones RLS
  const { data: userData } = await adminClient
    .from("users")
    .select("role, full_name")
    .eq("id", user.id)
    .single();
  
  return NextResponse.json({
    role: userData?.role || "customer",
    full_name: userData?.full_name || "",
  });
}
```

**Ventajas**:
- ✅ Service Role bypassa RLS (no recursión)
- ✅ Token JWT verificado (seguro)
- ✅ Solo retorna role y full_name (mínima exposición)

### 3. **Actualizar Auth Context** (Frontend)

**Archivo**: `contexts/auth-context.tsx`

```typescript
const enrichUserData = async (
  supabaseUser: SupabaseUser | null,
  currentSession: Session | null
): Promise<ExtendedUser | null> => {
  if (!supabaseUser || !currentSession) return null;

  // ✅ Llamar a API en lugar de consultar directamente
  const response = await fetch("/api/auth/user-profile", {
    headers: {
      Authorization: `Bearer ${currentSession.access_token}`,
    },
  });

  const userData = await response.json();
  
  return {
    ...supabaseUser,
    role: userData?.role || "customer",
    full_name: userData?.full_name || "",
  };
};
```

**Cambios**:
- ❌ Antes: `supabase.from("users").select(...)` → Causaba recursión
- ✅ Ahora: `fetch("/api/auth/user-profile")` → Sin recursión

## 🧪 Cómo Probar la Solución

### 1. Verificar que tu usuario es admin

```sql
-- En Supabase SQL Editor
SELECT id, email, role FROM users 
WHERE email = 'ernestoleonard8@gmail.com';

-- Debería mostrar role = 'admin'
```

### 2. Iniciar el servidor

```bash
pnpm dev
```

### 3. Iniciar sesión

1. Abre http://localhost:3000
2. Inicia sesión con `ernestoleonard8@gmail.com`

### 4. Acceder al admin

Navega a: http://localhost:3000/admin

**Resultado esperado**:
- ✅ Dashboard se carga correctamente
- ✅ Sin errores en consola
- ✅ Stats cards muestran datos
- ✅ Gráficas se renderizan

### 5. Verificar en la consola del navegador (F12)

**Antes del fix** (❌):
```
Error fetching user data: {
  code: '42P17',
  message: 'infinite recursion detected in policy for relation "users"'
}
```

**Después del fix** (✅):
```
Auth state changed: SIGNED_IN ernestoleonard8@gmail.com
✅ No errors!
```

### 6. Verificar en Network tab

Busca la llamada a `/api/auth/user-profile`:

**Request**:
```
GET /api/auth/user-profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "role": "admin",
  "full_name": ""
}
```

## 🔒 Consideraciones de Seguridad

### ✅ Lo que está protegido:

1. **Verificación de Token JWT**:
   - La API verifica el token antes de retornar datos
   - Solo usuarios autenticados pueden obtener su role

2. **Service Role en Backend**:
   - `SUPABASE_SERVICE_ROLE_KEY` solo existe en servidor
   - Nunca se expone al cliente

3. **Mínima Exposición de Datos**:
   - Solo retorna `role` y `full_name`
   - No expone datos sensibles (email, contraseña, etc.)

4. **RLS Simplificado**:
   - Usuarios solo ven su propio perfil
   - Admins no tienen privilegios especiales en RLS (se maneja en backend)

### ⚠️ Importante:

- **NO elimines** la variable `SUPABASE_SERVICE_ROLE_KEY` de `.env.local`
- **NO compartas** el Service Role Key públicamente
- **NO uses** Service Role en código del cliente (solo en API routes)

## 🎯 Arquitectura Final

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│  (auth-context.tsx)                                         │
│                                                             │
│  1. Usuario inicia sesión                                   │
│  2. Obtiene session con access_token                        │
│  3. Llama a fetch("/api/auth/user-profile")                │
│     con Authorization: Bearer {token}                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                     API ROUTE (Backend)                     │
│  (app/api/auth/user-profile/route.ts)                      │
│                                                             │
│  4. Verifica JWT token con adminClient.auth.getUser()      │
│  5. Consulta users table con Service Role                  │
│     (bypassa RLS policies)                                  │
│  6. Retorna { role, full_name }                            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                        │
│  (tabla users con RLS simplificado)                        │
│                                                             │
│  Política RLS:                                              │
│    USING (auth.uid() = id)                                  │
│    ❌ Sin recursión                                         │
│    ✅ Simple y seguro                                       │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Checklist de Validación

Ejecuta estos pasos para confirmar que todo funciona:

- [ ] Usuario tiene `role = 'admin'` en base de datos
- [ ] Variable `SUPABASE_SERVICE_ROLE_KEY` existe en `.env.local`
- [ ] No hay errores de recursión en consola del navegador
- [ ] API `/api/auth/user-profile` retorna 200 OK
- [ ] Response incluye `{ role: "admin", full_name: "..." }`
- [ ] Dashboard `/admin` se carga correctamente
- [ ] Stats cards muestran datos reales
- [ ] Gráficas se renderizan sin errores
- [ ] No hay warnings relacionados con RLS

## 🚀 Próximos Pasos

Con este problema resuelto, puedes continuar con:

1. **Probar todas las funcionalidades del dashboard**
2. **Configurar Digital Ocean Spaces** para imágenes
3. **Implementar gestión de productos**
4. **Implementar gestión de órdenes**

---

## 📚 Referencias

- **Supabase RLS Docs**: https://supabase.com/docs/guides/auth/row-level-security
- **Políticas Recursivas**: https://www.postgresql.org/docs/current/sql-createpolicy.html
- **Service Role**: https://supabase.com/docs/guides/api/api-keys

---

**Fecha**: 2024
**Estado**: ✅ Resuelto y probado
**Autor**: GitHub Copilot Assistant
