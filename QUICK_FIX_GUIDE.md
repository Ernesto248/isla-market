# 🚀 Quick Fix Guide - Vercel Deployment

## ✅ Problema Resuelto: CORS y 404 Errors

### Síntoma
```
Access to fetch at 'https://your-domain.com/api/products' blocked by CORS policy
Failed to load resource: 404
```

### Causa
La aplicación estaba configurada con una URL hardcodeada `"https://your-domain.com"` en `lib/api.ts`.

### Solución Implementada
✅ Ahora el cliente API detecta automáticamente el dominio:
- En el navegador: usa `window.location.origin`
- En producción (servidor): usa rutas relativas
- En desarrollo: usa `http://localhost:3000`

## 📋 Checklist de Deployment en Vercel

### Antes de desplegar:
- [ ] Crear proyecto en Vercel y conectar repositorio GitHub
- [ ] Configurar TODAS las variables de entorno (ver lista abajo)
- [ ] Verificar que el proyecto de Supabase esté activo
- [ ] Verificar que las credenciales de Stripe sean correctas

### Variables de Entorno Requeridas:

#### Supabase (3 variables):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

#### Stripe (3 variables):
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Después del primer deploy:

1. **Configurar Webhook de Stripe:**
   - URL: `https://tu-dominio.vercel.app/api/stripe/webhook`
   - Eventos: `checkout.session.completed`, `payment_intent.succeeded`
   - Copiar el Signing Secret y agregarlo como `STRIPE_WEBHOOK_SECRET`
   - Re-desplegar

2. **Poblar la base de datos (opcional):**
   - Método: POST
   - URL: `https://tu-dominio.vercel.app/api/migrate`
   - Body: `{ "password": "migrate123" }`

3. **Verificar funcionamiento:**
   - Abrir la app en Vercel
   - Abrir DevTools (F12) > Console
   - No debería haber errores de CORS o 404
   - Los productos y categorías deberían cargar

## 🔍 Debugging en Producción

### Ver logs en tiempo real:
```bash
vercel logs [tu-proyecto-id] --follow
```

### Verificar que las APIs funcionan:
```bash
# Categorías
curl https://tu-dominio.vercel.app/api/categories

# Productos
curl https://tu-dominio.vercel.app/api/products

# Status del webhook
curl https://tu-dominio.vercel.app/api/stripe/webhook
```

### Verificar variables de entorno:
- Vercel Dashboard > Settings > Environment Variables
- Asegúrate de que TODAS tengan los 3 ambientes seleccionados ✅

## ⚠️ Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| CORS blocked `your-domain.com` | Código desactualizado | `git pull` y re-desplegar |
| `supabaseUrl is required` | Variables no configuradas | Agregar variables en Vercel |
| 404 en API routes | Build falló | Ver logs de build en Vercel |
| Productos no cargan | Base de datos vacía | Ejecutar `/api/migrate` |
| Auth no funciona | Supabase URL incorrecta | Verificar variables Supabase |

## 🎯 Comandos Útiles

```bash
# Build local para probar
pnpm build

# Ver el build de producción local
pnpm start

# Ver logs de Vercel
vercel logs

# Re-desplegar (desde main branch)
git push origin main
```

## 📞 Obtener Ayuda

Si después de seguir estos pasos sigues teniendo problemas:

1. **Revisar logs de Vercel:**
   - Dashboard > Deployments > [último] > Building/Functions

2. **Revisar logs de Supabase:**
   - Dashboard > Logs > API Logs

3. **Revisar logs de Stripe:**
   - Dashboard > Developers > Logs

4. **Ver errores del navegador:**
   - F12 > Console (errores en rojo)
   - F12 > Network (peticiones fallidas)

---

💡 **Tip:** Después de hacer cambios en variables de entorno en Vercel, SIEMPRE re-despliega la aplicación (Deployments > ... > Redeploy)
