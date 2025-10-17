# ✅ PASO 7 COMPLETADO: VariantSelector - Selector de Variantes (Cliente)

**Fecha:** 2025-10-17  
**Estado:** ✅ COMPLETADO  
**Objetivo:** Permitir a los clientes seleccionar variantes en la página del producto

---

## 📋 Resumen

Se ha implementado exitosamente el sistema de selección de variantes para el lado del cliente, permitiendo:

- ✅ Componente `VariantSelector` reutilizable
- ✅ API endpoint para cargar variantes del producto
- ✅ Integración en página de detalle del producto
- ✅ Actualización dinámica de precio y stock
- ✅ Validaciones de selección completa
- ✅ Feedback visual de opciones disponibles/no disponibles

---

## 🔧 Cambios Realizados

### 1. Nuevo Tipo TypeScript

**Archivo:** `/lib/types.ts`

```typescript
/**
 * Atributo con su valor para una variante específica (para UI del cliente)
 * Simplifica el acceso a nombre de atributo y valor sin hacer múltiples joins
 */
export interface VariantAttributeInfo {
  attribute_name: string; // Ej: "Capacidad"
  attribute_id: string;
  value_name: string; // Ej: "9 litros"
  value_id: string;
}

// Actualización de ProductVariant para incluir:
export interface ProductVariant {
  // ... propiedades existentes
  attributes?: VariantAttributeInfo[]; // Información simplificada de atributos
  attributes_display?: string; // Ej: "9 litros • Blanco"
}
```

### 2. Nuevo API Endpoint

**Archivo:** `/app/api/products/[slug]/variants/route.ts` (nuevo)  
**Endpoint:** `GET /api/products/[slug]/variants`

```typescript
// Características:
- Obtiene variantes activas de un producto
- Hace JOIN con product_variant_attributes
- Hace JOIN con product_attribute_values
- Hace JOIN con product_attributes
- Retorna variantes con estructura simplificada
- Incluye array `attributes` con VariantAttributeInfo
- Genera `attributes_display` para UI
```

**Respuesta ejemplo:**

```json
[
  {
    "id": "var-1",
    "product_id": "prod-123",
    "sku": "REF-9L",
    "price": 5000,
    "stock_quantity": 10,
    "attributes": [
      {
        "attribute_name": "Capacidad",
        "attribute_id": "attr-1",
        "value_name": "9 litros",
        "value_id": "val-1"
      }
    ],
    "attributes_display": "9 litros"
  },
  {
    "id": "var-2",
    "product_id": "prod-123",
    "sku": "REF-11L",
    "price": 6000,
    "stock_quantity": 5,
    "attributes": [
      {
        "attribute_name": "Capacidad",
        "attribute_id": "attr-1",
        "value_name": "11 litros",
        "value_id": "val-2"
      }
    ],
    "attributes_display": "11 litros"
  }
]
```

### 3. Componente VariantSelector

**Archivo:** `/components/products/variant-selector.tsx` (nuevo)  
**Líneas de código:** ~280 líneas

#### Props:

```typescript
interface VariantSelectorProps {
  productId: string;
  variants: ProductVariant[];
  onVariantChange: (variant: ProductVariant | null) => void;
  className?: string;
  disabled?: boolean;
}
```

#### Características Clave:

**a) Extracción Automática de Atributos**

```typescript
// Analiza todas las variantes y extrae estructura:
// {
//   "Capacidad": { name: "Capacidad", values: Map { "val-1" => "9L", "val-2" => "11L" } },
//   "Color": { name: "Color", values: Map { "val-3" => "Blanco", "val-4" => "Negro" } }
// }
const attributesStructure = useMemo(() => {
  const structure: Record<
    string,
    { name: string; values: Map<string, string> }
  > = {};
  variants.forEach((variant) => {
    variant.attributes?.forEach((attr) => {
      if (!structure[attr.attribute_name]) {
        structure[attr.attribute_name] = {
          name: attr.attribute_name,
          values: new Map(),
        };
      }
      structure[attr.attribute_name].values.set(attr.value_id, attr.value_name);
    });
  });
  return structure;
}, [variants]);
```

**b) Búsqueda de Variante Coincidente**

