# Fix: Visualización de Productos con Variantes

## Problemas Identificados

1. **Lista de productos mostraba "agotado"** para productos con variantes
2. **Página de detalles no mostraba el selector de variantes** correctamente
3. **El selector de variantes original esperaba estructura de atributos** que no existe en el sistema ultra-simple

## Causa Raíz

### Problema 1: Stock en Lista de Productos

`ProductCard` estaba chequeando `product.stock_quantity` directamente, pero los productos con variantes **no usan el stock del producto base**, sino el stock de cada variante individual.

### Problema 2: Selector de Variantes Incompatible

El `VariantSelector` original esperaba que las variantes tuvieran un array `attributes`:

```typescript
variant.attributes = [
  { attribute_name: "Capacidad", value_name: "11 Litros", ... }
]
```

Pero el sistema ultra-simple usa campos planos:

```typescript
variant.variant_name = "11 Litros";
variant.color = "Blanco";
```

## Solución Implementada

### 1. Nuevo Componente `VariantSelectorSimple`

Creado selector simplificado que funciona con `variant_name` y `color`:

**Archivo:** `components/products/variant-selector-simple.tsx`

**Características:**

- ✅ No requiere estructura de atributos
- ✅ Muestra variantes como lista de opciones seleccionables
- ✅ Cada opción muestra: nombre, precio, stock, SKU
- ✅ Selección visual clara con checkmark
- ✅ Deshabilita variantes sin stock
- ✅ Auto-selecciona si solo hay una variante
- ✅ Feedback visual al seleccionar

**Interfaz de cada variante:**

```tsx
<button>
  <div>11 Litros - Blanco</div>
  <div>SKU: VAR-11-LIT-BLA-1234</div>
  <div>$450.00</div>
  <div>20 disponibles</div>
  <CheckIcon />
</button>
```

### 2. Actualizado Tipo `ProductVariant`

**Archivo:** `lib/types.ts`

Agregados campos opcionales para sistema ultra-simple:

```typescript
export interface ProductVariant {
  // ... campos existentes

  // NUEVO: Campos para sistema ultra-simple
  variant_name?: string | null; // Ej: "11 Litros"
  color?: string | null; // Ej: "Blanco"
}
```

### 3. Actualizado `ProductCard`

**Archivo:** `components/products/product-card.tsx`

**Cambios:**

#### a) Detección de Productos con Variantes

```typescript
const hasVariants = product.has_variants === true;
```

#### b) Stock Calculado Correctamente

```typescript
// Si tiene variantes, NO mostrar como sin stock
// (el stock se ve en la página de detalles)
const stock = hasVariants ? 1 : product.stock_quantity || 0;
const isOutOfStock = hasVariants ? false : stock === 0;
```

#### c) Mensaje de Stock

```typescript
{
  hasVariants ? (
    <p>Múltiples opciones disponibles</p>
  ) : isOutOfStock ? (
    <p>Sin stock disponible</p>
  ) : stock <= 5 ? (
    <p>¡Solo quedan {stock} unidades!</p>
  ) : null;
}
```

#### d) Texto del Botón

```typescript
{
  hasVariants
    ? "Ver opciones"
    : isOutOfStock
    ? "Producto Agotado"
    : "Agregar al Carrito";
}
```

#### e) Comportamiento del Botón

```typescript
const handleAddToCart = (e) => {
  e.preventDefault();
  e.stopPropagation();

  // Si tiene variantes, no hacer nada
  // El Link llevará a la página de detalles
  if (hasVariants) {
    return;
  }

  // ... resto de la lógica para productos sin variantes
};
```

### 4. Actualizada Página de Detalles

**Archivo:** `app/products/[slug]/page.tsx`

**Cambio:**

```typescript
// ANTES
import { VariantSelector } from "@/components/products/variant-selector";

// DESPUÉS
import { VariantSelectorSimple } from "@/components/products/variant-selector-simple";

// USO
<VariantSelectorSimple
  productId={product.id}
  variants={variants}
  onVariantChange={(variant) => {
    setSelectedVariant(variant);
    setQuantity(1);
  }}
/>;
```

## Resultado

### ✅ Lista de Productos

- Productos con variantes ya NO muestran "agotado"
- Muestran mensaje "Múltiples opciones disponibles"
- Botón dice "Ver opciones" en lugar de "Agregar al Carrito"
- Al hacer clic, navegan a la página de detalles

### ✅ Página de Detalles

- Muestra selector de variantes simplificado
- Cada variante muestra su nombre completo (ej: "9 Litros - Gris")
- Muestra precio, stock y SKU de cada variante
- Selección visual clara
- Usuario debe seleccionar una variante antes de agregar al carrito

### ✅ Experiencia de Usuario

1. Usuario ve producto en lista con "Múltiples opciones disponibles"
2. Hace clic en "Ver opciones"
3. En la página de detalles, ve todas las variantes
4. Selecciona una variante (ej: "11 Litros - Blanco")
5. Ve precio y stock de esa variante específica
6. Puede agregar al carrito con confianza

