# ✅ FIX: Visualización de Productos con Variantes en Panel Admin

## 📋 Problema Detectado

Al crear un producto con variantes ("Refrigerador EKO"), el panel de administración mostraba:

1. **En `/admin/products`**: El producto aparecía como "agotado" (0 unidades) y precio $0.00
2. **En `/admin/products/[id]/edit`**: El formulario de edición mostraba precio 0 y stock 0, como si fuera un producto sin variantes

### Datos Reales en la Base de Datos:

**Producto: "Refrigerador EKO"**

```json
{
  "id": "e6e7181b-10fa-41c1-9c65-4185fa4d9022",
  "name": "Refrigerador EKO",
  "has_variants": true,
  "price": 0.0, // ← Correcto para productos con variantes
  "stock_quantity": 0, // ← Correcto para productos con variantes
  "variant_count": 1
}
```

**Variante del producto:**

```json
{
  "id": "55d1b0f1-c8ea-4cd7-93de-b754355226ff",
  "sku": "11 Litros",
  "price": 500.0, // ← El precio REAL está aquí
  "stock_quantity": 10, // ← El stock REAL está aquí
  "attributes_display": null
}
```

## 🔍 Análisis de la Causa Raíz

### Comportamiento Esperado vs Actual:

Para productos **CON variantes** (`has_variants = true`):

- El `price` y `stock_quantity` del **producto padre** deben ser 0
- El precio y stock **real** están en cada **variante** individual
- El panel admin debe mostrar el **rango de precios** y **stock total** de las variantes

**Problema**:

- Las APIs no traían información de variantes
- Las páginas mostraban directamente `product.price` y `product.stock_quantity` (siempre 0)

## 🛠️ Soluciones Implementadas

### 1. API de Listado de Productos (`/api/admin/products`)

**Archivo**: `app/api/admin/products/route.ts`

**Cambio**: Incluir variantes en el SELECT:

```typescript
// ANTES
let query = supabaseAdmin
  .from("products")
  .select(
    `
    *,
    categories (id, name, slug)
  `
  )
  .order("created_at", { ascending: false });

// DESPUÉS
let query = supabaseAdmin
  .from("products")
  .select(
    `
    *,
    categories (id, name, slug),
    product_variants (
      id,
      sku,
      price,
      stock_quantity,
      is_active
    )
  `
  )
  .order("created_at", { ascending: false });
```

**Resultado**: Ahora cada producto trae un array `product_variants` con sus variantes.

---

### 2. Página de Listado (`/admin/products`)

**Archivo**: `app/admin/products/page.tsx`

**Cambios implementados**:

#### a) Función para calcular precio a mostrar:

```typescript
const getDisplayPrice = (product: ProductWithCategory) => {
  if (!product.has_variants) {
    return formatPrice(product.price);
  }

  const variants = (product as any).product_variants;
  if (!variants || variants.length === 0) {
    return "Sin variantes";
  }

  const prices = variants
    .filter((v: any) => v.is_active)
    .map((v: any) => Number(v.price));

  if (prices.length === 0) {
    return "Sin variantes activas";
  }

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  if (minPrice === maxPrice) {
    return formatPrice(minPrice);
  }

  return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
};
```

**Ejemplos de salida**:

- 1 variante con precio $500: **"$500.00"**
- 3 variantes ($400, $500, $600): **"$400.00 - $600.00"**
- Sin variantes activas: **"Sin variantes activas"**

#### b) Función para calcular stock total:

```typescript
const getDisplayStock = (product: ProductWithCategory) => {
  if (!product.has_variants) {
    return product.stock_quantity || 0;
  }

  const variants = (product as any).product_variants;
  if (!variants || variants.length === 0) {
    return 0;
  }

  return variants
    .filter((v: any) => v.is_active)
    .reduce((total: number, v: any) => total + (v.stock_quantity || 0), 0);
};
```

**Ejemplo**:

- Variante 1: 10 unidades
- Variante 2: 5 unidades
- **Total mostrado**: 15 unidades

#### c) Actualización de la tabla:

```tsx
{
  /* Columna de Precio */
}
<TableCell>
  <div className="flex items-center gap-1">
    {getDisplayPrice(product)}
    {product.has_variants && (
      <Badge variant="outline" className="ml-1 text-xs">
        {(product as any).product_variants?.length || 0} var
      </Badge>
    )}
  </div>
</TableCell>;

{
  /* Columna de Stock */
}
<TableCell>
  <Badge
    variant={
      getDisplayStock(product) > 10
        ? "default"
        : getDisplayStock(product) > 0
        ? "secondary"
        : "destructive"
    }
  >
    {getDisplayStock(product)} unidades
  </Badge>
</TableCell>;
```

**Resultado visual**:

