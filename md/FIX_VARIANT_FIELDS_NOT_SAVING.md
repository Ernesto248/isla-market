# Fix: Campos variant_name, color y attributes_display No Se Guardaban

## Problema Detectado

Las variantes en la base de datos tenían los campos `variant_name`, `color` y `attributes_display` en **NULL**, a pesar de que el editor de variantes permitía ingresarlos.

### Estado Inicial de la Base de Datos

```sql
SELECT id, sku, price, variant_name, color, attributes_display
FROM product_variants;
```

**Resultado:**

```
id: 21edb663-814e-49c4-a989-bd1fb64a784d
sku: VAR-9-LIT-GRI-0924
price: 450.00
variant_name: NULL ❌
color: NULL ❌
attributes_display: NULL ❌

id: 55d1b0f1-c8ea-4cd7-93de-b754355226ff
sku: VAR-11-LIT-GRI-8028
price: 500.00
variant_name: NULL ❌
color: NULL ❌
attributes_display: NULL ❌
```

## Causa Raíz

El problema estaba en **cuatro lugares**:

### 1. Tipos TypeScript Incompletos

**Archivo:** `lib/types.ts`

Los tipos `CreateVariantData` y `UpdateVariantData` **NO incluían** los campos:

- `variant_name`
- `color`
- `attributes_display`

**ANTES:**

```typescript
export interface CreateVariantData {
  product_id: string;
  sku?: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  attribute_value_ids: string[];
  display_order?: number;
  is_active?: boolean;
  // ❌ Faltaban los campos de variante simple
}

export interface UpdateVariantData {
  sku?: string;
  price?: number;
  stock_quantity?: number;
  image_url?: string;
  attribute_value_ids?: string[];
  display_order?: number;
  is_active?: boolean;
  // ❌ Faltaban los campos de variante simple
}
```

### 2. API POST No Guardaba los Campos

**Archivo:** `app/api/admin/products/[id]/variants/route.ts` (POST)

El INSERT **NO incluía** los nuevos campos:

**ANTES:**

```typescript
const { data: variant, error: variantError } = await supabaseAdmin
  .from("product_variants")
  .insert({
    product_id: productId,
    sku: body.sku,
    price: body.price,
    stock_quantity: body.stock_quantity || 0,
    is_active: body.is_active !== undefined ? body.is_active : true,
    // ❌ Faltaban variant_name, color, attributes_display
  })
  .select()
  .single();
```

### 3. API PUT No Actualizaba los Campos

**Archivo:** `app/api/admin/products/[id]/variants/[variantId]/route.ts` (PUT)

El UPDATE **NO incluía** los nuevos campos:

**ANTES:**

```typescript
const updateData: any = {};
if (body.sku !== undefined) updateData.sku = body.sku;
if (body.price !== undefined) updateData.price = body.price;
if (body.stock_quantity !== undefined)
  updateData.stock_quantity = body.stock_quantity;
if (body.is_active !== undefined) updateData.is_active = body.is_active;
// ❌ Faltaban variant_name, color, attributes_display
```

### 4. Frontend (Edit Page) No Enviaba los Campos

**Archivo:** `app/admin/products/[id]/edit/page.tsx`

El frontend **NO enviaba** los campos al hacer POST o PUT:

**ANTES (POST):**

```typescript
body: JSON.stringify({
  sku: variant.sku,
  price: variant.price,
  stock_quantity: variant.stock_quantity,
  is_active: variant.is_active,
  attribute_value_ids: variant.attribute_value_ids,
  // ❌ Faltaban variant_name, color, attributes_display
}),
```

**ANTES (PUT):**

```typescript
body: JSON.stringify({
  sku: variant.sku,
  price: variant.price,
  stock_quantity: variant.stock_quantity,
  is_active: variant.is_active,
  attribute_value_ids: variant.attribute_value_ids,
  // ❌ Faltaban variant_name, color, attributes_display
}),
```

