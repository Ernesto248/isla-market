# 📋 PLAN DE IMPLEMENTACIÓN - SISTEMA DE VARIANTES

## 🎯 Objetivo

Permitir que productos como refrigeradores y splits tengan múltiples variantes (capacidad, color, etc.) con precio y stock individual, evitando duplicar productos.

---

## ✅ FASE 1: BASE DE DATOS (COMPLETADA)

### ✅ Paso 1.1: Migración Aplicada

**Fecha:** 17 de Octubre, 2025  
**Migración:** `create_product_variants_system`  
**Estado:** ✅ COMPLETADA

**Tablas creadas:**

1. ✅ `product_attributes` - Tipos de atributos (Capacidad, Color, Tonelaje)
2. ✅ `product_attribute_values` - Valores posibles (9L, 11L, Blanco, etc.)
3. ✅ `product_variants` - Variantes con precio/stock específico
4. ✅ `product_variant_attributes` - Relación N:N (variante ↔ valores)

**Modificaciones:**

- ✅ `products.has_variants` - Indica si producto tiene variantes
- ✅ `order_items.variant_id` - Referencia a variante comprada

**Funciones creadas:**

- ✅ `reduce_variant_stock()` - Reduce stock de variante específica
- ✅ `update_product_variant_updated_at()` - Actualiza timestamps

**Seguridad:**

- ✅ RLS habilitado en todas las tablas
- ✅ Lectura pública, escritura solo admin
- ✅ Políticas configuradas correctamente

**Datos iniciales:**

- ✅ Atributo "Capacidad" creado
- ✅ Atributo "Color" creado
- ✅ Atributo "Tonelaje" creado

---

## 📊 Ejemplo de Estructura de Datos

### **Producto Base:**

```json
{
  "id": "uuid-1",
  "name": "Refrigerador Marca X",
  "description": "Mini refrigerador compacto...",
  "has_variants": true,
  "images": ["img1.jpg", "img2.jpg"]
}
```

### **Atributos y Valores:**

```json
// Atributo: Capacidad
{
  "id": "attr-1",
  "name": "capacidad",
  "display_name": "Capacidad",
  "values": [
    { "id": "val-1", "value": "9 litros" },
    { "id": "val-2", "value": "11 litros" },
    { "id": "val-3", "value": "17 litros" }
  ]
}

// Atributo: Color
{
  "id": "attr-2",
  "name": "color",
  "display_name": "Color",
  "values": [
    { "id": "val-4", "value": "Blanco" },
    { "id": "val-5", "value": "Negro" }
  ]
}
```

### **Variantes Generadas:**

```json
[
  {
    "id": "variant-1",
    "product_id": "uuid-1",
    "sku": "REF-X-9L-WHITE",
    "price": 500.0,
    "stock_quantity": 10,
    "attributes": [
      { "attribute": "Capacidad", "value": "9 litros" },
      { "attribute": "Color", "value": "Blanco" }
    ]
  },
  {
    "id": "variant-2",
    "product_id": "uuid-1",
    "sku": "REF-X-9L-BLACK",
    "price": 520.0,
    "stock_quantity": 5,
    "attributes": [
      { "attribute": "Capacidad", "value": "9 litros" },
      { "attribute": "Color", "value": "Negro" }
    ]
  }
  // ... más variantes (11L x 2 colores, 17L x 2 colores) = 6 variantes totales
]
```

---

## 🚀 FASE 2: BACKEND APIs (PENDIENTE)

### Paso 2.1: Tipos TypeScript

**Tiempo estimado:** 1 hora  
**Archivos a modificar:**

- `lib/types.ts`

**Tipos a crear:**

```typescript
// Atributo (ej: Capacidad, Color)
export interface ProductAttribute {
  id: string;
  name: string;
  display_name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Valor de atributo (ej: 9 litros, Blanco)
export interface ProductAttributeValue {
  id: string;
  attribute_id: string;
  value: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Relaciones opcionales
  attribute?: ProductAttribute;
}

// Variante de producto
export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string | null;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Relaciones opcionales
  product?: Product;
  attribute_values?: ProductAttributeValue[];
}

// Producto con sus variantes (para admin)
export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
  attributes: ProductAttribute[];
}
```

---

### Paso 2.2: APIs de Atributos

