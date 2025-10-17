# Fix: Precio $0.00 en "Comprar Ahora" con Variantes

## Problema Identificado

Al usar el botón "Comprar Ahora" con un producto que tiene variantes, el resumen de la orden mostraba:

- **Precio unitario**: $0.00
- **Total**: $0.00

Esto ocurría porque el sistema no estaba guardando ni recuperando correctamente la información de la variante seleccionada.

## Causa Raíz

### 1. Guardado Incompleto en sessionStorage

**Archivo:** `app/products/[slug]/page.tsx`

**ANTES:**

```typescript
sessionStorage.setItem(
  "buyNowProduct",
  JSON.stringify({
    product: product, // ✅ Producto base
    quantity: quantity, // ✅ Cantidad
    variant_id: selectedVariant?.id || null, // ✅ ID de variante
    // ❌ Faltaba el objeto completo de la variante
  })
);
```

**Problema:**

- Solo guardaba el `variant_id` pero no el objeto `variant` completo
- El checkout necesita `variant.price` para mostrar el precio correcto
- Sin el objeto, usaba `product.price` que es $0.00 para productos con variantes

### 2. Recuperación Incompleta en Checkout

**Archivo:** `app/checkout/page.tsx`

**ANTES:**

```typescript
const { product, quantity } = JSON.parse(buyNowData);
setBuyNowItems([{ product, quantity }]);
// ❌ No extraía ni pasaba variant_id ni variant
```

**Problema:**

- Solo extraía `product` y `quantity` del sessionStorage
- No pasaba `variant_id` ni `variant` a `buyNowItems`
- El mapeo posterior no tenía acceso a `item.variant?.price`

## Solución Implementada

### 1. Guardar Variante Completa

**Archivo:** `app/products/[slug]/page.tsx`

```typescript
// DESPUÉS ✅
sessionStorage.setItem(
  "buyNowProduct",
  JSON.stringify({
    product: product,
    quantity: quantity,
    variant_id: selectedVariant?.id || null,
    variant: selectedVariant || null, // ✅ NUEVO: Objeto completo
  })
);
```

**Beneficios:**

- ✅ Guarda toda la información de la variante (precio, stock, nombre)
- ✅ Disponible para el checkout sin queries adicionales
- ✅ Mantiene consistencia de datos

### 2. Recuperar Variante Completa

**Archivo:** `app/checkout/page.tsx`

```typescript
// DESPUÉS ✅
const { product, quantity, variant_id, variant } = JSON.parse(buyNowData);
setBuyNowMode(true);
setBuyNowItems([
  {
    product,
    quantity,
    variant_id: variant_id || null, // ✅ NUEVO
    variant: variant || null, // ✅ NUEVO
  },
]);
```

**Beneficios:**

- ✅ Extrae todos los campos necesarios
- ✅ Pasa la información completa a `buyNowItems`
- ✅ Compatible con el mapeo existente

### 3. Mapeo en Order Creation (Ya Existía)

**Archivo:** `app/checkout/page.tsx` (línea ~148)

```typescript
// Este código ya estaba correcto ✅
items: displayItems.map((item) => ({
  product_id: item.product.id,
  variant_id: item.variant_id || null, // Usa variant_id
  quantity: item.quantity,
  price_at_time: item.variant?.price || item.product.price, // Usa precio de variante
}));
```

**Nota:** Este mapeo ya estaba bien implementado, solo faltaba que llegara la data correcta.

## Flujo Completo

### ANTES ❌

```
1. Usuario selecciona variante "9 Litros - Gris" ($450)
   ↓
2. Click en "Comprar Ahora"
   ↓
3. sessionStorage guarda:
   {
     product: { price: 0 },
     quantity: 1,
     variant_id: "abc123"
     // ❌ Sin objeto variant
   }
   ↓
4. Checkout recupera:
   {
     product: { price: 0 },
     quantity: 1
     // ❌ Sin variant_id ni variant
   }
   ↓
5. Mapeo de items:
   price_at_time: item.variant?.price || item.product.price
                  undefined           || 0
   ↓
6. Resultado: $0.00 ❌
```

### DESPUÉS ✅

```
1. Usuario selecciona variante "9 Litros - Gris" ($450)
   ↓
2. Click en "Comprar Ahora"
   ↓
3. sessionStorage guarda:
   {
     product: { price: 0 },
     quantity: 1,
     variant_id: "abc123",
     variant: { price: 450, stock: 20, ... } ✅
   }
   ↓
4. Checkout recupera:
   {
     product: { price: 0 },
     quantity: 1,
     variant_id: "abc123", ✅
     variant: { price: 450, stock: 20, ... } ✅
   }
   ↓
5. Mapeo de items:
   price_at_time: item.variant?.price || item.product.price
                  450                 || 0
   ↓
6. Resultado: $450.00 ✅
```

## Comparación Visual

### Antes del Fix ❌

```
┌────────────────────────────────────┐
│  📋 Resumen del Pedido             │
│                                    │
│  🖼️ Refrigerador EKO               │
│     1 × $0.00                      │ ❌
│                                    │
│  Total:              $0.00         │ ❌
└────────────────────────────────────┘
```

### Después del Fix ✅

```
┌────────────────────────────────────┐
│  📋 Resumen del Pedido             │
│                                    │
│  🖼️ Refrigerador EKO               │
│     9 Litros - Gris                │ ✅
│     1 × $450.00                    │ ✅
│                                    │
│  Total:              $450.00       │ ✅
└────────────────────────────────────┘
```