## Solución Implementada

### 1. ✅ Actualización de Tipos

**Archivo:** `lib/types.ts`

**DESPUÉS:**

```typescript
export interface CreateVariantData {
  product_id: string;
  sku?: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  attribute_value_ids: string[];
  display_order?: number;
  is_active?: boolean;
  // ✅ Campos adicionales para variantes simples
  variant_name?: string;
  color?: string;
  attributes_display?: string;
}

export interface UpdateVariantData {
  sku?: string;
  price?: number;
  stock_quantity?: number;
  image_url?: string;
  attribute_value_ids?: string[];
  display_order?: number;
  is_active?: boolean;
  // ✅ Campos adicionales para variantes simples
  variant_name?: string;
  color?: string;
  attributes_display?: string;
}
```

### 2. ✅ API POST Actualizado

**Archivo:** `app/api/admin/products/[id]/variants/route.ts`

**DESPUÉS:**

```typescript
const { data: variant, error: variantError } = await supabaseAdmin
  .from("product_variants")
  .insert({
    product_id: productId,
    sku: body.sku,
    price: body.price,
    stock_quantity: body.stock_quantity || 0,
    is_active: body.is_active !== undefined ? body.is_active : true,
    // ✅ Guardar campos de variante simple
    variant_name: body.variant_name || null,
    color: body.color || null,
    attributes_display: body.attributes_display || null,
  })
  .select()
  .single();
```

### 3. ✅ API PUT Actualizado

**Archivo:** `app/api/admin/products/[id]/variants/[variantId]/route.ts`

**DESPUÉS:**

```typescript
const updateData: any = {};
if (body.sku !== undefined) updateData.sku = body.sku;
if (body.price !== undefined) updateData.price = body.price;
if (body.stock_quantity !== undefined)
  updateData.stock_quantity = body.stock_quantity;
if (body.is_active !== undefined) updateData.is_active = body.is_active;
// ✅ Actualizar campos de variante simple
if (body.variant_name !== undefined)
  updateData.variant_name = body.variant_name;
if (body.color !== undefined) updateData.color = body.color;
if (body.attributes_display !== undefined)
  updateData.attributes_display = body.attributes_display;
```

### 4. ✅ Frontend (Edit Page) Actualizado

**Archivo:** `app/admin/products/[id]/edit/page.tsx`

**DESPUÉS (POST):**

```typescript
body: JSON.stringify({
  sku: variant.sku,
  price: variant.price,
  stock_quantity: variant.stock_quantity,
  is_active: variant.is_active,
  attribute_value_ids: variant.attribute_value_ids,
  // ✅ Incluir campos de variante simple
  variant_name: variant.variant_name || null,
  color: variant.color || null,
  attributes_display: variant.attributes_display || null,
}),
```

**DESPUÉS (PUT):**

```typescript
body: JSON.stringify({
  sku: variant.sku,
  price: variant.price,
  stock_quantity: variant.stock_quantity,
  is_active: variant.is_active,
  attribute_value_ids: variant.attribute_value_ids,
  // ✅ Incluir campos de variante simple
  variant_name: variant.variant_name || null,
  color: variant.color || null,
  attributes_display: variant.attributes_display || null,
}),
```

## Fix Inmediato en Base de Datos

Actualicé manualmente las variantes existentes usando Supabase MCP:

```sql
-- Variante 1: 9 Litros
UPDATE product_variants
SET
  variant_name = '9 Litros',
  color = 'Gris',
  attributes_display = '9 Litros - Gris'
WHERE id = '21edb663-814e-49c4-a989-bd1fb64a784d';

-- Variante 2: 11 Litros
UPDATE product_variants
SET
  variant_name = '11 Litros',
  color = 'Gris',
  attributes_display = '11 Litros - Gris'
WHERE id = '55d1b0f1-c8ea-4cd7-93de-b754355226ff';
```

### Verificación Post-Fix

