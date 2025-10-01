# 🚀 Plan de Implementación - Isla Market

## Funcionalidades Pendientes y Mejoras

---

## 📊 Estado Actual de la Aplicación

### ✅ **Funcionalidades Implementadas**

- **Frontend Completo:**

  - Home page con hero, categorías y productos destacados
  - Catálogo de productos con filtros y búsqueda
  - Sistema de carrito de compras (Zustand + localStorage)
  - Checkout con formulario de dirección cubana
  - Página de órdenes del usuario
  - Sistema de autenticación (login/signup)
  - Internacionalización (ES/EN)
  - Modo oscuro/claro
  - Diseño responsivo completo

- **Backend APIs:**

  - CRUD completo de productos (`/api/products`)
  - CRUD completo de categorías (`/api/categories`)
  - Gestión de órdenes (`/api/orders`)
  - Integración con Stripe (checkout + webhooks)
  - Integración con Supabase (PostgreSQL)
  - Sistema de autenticación con Supabase Auth

- **Infraestructura:**
  - Base de datos PostgreSQL en Supabase
  - Políticas RLS básicas
  - Deployment en Vercel
  - Variables de entorno configuradas

### 🔴 **Funcionalidades Faltantes Identificadas**

1. **Panel de Administración** (CRÍTICO)
2. **Sistema de Emails** (IMPORTANTE)
3. **Otras Mejoras Necesarias** (VER ANÁLISIS DETALLADO)

---

## 🎯 FASE 1: PANEL DE ADMINISTRACIÓN

### **Prioridad:** 🔴 CRÍTICA

### **Tiempo estimado:** 4-6 días

### **Complejidad:** Alta

### 1.1 Dashboard Interactivo

#### **Componentes a Crear:**

```
app/
  admin/
    layout.tsx              # Layout específico de admin con sidebar
    page.tsx                # Dashboard principal
    products/
      page.tsx              # Lista de productos con acciones
      [id]/
        page.tsx            # Editar producto
      new/
        page.tsx            # Crear producto nuevo
    categories/
      page.tsx              # Gestión de categorías
    orders/
      page.tsx              # Gestión de órdenes
      [id]/
        page.tsx            # Detalle de orden
    analytics/
      page.tsx              # Página de análisis y reportes

components/
  admin/
    admin-guard.tsx         # Guard para verificar rol de admin
    dashboard/
      stats-card.tsx        # Tarjeta de estadísticas
      sales-chart.tsx       # Gráfico de ventas
      orders-table.tsx      # Tabla de órdenes recientes
      top-products.tsx      # Lista de productos más vendidos
    products/
      product-form.tsx      # Formulario de producto
      product-list.tsx      # Lista con acciones
      image-upload.tsx      # Componente para subir imágenes
    orders/
      order-detail.tsx      # Detalle completo de orden
      order-status-badge.tsx # Badge de estado
      shipping-info.tsx     # Info de envío
```

#### **APIs a Crear/Mejorar:**

```typescript
// app/api/admin/stats/route.ts
GET /api/admin/stats
- Retorna estadísticas del dashboard:
  * Total de ventas (hoy, semana, mes, año)
  * Total de órdenes por estado
  * Productos más vendidos
  * Ingresos por día/semana/mes
  * Órdenes recientes
  * Stock bajo

// app/api/admin/orders/route.ts
GET /api/admin/orders?status=&page=&limit=
- Lista todas las órdenes con paginación
- Filtros por estado, fecha, cliente

PATCH /api/admin/orders/[id]/status
- Actualizar estado de una orden

// app/api/admin/products/route.ts
POST /api/admin/products
- Crear producto con validación de admin

PUT /api/admin/products/[id]
- Actualizar producto

DELETE /api/admin/products/[id]
- Eliminar producto (soft delete)

// app/api/admin/analytics/route.ts
GET /api/admin/analytics?period=
- Análisis detallado por período
  * Ventas diarias/semanales/mensuales
  * Comparación con período anterior
  * Trending products
  * Provincias con más órdenes
```

