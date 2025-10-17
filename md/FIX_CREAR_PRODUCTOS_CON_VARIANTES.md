# Fix: Actualizar Página de Creación de Productos con Variantes

## 🔴 Problema

La página de creación de productos (`/admin/products/new`) estaba usando el sistema antiguo de variantes que:

- ❌ Usaba `VariantEditor` (antiguo) en lugar de `variant-editor-simple`
- ❌ No enviaba los campos `variant_name`, `color`, `attributes_display`
- ❌ Usaba endpoint `/api/admin/products/with-variants` (complejo)
- ❌ No validaba campos requeridos del sistema simplificado

## ✅ Solución Implementada

### 1. Actualizar Import del Editor

**ANTES:**

```typescript
import {
  VariantEditor,
  type VariantData,
} from "@/components/admin/variant-editor";
```

**DESPUÉS:**

```typescript
import {
  VariantEditor,
  type VariantData,
} from "@/components/admin/variant-editor-simple";
```

### 2. Actualizar Validaciones

**ANTES:**

```typescript
if (hasVariants) {
  if (variants.length === 0) {
    toast.error("Debes crear al menos una variante");
    return false;
  }

  // Verificar que todas las variantes tengan precio
  const withoutPrice = variants.filter((v) => !v.price || v.price <= 0);
  if (withoutPrice.length > 0) {
    toast.error("Todas las variantes deben tener un precio válido");
    return false;
  }

  // Verificar SKUs duplicados...
  // Verificar combinaciones duplicadas...
}
```

**DESPUÉS:**

```typescript
if (hasVariants) {
  if (variants.length === 0) {
    toast.error("Debes crear al menos una variante");
    return false;
  }

  // ✅ Verificar que todas las variantes tengan nombre
  const withoutName = variants.filter(
    (v) => !v.variant_name || v.variant_name.trim() === ""
  );
  if (withoutName.length > 0) {
    toast.error(
      "Todas las variantes deben tener un nombre (ej: 11 Litros, 1 Tonelada)"
    );
    return false;
  }

  // ✅ Verificar precio
  const withoutPrice = variants.filter((v) => !v.price || v.price <= 0);
  if (withoutPrice.length > 0) {
    toast.error("Todas las variantes deben tener un precio válido");
    return false;
  }

  // ✅ Verificar SKU
  const withoutSku = variants.filter((v) => !v.sku || v.sku.trim() === "");
  if (withoutSku.length > 0) {
    toast.error("Todas las variantes deben tener un SKU");
    return false;
  }

  // ✅ Verificar SKUs duplicados
  const skus = variants.map((v) => v.sku).filter(Boolean);
  const duplicateSkus = skus.filter(
    (sku, index) => skus.indexOf(sku) !== index
  );
  if (duplicateSkus.length > 0) {
    toast.error("Hay SKUs duplicados en las variantes");
    return false;
  }
}
```

### 3. Actualizar Lógica de Creación

**ANTES (Usaba endpoint especial):**

```typescript
if (hasVariants) {
  // Crear producto con variantes usando endpoint especial
  const response = await fetch("/api/admin/products/with-variants", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({
      product: {
        name: formData.name,
        description: formData.description || null,
        category_id: formData.category_id,
        images: uploadedImages,
        is_active: formData.is_active,
        featured: formData.featured,
      },
      variants: variants.map((v) => ({
        attribute_value_ids: v.attribute_value_ids,
        price: v.price,
        stock_quantity: v.stock_quantity,
        sku: v.sku || undefined,
        is_active: v.is_active,
        // ❌ Faltaban variant_name, color, attributes_display
      })),
    }),
  });
  // ...
}
```

**DESPUÉS (Dos pasos: producto + variantes):**