**Tiempo estimado:** 2 horas  
**Archivos a crear:**

#### 1. `app/api/admin/attributes/route.ts`

```typescript
// GET - Listar todos los atributos con sus valores
// POST - Crear nuevo atributo

GET /api/admin/attributes
Response: ProductAttribute[]

POST /api/admin/attributes
Body: { name, display_name, display_order }
Response: ProductAttribute
```

#### 2. `app/api/admin/attributes/[id]/route.ts`

```typescript
// GET - Obtener atributo específico
// PUT - Actualizar atributo
// DELETE - Eliminar atributo

GET /api/admin/attributes/[id]
Response: ProductAttribute

PUT /api/admin/attributes/[id]
Body: { name?, display_name?, display_order?, is_active? }
Response: ProductAttribute

DELETE /api/admin/attributes/[id]
Response: { success: true }
```

#### 3. `app/api/admin/attributes/[id]/values/route.ts`

```typescript
// GET - Listar valores de un atributo
// POST - Agregar valor a atributo

GET /api/admin/attributes/[id]/values
Response: ProductAttributeValue[]

POST /api/admin/attributes/[id]/values
Body: { value, display_order }
Response: ProductAttributeValue
```

---

### Paso 2.3: APIs de Variantes

**Tiempo estimado:** 3 horas  
**Archivos a crear:**

#### 1. `app/api/admin/products/[id]/variants/route.ts`

```typescript
// GET - Listar variantes de un producto
// POST - Crear nueva variante

GET /api/admin/products/[id]/variants
Response: ProductVariant[]

POST /api/admin/products/[id]/variants
Body: {
  sku?: string,
  price: number,
  stock_quantity: number,
  attribute_values: string[], // IDs de attribute_values
  image_url?: string
}
Response: ProductVariant
```

#### 2. `app/api/admin/products/[id]/variants/[variantId]/route.ts`

```typescript
// GET - Obtener variante específica
// PUT - Actualizar variante
// DELETE - Eliminar variante

GET /api/admin/products/[id]/variants/[variantId]
Response: ProductVariant

PUT /api/admin/products/[id]/variants/[variantId]
Body: {
  sku?: string,
  price?: number,
  stock_quantity?: number,
  attribute_values?: string[],
  image_url?: string,
  is_active?: boolean
}
Response: ProductVariant

DELETE /api/admin/products/[id]/variants/[variantId]
Response: { success: true }
```

#### 3. `app/api/admin/products/with-variants/route.ts`

```typescript
// POST - Crear producto con variantes en una sola llamada

POST /api/admin/products/with-variants
Body: {
  product: {
    name: string,
    description: string,
    category_id: string,
    images: string[]
  },
  attributes: [
    {
      attribute_id: string,
      values: string[] // IDs de attribute_values
    }
  ],
  variants: [
    {
      attribute_value_ids: string[],
      price: number,
      stock_quantity: number,
      sku?: string
    }
  ]
}
Response: ProductWithVariants
```

---

### Paso 2.4: APIs Públicas (Cliente)

**Tiempo estimado:** 2 horas  
**Archivos a modificar/crear:**

#### 1. Modificar `app/api/products/[id]/route.ts`

```typescript
// Incluir variantes si has_variants = true

GET /api/products/[id]
Response: {
  ...product,
  variants?: ProductVariant[], // Solo si has_variants = true
  attributes?: ProductAttribute[] // Solo si has_variants = true
}
```

#### 2. Modificar `app/api/products/route.ts`

```typescript
// Incluir indicador de variantes en listado

GET /api/products
Response: Product[] // Con campo has_variants
```

---

## 🎨 FASE 3: ADMIN PANEL (PENDIENTE)

### Paso 3.1: Componente Editor de Variantes

**Tiempo estimado:** 4 horas  
**Archivo a crear:** `components/admin/products/variant-editor.tsx`

**Funcionalidad:**

1. ✅ Ver atributos del producto
2. ✅ Agregar/eliminar atributos
3. ✅ Agregar/eliminar valores por atributo
4. ✅ Generar combinaciones automáticamente
5. ✅ Editar precio/stock de cada variante
6. ✅ Vista previa en tabla
7. ✅ Validaciones (precio > 0, stock >= 0)

**UI Propuesto:**