#### **Métricas del Dashboard:**

1. **Tarjetas de Estadísticas Principales:**

   - 💰 Ventas Totales (hoy, semana, mes)
   - 📦 Total de Órdenes
   - ⏳ Órdenes Pendientes
   - ✅ Órdenes Completadas
   - 📦 Productos en Catálogo
   - ⚠️ Productos con Stock Bajo

2. **Gráficos:**

   - 📈 **Ventas por Tiempo:** Line chart (últimos 30 días)
   - 📊 **Órdenes por Estado:** Pie chart
   - 🏆 **Top 10 Productos:** Bar chart
   - 🗺️ **Ventas por Provincia:** Map chart

3. **Tablas:**
   - 🕒 **Órdenes Recientes:** Últimas 10 con acciones rápidas
   - 🔥 **Productos Destacados:** Más vendidos del mes
   - ⚠️ **Alertas:** Stock bajo, órdenes pendientes

#### **Librerías Recomendadas:**

```json
{
  "recharts": "^2.10.0", // Gráficos
  "date-fns": "^3.0.0", // Manejo de fechas
  "react-hot-toast": "^2.4.1", // Ya instalado
  "@tanstack/react-table": "^8.11.0", // Tablas avanzadas
  "react-dropzone": "^14.2.0" // Upload de imágenes
}
```

#### **Checklist de Implementación:**

**Backend (2-3 días):**

- [ ] Crear API de estadísticas `/api/admin/stats`
- [ ] Crear API de analytics `/api/admin/analytics`
- [ ] Mejorar APIs de productos con validación admin
- [ ] Agregar middleware de verificación de rol admin
- [ ] Crear queries optimizadas en Supabase
- [ ] Agregar índices en BD para performance

**Frontend (2-3 días):**

- [ ] Crear AdminGuard component
- [ ] Layout de admin con sidebar responsivo
- [ ] Dashboard principal con stats cards
- [ ] Implementar gráficos con Recharts
- [ ] Tabla de órdenes con filtros y paginación
- [ ] Formulario de productos con validación
- [ ] Sistema de upload de imágenes
- [ ] Páginas de gestión de categorías
- [ ] Página de analytics detallado

**Testing y Optimización (1 día):**

- [ ] Probar flujo completo de admin
- [ ] Optimizar queries lentas
- [ ] Implementar caching donde sea necesario
- [ ] Responsive testing

---

## 📧 FASE 2: SISTEMA DE EMAILS CON RESEND

### **Prioridad:** 🟡 IMPORTANTE

### **Tiempo estimado:** 2-3 días

### **Complejidad:** Media

### 2.1 Configuración de Resend

#### **Setup Inicial:**

```bash
# Instalar Resend
pnpm add resend

# Agregar variable de entorno
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

#### **Estructura de Archivos:**

```
lib/
  email/
    resend.ts              # Cliente de Resend
    templates/
      order-confirmation.tsx  # Template de confirmación
      order-shipped.tsx       # Template de envío
      order-delivered.tsx     # Template de entrega
      password-reset.tsx      # Template reset password
      welcome.tsx             # Template bienvenida

app/api/
  email/
    send/route.ts          # Endpoint para enviar emails
    test/route.ts          # Endpoint de prueba
