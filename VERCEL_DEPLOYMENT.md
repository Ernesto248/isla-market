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

### Error: CORS Policy / "Access-Control-Allow-Origin" header is present

Este error ocurre cuando la aplicación intenta hacer fetch a una URL incorrecta.

**Síntomas:**
```
Access to fetch at 'https://your-domain.com/api/products' from origin 'https://isla-market.vercel.app' 
has been blocked by CORS policy
```

**Causa:** 
El archivo `lib/api.ts` tenía configurada una URL hardcodeada `"https://your-domain.com"` en lugar de usar el dominio real de Vercel.

**Solución:**
- ✅ Este problema ya está resuelto en la versión actual del código
- ✅ La aplicación ahora detecta automáticamente el dominio correcto
- ✅ Si ves este error, asegúrate de tener la última versión del código desde GitHub
- ✅ Re-despliega la aplicación en Vercel

**Para verificar:**
1. Abre las DevTools del navegador (F12)
2. Ve a la pestaña Network
3. Verifica que las peticiones sean a `https://tu-dominio.vercel.app/api/...`
4. Si ves peticiones a `your-domain.com`, necesitas actualizar el código

### Error: "No signature found in headers"

- ✅ Verifica que `STRIPE_WEBHOOK_SECRET` esté configurado
- ✅ Asegúrate de usar el secret del webhook de **producción**, no de desarrollo
- ✅ El endpoint debe ser `/api/stripe/webhook`

### Error: 404 en las rutas API

**Síntomas:**
```
Failed to load resource: the server responded with a status of 404 ()
```

**Posibles causas y soluciones:**

1. **Variables de entorno no configuradas:**
   - Verifica que todas las variables de entorno estén configuradas en Vercel
   - Re-despliega después de agregar las variables

2. **Base de datos vacía:**
   - Si es la primera vez que despliegas, la base de datos puede estar vacía
   - Usa el endpoint `/api/migrate` para crear datos de prueba (ver sección "Migración de Datos")

3. **Errores en el servidor:**
   - Revisa los logs de Vercel para ver errores específicos
   - Ve a: Vercel Dashboard > Tu Proyecto > Deployments > [último deployment] > Functions

### Pagos no se procesan

- ✅ Verifica que el webhook esté configurado en Stripe
- ✅ Revisa los logs del webhook en Stripe Dashboard
- ✅ Asegúrate de usar las credenciales correctas (test vs live)

### La aplicación carga pero no muestra productos

**Posibles causas:**

1. **Base de datos vacía:** 
   - Solución: Ejecuta la migración de datos (ver sección abajo)

2. **Políticas RLS de Supabase muy restrictivas:**
   - Ve a Supabase Dashboard > Authentication > Policies
   - Asegúrate de que las políticas permitan lectura pública para `products` y `categories`

3. **Errores de red:**
   - Abre DevTools (F12) y revisa la consola
   - Busca mensajes de error en rojo

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
