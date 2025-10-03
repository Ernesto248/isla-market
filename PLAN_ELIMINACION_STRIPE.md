# Plan Detallado: Eliminación de Stripe e Implementación de Flujo Directo de Órdenes

## 📋 Análisis de la Situación Actual

### ✅ Estructura de Base de Datos Actualizada (2025-10-03)

```
orders table: ✅ LIMPIA Y ACTUALIZADA
- id (uuid)
- user_id (uuid)
- shipping_address_id (uuid)
- status (enum: pending, confirmed, processing, shipped, delivered, cancelled, paid)
- total_amount (numeric)
- notes (text)
- created_at (timestamp)
- updated_at (timestamp)

✅ Columnas de Stripe ELIMINADAS:
❌ stripe_payment_intent_id (eliminado)
❌ stripe_session_id (eliminado)

✅ Datos limpiados: 0 órdenes, 0 order_items
```

### Archivos que Usan Stripe (a modificar/eliminar)

**APIs de Stripe (ELIMINAR):**

1. `/app/api/stripe/checkout/route.ts` - Crea sesión de Stripe
2. `/app/api/stripe/webhook/route.ts` - Procesa webhooks de Stripe
3. `/app/api/stripe/webhook-test/route.ts` - Testing de webhooks
4. `/app/api/stripe/webhook-no-verify/route.ts` - Webhook sin verificación

**Archivos a Modificar:**

1. `/app/checkout/page.tsx` - Página de checkout (usa Stripe)
2. `/app/admin/orders/[id]/page.tsx` - Muestra datos de Stripe
3. `/lib/stripe.ts` - Configuración de Stripe
4. `/lib/supabase.ts` - Tipos con campos de Stripe
5. `/lib/data-service.ts` - Función getOrderByStripeSessionId

**Páginas de Resultado:**

1. `/app/checkout/success/page.tsx` - Éxito de Stripe
2. `/app/checkout/cancel/page.tsx` - Cancelación de Stripe

---

## 🎯 Objetivos del Nuevo Flujo

1. **Crear orden directamente** sin pasar por Stripe
2. **Estado inicial: "pending"** al crear la orden
3. **Enviar 2 emails:**
   - Email al cliente: Recibo de confirmación de orden
   - Email al dueño: Notificación de nueva orden
4. **Guardar en DB inmediatamente** (no esperar webhook)
5. **Mantener flujo de estados:** pending → paid → delivered

---

## 📦 Fase 1: Preparación - Base de Datos ✅ COMPLETADA

### Paso 1.1: ✅ Migración de Base de Datos COMPLETADA

**✅ Acciones ejecutadas:**

1. Eliminados todos los registros de `order_items` (10 items)
2. Eliminadas todas las órdenes de `orders` (6 órdenes)
3. Ejecutada migración: `remove_stripe_columns_from_orders`
4. Columnas eliminadas exitosamente:
   - ❌ `stripe_payment_intent_id`
   - ❌ `stripe_session_id`

**Estado actual:** Tabla `orders` lista para el nuevo flujo sin Stripe.

---

## 📧 Fase 2: Sistema de Emails ✅ COMPLETADA

### ✅ Configuración Confirmada

**Servicio seleccionado:** Resend ✅  
**Dominio:** isla-market.com ✅  
**Templates:** React Email (diseños bonitos) ✅  
**Admin Email:** ernestoleonard8@gmail.com ✅

### Paso 2.1: ✅ Variables de Entorno Configuradas

```env
# Email Service - Resend
RESEND_API_KEY=re_xxxxxxxxxxxxx ✅
EMAIL_FROM=pedidos@isla-market.com ✅
ADMIN_EMAIL=ernestoleonard8@gmail.com ✅
```

### Paso 2.2: ✅ Dependencias Instaladas

- resend
- react-email
- @react-email/components (todos los componentes)

### Paso 2.3: ✅ Templates Creados

**Archivos creados:**

1. `/emails/order-confirmation-customer.tsx` - Template bonito para cliente
2. `/emails/order-notification-admin.tsx` - Template bonito para admin
3. `/lib/email.ts` - Utilidad para enviar emails

**Funciones disponibles:**

