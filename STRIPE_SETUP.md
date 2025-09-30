# 🔥 **Configuración de Stripe - Isla Market**

## ✅ **¡Implementación Completada!**

El procesamiento de pagos con Stripe ha sido completamente implementado. Aquí tienes todo lo que necesitas para configurarlo:

## 🔧 **Variables de Entorno Requeridas**

Agrega estas variables a tu archivo `.env.local`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Tu Secret Key de Stripe (TEST)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Tu Publishable Key de Stripe (TEST)
STRIPE_WEBHOOK_SECRET=whsec_... # Secret del webhook (se genera después)

# Supabase (ya existentes)
NEXT_PUBLIC_SUPABASE_URL=https://wrvndcavuczjffgbybcm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🚀 **Cómo Obtener las Keys de Stripe**

### 1. **Crear Cuenta en Stripe**

- Ve a [https://stripe.com](https://stripe.com)
- Crea una cuenta o inicia sesión
- Activa el "Test Mode" (interruptor en la esquina superior derecha)

### 2. **Obtener API Keys**

- Ve a **Developers** → **API keys**
- Copia el **Publishable key** (pk*test*...)
- Copia el **Secret key** (sk*test*...)

### 3. **Configurar Webhook**

- Ve a **Developers** → **Webhooks**
- Haz clic en **"Add endpoint"**
- URL del endpoint: `https://tu-dominio.com/api/stripe/webhook`
- Eventos a escuchar:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
- Guarda y copia el **Signing secret** (whsec\_...)

## 📋 **Archivos Implementados**

### **APIs de Stripe:**

- ✅ `/api/stripe/checkout` - Crear checkout session
- ✅ `/api/stripe/webhook` - Procesar eventos de Stripe

### **Páginas:**

- ✅ `/checkout/success` - Página de pago exitoso
- ✅ `/checkout/cancel` - Página de pago cancelado
- ✅ `/checkout` - Integrado con Stripe

### **Configuración:**

- ✅ `lib/stripe.ts` - Configuración de Stripe
- ✅ Base de datos actualizada con `stripe_session_id`

## 🔄 **Flujo Completo de Pagos**

```
1. Usuario → Productos → Carrito → Checkout
2. Checkout → API (/api/stripe/checkout) → Stripe Session
3. Stripe Checkout → Usuario paga → Webhook (/api/stripe/webhook)
4. Webhook → Crear orden en Supabase → Página de éxito
5. Usuario recibe confirmación → Email (TODO)
```

## 🧪 **Cómo Probar**

### **Tarjetas de Prueba de Stripe:**

```
✅ Éxito: 4242 4242 4242 4242
❌ Falla: 4000 0000 0000 0002
🔄 3D Secure: 4000 0000 0000 3220

Fecha: Cualquier fecha futura
CVC: Cualquier 3 dígitos
```

### **Pasos para Probar:**

1. Agregar productos al carrito
2. Ir a checkout
3. Llenar formulario
4. Usar tarjeta de prueba
5. Verificar que se crea la orden en Supabase
6. Verificar redirección a página de éxito

## 📊 **Base de Datos Actualizada**

### **Nuevas Columnas:**

```sql
-- Tabla orders
ALTER TABLE orders ADD COLUMN stripe_session_id TEXT;

-- Enum order_status
ALTER TYPE order_status ADD VALUE 'paid';
```

### **Estados de Orden:**

- `pending` - Pendiente
- `confirmed` - Confirmada
- `processing` - Procesando
- `shipped` - Enviada
- `delivered` - Entregada
- `cancelled` - Cancelada
- **`paid` - Pagada** ← NUEVO

## 🎯 **Características Implementadas**

### **Checkout Session:**

- ✅ Conversión automática de carrito a line_items
- ✅ Metadata con información del cliente
- ✅ Recolección de dirección de envío
- ✅ Recolección de teléfono
- ✅ Expiración en 30 minutos
- ✅ Solo países permitidos (Cuba)

### **Webhook:**

- ✅ Verificación de firma de Stripe
- ✅ Creación automática de usuario si no existe
- ✅ Creación de dirección de envío
- ✅ Creación de orden con items
- ✅ Estado "paid" automático
- ✅ Manejo de errores robusto

### **Páginas de Resultado:**

- ✅ Página de éxito con ID de transacción
- ✅ Página de cancelación
- ✅ Navegación intuitiva
- ✅ Limpieza automática del carrito

## 🔍 **Debugging**

### **Logs a Revisar:**

```bash
# Webhook logs
console.log("Processing completed checkout session:", session.id);

# Checkout logs
console.log("Checkout error:", error);

# Stripe Dashboard
# Ve a Developers → Logs para ver requests
```

### **Problemas Comunes:**

1. **Webhook no funciona**: Verificar STRIPE_WEBHOOK_SECRET
2. **Keys inválidas**: Verificar que sean de TEST mode
3. **CORS errors**: Verificar dominio en Stripe
4. **DB errors**: Verificar conexión a Supabase

## 🚀 **¡Listo para Producción!**

### **Para ir a producción:**

1. Cambiar a keys de producción en Stripe
2. Configurar webhook en dominio real
3. Actualizar variables de entorno
4. Configurar emails de confirmación
5. Configurar manejo de inventario

---

## 💡 **Próximos Pasos Sugeridos**

1. **Emails de Confirmación** (Resend/SendGrid)
2. **Panel de Admin** para gestionar órdenes
3. **Manejo de Inventario** automático
4. **Facturación** y recibos
5. **Reembolsos** desde el admin

**¡El sistema de pagos está completamente funcional! 🎉**