```sql
SELECT id, sku, price, variant_name, color, attributes_display
FROM product_variants;
```

**Resultado:**

```
id: 21edb663-814e-49c4-a989-bd1fb64a784d
sku: VAR-9-LIT-GRI-0924
price: 450.00
variant_name: "9 Litros" ✅
color: "Gris" ✅
attributes_display: "9 Litros - Gris" ✅

id: 55d1b0f1-c8ea-4cd7-93de-b754355226ff
sku: VAR-11-LIT-GRI-8028
price: 500.00
variant_name: "11 Litros" ✅
color: "Gris" ✅
attributes_display: "11 Litros - Gris" ✅
```

## Flujo Completo Corregido

### Crear Nueva Variante

1. **Frontend** (`variant-editor-simple.tsx`):

   ```typescript
   const response = await fetch(`/api/admin/products/${productId}/variants`, {
     method: "POST",
     body: JSON.stringify({
       sku: generatedSku,
       price: parseFloat(formData.price),
       stock_quantity: parseInt(formData.stock_quantity),
       variant_name: formData.variant_name, // ✅ Incluido
       color: formData.color, // ✅ Incluido
       attributes_display: `${formData.variant_name} - ${formData.color}`, // ✅ Auto-generado
       attribute_value_ids: [],
       is_active: true,
     }),
   });
   ```

2. **Backend** (API):

   - ✅ Tipo `CreateVariantData` incluye los campos
   - ✅ INSERT guarda variant_name, color, attributes_display
   - ✅ Base de datos almacena los valores correctamente

3. **Visualización** (`variant-selector-simple.tsx`):
   ```typescript
   const getVariantDisplayName = (variant: ProductVariant) => {
     const parts = [];
     if (variant.variant_name) parts.push(variant.variant_name);
     if (variant.color) parts.push(variant.color);
     return parts.join(" - "); // "9 Litros - Gris" ✅
   };
   ```

### Actualizar Variante Existente

1. **Frontend** (`variant-editor-simple.tsx`):

   ```typescript
   const response = await fetch(
     `/api/admin/products/${productId}/variants/${variantId}`,
     {
       method: "PUT",
       body: JSON.stringify({
         variant_name: formData.variant_name, // ✅ Incluido
         color: formData.color, // ✅ Incluido
         attributes_display: `${formData.variant_name} - ${formData.color}`, // ✅ Auto-generado
         price: parseFloat(formData.price),
         stock_quantity: parseInt(formData.stock_quantity),
       }),
     }
   );
   ```

2. **Backend** (API):
   - ✅ Tipo `UpdateVariantData` incluye los campos
   - ✅ UPDATE actualiza variant_name, color, attributes_display
   - ✅ Base de datos refleja los cambios

## Impacto del Fix

### Antes del Fix ❌

**Crear variante:**

```
Usuario ingresa: "9 Litros" + "Gris" + $450
DB guarda: { sku: "VAR-9-LIT-GRI-0924", price: 450, variant_name: NULL }
Checkout muestra: Solo SKU, sin nombre descriptivo
```

**Flujo roto:**

```
Editor → API → DB
  ✅      ❌    ❌  (Datos se perdían en el API)
```

### Después del Fix ✅

**Crear variante:**

```
Usuario ingresa: "9 Litros" + "Gris" + $450
DB guarda: {
  sku: "VAR-9-LIT-GRI-0924",
  price: 450,
  variant_name: "9 Litros",
  color: "Gris",
  attributes_display: "9 Litros - Gris"
}
Checkout muestra: "9 Litros - Gris" con precio correcto
```

**Flujo completo:**

```
Editor → API → DB → Cliente
  ✅     ✅    ✅     ✅
```

## Testing Recomendado

### Test 1: Crear Nueva Variante

1. Ir al panel de admin
2. Editar producto "Refrigerador EKO"
3. Agregar variante:
   - Nombre: "13 Litros"
   - Color: "Azul"
   - Precio: $550
   - Stock: 10