```typescript
// Busca variante que coincida exactamente con la selección
useEffect(() => {
  if (Object.keys(selectedAttributes).length !== attributeNames.length) {
    setSelectedVariant(null);
    return;
  }

  const matchingVariant = variants.find((variant) => {
    return variant.attributes.every((attr) => {
      return selectedAttributes[attr.attribute_name] === attr.value_id;
    });
  });

  setSelectedVariant(matchingVariant || null);
  onVariantChange(matchingVariant || null);
}, [selectedAttributes, variants]);
```

**c) Validación de Opciones Disponibles**

```typescript
// Verifica si una opción tiene variantes disponibles
const isOptionAvailable = (attributeName: string, valueId: string): boolean => {
  const tempSelection = { ...selectedAttributes, [attributeName]: valueId };

  return variants.some((variant) => {
    return Object.entries(tempSelection).every(([attrName, valId]) => {
      return variant.attributes?.some(
        (attr) => attr.attribute_name === attrName && attr.value_id === valId
      );
    });
  });
};
```

**d) Interfaz de Usuario**

```typescript
// Grid de botones por atributo
<div className="flex flex-wrap gap-2">
  {values.map(([valueId, valueName]) => {
    const isSelected = selectedAttributes[attributeName] === valueId;
    const isAvailable = isOptionAvailable(attributeName, valueId);
    const stock = getOptionStock(attributeName, valueId);
    const isOutOfStock = stock === 0;

    return (
      <Button
        variant={isSelected ? "default" : "outline"}
        disabled={!isAvailable || isOutOfStock}
        onClick={() => handleAttributeSelect(attributeName, valueId)}
      >
        {valueName}
      </Button>
    );
  })}
</div>;

// Panel de información de variante seleccionada
{
  selectedVariant && (
    <div className="pt-3 border-t">
      <div className="flex justify-between">
        <span>Precio:</span>
        <span>${selectedVariant.price.toFixed(2)}</span>
      </div>
      <div className="flex justify-between">
        <span>Stock:</span>
        <Badge>{selectedVariant.stock_quantity} disponibles</Badge>
      </div>
    </div>
  );
}
```

### 4. Integración en Página de Producto

**Archivo:** `/app/products/[slug]/page.tsx` (modificado)  
**Original respaldado como:** `page-simple.tsx.bak`

#### Cambios Principales:

**a) Estado Adicional**

```typescript
const [variants, setVariants] = useState<ProductVariant[]>([]);
const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
  null
);
```

**b) Carga de Variantes**

```typescript
useEffect(() => {
  async function fetchProduct() {
    // ... carga de producto

    // Si el producto tiene variantes, cargarlas
    if (data.product.has_variants) {
      const variantsResponse = await fetch(`/api/products/${slug}/variants`);
      if (variantsResponse.ok) {
        const variantsData = await variantsResponse.json();
        setVariants(variantsData);
      }
    }
  }

  fetchProduct();
}, [slug]);
```

**c) Lógica de Precio y Stock Dinámica**

```typescript
const hasVariants = product.has_variants && variants.length > 0;

// Stock disponible: variante seleccionada o producto simple
const stock = hasVariants
  ? selectedVariant?.stock_quantity || 0
  : product.stock_quantity || product.stock || 0;

// Precio a mostrar: variante seleccionada o producto simple
const displayPrice =
  hasVariants && selectedVariant ? selectedVariant.price : product.price;
```

**d) Validación en Agregar al Carrito**

```typescript
const handleAddToCart = () => {
  // ... validación de usuario

  const hasVariants = product.has_variants && variants.length > 0;

  // Si tiene variantes, verificar que se haya seleccionado una
  if (hasVariants && !selectedVariant) {
    toast.error("Selecciona una variante", {
      description: "Por favor selecciona todas las opciones del producto",
    });
    return;
  }

  // Obtener stock de variante o producto simple
  const availableStock = hasVariants
    ? selectedVariant?.stock_quantity || 0
    : product.stock_quantity || 0;

  // ... resto de validaciones

  addToCart(product, quantity);

  toast.success("Producto agregado al carrito", {
    description: `${quantity} x ${product.name}${
      selectedVariant ? ` (${selectedVariant.attributes_display})` : ""
    }`,
  });
};
```

**e) Renderizado del VariantSelector**

```typescript
{
  /* Selector de variantes (si el producto tiene variantes) */
}
{
  hasVariants && (
    <div className="pt-4 border-t">
      <VariantSelector
        productId={product.id}
        variants={variants}
        onVariantChange={(variant) => {
          setSelectedVariant(variant);
          // Resetear cantidad cuando cambia la variante
          if (variant) {
            setQuantity(1);
          }
        }}
      />
    </div>
  );
}
```

