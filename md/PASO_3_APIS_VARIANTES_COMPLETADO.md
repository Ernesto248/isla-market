# ✅ PASO 3 COMPLETADO: APIs de Variantes de Productos (Admin)

**Fecha:** 17 de Octubre, 2025  
**Duración:** ~2 horas  
**Estado:** ✅ COMPLETADO SIN ERRORES

---

## 📝 Lo Que Se Creó

### Estructura de Endpoints

```
/api/admin/products/
├── with-variants/
│   └── route.ts                              ✅ POST (crear producto completo)
└── [id]/
    └── variants/
        ├── route.ts                          ✅ GET, POST
        └── [variantId]/
            └── route.ts                      ✅ GET, PUT, DELETE
```

---

## 🔌 Endpoints Implementados

### 1. **GET /api/admin/products/[id]/variants**

**Descripción:** Lista todas las variantes de un producto con sus atributos

**Response:**

```typescript
[
  {
    id: "var-001",
    product_id: "prod-001",
    sku: "REF-X-9L-WHITE",
    price: 299.99,
    stock_quantity: 50,
    image_url: null,
    display_order: 0,
    is_active: true,
    created_at: "2025-10-17T...",
    updated_at: "2025-10-17T...",
    product_variant_attributes: [
      {
        id: "pva-001",
        product_attribute_values: {
          id: "val-001",
          value: "9 litros",
          attribute_id: "attr-001",
          product_attributes: {
            id: "attr-001",
            name: "capacidad",
            display_name: "Capacidad",
          },
        },
      },
      {
        id: "pva-002",
        product_attribute_values: {
          id: "val-010",
          value: "Blanco",
          attribute_id: "attr-002",
          product_attributes: {
            id: "attr-002",
            name: "color",
            display_name: "Color",
          },
        },
      },
    ],
  },
];
```

---

### 2. **POST /api/admin/products/[id]/variants**

**Descripción:** Crea una nueva variante para el producto

**Body:**

```typescript
{
  sku: "REF-X-9L-WHITE",              // Opcional - se genera automáticamente si no se proporciona
  price: 299.99,                       // Opcional - usa el precio del producto si no se especifica
  stock_quantity: 50,                  // Opcional - default: 0
  attribute_value_ids: [               // Requerido - IDs de los valores de atributos
    "val-001",  // 9 litros
    "val-010"   // Blanco
  ],
  is_active: true                      // Opcional - default: true
}
```

**Validaciones:**

- ✅ El producto debe existir y tener `has_variants = true`
- ✅ `attribute_value_ids` es requerido y debe tener al menos un valor
- ✅ SKU debe ser único si se proporciona
- ✅ Todos los `attribute_value_ids` deben existir y estar activos
- ✅ No puede haber múltiples valores del mismo atributo (ej: no puedes tener "9 litros" + "11 litros")
- ✅ No puede existir otra variante con la misma combinación de atributos
- ✅ Precio y stock no pueden ser negativos

**Response:** `201 Created`

```typescript
{
  id: "var-001",
  product_id: "prod-001",
  sku: "REF-X-9L-WHITE",
  price: 299.99,
  stock_quantity: 50,
  // ... incluye product_variant_attributes con todos los datos
}
```

---

### 3. **GET /api/admin/products/[id]/variants/[variantId]**

**Descripción:** Obtiene una variante específica con sus atributos

**Response:** Similar al GET de lista, pero un solo objeto

---

### 4. **PUT /api/admin/products/[id]/variants/[variantId]**

**Descripción:** Actualiza una variante existente

**Body:**

```typescript
{
  sku?: "REF-X-11L-WHITE",            // Opcional
  price?: 349.99,                      // Opcional
  stock_quantity?: 30,                 // Opcional
  attribute_value_ids?: [              // Opcional - cambia la combinación de atributos
    "val-002",  // 11 litros
    "val-010"   // Blanco
  ],
  is_active?: false                    // Opcional
}
```

**Validaciones:**

- ✅ La variante debe existir
- ✅ Si se cambia el SKU, debe ser único
- ✅ Si se cambian los atributos, aplican las mismas validaciones que en POST
- ✅ No puede crear combinaciones duplicadas

**Response:**

```typescript
{
  id: "var-001",
  // ... variante actualizada con todos sus atributos
}
```

---

### 5. **DELETE /api/admin/products/[id]/variants/[variantId]**

**Descripción:** Elimina una variante

**Validaciones:**

- ✅ La variante debe existir
- ✅ No puede haber órdenes asociadas a esta variante
- ✅ Si hay órdenes, se recomienda marcar como inactiva en lugar de eliminar

**Response:**

```typescript
{
  success: true,
  message: "Variant deleted successfully"
}
```

**Error si hay órdenes:**

```typescript
{
  error: "Cannot delete variant with existing orders. Consider marking it as inactive instead.";
}
```

---

### 6. **POST /api/admin/products/with-variants** ⭐ (Endpoint Especial)

**Descripción:** Crea un producto completo con todas sus variantes en una sola operación

Este endpoint es MUY ÚTIL para crear productos nuevos con variantes de forma eficiente, evitando múltiples llamadas a la API.

