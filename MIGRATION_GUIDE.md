# 🚀 Guía de Migración a Supabase - Isla Market

## ✅ **Migración Completada**

La migración de datos mock a Supabase ha sido completada exitosamente. El proyecto ahora utiliza una base de datos real con APIs REST.

## 📋 **Lo que se ha implementado**

### **1. Configuración de Supabase**

- ✅ Cliente de Supabase configurado (`lib/supabase.ts`)
- ✅ Variables de entorno configuradas
- ✅ Tipos TypeScript para la base de datos

### **2. APIs REST**

- ✅ `/api/categories` - CRUD completo para categorías
- ✅ `/api/products` - CRUD completo para productos
- ✅ `/api/orders` - CRUD completo para órdenes
- ✅ `/api/migrate` - Script de migración de datos

### **3. Servicios de Datos**

- ✅ `DataService` - Adaptador entre APIs y componentes
- ✅ `ApiClient` - Cliente HTTP para consumir APIs
- ✅ Compatibilidad con código existente

### **4. Componentes Actualizados**

- ✅ Página principal (`app/page.tsx`)
- ✅ Página de productos (`app/products/page.tsx`)
- ✅ Filtros de productos (`components/products/product-filters.tsx`)
- ✅ Tarjetas de productos (`components/products/product-card.tsx`)

## 🗄️ **Estructura de la Base de Datos**

### **Tablas Principales:**

```sql
categories (4 registros)
├── id (UUID)
├── name (text)
├── description (text)
├── slug (text)
├── image_url (text)
└── is_active (boolean)

products (8 registros)
├── id (UUID)
├── name (text)
├── description (text)
├── price (numeric)
├── category_id (UUID → categories.id)
├── images (text[])
├── stock_quantity (integer)
├── weight (numeric)
└── dimensions (text)

users
├── id (UUID → auth.users.id)
├── email (text)
├── full_name (text)
└── role (enum: admin|customer)

orders
├── id (UUID)
├── user_id (UUID → users.id)
├── shipping_address_id (UUID)
├── status (enum)
├── total_amount (numeric)
└── notes (text)

order_items
├── id (UUID)
├── order_id (UUID → orders.id)
├── product_id (UUID → products.id)
├── quantity (integer)
├── unit_price (numeric)
└── total_price (numeric)

shipping_addresses
├── id (UUID)
├── user_id (UUID → users.id)
├── first_name, last_name (text)
├── phone (text)
├── street, house_number (text)
├── between_streets (text)
├── neighborhood, province (text)
└── is_default (boolean)
```

## 🔧 **Variables de Entorno Requeridas**

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://wrvndcavuczjffgbybcm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🚀 **Cómo ejecutar el proyecto**

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
# Crear .env.local con las variables de arriba

# 3. Ejecutar en desarrollo
npm run dev

# 4. Abrir en el navegador
# http://localhost:3000
```

## 📊 **Datos de Ejemplo**

La base de datos ya contiene:

- **4 categorías**: Electrónicos, Ropa, Hogar, Comida
- **8 productos**: Samsung Galaxy, iPad, Rice Cooker, Coffee Beans, etc.

## 🔄 **Cómo usar las APIs**

### **Obtener productos:**

```typescript
import { DataService } from "@/lib/data-service";

// Todos los productos
const products = await DataService.getProducts();

// Productos por categoría
const electronics = await DataService.getProducts({
  category: "category-id",
});

// Búsqueda
const results = await DataService.searchProducts("Samsung");

// Productos destacados
const featured = await DataService.getFeaturedProducts();
```

### **Obtener categorías:**

```typescript
const categories = await DataService.getCategories();
```

### **Crear orden:**

```typescript
const order = await DataService.createOrder({
  user_id: "user-uuid",
  shipping_address: {
    first_name: "María",
    last_name: "González",
    // ... otros campos
  },
  items: [
    {
      product_id: "product-uuid",
      quantity: 2,
      unit_price: 399.99,
    },
  ],
  total_amount: 799.98,
});
```

## 🔒 **Seguridad**

- ✅ RLS (Row Level Security) habilitado en todas las tablas
- ✅ Service Role Key solo en backend
- ✅ Anon Key para cliente frontend
- ⚠️ Configurar políticas RLS según necesidades

## 📈 **Próximos Pasos Sugeridos**

1. **Autenticación Real**

   - Implementar login/registro con Supabase Auth
   - Configurar políticas RLS

2. **Panel de Administración**

   - CRUD de productos desde la UI
   - Gestión de órdenes
   - Dashboard con estadísticas

3. **Procesamiento de Pagos**

   - Integrar Stripe
   - Webhook para actualizar órdenes

4. **Optimizaciones**

   - React Query para cache
   - Paginación de productos
   - Búsqueda avanzada

5. **Funcionalidades Avanzadas**
   - Sistema de reviews
   - Wishlist de usuarios
   - Notificaciones en tiempo real

## 🐛 **Solución de Problemas**

### **Error de conexión a Supabase:**

- Verificar variables de entorno
- Comprobar que las keys sean correctas
- Revisar la configuración de red

### **Productos no se cargan:**

- Verificar que los datos estén en la DB
- Comprobar logs de la consola
- Revisar permisos RLS

### **APIs no funcionan:**

- Verificar que Next.js esté corriendo
- Comprobar rutas API en `/api/`
- Revisar logs del servidor

## 📞 **Soporte**

Si encuentras algún problema:

1. Revisa los logs de la consola
2. Verifica la configuración de Supabase
3. Comprueba las variables de entorno
4. Consulta la documentación de Supabase

---

**¡La migración está completa y el sistema está listo para usar! 🎉**