```typescript
if (hasVariants) {
  // ✅ Paso 1: Crear el producto con has_variants=true
  const productResponse = await fetch("/api/admin/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({
      name: formData.name,
      description: formData.description || null,
      price: 0, // Precio base en 0 para productos con variantes
      category_id: formData.category_id,
      images: uploadedImages,
      stock_quantity: 0,
      is_active: formData.is_active,
      featured: formData.featured,
      has_variants: true, // ✅ Indicar que tiene variantes
    }),
  });

  if (!productResponse.ok) {
    const error = await productResponse.json();
    throw new Error(error.error || "Error al crear producto");
  }

  const productData = await productResponse.json();
  const productId = productData.id;

  // ✅ Paso 2: Crear las variantes una por una
  let variantsCreated = 0;
  const variantErrors = [];

  for (const variant of variants) {
    try {
      const variantResponse = await fetch(
        `/api/admin/products/${productId}/variants`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            sku: variant.sku,
            price: variant.price,
            stock_quantity: variant.stock_quantity,
            is_active:
              variant.is_active !== undefined ? variant.is_active : true,
            attribute_value_ids: variant.attribute_value_ids || [],
            // ✅ Incluir campos del sistema simplificado
            variant_name: variant.variant_name || null,
            color: variant.color || null,
            attributes_display: variant.attributes_display || null,
          }),
        }
      );

      if (variantResponse.ok) {
        variantsCreated++;
      } else {
        const error = await variantResponse.json();
        variantErrors.push(`${variant.sku}: ${error.error}`);
      }
    } catch (error) {
      variantErrors.push(
        `${variant.sku}: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    }
  }

  // ✅ Mostrar resultado detallado
  if (variantErrors.length > 0) {
    toast.warning(
      `Producto creado. ${variantsCreated} de ${variants.length} variantes creadas correctamente.`
    );
    console.error("Errores al crear variantes:", variantErrors);
  } else {
    toast.success("Producto con variantes creado correctamente");
  }

  router.push("/admin/products");
}
```

## 📊 Flujo Completo de Creación

### Crear Producto Simple (Sin Variantes)

```
Admin ingresa:
  - Nombre: "Miel de Abeja"
  - Precio: $250
  - Stock: 100
         ↓
POST /api/admin/products
  {
    name: "Miel de Abeja",
    price: 250,
    stock_quantity: 100,
    has_variants: false
  }
         ↓
✅ Producto creado
         ↓
Redirigir a /admin/products
```

### Crear Producto con Variantes

```
Admin ingresa:
  - Nombre: "Refrigerador EKO"
  - Variantes:
    1. "9 Litros - Gris" - $450 - 20 unidades
    2. "11 Litros - Gris" - $500 - 10 unidades
         ↓
PASO 1: POST /api/admin/products
  {
    name: "Refrigerador EKO",
    price: 0,           ← Precio base en 0
    stock_quantity: 0,   ← Stock base en 0
    has_variants: true   ← Indicar que tiene variantes
  }
         ↓
✅ Producto creado (id: abc-123)
         ↓
PASO 2: POST /api/admin/products/abc-123/variants
  {
    sku: "VAR-9-LIT-GRI-1234",
    price: 450,
    stock_quantity: 20,
    variant_name: "9 Litros",    ← ✅ NUEVO
    color: "Gris",               ← ✅ NUEVO
    attributes_display: "9 Litros - Gris"  ← ✅ NUEVO
  }
         ↓
✅ Variante 1 creada
         ↓
PASO 2: POST /api/admin/products/abc-123/variants
  {
    sku: "VAR-11-LIT-GRI-5678",
    price: 500,
    stock_quantity: 10,
    variant_name: "11 Litros",   ← ✅ NUEVO
    color: "Gris",               ← ✅ NUEVO
    attributes_display: "11 Litros - Gris"  ← ✅ NUEVO
  }
         ↓
✅ Variante 2 creada
         ↓
✅ Toast: "Producto con variantes creado correctamente"
         ↓
Redirigir a /admin/products
```

## 🔄 Comparación con Página de Edición

### Edición (`/admin/products/[id]/edit`)

```typescript
// En edit: Ya tiene el productId
<VariantEditor
  productId={params.id}  ← Producto ya existe
  initialVariants={variantsData}
  onChange={handleVariantEditorChange}
  disabled={savingVariants}
/>
```

### Creación (`/admin/products/new`)

```typescript
// En new: No tiene productId hasta que se cree
<VariantEditor
  // ✅ productId es opcional (undefined al crear)
  onChange={handleVariantsChange}
  disabled={loading}