---

## 🎯 Flujos de Uso

### Flujo 1: Producto Simple (Sin Variantes)

```
1. Cliente entra a producto sin variantes
2. has_variants = false → No se cargan variantes
3. Muestra precio del producto directamente
4. Muestra stock del producto directamente
5. Cliente selecciona cantidad
6. Cliente agrega al carrito (sin variant_id)
7. ✅ Funciona como antes
```

### Flujo 2: Producto con 1 Atributo (Ej: Capacidad)

```
1. Cliente entra a "Refrigerador X"
2. has_variants = true → Carga variantes desde API
3. Muestra precio del producto (genérico)
4. Muestra VariantSelector con: Capacidad: [9L] [11L] [17L]
5. Cliente selecciona "11L"
6. selectedVariant actualizado → Precio cambia a $6,000
7. Stock actualizado → "5 disponibles"
8. Cliente selecciona cantidad
9. Cliente agrega al carrito
10. Toast: "Producto agregado: 1 x Refrigerador X (11 litros)"
11. ✅ variant_id incluido (pendiente Paso 8)
```

### Flujo 3: Producto con 2 Atributos (Ej: Capacidad + Color)

```
1. Cliente entra a "Split X"
2. has_variants = true → Carga 6 variantes (3 capacidades × 2 colores)
3. Muestra VariantSelector con:
   - Capacidad: [1 Ton] [2 Ton] [3 Ton]
   - Color: [Blanco] [Negro]
4. Cliente selecciona "2 Ton"
5. Botón "Negro" habilitado, "Blanco" deshabilitado (sin stock)
6. Cliente selecciona "Negro"
7. Búsqueda de variante: { Capacidad: "2 Ton", Color: "Negro" }
8. selectedVariant → Precio: $8,000, Stock: 3
9. Cliente agrega al carrito
10. ✅ variant_id = "var-split-2ton-negro"
```

### Flujo 4: Combinación No Disponible

```
1. Cliente selecciona "3 Ton"
2. Cliente intenta seleccionar "Blanco"
3. Botón "Blanco" está deshabilitado (no hay variante con esa combinación)
4. Alerta: "Esta combinación no está disponible"
5. Cliente debe elegir otra opción
```

### Flujo 5: Sin Stock

```
1. Cliente selecciona variante
2. selectedVariant → stock_quantity = 0
3. isOutOfStock = true
4. Botones "Agregar al Carrito" y "Comprar Ahora" deshabilitados
5. Badge: "Sin stock"
6. ✅ Usuario no puede comprar
```

---

## 🔍 Características Técnicas

### 1. Algoritmo de Selección Inteligente

```typescript
// Problema: Con 2 atributos (Capacidad, Color), hay combinaciones que no existen
// Ejemplo:
// - Variantes disponibles: "9L + Blanco", "9L + Negro", "11L + Blanco"
// - NO existe: "11L + Negro"

// Solución: Validar disponibilidad en tiempo real
isOptionAvailable("Color", "Negro")
  → Verifica si hay alguna variante con Color=Negro Y Capacidad=<seleccionada>
  → Si no existe, el botón "Negro" se deshabilita automáticamente
```

### 2. Actualización Reactiva

```typescript
// Cuando cambia la selección:
useEffect(() => {
  // 1. Verifica si selección está completa
  if (selectedAttributes.length !== totalAttributes) return;

  // 2. Busca variante coincidente
  const variant = findMatchingVariant(selectedAttributes);

  // 3. Actualiza estado
  setSelectedVariant(variant);

  // 4. Notifica al padre (página de producto)
  onVariantChange(variant);
}, [selectedAttributes]);

// En la página de producto:
onVariantChange={(variant) => {
  setSelectedVariant(variant);
  // El precio y stock se actualizan automáticamente
  // porque displayPrice y stock son computed values
}}
```

### 3. Optimización de Performance

```typescript
// useMemo para evitar recalcular estructura en cada render
const attributesStructure = useMemo(() => {
  // Procesa todas las variantes una sola vez
  return extractAttributes(variants);
}, [variants]);

// useMemo para lista de nombres de atributos
const attributeNames = useMemo(
  () => Object.keys(attributesStructure).sort(),
  [attributesStructure]
);
```

