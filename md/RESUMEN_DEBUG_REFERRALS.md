# 🔧 Fix: Referidos no aparecen en Vercel - Resumen Ejecutivo

**Fecha:** 10 de octubre de 2025  
**Status:** ✅ Código actualizado, listo para debug

---

## 🎯 Problema

Los usuarios referidores ven la opción "Mis Referidos" en **local** pero NO en **Vercel (producción)**.

---

## ✅ Cambios Realizados

### 1. **Mejorado endpoint de verificación** (`/api/referrals/check-status`)

- ✅ Agregados logs detallados para debugging
- ✅ Ahora retorna información de debug
- ✅ Maneja errores de forma más robusta

### 2. **Creado endpoint de debug** (`/api/debug/referrers`)

- ✅ Lista todos los referidores en la base de datos
- ✅ Muestra si las variables de entorno están configuradas
- ✅ Permite verificar rápidamente el estado del sistema

---

## 🧪 Cómo Diagnosticar el Problema

### **Opción 1: Ver logs en Vercel (Recomendado)**

1. Haz commit y push:

   ```bash
   git add .
   git commit -m "Add debug logs for referrals system"
   git push
   ```

2. Espera el deploy en Vercel

3. Ve a: Vercel Dashboard → Tu Proyecto → Logs

4. Inicia sesión como usuario referidor en https://isla-market.com

5. Busca en los logs:
   ```
   [check-status] Checking referrer status for user: xxx
   [check-status] Referrer query result: {...}
   ```

### **Opción 2: Usar el endpoint de debug**

1. Abre en tu navegador:

   ```
   https://isla-market.com/api/debug/referrers
   ```

2. Verás algo como:

   ```json
   {
     "success": true,
     "total_referrers": 3,
     "referrers": [
       {
         "id": "...",
         "user_id": "...",
         "email": "user@example.com",
         "referral_code": "ABC123",
         "is_active": true
       }
     ],
     "database_url": "https://...supabase.co",
     "has_service_key": true
   }
   ```

3. Verifica:
   - ¿Aparecen los referidores que esperas?
   - ¿Tienen `is_active: true`?
   - ¿El email coincide con el que estás usando?

### **Opción 3: Verificar directamente en Supabase**

1. Ve a: https://supabase.com/dashboard

2. Abre tu proyecto de PRODUCCIÓN

3. Ve a: SQL Editor

4. Ejecuta:

   ```sql
   SELECT
     r.id,
     r.user_id,
     r.referral_code,
     r.is_active,
     u.email
   FROM referrers r
   LEFT JOIN auth.users u ON r.user_id = u.id
   WHERE r.is_active = true;
   ```

5. Verifica que el usuario que estás probando esté en la lista

---

## 🔍 Diagnósticos Comunes

### **Si no hay referidores en la respuesta:**

**Problema:** Base de datos vacía en producción

**Solución:**

```sql
-- Crear referidor en producción
INSERT INTO referrers (
  user_id,
  referral_code,
  commission_rate,
  duration_months,
  is_active
)
SELECT
  id,
  'REF' || SUBSTRING(id, 1, 6),
  10.00,
  12,
  true
FROM auth.users
WHERE email = 'TU_EMAIL_AQUI';
```

### **Si is_active es false:**

**Problema:** Referidor existe pero está inactivo

**Solución:**

```sql
UPDATE referrers
SET is_active = true
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'TU_EMAIL_AQUI'
);
```

### **Si database_url es diferente entre local y Vercel:**

**Problema:** Variables de entorno apuntan a diferentes bases de datos

**Solución:**

1. Ve a: Vercel → Settings → Environment Variables
2. Verifica que `NEXT_PUBLIC_SUPABASE_URL` sea la misma que en `.env.local`
3. Si es diferente, actualízala
4. Redeploy

### **Si has_service_key es false:**

**Problema:** Falta la variable `SUPABASE_SERVICE_ROLE_KEY`

**Solución:**

1. Ve a: Vercel → Settings → Environment Variables
2. Agrega:
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: [Tu service role key de Supabase]
3. Redeploy

---

## 📋 Checklist de Deployment

- [ ] Código con logs agregado
- [ ] Commit realizado
- [ ] Push a GitHub
- [ ] Deploy automático en Vercel completado
- [ ] Endpoint `/api/debug/referrers` verificado
- [ ] Logs de Vercel revisados
- [ ] Variables de entorno verificadas
- [ ] Base de datos verificada
- [ ] Usuario de prueba existe como referidor
- [ ] Usuario de prueba tiene `is_active: true`
- [ ] Opción "Mis Referidos" ahora visible

---

## 🚀 Comandos Rápidos

```bash
# 1. Commit y push
git add .
git commit -m "Add debug logs and endpoint for referrals"
git push

# 2. Verificar deploy
# Ve a: https://vercel.com/dashboard

# 3. Probar endpoint de debug
# Abre: https://isla-market.com/api/debug/referrers

# 4. Ver logs
# Vercel Dashboard → Logs → Functions
```

---

## 📊 Respuesta Esperada del Debug

**Si todo está bien configurado:**

```json
{
  "success": true,
  "total_referrers": 3,
  "referrers": [
    {
      "id": "ref123",
      "user_id": "user456",
      "email": "referrer@example.com",
      "referral_code": "ABC123",
      "is_active": true,
      "commission_rate": 10.0
    }
  ],
  "database_url": "https://wrvndcavuczjffgbybcm.supabase.co",
  "has_service_key": true
}
```

**Si hay problemas:**

```json
{
  "success": true,
  "total_referrers": 0, // ← No hay referidores
  "referrers": [],
  "database_url": "https://...",
  "has_service_key": false // ← Falta variable
}
```

---

## 💡 Próximo Paso

1. **HAZ DEPLOY:**

   ```bash
   git add .
   git commit -m "Debug referrals system in Vercel"
   git push
   ```

2. **ABRE EL ENDPOINT DE DEBUG:**

   ```
   https://isla-market.com/api/debug/referrers
   ```

3. **REPORTA LO QUE VES:**

   - ¿Cuántos referidores aparecen?
   - ¿Qué emails tienen?
   - ¿Tienen `is_active: true`?

4. **SEGÚN EL RESULTADO, APLICAR FIX:**
   - Si no hay referidores → Crear en DB
   - Si están inactivos → Activar con UPDATE
   - Si faltan variables → Configurar en Vercel

---

**Archivos modificados:**

- ✅ `/app/api/referrals/check-status/route.ts` (logs mejorados)
- ✅ `/app/api/debug/referrers/route.ts` (nuevo endpoint)
- ✅ `/md/DEBUG_REFERRALS_VERCEL.md` (guía completa)

**Listo para deploy:** ✅ Sí  
**Próximo paso:** Hacer commit y verificar resultados