```
┌─────────────────────────────────────────────────┐
│ Atributos del Producto                          │
├─────────────────────────────────────────────────┤
│                                                  │
│ Atributo 1: Capacidad                           │
│ ☑ 9 litros  ☑ 11 litros  ☑ 17 litros           │
│ [+ Agregar valor]                                │
│                                                  │
│ Atributo 2: Color                                │
│ ☑ Blanco  ☑ Negro                               │
│ [+ Agregar valor]                                │
│                                                  │
│ [+ Agregar atributo]                             │
│                                                  │
│ [Generar Variantes] (Automático)                │
│                                                  │
├─────────────────────────────────────────────────┤
│ Variantes Generadas (6)                         │
├─────────────────────────────────────────────────┤
│                                                  │
│ Variante           │ Precio │ Stock  │ Acciones │
│────────────────────┼────────┼────────┼──────────│
│ 9L + Blanco       │ $500   │ [10]   │ [Editar] │
│ 9L + Negro        │ $520   │ [5]    │ [Editar] │
│ 11L + Blanco      │ $650   │ [8]    │ [Editar] │
│ 11L + Negro       │ $670   │ [3]    │ [Editar] │
│ 17L + Blanco      │ $800   │ [2]    │ [Editar] │
│ 17L + Negro       │ $820   │ [1]    │ [Editar] │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

### Paso 3.2: Formulario de Producto con Variantes

**Tiempo estimado:** 3 horas  
**Archivo a crear:** `components/admin/products/product-form-with-variants.tsx`

**Funcionalidad:**

1. ✅ Toggle "Este producto tiene variantes"
2. ✅ Si NO tiene variantes: Mostrar campos precio/stock normales
3. ✅ Si SÍ tiene variantes: Mostrar `VariantEditor`
4. ✅ Validar que si has_variants=true tenga al menos 1 variante
5. ✅ Guardar producto + variantes en una transacción

---

### Paso 3.3: Integrar en Páginas Admin

**Tiempo estimado:** 2 horas  
**Archivos a modificar:**

#### 1. `app/admin/products/new/page.tsx`

```typescript
// Usar ProductFormWithVariants en lugar del form antiguo
import { ProductFormWithVariants } from "@/components/admin/products/product-form-with-variants";
```

#### 2. `app/admin/products/[id]/edit/page.tsx`

```typescript
// Cargar producto con sus variantes
// Usar ProductFormWithVariants para editar
```

#### 3. `app/admin/products/page.tsx`

```typescript
// Mostrar indicador de variantes en la tabla
// Columna "Variantes: Sí/No"
// Click para ver/editar variantes
```

---

## 🛍️ FASE 4: FRONTEND CLIENTE (PENDIENTE)

### Paso 4.1: Página de Producto

**Tiempo estimado:** 4 horas  
**Archivo a modificar:** `app/products/[slug]/page.tsx`

**Funcionalidad:**

1. ✅ Detectar si producto tiene variantes
2. ✅ Mostrar selectores de variantes (dropdowns o botones)
3. ✅ Actualizar precio según selección
4. ✅ Actualizar stock disponible
5. ✅ Deshabilitar combinaciones sin stock
6. ✅ Mostrar SKU de variante seleccionada

**UI Propuesto:**

```
┌─────────────────────────────────────────┐
│ Refrigerador Marca X                     │
│ [Imagen]                                  │
│                                           │
│ Precio: $500                              │
│                                           │
│ ┌─ Capacidad ──────────────────┐         │
│ │ ○ 9 litros  ○ 11L  ○ 17L     │         │
│ └──────────────────────────────┘         │
│                                           │
│ ┌─ Color ──────────────────────┐         │
│ │ ○ Blanco  ○ Negro             │         │
│ └──────────────────────────────┘         │
│                                           │
│ Stock disponible: 10 unidades             │
│ SKU: REF-X-9L-WHITE                       │
│                                           │
│ [Agregar al Carrito]                      │
└─────────────────────────────────────────┘
```

---

### Paso 4.2: Componente Selector de Variantes

**Tiempo estimado:** 3 horas  
**Archivo a crear:** `components/products/variant-selector.tsx`

**Props:**

```typescript
interface VariantSelectorProps {
  product: ProductWithVariants;
  onVariantChange: (variant: ProductVariant | null) => void;
}
```

**Lógica:**

1. ✅ Mostrar atributos en orden (display_order)
2. ✅ Permitir seleccionar un valor por atributo
3. ✅ Buscar variante que coincida con selección
4. ✅ Actualizar precio/stock del componente padre
5. ✅ Deshabilitar opciones sin stock
6. ✅ Resetear selección si combo no disponible

---

### Paso 4.3: Carrito con Variantes

**Tiempo estimado:** 3 horas  
**Archivos a modificar:**

#### 1. `lib/store.ts` (Zustand store)

```typescript
// Modificar CartItem para incluir variant_id
interface CartItem {
  id: string;
  product: Product;
  variant?: ProductVariant; // NUEVO
  variant_id?: string; // NUEVO
  quantity: number;
  price: number; // Precio de la variante
}