## Archivos Modificados

### 1. `app/products/[slug]/page.tsx`

**Cambio:**

```diff
  sessionStorage.setItem(
    "buyNowProduct",
    JSON.stringify({
      product: product,
      quantity: quantity,
      variant_id: selectedVariant?.id || null,
+     variant: selectedVariant || null,
    })
  );
```

### 2. `app/checkout/page.tsx`

**Cambio:**

```diff
- const { product, quantity } = JSON.parse(buyNowData);
+ const { product, quantity, variant_id, variant } = JSON.parse(buyNowData);

  setBuyNowMode(true);
  setBuyNowItems([{
    product,
-   quantity
+   quantity,
+   variant_id: variant_id || null,
+   variant: variant || null
  }]);
```

## Testing

### Test 1: Comprar Ahora con Variante

1. Ve a un producto con variantes
2. Selecciona una variante (ej: "9 Litros - Gris" a $450)
3. Click en "Comprar Ahora"
4. Verifica en el resumen:
   - ✅ Nombre de variante aparece
   - ✅ Precio unitario es $450.00 (no $0.00)
   - ✅ Total es $450.00 (no $0.00)

### Test 2: Comprar Ahora Producto Simple

1. Ve a un producto sin variantes
2. Click en "Comprar Ahora"
3. Verifica que:
   - ✅ Sigue funcionando correctamente
   - ✅ Muestra precio del producto base
   - ✅ No hay errores

### Test 3: Cambiar Cantidad

1. En producto con variantes
2. Selecciona variante de $450
3. Cambia cantidad a 2
4. Click en "Comprar Ahora"
5. Verifica:
   - ✅ Muestra "2 × $450.00"
   - ✅ Total es $900.00

### Test 4: Variantes con Diferentes Precios

1. Producto con variantes de diferentes precios:
   - Variante A: $450
   - Variante B: $500
2. Selecciona Variante B
3. Click en "Comprar Ahora"
4. Verifica:
   - ✅ Muestra $500.00 (no $450.00)

## Casos Edge Manejados

### Caso 1: Producto Sin Variantes

```typescript
variant_id: null;
variant: null;
price_at_time: item.product.price; // Usa precio del producto
```

✅ Funciona correctamente

### Caso 2: Variante Seleccionada

```typescript
variant_id: "abc123"
variant: { price: 450, ... }
price_at_time: item.variant.price // Usa precio de variante
```

✅ Funciona correctamente

### Caso 3: sessionStorage Corrupto

```typescript
try {
  const { product, quantity, variant_id, variant } = JSON.parse(buyNowData);
} catch (error) {
  // Redirige a /products
}
```

✅ Manejo de errores existente

## Beneficios

### Para el Usuario

- ✅ **Transparencia**: Ve el precio correcto antes de confirmar
- ✅ **Confianza**: No ve $0.00 que genera desconfianza
- ✅ **Claridad**: Ve qué variante está comprando

### Para el Negocio

- ✅ **Conversiones**: Clientes no abandonan por ver $0.00
- ✅ **Datos correctos**: Órdenes se crean con precio correcto
- ✅ **Menos soporte**: No hay confusión con precios

### Técnico

- ✅ **Consistencia**: Misma estructura que carrito normal
- ✅ **Mantenibilidad**: Código más claro
- ✅ **Extensibilidad**: Fácil agregar más info de variante

## Datos Guardados en sessionStorage

### Estructura Completa

```typescript
{
  product: {
    id: "prod-123",
    name: "Refrigerador EKO",
    price: 0,           // Precio base (ignorado si hay variante)
    slug: "refrigerador-eko",
    images: ["..."],
    // ... otros campos del producto
  },
  quantity: 1,
  variant_id: "var-456",  // ID de la variante seleccionada
  variant: {              // Objeto completo de la variante
    id: "var-456",
    product_id: "prod-123",
    sku: "VAR-9-LIT-GRI-0924",
    variant_name: "9 Litros",
    color: "Gris",
    price: 450.00,        // ✅ Precio correcto
    stock_quantity: 20,
    is_active: true,
    attributes_display: "9 Litros - Gris"
  }
}
```

## Compatibilidad

- ✅ Compatible con productos sin variantes
- ✅ Compatible con productos con variantes
- ✅ Compatible con sistema de carrito existente
- ✅ Compatible con creación de órdenes
- ✅ No afecta flujo de carrito normal

## Notas Técnicas

### Por qué Guardar el Objeto Completo

1. **Performance**: Evita query adicional en checkout
2. **Consistencia**: Garantiza mismo precio que usuario vio
3. **Offline**: Funciona aunque cambie precio en DB
4. **Simplicidad**: Código más simple y directo

### Alternativa No Elegida

Podríamos solo guardar `variant_id` y hacer fetch en checkout:

```typescript
// ❌ No elegido
const variant = await fetch(`/api/variants/${variant_id}`);
```

**Desventajas:**

- Query adicional (más lento)
- Precio podría cambiar entre selección y checkout
- Más complejo de implementar
- Requiere manejo de errores de red

## Referencias

- `app/products/[slug]/page.tsx`: Función `handleBuyNow()`
- `app/checkout/page.tsx`: useEffect de buyNowProduct
- `app/api/orders/create/route.ts`: Creación de órdenes con variantes
