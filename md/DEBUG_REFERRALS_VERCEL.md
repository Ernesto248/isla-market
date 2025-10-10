# 🔍 Debug: Referidos no aparecen en Vercel

**Fecha:** 10 de octubre de 2025  
**Problema:** La opción "Mis Referidos" aparece en desarrollo local pero NO en Vercel  
**Status:** 🔧 En investigación

---

## 🎯 Problema Identificado

Los usuarios que son referidores pueden ver la opción "Mis Referidos" en desarrollo local (`localhost`), pero cuando acceden desde Vercel (producción), esta opción no aparece en el menú.

---

## 🔍 Análisis del Flujo

### **1. Cómo se determina si mostrar "Mis Referidos"**

El archivo `components/layout/header.tsx` tiene la lógica:

```typescript
// Estado para controlar si es referidor
const [isReferrer, setIsReferrer] = useState(false);

// useEffect que verifica el estado
useEffect(() => {
  if (user && session?.access_token) {
    fetch("/api/referrals/check-status", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setIsReferrer(data.is_referrer || false);
      })
      .catch(() => {
        setIsReferrer(false);
      });
  } else {
    setIsReferrer(false);
  }
}, [user, session]);

// Mostrar opción solo si isReferrer es true
{
  isReferrer && (
    <DropdownMenuItem asChild>
      <Link href="/profile/referrals">Mis Referidos</Link>
    </DropdownMenuItem>
  );
}
```

### **2. API que verifica el estado**

El endpoint `/api/referrals/check-status/route.ts` hace la verificación:

**Antes (versión original):**

```typescript
const { data: referrer } = await supabase
  .from("referrers")
  .select("id, is_active")
  .eq("user_id", user.id)
  .eq("is_active", true) // ← Solo busca activos
  .single();

return NextResponse.json({
  is_referrer: !!referrer,
});
```

**Ahora (versión mejorada con logs):**

```typescript
const { data: referrer, error: referrerError } = await supabase
  .from("referrers")
  .select("id, is_active, referral_code")
  .eq("user_id", user.id)
  .single(); // ← Busca cualquier referrer

console.log("[check-status] Referrer query result:", {
  found: !!referrer,
  is_active: referrer?.is_active,
  referral_code: referrer?.referral_code,
  error: referrerError?.message,
});

return NextResponse.json({
  is_referrer: !!referrer,
  is_active: referrer?.is_active || false,
  debug: {
    user_id: user.id,
    found_referrer: !!referrer,
    referrer_is_active: referrer?.is_active,
  },
});
```

---

## 🐛 Posibles Causas

### **1. Base de Datos Diferente**

- ❌ Local apunta a una instancia de Supabase
- ❌ Vercel apunta a otra instancia diferente
- ✅ **Solución:** Verificar variables de entorno en Vercel

### **2. Campo `is_active` en `false`**

- ❌ Los referidores en producción tienen `is_active: false`
- ❌ La API original solo busca `is_active: true`
- ✅ **Solución:** Verificar datos en Supabase y actualizar si es necesario

### **3. Usuario no existe en tabla `referrers`**

- ❌ El usuario existe localmente pero no en producción
- ❌ Diferentes bases de datos entre ambientes
- ✅ **Solución:** Sincronizar datos o crear referidor en producción

### **4. Token de autenticación inválido**

- ❌ El token no se está enviando correctamente en Vercel
- ❌ Problema con cookies o CORS
- ✅ **Solución:** Verificar logs de autenticación

### **5. Variables de entorno faltantes**

- ❌ `SUPABASE_SERVICE_ROLE_KEY` no configurada en Vercel
- ❌ URLs de Supabase incorrectas
- ✅ **Solución:** Verificar todas las variables en Vercel

---

## ✅ Pasos para Diagnosticar

### **Paso 1: Verificar Variables de Entorno en Vercel**

1. Ve a: https://vercel.com/dashboard → Tu Proyecto → Settings → Environment Variables

2. Verifica que existan estas variables:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://wrvndcavuczjffgbybcm.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
   ```

3. **Importante:** Las variables deben estar habilitadas para:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

### **Paso 2: Ver Logs en Vercel**

1. Despliega la nueva versión con logs mejorados:

   ```bash
   git add .
   git commit -m "Add debug logs for referrals check"
   git push
   ```

2. Ve a: Vercel Dashboard → Tu Proyecto → Logs → Functions

3. Inicia sesión como un usuario referidor en Vercel

4. Busca en los logs:
   ```
   [check-status] Checking referrer status for user: xxx
   [check-status] Referrer query result: {...}
   ```

### **Paso 3: Verificar Datos en Supabase**

1. Ve a: https://supabase.com/dashboard

2. Selecciona tu proyecto de PRODUCCIÓN

3. Ve a: Table Editor → `referrers`

4. Ejecuta esta query en SQL Editor:

   ```sql
   SELECT
     r.id,
     r.user_id,
     r.referral_code,
     r.is_active,
     r.created_at,
     u.email
   FROM referrers r
   LEFT JOIN auth.users u ON r.user_id = u.id
   WHERE r.is_active = true
   ORDER BY r.created_at DESC;
   ```

5. Verifica:
   - ¿Existen referidores?
   - ¿Tienen `is_active: true`?
   - ¿Los `user_id` coinciden con los usuarios que usas?

### **Paso 4: Verificar el Usuario Específico**

En Supabase SQL Editor, ejecuta:

```sql
-- Reemplaza 'tu-email@ejemplo.com' con el email del usuario que estás probando
SELECT
  u.id as user_id,
  u.email,
  r.id as referrer_id,
  r.referral_code,
  r.is_active,
  r.commission_rate,
  r.created_at