- `sendOrderEmails()` - Envía confirmación al cliente y notificación al admin
- `sendOrderStatusUpdateEmail()` - Envía actualizaciones de estado (paid, delivered, etc.)

### Paso 2.3: Templates de Email

**Template 1 - Email al Cliente (Recibo):**

```
Asunto: ✅ Confirmación de Pedido #[ORDER_ID]

Hola [CUSTOMER_NAME],

¡Gracias por tu pedido! Hemos recibido tu orden y la procesaremos pronto.

📦 DETALLES DEL PEDIDO
━━━━━━━━━━━━━━━━━━━━━
Pedido #: [ORDER_ID]
Fecha: [ORDER_DATE]
Total: $[TOTAL_AMOUNT]

🛍️ PRODUCTOS
[PRODUCT_LIST]

📍 DESTINATARIO EN CUBA
[RECIPIENT_NAME]
[FULL_ADDRESS]

💳 ESTADO DEL PAGO
Pendiente de confirmación

Te notificaremos cuando se confirme el pago y se procese tu pedido.

¿Preguntas? Responde a este email.

Con amor desde el exterior,
Isla Market 🇨🇺
```

**Template 2 - Email al Admin (Notificación):**

```
Asunto: 🔔 Nueva Orden Recibida - #[ORDER_ID]

Nueva orden en Isla Market:

📋 INFORMACIÓN
━━━━━━━━━━━━━━━━━━━━━
ID: [ORDER_ID]
Cliente: [CUSTOMER_NAME]
Email: [CUSTOMER_EMAIL]
Teléfono: [CUSTOMER_PHONE]
Total: $[TOTAL_AMOUNT]
Fecha: [ORDER_DATE]

🛍️ PRODUCTOS
[PRODUCT_LIST]

📍 ENVÍO A CUBA
Destinatario: [RECIPIENT_NAME]
Dirección: [FULL_ADDRESS]

🔗 Ver orden completa:
[ADMIN_LINK]
```

---

## � Fase 3: Nuevo Flujo de Órdenes ✅ COMPLETADA

### Paso 3.1: ✅ Crear Nueva API de Órdenes COMPLETADA

**Archivo nuevo:** `/app/api/orders/create/route.ts` ✅

Funcionalidad implementada:

1. ✅ Validar datos del formulario
2. ✅ Validar que el usuario esté autenticado
3. ✅ Crear/obtener dirección de envío
4. ✅ Crear orden con estado "pending"
5. ✅ Crear order_items
6. ✅ Enviar email al cliente (recibo) - importación dinámica
7. ✅ Enviar email al admin (notificación) - importación dinámica
8. ✅ Retornar orden creada

**Nota técnica:** Se utilizó importación dinámica de `@/lib/email` para evitar problemas de build con React Email components.

### Paso 3.2: ✅ Modificar Página de Checkout COMPLETADA

**Archivo:** `/app/checkout/page.tsx` ✅

Cambios realizados:

- ✅ Eliminada integración con Stripe
- ✅ Eliminado `loadStripe()` import
- ✅ Agregada llamada a `/api/orders/create`
- ✅ Redirige a `/checkout/success` con orderId
- ✅ Limpia carrito después de crear orden exitosamente
- ✅ Cambiado icono de botón de CreditCard a ShoppingBag
- ✅ Texto del botón: "Confirmar Pedido" / "Creando orden..."
- ✅ Bundle size reducido: 7.83 kB → 6.74 kB

### Paso 3.3: Actualizar Página de Éxito

**Archivo:** `/app/checkout/success/page.tsx`

Cambios:

- Mostrar detalles de la orden creada
- Mensaje de confirmación
- No mencionar Stripe/pago procesado
- Indicar que el pago está pendiente de confirmación

### Paso 3.4: Actualizar Admin Panel

**Archivo:** `/app/admin/orders/[id]/page.tsx`

Cambios:

- Eliminar sección de "ID de Sesión Stripe"
- Eliminar sección de "Payment Intent ID"
- Mantener flujo de estados (pending → paid → delivered)

---

## 🗑️ Fase 4: Limpieza de Código

### Paso 4.1: Eliminar Archivos de Stripe

```
❌ /app/api/stripe/ (toda la carpeta)
❌ /lib/stripe.ts
❌ STRIPE_SETUP.md
```

### Paso 4.2: Actualizar Tipos en Supabase