**Body:**

```typescript
{
  product: {
    name: "Refrigerador EcoFrost X",
    slug: "refrigerador-ecofrost-x",    // Opcional - se genera del nombre
    description: "Refrigerador eficiente con múltiples opciones",
    category_id: "cat-001",
    images: [
      "https://...image1.jpg",
      "https://...image2.jpg"
    ],
    is_active: true,                     // Opcional - default: true
    featured: false                      // Opcional - default: false
  },
  attributes: [                          // Info opcional - no se usa en la creación
    {
      attribute_id: "attr-001",
      value_ids: ["val-001", "val-002", "val-003"]
    }
  ],
  variants: [
    {
      attribute_value_ids: ["val-001", "val-010"],  // 9L + Blanco
      price: 299.99,
      stock_quantity: 50,
      sku: "REF-X-9L-WHITE",             // Opcional
      image_url: null                    // Opcional
    },
    {
      attribute_value_ids: ["val-001", "val-011"],  // 9L + Negro
      price: 299.99,
      stock_quantity: 30
    },
    {
      attribute_value_ids: ["val-002", "val-010"],  // 11L + Blanco
      price: 349.99,
      stock_quantity: 40
    },
    // ... más variantes
  ]
}
```

**Comportamiento:**

1. ✅ Crea el producto con `has_variants = true`
2. ✅ Genera el slug automáticamente si no se proporciona
3. ✅ Valida que la categoría existe
4. ✅ Valida que todos los attribute_value_ids existen
5. ✅ Crea todas las variantes válidas
6. ✅ Genera SKUs automáticamente si no se proporcionan
7. ✅ Si una variante falla, continúa con las demás
8. ✅ Si TODAS las variantes fallan, elimina el producto

**Response:** `201 Created`

```typescript
{
  success: true,
  product: {
    id: "prod-001",
    name: "Refrigerador EcoFrost X",
    has_variants: true,
    // ... producto completo con variantes incluidas
    product_variants: [
      // ... array de variantes creadas
    ]
  },
  stats: {
    total_variants_requested: 6,
    variants_created: 5,
    variants_failed: 1
  },
  errors: [                              // Solo si hubo errores
    {
      variantIndex: 3,
      error: "Duplicate variant combination"
    }
  ]
}
```

---

## 🛡️ Validaciones Implementadas

### 1. **Validaciones de Producto**

- ✅ El producto debe tener `has_variants = true` para crear variantes
- ✅ El producto debe existir

### 2. **Validaciones de SKU**

- ✅ SKU debe ser único en toda la tabla de variantes
- ✅ Se genera automáticamente si no se proporciona

### 3. **Validaciones de Atributos**

- ✅ Todos los `attribute_value_ids` deben existir en la base de datos
- ✅ Todos los valores deben estar activos (`is_active = true`)
- ✅ No puede haber múltiples valores del mismo atributo en una variante
- ✅ Ejemplo válido: `["9 litros", "Blanco"]` ✓
- ✅ Ejemplo inválido: `["9 litros", "11 litros"]` ✗ (ambos son del atributo "capacidad")

### 4. **Validaciones de Combinaciones**

- ✅ No pueden existir dos variantes con la misma combinación de atributos
- ✅ La comparación es independiente del orden: `["val-001", "val-010"]` = `["val-010", "val-001"]`

### 5. **Validaciones de Eliminación**

- ✅ No se puede eliminar una variante que tiene órdenes asociadas
- ✅ Se recomienda marcar como inactiva en su lugar

### 6. **Validaciones de Precio y Stock**

- ✅ No pueden ser negativos
- ✅ Stock default: 0
- ✅ Precio puede ser null (usa el del producto)

---

## 📊 Ejemplos de Uso

### Ejemplo 1: Crear Variantes Manualmente (Paso a Paso)

```typescript
// 1. Asegurarse de que el producto tenga has_variants = true
await fetch("/api/admin/products/prod-001", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    has_variants: true,
  }),
});

// 2. Crear primera variante: 9L + Blanco
await fetch("/api/admin/products/prod-001/variants", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    attribute_value_ids: ["val-001", "val-010"],
    price: 299.99,
    stock_quantity: 50,
    sku: "REF-X-9L-WHITE",
  }),
});

// 3. Crear segunda variante: 9L + Negro
await fetch("/api/admin/products/prod-001/variants", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    attribute_value_ids: ["val-001", "val-011"],
    price: 299.99,
    stock_quantity: 30,
    sku: "REF-X-9L-BLACK",
  }),
});

// 4. Listar todas las variantes
const response = await fetch("/api/admin/products/prod-001/variants");
const variants = await response.json();
```

---

### Ejemplo 2: Crear Producto Completo con Variantes (Recomendado ⭐)