```

#### **Templates de Emails a Crear:**

1. **🛒 Confirmación de Orden**

   - Trigger: Después de pago exitoso
   - Contenido:
     - Número de orden
     - Resumen de productos
     - Dirección de envío
     - Total pagado
     - Tiempo estimado de entrega

2. **📦 Orden Enviada**

   - Trigger: Admin marca orden como "shipped"
   - Contenido:
     - Número de tracking (si aplica)
     - Productos enviados
     - Fecha estimada de llegada

3. **✅ Orden Entregada**

   - Trigger: Admin marca orden como "delivered"
   - Contenido:
     - Confirmación de entrega
     - Solicitar feedback
     - Link a página de review

4. **👋 Email de Bienvenida**

   - Trigger: Registro nuevo
   - Contenido:
     - Bienvenida personalizada
     - Cómo funciona el servicio
     - Categorías destacadas
     - Cupón de descuento (opcional)

5. **🔐 Reset de Contraseña**

   - Trigger: Usuario solicita reset
   - Contenido:
     - Link seguro de reset
     - Expiración del link
     - Instrucciones

6. **❌ Orden Cancelada**
   - Trigger: Cancelación de orden
   - Contenido:
     - Razón de cancelación
     - Información de reembolso
     - Alternativas

#### **Implementación:**

```typescript
// lib/email/resend.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({
  to,
  subject,
  template,
  data,
}: {
  to: string;
  subject: string;
  template: React.ReactElement;
  data?: any;
}) => {
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: "Isla Market <orders@islamarket.com>",
      to,
      subject,
      react: template,
    });

    if (error) {
      console.error("Error sending email:", error);
      throw error;
    }

    return emailData;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
};