```
┌──────────────────┬─────────────────────────┬──────────────┐
│ Nombre           │ Precio                  │ Stock        │
├──────────────────┼─────────────────────────┼──────────────┤
│ Refrigerador EKO │ $500.00  [1 var]       │ 10 unidades  │
│ Miel de abeja    │ $5.00                   │ 15 unidades  │
└──────────────────┴─────────────────────────┴──────────────┘
```

---

### 3. API de Producto Individual (`/api/admin/products/[id]`)

**Archivo**: `app/api/admin/products/[id]/route.ts`

**Cambio**: Incluir variantes detalladas:

```typescript
// ANTES
const { data: product, error } = await supabaseAdmin
  .from("products")
  .select(
    `
    *,
    categories (id, name, slug)
  `
  )
  .eq("id", params.id)
  .single();

// DESPUÉS
const { data: product, error } = await supabaseAdmin
  .from("products")
  .select(
    `
    *,
    categories (id, name, slug),
    product_variants (
      id,
      sku,
      price,
      stock_quantity,
      image_url,
      attributes_display,
      is_active,
      display_order
    )
  `
  )
  .eq("id", params.id)
  .single();
```

---

### 4. Página de Edición (`/admin/products/[id]/edit`)

**Archivo**: `app/admin/products/[id]/edit/page.tsx`

**Cambios implementados**:

#### a) Detectar productos con variantes:

```typescript
const [hasVariants, setHasVariants] = useState(false);
const [variantsData, setVariantsData] = useState<any[]>([]);

// Al cargar el producto
const productHasVariants = product.has_variants || false;
const variants = (product as any).product_variants || [];

setHasVariants(productHasVariants);
setVariantsData(variants);
```

#### b) Mostrar alerta informativa:

```tsx
{
  hasVariants && variantsData.length > 0 && (
    <Alert>
      <Package className="h-4 w-4" />
      <AlertTitle>Producto con Variantes</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>
          Este producto tiene <strong>{variantsData.length} variante(s)</strong>
          . El precio y stock se gestionan en cada variante individual.
        </p>
        <div className="mt-2 space-y-1">
          {variantsData.map((variant: any, index: number) => (
            <div
              key={variant.id}
              className="flex items-center justify-between text-sm bg-muted p-2 rounded"
            >
              <span className="font-medium">
                {variant.sku || `Variante ${index + 1}`}
                {variant.attributes_display && (
                  <span className="ml-2 text-muted-foreground">
                    ({variant.attributes_display})
                  </span>
                )}
              </span>
              <div className="flex items-center gap-3">
                <Badge variant="outline">
                  ${Number(variant.price).toFixed(2)}
                </Badge>
                <Badge
                  variant={
                    variant.stock_quantity > 0 ? "default" : "destructive"
                  }
                >
                  {variant.stock_quantity} unidades
                </Badge>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          💡 Para editar las variantes, usa el panel de gestión de variantes
          (próximamente disponible).
        </p>
      </AlertDescription>
    </Alert>
  );
}
```

#### c) Ocultar campos de precio y stock para productos con variantes:

```tsx
{
  /* Precio e inventario - SOLO para productos SIN variantes */
}
{
  !hasVariants && (
    <Card>
      <CardHeader>
        <CardTitle>Precio e Inventario</CardTitle>
        <CardDescription>Información de precio y stock</CardDescription>
      </CardHeader>
      <CardContent>{/* Campos de precio y stock */}</CardContent>
    </Card>
  );
}
```

**Resultado visual en edición**:

```
┌────────────────────────────────────────────────────────┐
│ 📦 Producto con Variantes                              │
├────────────────────────────────────────────────────────┤
│ Este producto tiene 1 variante(s).                     │
│ El precio y stock se gestionan en cada variante.       │
│                                                         │
│ ┌──────────────────────────────────────────────────┐  │
│ │ 11 Litros           $500.00    10 unidades       │  │
│ └──────────────────────────────────────────────────┘  │
│                                                         │
│ 💡 Para editar las variantes, usa el panel de          │
│    gestión de variantes (próximamente disponible).     │
└────────────────────────────────────────────────────────┘

[Los campos de Precio y Stock están OCULTOS]
```

## 📊 Comparación Antes/Después

### ANTES ❌

**Listado de productos:**

```
Refrigerador EKO  │  $0.00  │  0 unidades (agotado)
```

**Formulario de edición:**

```
Precio: [0.00]
Stock:  [0]
```

### DESPUÉS ✅

**Listado de productos:**

```
Refrigerador EKO  │  $500.00  [1 var]  │  10 unidades
```

**Formulario de edición:**