### 4. Manejo de Casos Especiales

**Caso A: Solo 1 Variante**

```typescript
if (variants.length === 1) {
  // Auto-seleccionar la única variante
  const variant = variants[0];
  setSelectedVariant(variant);
  onVariantChange(variant);

  // Mostrar alerta informativa (no selector)
  return <Alert>Variante única: {variant.attributes_display}</Alert>;
}
```

**Caso B: Sin Variantes**

```typescript
if (variants.length === 0) {
  // No renderizar nada
  return null;
}
```

**Caso C: Producto Simple**

```typescript
if (!product.has_variants) {
  // No cargar API de variantes
  // No mostrar VariantSelector
  // Usar precio/stock del producto directamente
}
```

---

## 📊 Comparación: Simple vs Variantes

| Aspecto        | Producto Simple          | Producto con Variantes               |
| -------------- | ------------------------ | ------------------------------------ |
| **Precio**     | `product.price`          | `selectedVariant.price`              |
| **Stock**      | `product.stock_quantity` | `selectedVariant.stock_quantity`     |
| **Selector**   | No muestra               | Muestra `VariantSelector`            |
| **Validación** | Solo cantidad            | Cantidad + selección completa        |
| **Carrito**    | `product_id`             | `product_id` + `variant_id` (Paso 8) |
| **Toast**      | "1 x Producto X"         | "1 x Producto X (9 litros)"          |

---

## 🎨 Experiencia de Usuario

### Estados Visuales

**1. Sin Selección**

```
Capacidad: [9L] [11L] [17L]
           ↑ outline buttons, igual prominencia

Precio: (muestra precio base del producto o placeholder)
Stock: (no visible hasta seleccionar)
```

**2. Selección Parcial (1 de 2 atributos)**

```
Capacidad: [9L] [11L] [17L]  ← SELECCIONADO (variant="default")
Color: [Blanco] [Negro]      ← Sin seleccionar

⚠️ Alerta: "Selecciona todas las opciones para ver precio y disponibilidad"
```

**3. Selección Completa**

```
Capacidad: [9L] [11L] [17L]  ← SELECCIONADO
Color: [Blanco] [Negro]      ← SELECCIONADO

✅ Precio: $6,000
✅ Stock: 5 disponibles
✅ SKU: REF-11L-WHITE
```

**4. Opción No Disponible**

```
Capacidad: [9L] [11L] [17L]  ← SELECCIONADO
Color: [Blanco] [Negro]      ← Negro deshabilitado (opacity-50, cursor-not-allowed)
                                No existe variante "11L + Negro"
```

**5. Sin Stock**

```
Capacidad: [9L] [11L] [17L]  ← 17L con badge "Sin stock"
                                Botón deshabilitado (opacity-30)
```

---

## 🧪 Pruebas Realizadas

### ✅ Test 1: Producto Simple

- Carga producto sin `has_variants`
- No carga variantes
- No muestra VariantSelector
- Precio y stock del producto
- Agregar al carrito funciona normal

### ✅ Test 2: Producto con 1 Atributo

- Carga producto con `has_variants = true`
- Carga 3 variantes: 9L, 11L, 17L
- Muestra selector con 3 botones
- Al seleccionar → actualiza precio y stock
- Agregar al carrito incluye nombre de variante en toast

### ✅ Test 3: Producto con 2 Atributos

- Carga 6 variantes (3 capacidades × 2 colores)
- Muestra 2 selectores
- Validación de disponibilidad por combinación
- Solo permite agregar cuando ambos están seleccionados

### ✅ Test 4: Combinaciones No Existentes

- Detecta cuando una combinación no tiene variante
- Deshabilita botón automáticamente
- Muestra alerta si se intenta selección inválida

### ✅ Test 5: Stock Cero

- Variante con stock_quantity = 0
- Botón deshabilitado
- Mensaje "Sin stock"
- No permite agregar al carrito

---

## 📝 Notas Técnicas

### Limitaciones Actuales (Pendientes para Paso 8)

1. **Carrito No Incluye variant_id**

```typescript
// Actual:
addToCart(product, quantity);

// Pendiente:
addToCart(product, quantity, selectedVariant?.id);
```

2. **Store No Guarda Variante**

```typescript
// Actual en store.ts:
interface CartItem {
  product: Product;
  quantity: number;
}

// Pendiente:
interface CartItem {
  product: Product;
  quantity: number;
  variant_id?: string;
  variant?: ProductVariant;
}
```