// Funciones específicas
export const sendOrderConfirmation = async (
  order: Order,
  userEmail: string
) => {
  return sendEmail({
    to: userEmail,
    subject: `Confirmación de Orden #${order.id.slice(0, 8)}`,
    template: <OrderConfirmationEmail order={order} />,
  });
};
```

#### **API para Enviar Emails:**

```typescript
// app/api/email/send/route.ts
import { sendEmail } from "@/lib/email/resend";
import { createSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { type, orderId, userId } = await request.json();

    // Verificar autenticación/autorización
    // ...

    // Obtener datos necesarios
    const supabase = createSupabaseAdmin();
    // ...

    // Enviar email según tipo
    switch (type) {
      case "order-confirmation":
        await sendOrderConfirmation(order, userEmail);
        break;
      // ... otros casos
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

#### **Integración con Webhooks de Stripe:**

```typescript
// En app/api/stripe/webhook/route.ts
// Después de crear la orden exitosamente

if (session.payment_status === "paid") {
  // Crear orden en BD
  const order = await createOrder(session);

  // Enviar email de confirmación
  await sendOrderConfirmation(order, session.customer_email);
}
```

#### **Checklist de Implementación:**

- [ ] Configurar cuenta en Resend
- [ ] Configurar dominio y DNS
- [ ] Crear templates de emails con React
- [ ] Implementar función sendEmail
- [ ] Crear API endpoint `/api/email/send`
- [ ] Integrar con webhook de Stripe
- [ ] Integrar con cambios de estado de órdenes
- [ ] Agregar emails a proceso de registro
- [ ] Crear página de test de emails
- [ ] Agregar logging de emails enviados
- [ ] Probar todos los flujos

---

## 🎨 FASE 3: MEJORAS ADICIONALES RECOMENDADAS

### **Prioridad:** 🟢 DESEABLE

### **Tiempo estimado:** 5-7 días

### 3.1 Sistema de Notificaciones en Tiempo Real

**Herramientas:** Supabase Realtime

**Características:**

- 🔔 Notificaciones de nuevas órdenes para admins
- 📦 Actualizaciones de estado de orden para clientes
- 💬 Sistema de mensajería admin-cliente
- ⚡ Toast notifications en UI

**Implementación:**

```typescript
// lib/realtime.ts
export function subscribeToOrders(userId: string, callback: Function) {
  return supabase
    .channel("orders")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "orders",
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}
```

---

### 3.2 Sistema de Reviews y Ratings

**Características:**

- ⭐ Rating de productos (1-5 estrellas)
- 💬 Comentarios de clientes
- 📸 Fotos en reviews
- ✅ Verificación de compra
- 👍 Helpful/Not helpful votes

**Base de Datos:**

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  user_id UUID REFERENCES auth.users(id),
  order_id UUID REFERENCES orders(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  images TEXT[],
  is_verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 3.3 Sistema de Cupones y Descuentos

**Características:**

- 🎟️ Códigos de descuento
- 💰 Descuentos por porcentaje o monto fijo
- 📅 Fechas de validez
- 🔢 Límite de usos
- 👥 Descuentos por primera compra
- 🎁 Cupones de referidos

**Base de Datos:**

```sql
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase_amount DECIMAL(10,2),
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE coupon_uses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID REFERENCES coupons(id),
  user_id UUID REFERENCES auth.users(id),
  order_id UUID REFERENCES orders(id),
  discount_applied DECIMAL(10,2),
  used_at TIMESTAMP DEFAULT NOW()
);
```

---

### 3.4 Tracking de Envíos

**Características:**

- 📍 Estado de envío en tiempo real
- 🗺️ Mapa con ubicación del paquete
- 📧 Notificaciones de cambios de estado
- 📱 Link de tracking público

**Estados de Envío:**

1. Orden Recibida
2. En Preparación
3. En Tránsito a Cuba
4. En Aduana
5. En Distribución Local
6. En Ruta de Entrega
7. Entregado

---

### 3.5 Wishlist / Lista de Deseos

**Características:**

- ❤️ Agregar productos a favoritos
- 🔔 Notificar cuando baje de precio
- 📧 Notificar cuando vuelva a stock
- 📤 Compartir wishlist

---

### 3.6 Programa de Referidos

**Características:**

- 👥 Código de referido único por usuario
- 💰 Créditos por referidos exitosos
- 📊 Dashboard de referidos
- 🏆 Niveles de recompensas

---

### 3.7 Mejoras de Seguridad

**Implementaciones Necesarias:**

1. **Rate Limiting:**

```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});
```

2. **Verificación de Email:**

- Supabase ya provee esto
- Implementar flujo de verificación obligatoria

3. **2FA Opcional:**

- Para admins (obligatorio)
- Para clientes (opcional)

4. **Logs de Auditoría:**

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 3.8 Mejoras de UX

**Implementaciones:**

1. **Búsqueda Avanzada:**

   - Autocompletado
   - Búsqueda por voz
   - Filtros avanzados
   - Historial de búsquedas

2. **Carrito Mejorado:**

   - Guardar para después
   - Productos sugeridos relacionados
   - Cálculo de impuestos y envío en tiempo real

3. **Onboarding:**

   - Tour guiado para nuevos usuarios
   - Tips contextuales
   - Video tutoriales

4. **PWA (Progressive Web App):**
   - Instalable en móviles
   - Funciona offline
   - Push notifications

---

### 3.9 Analytics y Tracking

**Herramientas:**

- Google Analytics 4
- Facebook Pixel
- Hotjar (mapas de calor)

**Métricas a Trackear:**

- Conversión de visitante a comprador
- Abandono de carrito
- Productos más vistos
- Tiempo en sitio
- Flujo de navegación

---

### 3.10 Optimización de Performance

**Implementaciones:**

1. **Image Optimization:**

```typescript
// next.config.js
module.exports = {
  images: {
    domains: ["images.pexels.com", "supabase.co"],
    formats: ["image/webp", "image/avif"],
  },
};
```

2. **Caching:**

   - Redis para cache de productos
   - SWR para cache del lado del cliente
   - ISR para páginas estáticas

3. **Code Splitting:**

   - Dynamic imports
   - Route-based splitting
   - Component lazy loading

4. **CDN:**
   - Vercel Edge Network (ya incluido)
   - Cloudflare para assets

---

## 📋 ROADMAP PRIORIZADO

### **Sprint 1 (Semana 1-2):** 🔴 CRÍTICO

1. ✅ Panel de Administración - Backend APIs
2. ✅ Panel de Administración - Dashboard UI
3. ✅ Panel de Administración - Gestión de Productos
4. ✅ Panel de Administración - Gestión de Órdenes

### **Sprint 2 (Semana 3):** 🟡 IMPORTANTE

5. ✅ Sistema de Emails - Setup Resend
6. ✅ Sistema de Emails - Templates
7. ✅ Sistema de Emails - Integración

### **Sprint 3 (Semana 4):** 🟢 DESEABLE

8. ✅ Sistema de Reviews y Ratings
9. ✅ Sistema de Cupones
10. ✅ Mejoras de Seguridad (Rate Limiting, Audit Logs)

### **Sprint 4 (Semana 5-6):** 🟢 DESEABLE

11. ✅ Tracking de Envíos
12. ✅ Wishlist
13. ✅ Notificaciones en Tiempo Real

### **Sprint 5 (Semana 7+):** 🔵 FUTURO

14. ⏳ Programa de Referidos
15. ⏳ Analytics Avanzados
16. ⏳ PWA
17. ⏳ Optimizaciones de Performance

---

## 💰 ESTIMACIÓN DE COSTOS MENSUALES

### **Servicios Actuales:**

- ✅ Vercel (Hobby): $0/mes
- ✅ Supabase (Free): $0/mes
- ✅ Stripe: 2.9% + $0.30 por transacción

### **Servicios Nuevos Necesarios:**

- 📧 **Resend:**
  - Free: 3,000 emails/mes
  - Pro: $20/mes (50,000 emails)
- 📊 **Analytics (Opcional):**
  - Google Analytics: $0 (gratis)
  - Mixpanel: $0-$25/mes
- 🚀 **Upstash Redis (Rate Limiting):**
  - Free: 10,000 requests/día
  - Pro: $10/mes

### **Estimación Total:**

- **MVP:** $0-20/mes
- **Producción Pequeña:** $30-50/mes
- **Producción Media:** $100-200/mes

---

## 🎯 MÉTRICAS DE ÉXITO

### **KPIs del Negocio:**

- 📈 Conversión: % de visitantes que compran
- 💰 Ticket Promedio: Valor promedio de orden
- 🔄 Tasa de Retorno: % de clientes que vuelven
- ⭐ Satisfacción: Rating promedio de reviews
- 📦 Tiempo de Entrega: Días promedio

### **KPIs Técnicos:**

- ⚡ Performance: <3s carga inicial
- 🐛 Error Rate: <1%
- 📱 Mobile Usage: >60%
- 🔐 Security: 0 vulnerabilidades críticas

---

## 📞 PRÓXIMOS PASOS INMEDIATOS

### **Para Empezar HOY:**

1. **Confirmar Prioridades:**

   - ¿Qué sprint quieres atacar primero?
   - ¿Alguna funcionalidad adicional específica?

2. **Preparar Ambiente:**

   ```bash
   # Instalar dependencias nuevas
   pnpm add recharts date-fns @tanstack/react-table react-dropzone resend

   # Crear estructura de carpetas
   mkdir -p app/admin/{products,categories,orders,analytics}
   mkdir -p components/admin/{dashboard,products,orders}
   mkdir -p lib/email/templates
   ```

3. **Setup de Servicios:**
   - Crear cuenta en Resend
   - Configurar dominio para emails
   - Revisar políticas RLS en Supabase

---

## 📝 NOTAS IMPORTANTES

1. **Seguridad:**

   - TODAS las rutas de admin deben validar rol
   - Implementar CSRF tokens
   - Rate limiting en todas las APIs públicas

2. **Performance:**

   - Cachear queries pesadas
   - Optimizar imágenes
   - Lazy loading de componentes

3. **UX:**

   - Mantener feedback visual en todas las acciones
   - Loading states en todas las peticiones
   - Mensajes de error claros

4. **Testing:**
   - Probar flujos completos antes de merge
   - Test en móvil
   - Test con datos reales

---

¿Por cuál fase quieres que empecemos? 🚀