FROM auth.users u
LEFT JOIN referrers r ON r.user_id = u.id
WHERE u.email = 'tu-email@ejemplo.com';
```

Resultado esperado:

```
user_id | email              | referrer_id | referral_code | is_active | commission_rate
--------|--------------------|--------------|--------------|-----------|-----------------
abc123  | user@example.com   | ref456       | ABC123       | true      | 10.00
```

Si `referrer_id` es `NULL` → El usuario NO es referidor en producción

---

## 🔧 Soluciones según el Diagnóstico

### **Si el problema es: Variables de entorno faltantes**

```bash
# En Vercel Dashboard:
1. Settings → Environment Variables
2. Add Variable:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
3. Redeploy
```

### **Si el problema es: Usuario no existe en producción**

```sql
-- En Supabase SQL Editor (PRODUCCIÓN):
INSERT INTO referrers (
  user_id,
  referral_code,
  commission_rate,
  duration_months,
  is_active
)
VALUES (
  'USER_ID_AQUI',  -- Obtener de auth.users
  'CODIGO_UNICO',  -- Ej: 'REF123'
  10.00,           -- 10% comisión
  12,              -- 12 meses
  true             -- Activo
);
```

### **Si el problema es: is_active en false**

```sql
-- En Supabase SQL Editor (PRODUCCIÓN):
UPDATE referrers
SET is_active = true
WHERE user_id = 'USER_ID_AQUI';
```

### **Si el problema es: Token inválido**

Verifica en los logs de Vercel:

```
[check-status] Error checking referrer status: Token inválido
```

Solución:

1. Verifica que `SUPABASE_SERVICE_ROLE_KEY` esté correcta
2. Asegúrate de que el token JWT no haya expirado
3. Verifica que las políticas RLS de Supabase permitan la consulta

---

## 🧪 Prueba Manual en Vercel

### **1. Abrir DevTools en el Browser**

1. Abre https://isla-market.com en el navegador
2. Presiona F12 para abrir DevTools
3. Ve a la pestaña "Network"
4. Inicia sesión como usuario referidor
5. Busca la llamada a `/api/referrals/check-status`
6. Ve la respuesta:

**Respuesta esperada (usuario ES referidor):**

```json
{
  "is_referrer": true,
  "referrer_id": "abc123",
  "is_active": true,
  "debug": {
    "user_id": "user123",
    "found_referrer": true,
    "referrer_is_active": true
  }
}
```

**Respuesta problema (usuario NO ES referidor):**

```json
{
  "is_referrer": false,
  "referrer_id": null,
  "is_active": false,
  "debug": {
    "user_id": "user123",
    "found_referrer": false,
    "referrer_is_active": false
  }
}
```

### **2. Verificar el Header**

Después de iniciar sesión:

1. Abre el menú de usuario (icono de perfil)
2. Verifica si aparece "Mis Referidos"
3. Si NO aparece, revisa el objeto `debug` en la respuesta

---

## 📊 Comparación Local vs Producción

| Aspecto               | Local (Funciona)       | Vercel (No funciona) | Acción                 |
| --------------------- | ---------------------- | -------------------- | ---------------------- |
| **Base de datos**     | Supabase (dev o prod?) | Supabase prod        | Verificar son la misma |
| **Variables ENV**     | `.env.local`           | Vercel ENV vars      | Comparar valores       |
| **Usuario referidor** | Existe en DB           | ¿Existe en DB?       | Query SQL              |
| **is_active**         | true                   | ¿true o false?       | Verificar valor        |
| **Token auth**        | Válido                 | ¿Válido?             | Ver logs               |

---

## 🎯 Checklist de Debugging

- [ ] Variables de entorno configuradas en Vercel
- [ ] Deploy realizado después de agregar logs
- [ ] Logs de Vercel revisados
- [ ] Query SQL ejecutada en Supabase (producción)
- [ ] Usuario existe en tabla `referrers` (producción)
- [ ] Campo `is_active = true` en producción
- [ ] Respuesta de API verificada en DevTools
- [ ] Header actualizado después de login
- [ ] Opción "Mis Referidos" visible en menú

---

## 📝 Información a Recopilar

Para ayudar con el debug, recopila esta información:

1. **Email del usuario que estás probando:**

   ```
   Email: ___________________________
   ```

2. **Resultado de la query SQL:**

   ```sql
   SELECT * FROM referrers WHERE user_id = 'USER_ID';
   ```

   ```
   Resultado: ________________________
   ```

3. **Respuesta de /api/referrals/check-status en Vercel:**

   ```json
   {
     "is_referrer": ___,
     "debug": {...}
   }
   ```

4. **Variables ENV en Vercel:**

   ```
   NEXT_PUBLIC_SUPABASE_URL: ✅ / ❌
   NEXT_PUBLIC_SUPABASE_ANON_KEY: ✅ / ❌
   SUPABASE_SERVICE_ROLE_KEY: ✅ / ❌
   ```

5. **Logs de Vercel:**
   ```
   [Pegar logs relevantes aquí]
   ```

---

## 🚀 Próximos Pasos

1. **Hacer deploy con logs mejorados** ✅
2. **Verificar logs en Vercel** ⏳
3. **Ejecutar query SQL en Supabase** ⏳
4. **Verificar variables de entorno** ⏳
5. **Aplicar fix según diagnóstico** ⏳

---

**Status:** 🔧 Esperando resultados del diagnóstico  
**Archivo actualizado:** `/api/referrals/check-status/route.ts`  
**Logs agregados:** ✅ Sí