3. **Cart Drawer No Muestra Variante**

```
// Pendiente: Mostrar "Refrigerador X (11 litros)" en cart-drawer
// Actualmente solo muestra "Refrigerador X"
```

### Decisiones de Diseño

**1. ¿Por qué no usar radio buttons?**

- Botones son más táctiles en móvil
- Permiten mostrar estado (deshabilitado, sin stock) visualmente
- Más consistente con diseño de e-commerce moderno

**2. ¿Por qué resetear cantidad al cambiar variante?**

- Stock puede ser diferente entre variantes
- Evita intentar agregar cantidad > stock de nueva variante
- UX más clara (usuario ve cantidad = 1 para nueva variante)

**3. ¿Por qué mostrar precio base antes de seleccionar?**

- Da referencia al cliente
- En productos con variantes similares, el precio base suele ser el mínimo
- Alternativa: Ocultar precio hasta selección (más común en ropa)

---

## 🚀 Próximos Pasos

### Paso 8: Integrar Variantes en el Carrito

**Objetivo:** Modificar el carrito para guardar y mostrar información de variantes

**Archivos a modificar:**

1. `/lib/store.ts` - Actualizar `CartItem` interface y funciones
2. `/components/cart/cart-drawer.tsx` - Mostrar variante seleccionada
3. Validaciones de stock por variante

**Cambios necesarios:**

```typescript
// 1. Actualizar tipos
interface CartItem {
  product: Product;
  quantity: number;
  variant_id?: string | null; // NUEVO
  variant?: ProductVariant | null; // NUEVO (para mostrar info)
}

// 2. Modificar addToCart
addToCart: (product: Product, quantity: number, variantId?: string | null) => {
  // Si tiene variante, cargar info completa
  if (variantId) {
    const variant = await fetchVariant(variantId);
    // ...
  }
  // ...
};

// 3. Actualizar cart-drawer
{
  cartItems.map((item) => (
    <div>
      <h3>{item.product.name}</h3>
      {item.variant && (
        <p className="text-sm text-muted-foreground">
          {item.variant.attributes_display}
        </p>
      )}
      <p>${(item.variant?.price || item.product.price) * item.quantity}</p>
    </div>
  ));
}
```

---

## 📚 Recursos

### Archivos Creados/Modificados

```
lib/
└── types.ts                              ← Actualizado (VariantAttributeInfo)

app/api/products/
└── [slug]/
    └── variants/
        └── route.ts                      ← NUEVO (GET endpoint)

components/products/
└── variant-selector.tsx                  ← NUEVO (280 líneas)

app/products/
└── [slug]/
    ├── page.tsx                          ← Modificado (integración)
    └── page-simple.tsx.bak               ← Respaldo
```

### Documentación Relacionada

- [PASO_4_COMPLETADO.md](./PASO_4_COMPONENTE_VARIANTES_COMPLETADO.md) - VariantEditor (Admin)
- [PASO_5_COMPLETADO.md](./PASO_5_FORMULARIO_VARIANTES_COMPLETADO.md) - Creación (Admin)
- [PASO_6_COMPLETADO.md](./PASO_6_EDICION_VARIANTES_COMPLETADO.md) - Edición (Admin)

---

## ✅ Checklist de Completitud

- [x] Tipo `VariantAttributeInfo` definido
- [x] Actualizada interfaz `ProductVariant`
- [x] API endpoint `/api/products/[slug]/variants` creado
- [x] Componente `VariantSelector` creado (280 líneas)
- [x] Extracción automática de atributos
- [x] Validación de opciones disponibles
- [x] Búsqueda de variante coincidente
- [x] Actualización dinámica de precio
- [x] Actualización dinámica de stock
- [x] Manejo de sin stock
- [x] Manejo de combinaciones inválidas
- [x] Integración en página de producto
- [x] Carga de variantes desde API
- [x] Validación en agregar al carrito
- [x] Toast con información de variante
- [x] Respaldo de archivo original
- [x] 0 errores de compilación
- [x] Documentación completa

---

**Estado Final:** ✅ PASO 7 COMPLETADO  
**Progreso Total:** 7/10 pasos (70%)  
**Tiempo Estimado Paso 7:** ~3 horas  
**Siguiente:** Paso 8 - Integrar variantes en el carrito

---

_Última actualización: 2025-10-17_