**Archivo:** `/lib/supabase.ts`

Cambios:

- Marcar `stripe_payment_intent_id` y `stripe_session_id` como opcionales
- O eliminar completamente si elegiste Opción B en BD

### Paso 4.3: Limpiar Dependencias

**Archivo:** `package.json`

Eliminar:

```json
"stripe": "^x.x.x",
"@stripe/stripe-js": "^x.x.x"
```

Comando:

```bash
pnpm remove stripe @stripe/stripe-js
```

### Paso 4.4: Limpiar Variables de Entorno

**Archivo:** `.env.local`

Eliminar:

```env
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## 📝 Fase 5: Testing

### Checklist de Pruebas:

- [ ] Usuario puede crear orden desde checkout
- [ ] Orden se guarda en DB con estado "pending"
- [ ] Email de recibo llega al cliente
- [ ] Email de notificación llega al admin
- [ ] Carrito se limpia después de crear orden
- [ ] Página de éxito muestra orden correctamente
- [ ] Admin puede ver orden sin errores
- [ ] Admin puede cambiar estado a "paid"
- [ ] Admin puede cambiar estado a "delivered"
- [ ] No hay referencias a Stripe en la UI
- [ ] No hay errores en consola por Stripe

---

## 🎨 Fase 6: Mejoras UX (Opcional)

### Mejoras sugeridas:

1. **Página de confirmación mejorada** con timeline de estados
2. **Notificación por email** cuando el estado cambia (paid, delivered)
3. **Panel de usuario** para ver sus órdenes
4. **Tracking de envíos** (futuro)

---

## ⚠️ Preguntas Importantes Antes de Comenzar

1. **¿Qué servicio de email prefieres?** (Resend, SendGrid, otro)
2. **¿Tienes un dominio configurado para enviar emails?** (Ej: @islamarketcuba.com)
3. **¿Quieres mantener las columnas de Stripe en la BD?** (Recomiendo que sí)
4. **¿Cuál es el email del admin para recibir notificaciones?**
5. **¿Quieres que te cree las plantillas de email en HTML/React bonitas?**

---

## 📊 Resumen de Cambios

### Archivos a ELIMINAR:

- 4 archivos en `/app/api/stripe/`
- 1 archivo: `/lib/stripe.ts`
- 1 archivo: `STRIPE_SETUP.md`
- **Total: ~6 archivos**

### Archivos a CREAR:

- 1 API: `/app/api/orders/create/route.ts`
- 2 Templates: Email cliente y admin
- 1 Utilidad: `/lib/email.ts`
- **Total: ~4 archivos nuevos**

### Archivos a MODIFICAR:

- `/app/checkout/page.tsx`
- `/app/checkout/success/page.tsx`
- `/app/admin/orders/[id]/page.tsx`
- `/lib/supabase.ts`
- `/lib/data-service.ts`
- `package.json`
- `.env.local`
- **Total: ~7 archivos**

---

## 🚀 Orden de Implementación Recomendado

1. **Responder preguntas** sobre email y configuración
2. **Instalar servicio de email** (ej: Resend)
3. **Crear utilidad de email** con templates
4. **Crear API `/orders/create`**
5. **Modificar checkout page**
6. **Probar flujo completo**
7. **Actualizar admin panel**
8. **Eliminar código de Stripe**
9. **Limpiar dependencias**
10. **Testing final**

---

## ⏱️ Tiempo Estimado

- Configuración email: 15-20 minutos
- API de órdenes: 30-40 minutos
- Templates de email: 20-30 minutos
- Modificar checkout: 20 minutos
- Actualizar admin: 15 minutos
- Limpieza: 10 minutos
- Testing: 20-30 minutos

**Total: ~2.5-3 horas de trabajo paso a paso**

---

## 💡 Notas Finales

- Iremos **paso a paso, sin apuros** como prefieres
- Te mostraré el código antes de implementar cada cambio
- Podrás revisar y aprobar cada paso
- Mantendré el mismo estilo de código de tu proyecto
- Usaremos TypeScript y las mismas librerías que ya tienes

**¿Listo para empezar? Por favor responde las 5 preguntas de la sección "Preguntas Importantes" y comenzamos con la Fase 2 (Emails).** 🚀