// Modificar addToCart para aceptar variante
addToCart: (product: Product, variant?: ProductVariant, quantity?: number) => void;

// Clave única: product_id + variant_id (no solo product_id)
const itemKey = variant ? `${product.id}-${variant.id}` : product.id;
```

#### 2. `components/cart/cart-drawer.tsx`

```typescript
// Mostrar información de variante en cada item
{
  item.variant && (
    <div className="text-sm text-muted-foreground">
      {item.variant.attribute_values.map((av) => av.value).join(" • ")}
    </div>
  );
}
```

---

### Paso 4.4: Checkout con Variantes

**Tiempo estimado:** 2 horas  
**Archivo a modificar:** `app/checkout/page.tsx`

**Cambios:**

1. ✅ Incluir `variant_id` al crear order_items
2. ✅ Validar stock de variante (no del producto base)
3. ✅ Llamar a `reduce_variant_stock()` en vez de `reduce_product_stock()`

---

## 🔧 FASE 5: ACTUALIZAR APIs EXISTENTES (PENDIENTE)

### Paso 5.1: API de Carrito

**Tiempo estimado:** 1 hora  
**Archivo:** `app/api/cart/add/route.ts` (si existe)

**Cambios:**

```typescript
// Aceptar variant_id en el body
const { product_id, variant_id, quantity } = await req.json();

// Validar stock de variante
if (variant_id) {
  const { data: variant } = await supabase
    .from("product_variants")
    .select("stock_quantity")
    .eq("id", variant_id)
    .single();

  if (!variant || variant.stock_quantity < quantity) {
    return NextResponse.json({ error: "Stock insuficiente" }, { status: 400 });
  }
}
```

---

### Paso 5.2: API de Órdenes

**Tiempo estimado:** 2 horas  
**Archivo:** `app/api/orders/route.ts`

**Cambios:**

```typescript
// Al crear order_items, incluir variant_id
const { data: orderItems, error: itemsError } = await supabase
  .from("order_items")
  .insert(
    items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id, // NUEVO
      quantity: item.quantity,
      price: item.price,
    }))
  );