## Archivos Modificados

1. ✅ `components/products/variant-selector-simple.tsx` - **CREADO**
2. ✅ `lib/types.ts` - Agregados campos `variant_name` y `color` a `ProductVariant`
3. ✅ `components/products/product-card.tsx` - Manejo especial para productos con variantes
4. ✅ `app/products/[slug]/page.tsx` - Uso del nuevo selector simple

## Testing

### Para Probar la Lista de Productos

1. Ve a `/products`
2. Busca el "Refrigerador EKO" (o cualquier producto con variantes)
3. Verifica que:
   - ✅ NO dice "Agotado"
   - ✅ Dice "Múltiples opciones disponibles"
   - ✅ El botón dice "Ver opciones"
   - ✅ NO tiene overlay gris de "AGOTADO"

### Para Probar la Página de Detalles

1. Haz clic en un producto con variantes
2. En la página de detalles, verifica que:
   - ✅ Aparece el selector de variantes
   - ✅ Se ven todas las variantes (ej: "9 Litros - Gris", "11 Litros - Gris")
   - ✅ Cada variante muestra precio, stock y SKU
   - ✅ Al seleccionar una, se resalta visualmente
   - ✅ El precio y stock se actualizan arriba
   - ✅ Puedes agregar al carrito

### Para Probar Productos SIN Variantes

1. Ve a un producto simple (sin variantes)
2. Verifica que:
   - ✅ Muestra stock normal
   - ✅ El botón dice "Agregar al Carrito"
   - ✅ Agrega al carrito directamente desde la lista
   - ✅ NO muestra selector de variantes en detalles

## Comparación Visual

### ANTES ❌

```
┌────────────────────────────┐
│ Refrigerador EKO           │
│ $450.00                    │
│                            │
│ [❌ AGOTADO]              │
│ Sin stock disponible       │
│                            │
│ [🛒 Producto Agotado]     │
└────────────────────────────┘
```

### DESPUÉS ✅

```
┌────────────────────────────┐
│ Refrigerador EKO           │
│ $450.00                    │
│                            │
│ Múltiples opciones         │
│ disponibles                │
│                            │
│ [🛒 Ver opciones]         │
└────────────────────────────┘
```

### Página de Detalles DESPUÉS ✅

```
┌────────────────────────────────────────┐
│ Refrigerador EKO                       │
│ $450.00                                │
│                                        │
│ Selecciona una opción:                 │
│                                        │
│ ┌────────────────────────────────┐    │
│ │ 9 Litros - Gris                │    │
│ │ SKU: VAR-9-LIT-GRI-1234        │    │
│ │ $450.00   20 disponibles   [✓] │    │
│ └────────────────────────────────┘    │
│                                        │
│ ┌────────────────────────────────┐    │
│ │ 11 Litros - Gris               │    │
│ │ SKU: VAR-11-LIT-GRI-5678       │    │
│ │ $450.00   20 disponibles   [ ] │    │
│ └────────────────────────────────┘    │
│                                        │
│ ✓ Seleccionaste: 9 Litros - Gris      │
│   Precio: $450.00 • Stock: 20         │
│                                        │
│ [🛒 Agregar al Carrito]               │
└────────────────────────────────────────┘
```

## Notas Técnicas

### ¿Por qué no calcular stock total de variantes?

Decidí NO calcular el stock total de variantes porque:

1. **Puede ser confuso**: Usuario ve "20 disponibles" pero al entrar descubre que solo hay 5 de color blanco
2. **Mejor UX**: "Múltiples opciones disponibles" es más claro
3. **Menos queries**: No necesita cargar todas las variantes en la lista
4. **Consistencia**: El precio también varía, así que es mejor ver detalles en la página individual

### Compatibilidad

Este sistema es compatible con:

- ✅ Variantes ultra-simples (variant_name + color)
- ✅ Variantes con sistema de atributos estructurado (si se implementa en futuro)
- ✅ Productos sin variantes

El campo `attributes_display` sirve para ambos sistemas:

- Sistema simple: se genera desde `variant_name + color`
- Sistema estructurado: se genera desde atributos

## Próximos Pasos (Opcionales)

1. **Calcular stock total** si es necesario (sumar stock de todas las variantes activas)
2. **Mostrar rango de precios** en lista (ej: "$450 - $500")
3. **Filtros por variante** en lista de productos (ej: filtrar por color)
4. **Imágenes por variante** (mostrar imagen diferente por cada variante)
5. **Comparador de variantes** (tabla comparativa en página de detalles)

## Referencias

- `VariantSelectorSimple`: Sistema simplificado sin atributos estructurados
- `VariantSelector` (original): Sistema con atributos estructurados
- Ambos pueden coexistir y se elige según `variant.attributes` exista o no