/>
```

**Ambos usan el mismo componente:** `variant-editor-simple.tsx`

## 🧪 Testing Completo

### Test 1: Crear Producto Simple

1. Ir a Admin → Productos → Nuevo Producto
2. Ingresar:
   - Nombre: "Aceite de Oliva"
   - Categoría: "Alimentos"
   - Precio: $180
   - Stock: 50
3. **NO** activar "Este producto tiene variantes"
4. Guardar
5. **Verificar:**
   - ✅ Producto creado
   - ✅ Precio: $180
   - ✅ Stock: 50
   - ✅ has_variants: false

### Test 2: Crear Producto con Variantes

1. Ir a Admin → Productos → Nuevo Producto
2. Ingresar:
   - Nombre: "Split de Aire"
   - Categoría: "Electrodomésticos"
3. **Activar** "Este producto tiene variantes"
4. Agregar variantes:
   - Variante 1:
     - Nombre: "2250 Frigorías"
     - Color: "Blanco"
     - Precio: $350,000
     - Stock: 5
   - Variante 2:
     - Nombre: "3000 Frigorías"
     - Color: "Blanco"
     - Precio: $450,000
     - Stock: 3
5. Guardar
6. **Verificar:**
   - ✅ Producto creado con has_variants: true
   - ✅ price: 0 (base)
   - ✅ stock_quantity: 0 (base)
   - ✅ 2 variantes creadas con:
     - variant_name ✅
     - color ✅
     - attributes_display ✅
     - Precios y stocks correctos ✅

### Test 3: Validaciones

**Test 3.1: Variante sin nombre**

1. Crear producto con variantes
2. Agregar variante sin "Nombre"
3. Intentar guardar
4. **Resultado:** ❌ "Todas las variantes deben tener un nombre"

**Test 3.2: Variante sin SKU**

1. Crear producto con variantes
2. Agregar variante con nombre pero borrar SKU
3. Intentar guardar
4. **Resultado:** ❌ "Todas las variantes deben tener un SKU"

**Test 3.3: Variante sin precio**

1. Crear producto con variantes
2. Agregar variante sin precio o con precio 0
3. Intentar guardar
4. **Resultado:** ❌ "Todas las variantes deben tener un precio válido"

**Test 3.4: SKUs duplicados**

1. Crear producto con variantes
2. Agregar dos variantes con el mismo SKU
3. Intentar guardar
4. **Resultado:** ❌ "Hay SKUs duplicados en las variantes"

### Test 4: Flujo Completo con Compra

1. Crear producto con variantes (ej: "Split 2250 - Blanco")
2. Verificar que aparece en la tienda
3. Ver producto en detalle
4. Seleccionar variante
5. Comprar
6. **Verificar:**
   - ✅ Checkout muestra "2250 Frigorías - Blanco"
   - ✅ Precio correcto ($350,000)
   - ✅ Orden se crea correctamente
   - ✅ Stock se reduce (5 → 4)

## 📋 Checklist de Actualización

- [x] Cambiar import de `variant-editor` a `variant-editor-simple`
- [x] Actualizar validaciones para sistema simplificado
  - [x] Validar `variant_name` requerido
  - [x] Validar `sku` requerido
  - [x] Validar `price` válido
  - [x] Validar SKUs únicos
  - [x] Remover validaciones de combinaciones de atributos
- [x] Actualizar lógica de creación
  - [x] Crear producto primero con `has_variants: true`
  - [x] Crear variantes una por una
  - [x] Incluir `variant_name`, `color`, `attributes_display`
  - [x] Manejo de errores por variante
- [x] Mantener compatibilidad con productos simples
- [x] Usar mismo componente que página de edición
- [x] Documentar cambios

## 🎯 Resultado Final

### Antes ❌

```
Crear Producto → VariantEditor (antiguo) → API /with-variants
                      ↓
                 Sin variant_name, color, attributes_display
                      ↓
                 Variantes incompletas en DB
                      ↓
                 Checkout muestra solo SKU
```

### Después ✅

```
Crear Producto → VariantEditor (simple) → API /products + /variants
                      ↓
                 Con variant_name, color, attributes_display
                      ↓
                 Variantes completas en DB
                      ↓
                 Checkout muestra "9 Litros - Gris"
```

## 🔗 Archivos Modificados

### `app/admin/products/new/page.tsx`

**Cambios:**

1. Import actualizado a `variant-editor-simple`
2. Validaciones actualizadas para sistema simplificado
3. Lógica de creación en dos pasos (producto + variantes)
4. Envío de `variant_name`, `color`, `attributes_display`
5. Mejor manejo de errores por variante

**Líneas modificadas:**

- Línea ~26: Import
- Líneas ~135-165: Validaciones
- Líneas ~190-280: Lógica de creación con variantes

## 📝 Notas Finales

### Consistencia con Edición

Ahora ambas páginas (new y edit) usan:

- ✅ Mismo componente: `variant-editor-simple`
- ✅ Misma lógica de validación
- ✅ Mismo formato de datos
- ✅ Mismos campos enviados a API

### Mantenimiento Futuro

Si necesitas agregar un nuevo campo a las variantes:

1. Agregarlo a `VariantData` en `variant-editor-simple.tsx`
2. Agregarlo a validaciones en AMBAS páginas (new y edit)
3. Enviarlo en AMBAS páginas al API
4. Actualizar API para guardarlo (ya hecho)

### Endpoint Legacy

El endpoint `/api/admin/products/with-variants` ya no se usa. Podría eliminarse en el futuro si no hay otras dependencias.