```typescript
const response = await fetch("/api/admin/products/with-variants", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    product: {
      name: "Refrigerador EcoFrost X",
      description: "Refrigerador eficiente con múltiples opciones",
      category_id: "cat-001",
      images: [
        "https://storage.com/ref-x-front.jpg",
        "https://storage.com/ref-x-side.jpg",
      ],
    },
    variants: [
      // 9 litros en 2 colores
      {
        attribute_value_ids: ["val-001", "val-010"], // 9L + Blanco
        price: 299.99,
        stock_quantity: 50,
      },
      {
        attribute_value_ids: ["val-001", "val-011"], // 9L + Negro
        price: 299.99,
        stock_quantity: 30,
      },
      // 11 litros en 2 colores
      {
        attribute_value_ids: ["val-002", "val-010"], // 11L + Blanco
        price: 349.99,
        stock_quantity: 40,
      },
      {
        attribute_value_ids: ["val-002", "val-011"], // 11L + Negro
        price: 349.99,
        stock_quantity: 25,
      },
      // 17 litros en 2 colores
      {
        attribute_value_ids: ["val-003", "val-010"], // 17L + Blanco
        price: 449.99,
        stock_quantity: 20,
      },
      {
        attribute_value_ids: ["val-003", "val-011"], // 17L + Negro
        price: 449.99,
        stock_quantity: 15,
      },
    ],
  }),
});

const result = await response.json();
console.log(`Producto creado: ${result.product.id}`);
console.log(
  `Variantes creadas: ${result.stats.variants_created}/${result.stats.total_variants_requested}`
);
```

---

### Ejemplo 3: Actualizar Stock de una Variante

```typescript
// Reducir stock después de una venta
await fetch("/api/admin/products/prod-001/variants/var-001", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    stock_quantity: 45, // Reduce de 50 a 45
  }),
});
```

---

### Ejemplo 4: Cambiar Atributos de una Variante

```typescript
// Cambiar de 9L a 11L (mantener mismo color)
await fetch("/api/admin/products/prod-001/variants/var-001", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    attribute_value_ids: ["val-002", "val-010"], // 11L + Blanco
    price: 349.99, // Actualizar precio también
    sku: "REF-X-11L-WHITE",
  }),
});
```

---

### Ejemplo 5: Desactivar una Variante (No Eliminar)

```typescript
// Marcar como inactiva (recomendado si hay órdenes)
await fetch("/api/admin/products/prod-001/variants/var-001", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    is_active: false,
  }),
});
```

---

### Ejemplo 6: Eliminar una Variante

```typescript
const response = await fetch("/api/admin/products/prod-001/variants/var-001", {
  method: "DELETE",
});

if (response.ok) {
  const result = await response.json();
  console.log(result.message); // "Variant deleted successfully"
} else {
  const error = await response.json();
  console.error(error.error); // Ej: "Cannot delete variant with existing orders..."
}
```

---

## ✅ Archivos Creados

1. ✅ `app/api/admin/products/[id]/variants/route.ts` (GET, POST)
2. ✅ `app/api/admin/products/[id]/variants/[variantId]/route.ts` (GET, PUT, DELETE)
3. ✅ `app/api/admin/products/with-variants/route.ts` (POST)
4. ✅ `lib/types.ts` - Agregados tipos DTO

**Total:** 3 archivos, 6 endpoints REST

---

## ✅ Validación TypeScript

```bash
✓ variants/route.ts - 0 errores
✓ variants/[variantId]/route.ts - 0 errores
✓ with-variants/route.ts - 0 errores
✓ lib/types.ts - 0 errores
✓ Todos los endpoints compilan correctamente
```

---

## 🎯 Próximo Paso

**PASO 4: Crear Componente VariantEditor (Admin UI)**

**Componentes a crear:**

- `VariantEditor.tsx` - Editor visual de variantes
- `VariantTable.tsx` - Tabla para mostrar/editar variantes
- `AttributeSelector.tsx` - Selector de atributos y valores
- Integración con `ProductForm`

**Funcionalidades:**

- Seleccionar atributos (Capacidad, Color, etc.)
- Seleccionar valores para cada atributo
- Generar combinaciones automáticamente
- Editar precio/stock por variante
- Preview de variantes antes de guardar

**Tiempo estimado:** 4 horas

---

## 📋 Checklist del Paso 3

- [x] Endpoint GET /api/admin/products/[id]/variants
- [x] Endpoint POST /api/admin/products/[id]/variants
- [x] Endpoint GET /api/admin/products/[id]/variants/[variantId]
- [x] Endpoint PUT /api/admin/products/[id]/variants/[variantId]
- [x] Endpoint DELETE /api/admin/products/[id]/variants/[variantId]
- [x] Endpoint POST /api/admin/products/with-variants
- [x] Validación de has_variants en producto
- [x] Validación de SKU único
- [x] Validación de atributos únicos por variante
- [x] Validación de combinaciones únicas
- [x] Prevención de eliminación con órdenes
- [x] Generación automática de SKU
- [x] Rollback si falla creación de atributos
- [x] Manejo de errores parciales en creación masiva
- [x] Tipos DTO exportados
- [x] Compilar sin errores TypeScript

**Estado:** ✅ **COMPLETADO AL 100%**

---

## 🚀 Listo para Continuar

Las APIs de variantes están completas y listas para usar. Ahora podemos crear la interfaz de usuario en el panel de administración.

**¿Continuamos con el Paso 4: VariantEditor Component?** 🎨
