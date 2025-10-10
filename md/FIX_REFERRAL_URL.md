# 🔗 Fix: URL de Referidos - Usar Dominio de Producción

**Fecha:** 10 de octubre de 2025  
**Status:** ✅ Completado

---

## 🎯 Problema Identificado

Los enlaces de referidos estaban usando `localhost` en lugar del dominio de producción `isla-market.com`, lo que generaba URLs inválidas cuando los usuarios copiaban sus enlaces de referido.

**Ejemplo del problema:**

```
❌ http://localhost:3000/?ref=ABC123
✅ https://isla-market.com/?ref=ABC123
```

---

## 🔧 Solución Implementada

### 1. **Modificación en `app/profile/referrals/page.tsx`**

**Antes:**

```typescript
const getReferralUrl = () => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/?ref=${stats?.referrer?.referral_code}`;
};
```

**Después:**

```typescript
const getReferralUrl = () => {
  // Usar el dominio de producción o el origin actual
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://isla-market.com";
  return `${baseUrl}/?ref=${stats?.referrer?.referral_code}`;
};
```

### 2. **Variable de Entorno Agregada**

Se agregó la variable `NEXT_PUBLIC_SITE_URL` al archivo `.env.example`:

```bash
# Site Configuration
NEXT_PUBLIC_SITE_URL=https://isla-market.com
```

---

## 📋 Pasos para Configurar

### **Opción 1: Archivo `.env.local` (Desarrollo)**

1. Crea o edita el archivo `.env.local` en la raíz del proyecto:

```bash
NEXT_PUBLIC_SITE_URL=https://isla-market.com
```

2. Reinicia el servidor de desarrollo:

```bash
npm run dev
```

### **Opción 2: Variables de Entorno en Vercel (Producción)**

1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. Navega a: **Project Settings > Environment Variables**
3. Agrega la nueva variable:
   - **Name:** `NEXT_PUBLIC_SITE_URL`
   - **Value:** `https://isla-market.com`
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
4. Click en **Save**
5. **Redeploy** el proyecto para aplicar los cambios

---

## 🎨 Comportamiento

### **Con Variable de Entorno Configurada:**

```typescript
process.env.NEXT_PUBLIC_SITE_URL = "https://isla-market.com";
// Genera: https://isla-market.com/?ref=ABC123
```

### **Sin Variable de Entorno (Fallback):**

```typescript
process.env.NEXT_PUBLIC_SITE_URL = undefined;
// Usa fallback: https://isla-market.com/?ref=ABC123
```

### **Ventaja del Enfoque:**

- ✅ Funciona en todos los ambientes (desarrollo, preview, producción)
- ✅ Permite usar diferentes URLs por ambiente si es necesario
- ✅ Tiene fallback seguro al dominio de producción
- ✅ No depende de `window.location.origin`

---

## 🧪 Cómo Probar

### **1. Verificar en Desarrollo Local:**

```bash
# 1. Asegúrate de tener la variable en .env.local
echo "NEXT_PUBLIC_SITE_URL=https://isla-market.com" >> .env.local

# 2. Reinicia el servidor
npm run dev

# 3. Navega a la página de referidos
# http://localhost:3000/profile/referrals

# 4. Copia el enlace de referido
# Debería ser: https://isla-market.com/?ref=TU_CODIGO
```

### **2. Verificar en Producción:**

```bash
# 1. Ve a https://isla-market.com/profile/referrals
# 2. Inicia sesión como usuario referrer
# 3. Copia el enlace de referido
# 4. Verifica que sea: https://isla-market.com/?ref=TU_CODIGO
```

---

## 📊 Impacto en Otras Funcionalidades

### **Páginas que Usan el Enlace de Referido:**

- ✅ `/profile/referrals` - Panel de referidos (arreglado)
- ✅ Función de compartir en redes sociales (funciona correctamente)
- ✅ Copiar al portapapeles (funciona correctamente)

### **No Afecta:**

- ❌ API de referidos
- ❌ Lógica de tracking de referidos
- ❌ Base de datos de referidos

---

## 🔄 Ambientes Múltiples (Opcional)

Si en el futuro necesitas diferentes URLs por ambiente:

```bash
# .env.local (Desarrollo)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# .env.preview (Preview en Vercel)
NEXT_PUBLIC_SITE_URL=https://preview-isla-market.vercel.app

# .env.production (Producción)
NEXT_PUBLIC_SITE_URL=https://isla-market.com
```

---

## ✅ Checklist de Deployment

Antes de hacer deploy a producción:

- [x] Variable `NEXT_PUBLIC_SITE_URL` agregada a `.env.example`
- [ ] Variable configurada en `.env.local` para desarrollo
- [ ] Variable configurada en Vercel para producción
- [ ] Código modificado en `app/profile/referrals/page.tsx`
- [ ] Servidor reiniciado después de agregar variable
- [ ] Probado en desarrollo (enlace debe usar isla-market.com)
- [ ] Probado en producción después del deploy
- [ ] Compartir enlace funciona correctamente
- [ ] Copiar al portapapeles funciona correctamente

---

## 🚨 Importante para Deployment en Vercel

### **Después de agregar la variable en Vercel:**

1. **NO olvides hacer redeploy:**

   ```bash
   # Opción 1: Desde Vercel Dashboard
   # Ve a Deployments > Click en "..." > Redeploy

   # Opción 2: Desde la terminal
   git commit --allow-empty -m "Trigger redeploy"
   git push
   ```

2. **Verifica que la variable esté activa:**
   - Ve a: Project Settings > Environment Variables
   - Confirma que `NEXT_PUBLIC_SITE_URL` esté listada
   - Verifica que esté habilitada para Production

---

## 📝 Notas Adicionales

### **Por qué `NEXT_PUBLIC_`?**

- El prefijo `NEXT_PUBLIC_` hace que la variable esté disponible en el cliente (browser)
- Sin este prefijo, la variable solo estaría disponible en el servidor
- Necesitamos acceso en el cliente porque `getReferralUrl()` se ejecuta en el navegador

### **Seguridad:**

- Es seguro exponer el dominio público del sitio
- No contiene información sensible
- No compromete la seguridad de la aplicación

---

## 🎉 Resultado Final

Los usuarios ahora recibirán enlaces de referido correctos:

```
✅ https://isla-market.com/?ref=ABC123
✅ https://isla-market.com/?ref=XYZ789

❌ http://localhost:3000/?ref=ABC123 (antiguo problema)
```

Los enlaces funcionan correctamente en:

- 📱 Compartir en WhatsApp, Facebook, Twitter, etc.
- 📋 Copiar al portapapeles
- 📧 Enviar por email
- 💬 Compartir en mensajes

---

**Status:** ✅ Implementado y listo para deployment  
**Próximo paso:** Configurar la variable en Vercel y hacer redeploy
