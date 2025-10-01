# Deployment en Vercel - Isla Market

## Configuración de Variables de Entorno

Para que la aplicación funcione correctamente en Vercel, necesitas configurar las siguientes variables de entorno:

### 1. Variables de Supabase

Ve a tu proyecto de Supabase (https://supabase.com/dashboard) y copia las siguientes credenciales:

- **NEXT_PUBLIC_SUPABASE_URL**: URL de tu proyecto Supabase

  - Ubicación: Project Settings > API > Project URL
  - Ejemplo: `https://xyzcompany.supabase.co`

- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Anon/Public key

  - Ubicación: Project Settings > API > Project API keys > anon public
  - Ejemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

- **SUPABASE_SERVICE_ROLE_KEY**: Service Role key (¡SECRETO!)
  - Ubicación: Project Settings > API > Project API keys > service_role
  - Ejemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - ⚠️ **NUNCA** compartas esta clave públicamente

### 2. Variables de Stripe

Ve a tu dashboard de Stripe (https://dashboard.stripe.com) y copia las siguientes credenciales:

- **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**: Publishable key

  - Ubicación: Developers > API keys > Publishable key
  - Ejemplo: `pk_test_51...` o `pk_live_51...`

- **STRIPE_SECRET_KEY**: Secret key (¡SECRETO!)

  - Ubicación: Developers > API keys > Secret key
  - Ejemplo: `sk_test_51...` o `sk_live_51...`
  - ⚠️ **NUNCA** compartas esta clave públicamente

- **STRIPE_WEBHOOK_SECRET**: Webhook signing secret
  - Ubicación: Developers > Webhooks > [tu endpoint] > Signing secret
  - Ejemplo: `whsec_...`
  - 📝 Debes crear un webhook endpoint primero (ver sección de Webhooks)

### 3. Configurar en Vercel

1. Ve a tu proyecto en Vercel
2. Click en **Settings** > **Environment Variables**
3. Agrega cada variable una por una:
   - Name: nombre de la variable (ej: `NEXT_PUBLIC_SUPABASE_URL`)
   - Value: el valor correspondiente
   - Environments: Selecciona **Production**, **Preview**, y **Development**
4. Click en **Save**

### 4. Configurar Webhook de Stripe

Una vez que despliegues a Vercel, necesitas configurar el webhook de Stripe:

1. En Stripe Dashboard, ve a: **Developers > Webhooks**
2. Click en **Add endpoint**
3. Endpoint URL: `https://tu-dominio.vercel.app/api/stripe/webhook`
4. Selecciona los eventos:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
5. Click en **Add endpoint**
6. Copia el **Signing secret** (empieza con `whsec_`)
7. Agrégalo como variable de entorno `STRIPE_WEBHOOK_SECRET` en Vercel
8. Re-despliega tu aplicación

## Verificación del Deployment

Después de configurar todo:

1. Haz un nuevo deployment o re-despliega:

   ```bash
   git push origin main
   ```

2. Verifica los logs en Vercel:

   - Ve a tu proyecto en Vercel
   - Click en el deployment más reciente
   - Revisa que no haya errores en los logs

3. Prueba la aplicación:
   - Visita tu sitio en Vercel
   - Prueba el login/registro
   - Intenta agregar productos al carrito
   - Realiza un checkout de prueba con Stripe

## Solución de Problemas

### Error: "supabaseUrl is required"

- ✅ Verifica que las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` estén configuradas en Vercel
- ✅ Asegúrate de que estén en los 3 ambientes (Production, Preview, Development)
- ✅ Re-despliega después de agregar las variables

### Error: "SUPABASE_SERVICE_ROLE_KEY is required"

- ✅ Verifica que `SUPABASE_SERVICE_ROLE_KEY` esté configurada en Vercel
- ✅ Asegúrate de copiar la clave completa sin espacios

### Error: "No signature found in headers"

- ✅ Verifica que `STRIPE_WEBHOOK_SECRET` esté configurado
- ✅ Asegúrate de usar el secret del webhook de **producción**, no de desarrollo
- ✅ El endpoint debe ser `/api/stripe/webhook`

### Pagos no se procesan

- ✅ Verifica que el webhook esté configurado en Stripe
- ✅ Revisa los logs del webhook en Stripe Dashboard
- ✅ Asegúrate de usar las credenciales correctas (test vs live)

## Migración de Datos (Opcional)

Si necesitas poblar tu base de datos con productos de prueba:

1. Accede a: `https://tu-dominio.vercel.app/api/migrate`
2. Usa el método POST con el password configurado
3. Esto creará categorías y productos de ejemplo

## Monitoreo

- Logs de Vercel: https://vercel.com/dashboard
- Logs de Supabase: https://supabase.com/dashboard/project/[tu-proyecto]/logs
- Logs de Stripe: https://dashboard.stripe.com/logs

## Seguridad

⚠️ **Importante:**

- Nunca commits archivos `.env` o `.env.local` al repositorio
- Usa diferentes credenciales para development y production
- Rota las claves periódicamente
- Revisa los logs regularmente para detectar actividad sospechosa