```
┌─────────────────────────────────────────┐
│ 📦 Producto con Variantes               │
│                                          │
│ Este producto tiene 1 variante(s)       │
│                                          │
│ 11 Litros  │  $500.00  │  10 unidades   │
└─────────────────────────────────────────┘

[Campos de precio/stock ocultos]
```

## 🎯 Casos de Uso Cubiertos

### 1. Producto SIN variantes (comportamiento original):

```json
{
  "name": "Miel de abeja",
  "has_variants": false,
  "price": 5.0,
  "stock_quantity": 15
}
```

**Muestra**: $5.00 | 15 unidades

---

### 2. Producto CON 1 variante:

```json
{
  "name": "Refrigerador EKO",
  "has_variants": true,
  "product_variants": [
    { "sku": "11 Litros", "price": 500, "stock_quantity": 10 }
  ]
}
```

**Muestra**: $500.00 [1 var] | 10 unidades

---

### 3. Producto CON múltiples variantes (precios diferentes):

```json
{
  "name": "Refrigerador",
  "has_variants": true,
  "product_variants": [
    { "sku": "9L", "price": 400, "stock_quantity": 5 },
    { "sku": "11L", "price": 500, "stock_quantity": 10 },
    { "sku": "17L", "price": 600, "stock_quantity": 3 }
  ]
}
```

**Muestra**: $400.00 - $600.00 [3 var] | 18 unidades

---

### 4. Producto CON variantes (mismo precio):

```json
{
  "name": "Camiseta",
  "has_variants": true,
  "product_variants": [
    { "sku": "S", "price": 25, "stock_quantity": 10 },
    { "sku": "M", "price": 25, "stock_quantity": 15 },
    { "sku": "L", "price": 25, "stock_quantity": 5 }
  ]
}
```

**Muestra**: $25.00 [3 var] | 30 unidades

---

### 5. Producto CON variantes pero ninguna activa:

```json
{
  "name": "Producto Descontinuado",
  "has_variants": true,
  "product_variants": [
    { "sku": "V1", "price": 100, "stock_quantity": 0, "is_active": false }
  ]
}
```

**Muestra**: Sin variantes activas | 0 unidades

## 🔧 Archivos Modificados

1. **`app/api/admin/products/route.ts`**

   - ✅ GET: Incluye `product_variants` en el SELECT

2. **`app/api/admin/products/[id]/route.ts`**

   - ✅ GET: Incluye `product_variants` con todos los campos necesarios

3. **`app/admin/products/page.tsx`**

   - ✅ Añadidas funciones `getDisplayPrice()` y `getDisplayStock()`
   - ✅ Actualizada tabla para mostrar rango de precios y badge de variantes
   - ✅ Stock calculado como suma de variantes activas

4. **`app/admin/products/[id]/edit/page.tsx`**
   - ✅ Detecta `has_variants` y carga `product_variants`
   - ✅ Muestra alerta informativa con listado de variantes
   - ✅ Oculta campos de precio/stock para productos con variantes
   - ✅ Mantiene formulario normal para productos sin variantes

## 📝 Pendientes / Mejoras Futuras

### Implementar panel de gestión de variantes:

- [ ] Página `/admin/products/[id]/variants` para gestionar variantes
- [ ] CRUD completo de variantes (crear, editar, eliminar)
- [ ] Gestión de atributos y valores de atributos
- [ ] Asignación de atributos a variantes
- [ ] Actualización automática de `attributes_display`

### Mejoras de UX:

- [ ] Botón "Gestionar Variantes" en la alerta
- [ ] Validación: No permitir guardar producto con `has_variants=true` si no tiene variantes
- [ ] Previsualización de cómo se verá el producto en la tienda

### Optimizaciones:

- [ ] Cache de consultas de variantes
- [ ] Lazy loading de variantes en listados grandes
- [ ] Filtros por rango de precio en listado de productos

## ✅ Verificación

Para verificar que funciona correctamente:

1. **Ir a `/admin/products`**

   - ✅ "Refrigerador EKO" debe mostrar "$500.00 [1 var]" y "10 unidades"
   - ✅ Badge verde (stock > 10) o amarillo (stock 1-10)

2. **Hacer clic en editar "Refrigerador EKO"**

   - ✅ Debe aparecer alerta azul "Producto con Variantes"
   - ✅ Debe listar la variante "11 Litros" con $500.00 y 10 unidades
   - ✅ Los campos "Precio" y "Stock" NO deben aparecer

3. **Editar un producto SIN variantes (ej: "Miel de abeja")**
   - ✅ Debe mostrar campos de precio y stock normalmente
   - ✅ NO debe aparecer la alerta de variantes

---

**Fecha de resolución**: 17 de octubre de 2025  
**Archivos modificados**: 4  
**Impacto**: 🟡 Medio (mejora de UX en panel admin)  
**Estado**: ✅ Resuelto