4. Guardar
5. Verificar en DB:
   ```sql
   SELECT variant_name, color, attributes_display
   FROM product_variants
   WHERE variant_name = '13 Litros';
   ```
6. ✅ Debe tener los tres campos llenos

### Test 2: Actualizar Variante Existente

1. Editar variante "9 Litros - Gris"
2. Cambiar a "9 Litros - Negro"
3. Guardar
4. Verificar en DB que `color = 'Negro'`
5. Verificar en frontend que se muestra "9 Litros - Negro"

### Test 3: Checkout Completo

1. Ir a producto con variantes
2. Seleccionar "9 Litros - Gris"
3. Comprar Ahora
4. Verificar checkout muestra:
   - ✅ Nombre: "9 Litros - Gris"
   - ✅ Precio: $450.00
   - ✅ Total correcto

## Archivos Modificados

### 1. `lib/types.ts`

- ✅ Agregados campos opcionales: `variant_name?`, `color?`, `attributes_display?`
- ✅ Tanto en `CreateVariantData` como `UpdateVariantData`

### 2. `app/api/admin/products/[id]/variants/route.ts`

- ✅ INSERT ahora guarda `variant_name`, `color`, `attributes_display`
- ✅ Usa `|| null` para manejar valores undefined

### 3. `app/api/admin/products/[id]/variants/[variantId]/route.ts`

- ✅ UPDATE ahora actualiza `variant_name`, `color`, `attributes_display`
- ✅ Usa `!== undefined` para detectar cambios explícitos

### 4. `app/admin/products/[id]/edit/page.tsx`

- ✅ Llama al API POST con `variant_name`, `color`, `attributes_display`
- ✅ Llama al API PUT con `variant_name`, `color`, `attributes_display`
- ✅ Usa `|| null` para enviar null en lugar de undefined

## Consistencia con Sistema Actual

Este fix se integra perfectamente con:

1. ✅ **variant-editor-simple.tsx**: Ya enviaba estos campos (pero se perdían)
2. ✅ **variant-selector-simple.tsx**: Ya esperaba estos campos (mostraba fallback)
3. ✅ **checkout/page.tsx**: Ya los usaba para display (ahora tendrá datos)
4. ✅ **Migration 014**: Columnas ya existían en DB (solo faltaba guardar datos)

## Beneficios

### Para el Usuario

- ✅ **Nombres descriptivos**: Ve "9 Litros - Gris" en vez de SKU técnico
- ✅ **Experiencia consistente**: Mismo nombre en admin, productos y checkout
- ✅ **Confianza**: Información clara de lo que está comprando

### Para el Negocio

- ✅ **Datos completos**: Toda la información de variantes guardada
- ✅ **Reportes mejorados**: Puede filtrar/agrupar por nombre o color
- ✅ **SEO mejorado**: Nombres descriptivos en lugar de códigos

### Técnico

- ✅ **Tipos correctos**: TypeScript valida los campos
- ✅ **API completa**: Guarda y actualiza todos los campos
- ✅ **Sin datos perdidos**: Información fluye de principio a fin
- ✅ **Backwards compatible**: Variantes viejas siguen funcionando (null → fallback)

## Resumen

**Problema:** API ignoraba campos `variant_name`, `color` y `attributes_display`

**Solución:**

1. ✅ Tipos actualizados para incluir campos
2. ✅ API POST guarda los campos
3. ✅ API PUT actualiza los campos
4. ✅ Variantes existentes actualizadas manualmente en DB

**Resultado:** Sistema completo end-to-end funcional para variantes simples

## Documentos Relacionados

- `md/FIX_PRECIO_CERO_COMPRAR_AHORA.md` - Fix de sessionStorage
- `md/FIX_PRECIO_CERO_COMPRAR_AHORA_PARTE2.md` - Fix de display en checkout
- Este documento - Fix de guardado en API