// Reducir stock según si tiene variante o no
for (const item of items) {
  if (item.variant_id) {
    // Reducir stock de variante
    await supabase.rpc("reduce_variant_stock", {
      p_variant_id: item.variant_id,
      p_quantity: item.quantity,
    });
  } else {
    // Reducir stock de producto normal
    await supabase.rpc("reduce_product_stock", {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    });
  }
}
```

---

## 📝 FASE 6: TESTING (PENDIENTE)

### Paso 6.1: Testing Manual

**Tiempo estimado:** 3 horas

**Casos a probar:**

#### Admin Panel:

1. ✅ Crear producto sin variantes (flujo antiguo funciona)
2. ✅ Crear producto con 1 atributo (ej: solo Capacidad)
3. ✅ Crear producto con 2 atributos (ej: Capacidad + Color)
4. ✅ Editar variante (cambiar precio/stock)
5. ✅ Eliminar variante
6. ✅ Desactivar variante
7. ✅ Agregar nuevo valor a atributo existente

#### Cliente:

1. ✅ Ver producto sin variantes (funciona normal)
2. ✅ Ver producto con variantes
3. ✅ Seleccionar diferentes variantes (precio/stock cambia)
4. ✅ Agregar variante al carrito
5. ✅ Carrito muestra variante correcta
6. ✅ Checkout con variante
7. ✅ Stock se reduce de variante correcta

#### Edge Cases:

1. ✅ Seleccionar combo sin stock (debe deshabilitarse)
2. ✅ Producto con variantes pero todas desactivadas
3. ✅ Orden con producto que después se convierte a variantes
4. ✅ Múltiples variantes del mismo producto en carrito

---

### Paso 6.2: Testing de Performance

**Tiempo estimado:** 1 hora

**Queries a optimizar:**

1. ✅ Cargar producto con todas sus variantes
2. ✅ Buscar variante por combinación de atributos
3. ✅ Listar productos con indicador de variantes
4. ✅ Actualizar stock de múltiples variantes

---

## 📊 RESUMEN DE TIEMPOS

| Fase      | Descripción      | Tiempo       | Estado            |
| --------- | ---------------- | ------------ | ----------------- |
| **1**     | Base de Datos    | 2 horas      | ✅ **COMPLETADA** |
| **2**     | Backend APIs     | 8 horas      | ⏳ Pendiente      |
| **3**     | Admin Panel      | 9 horas      | ⏳ Pendiente      |
| **4**     | Frontend Cliente | 12 horas     | ⏳ Pendiente      |
| **5**     | Actualizar APIs  | 3 horas      | ⏳ Pendiente      |
| **6**     | Testing          | 4 horas      | ⏳ Pendiente      |
| **TOTAL** |                  | **38 horas** | **~5 días**       |

---

## 🎯 PRÓXIMO PASO RECOMENDADO

### Opción A: Backend Completo Primero

**Ventaja:** Toda la lógica de negocio lista antes del UI

**Orden:**

1. Tipos TypeScript (1h)
2. APIs de Atributos (2h)
3. APIs de Variantes (3h)
4. APIs Públicas (2h)

**Total:** ~8 horas (1 día)

---

### Opción B: Flujo Completo de Admin

**Ventaja:** Puedes empezar a crear productos con variantes inmediatamente

**Orden:**

1. Tipos TypeScript (1h)
2. API crear producto con variantes (2h)
3. Componente VariantEditor (4h)
4. Formulario en Admin (3h)

**Total:** ~10 horas (1.5 días)

---

### Opción C: Paso a Paso (Recomendado)

**Ventaja:** Validar cada parte antes de continuar

**Orden:**

1. **HOY:** Tipos TypeScript → Probar con datos dummy
2. **Mañana:** APIs Admin → Probar con Postman
3. **Siguiente:** Componente Admin → Crear primer producto
4. **Siguiente:** Frontend Cliente → Comprar primera variante
5. **Final:** Testing completo

---

## 📋 CHECKLIST DE PROGRESO

### Base de Datos ✅

- [x] Tabla product_attributes
- [x] Tabla product_attribute_values
- [x] Tabla product_variants
- [x] Tabla product_variant_attributes
- [x] Campo products.has_variants
- [x] Campo order_items.variant_id
- [x] Función reduce_variant_stock()
- [x] RLS policies configuradas
- [x] Datos iniciales (atributos comunes)

### Backend APIs ⏳

- [ ] Tipos TypeScript
- [ ] CRUD Atributos
- [ ] CRUD Valores de Atributos
- [ ] CRUD Variantes
- [ ] API crear producto con variantes
- [ ] Modificar API pública de productos
- [ ] Modificar API de carrito
- [ ] Modificar API de órdenes

### Admin Panel ⏳

- [ ] Componente VariantEditor
- [ ] Componente ProductFormWithVariants
- [ ] Página crear producto
- [ ] Página editar producto
- [ ] Lista de productos (mostrar variantes)

### Frontend Cliente ⏳

- [ ] Componente VariantSelector
- [ ] Página de producto con variantes
- [ ] Carrito con variantes
- [ ] Checkout con variantes
- [ ] Reducción de stock correcto

### Testing ⏳

- [ ] Testing manual admin
- [ ] Testing manual cliente
- [ ] Testing edge cases
- [ ] Testing performance

---

## 🤔 ¿CUÁL OPCIÓN PREFIERES?

**A)** Backend completo primero  
**B)** Admin panel funcional ya  
**C)** Paso a paso validando cada parte

**Dime cuál prefieres y empezamos con la siguiente fase! 🚀**
