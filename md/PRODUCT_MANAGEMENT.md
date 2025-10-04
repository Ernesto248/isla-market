# Gestión de Productos - Documentación

## 📋 Resumen

Se ha implementado el sistema completo de gestión de productos (CRUD) para el panel de administración, incluyendo la integración con Digital Ocean Spaces para el manejo de imágenes.

## 🎯 Funcionalidades Implementadas

### API Endpoints

#### `/api/admin/products` (GET, POST)

- **GET**: Listar todos los productos con filtros

  - Búsqueda por nombre y descripción
  - Filtro por categoría
  - Filtro por estado (activo/inactivo)
  - Incluye información de categoría (JOIN)
  - Ordenado por fecha de creación (descendente)

- **POST**: Crear nuevo producto
  - Validación de campos requeridos (nombre, precio, categoría)
  - Validación de precio positivo
  - Soporte para imágenes múltiples
  - Campos opcionales: descripción, stock, peso, dimensiones

#### `/api/admin/products/[id]` (GET, PUT, DELETE)

- **GET**: Obtener un producto específico

  - Incluye información de categoría

- **PUT**: Actualizar producto existente

  - Actualización parcial (solo campos enviados)
  - Validación de datos
  - Actualiza timestamp `updated_at`

- **DELETE**: Eliminación inteligente
  - Si el producto tiene órdenes: lo **desactiva** (soft delete)
  - Si no tiene órdenes: lo **elimina permanentemente** (hard delete)
  - Previene pérdida de información histórica

### Páginas de Administración

#### `/admin/products` - Lista de Productos

**Características:**

- Tabla responsiva con información del producto
- Imagen en miniatura (12x12px)
- Badges de estado (activo/inactivo)
- Badges de stock con códigos de color:
  - Verde (>10 unidades): Stock suficiente
  - Amarillo (1-10 unidades): Stock bajo
  - Rojo (0 unidades): Sin stock

**Filtros:**

- Búsqueda en tiempo real (debounce 500ms)
- Filtro por categoría
- Filtro por estado

**Acciones:**

- Toggle activo/inactivo (icono ojo)
- Editar producto (icono lápiz)
- Eliminar producto (icono basura)
- Crear nuevo producto (botón principal)

#### `/admin/products/new` - Crear Producto

**Formulario organizado en 4 secciones:**

1. **Información Básica**

   - Nombre (requerido)
   - Descripción (textarea)
   - Categoría (select, requerido)
   - Estado activo/inactivo (switch)

2. **Precio e Inventario**

   - Precio en ARS (requerido, decimal)
   - Cantidad en stock (opcional, entero)

3. **Detalles Físicos**

   - Peso en kg (opcional, decimal)
   - Dimensiones (opcional, texto libre)

4. **Imágenes**
   - Componente ImageUpload integrado
   - Hasta 5 imágenes
   - Drag & drop funcional
   - Vista previa en grid

**Validaciones:**

- Campos requeridos marcados con \*
- Precio debe ser mayor a 0
- Categoría debe seleccionarse
- Notificaciones toast para errores/éxito

#### `/admin/products/[id]/edit` - Editar Producto

**Características:**

- Misma estructura que el formulario de creación
- Pre-carga de datos existentes
- Imágenes existentes se muestran automáticamente
- Loading state durante la carga inicial
- Permite agregar/eliminar imágenes

**Funcionalidad:**

- Carga del producto desde API
- Actualización parcial (PUT request)
- Redirección automática después de guardar
- Manejo de errores con toasts

## 🔒 Seguridad

- Todos los endpoints protegidos con `requireAdmin()`
- Verificación de JWT token en cada request
- Validación de datos en servidor
- Solo admins pueden acceder a las páginas

## 🎨 UI/UX

### Componentes Utilizados

- **shadcn/ui**: Card, Table, Button, Input, Select, Badge, Switch
- **lucide-react**: Iconos (Plus, Search, Pencil, Trash2, Eye, EyeOff, Loader2)
- **sonner**: Toast notifications
- **ImageUpload**: Componente custom con drag-and-drop

### Características de UX

- Loading states en todas las acciones
- Confirmación antes de eliminar (AlertDialog)
- Feedback visual inmediato (toasts)
- Diseño responsivo (mobile-first)
- Accesibilidad con labels y aria-labels

## 📊 Estructura de Datos

### Producto (Product)

```typescript
{
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string;
  images: string[];  // URLs en Digital Ocean Spaces
  stock_quantity: number;
  weight: number | null;
  dimensions: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories?: Category;  // JOIN
}
```

## 🚀 Flujo de Trabajo

### Crear Producto

1. Admin navega a `/admin/products`
2. Click en "Nuevo Producto"
3. Completa formulario
4. Sube imágenes (opcional)
5. Click en "Crear Producto"
6. API crea producto en Supabase
7. Redirección a lista de productos
8. Toast de confirmación

### Editar Producto

1. Admin navega a `/admin/products`
2. Click en icono de editar (lápiz)
3. Formulario pre-cargado con datos
4. Modifica campos necesarios
5. Puede agregar/eliminar imágenes
6. Click en "Guardar Cambios"
7. API actualiza producto
8. Redirección a lista
9. Toast de confirmación

### Eliminar Producto

1. Admin navega a `/admin/products`
2. Click en icono de eliminar (basura)
3. Aparece dialog de confirmación
4. Confirma eliminación
5. API verifica si tiene órdenes:
   - Con órdenes: desactiva
   - Sin órdenes: elimina
6. Actualiza lista
7. Toast con resultado

## 🔄 Integración con Digital Ocean Spaces

Los productos utilizan el sistema de carga de imágenes implementado previamente:

- Imágenes se almacenan en el bucket `cms-next`
- Carpeta: `products/`
- Formato de nombre: `nombre-timestamp-random.ext`
- URLs públicas generadas automáticamente
- Eliminación de imágenes al actualizar producto

## 📝 Próximos Pasos

Según el plan de implementación, los siguientes pasos serían:

1. **Gestión de Órdenes** (Sprint 1)

   - Lista de órdenes
   - Detalles de orden
   - Actualización de estado
   - Filtros y búsqueda

2. **Gestión de Clientes** (Sprint 1 - opcional)

   - Lista de clientes
   - Detalles de cliente
   - Historial de compras

3. **Integración de Resend** (Sprint 2)
   - Emails de confirmación
   - Emails de actualización de estado

## 🎯 Testing

Para probar la funcionalidad:

1. Inicia sesión como admin (ernestoleonard8@gmail.com)
2. Navega a `/admin/products`
3. Crea un producto de prueba
4. Sube algunas imágenes
5. Edita el producto
6. Prueba los filtros y búsqueda
7. Toggle el estado activo/inactivo
8. Intenta eliminar un producto

## 📦 Archivos Creados

### API Routes

- `app/api/admin/products/route.ts` (156 líneas)
- `app/api/admin/products/[id]/route.ts` (217 líneas)

### Páginas Admin

- `app/admin/products/page.tsx` (385 líneas)
- `app/admin/products/new/page.tsx` (356 líneas)
- `app/admin/products/[id]/edit/page.tsx` (431 líneas)

**Total:** ~1,545 líneas de código

## ✅ Build Status

```
✓ Compiled successfully
✓ Checking validity of types
✓ Generating static pages (13/13)

Nuevas rutas:
- λ /admin/products
- λ /admin/products/[id]/edit
- ○ /admin/products/new
- λ /api/admin/products
- λ /api/admin/products/[id]
```

---

**Fecha de implementación:** 2025-10-01  
**Estado:** ✅ Completado y testeado
