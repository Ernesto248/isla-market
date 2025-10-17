# Fix: Input Binding y Auto-generación de SKU

## Problema Identificado

1. **Los inputs no mostraban feedback visual**: Al escribir en los campos de variante y color, no se veía el texto
2. **SKU manual era tedioso**: El usuario quería que el SKU se generara automáticamente

## Causa Raíz

El problema de los inputs era causado por **múltiples llamadas a `updateVariant()`** en un solo evento `onChange`:

```typescript
// ❌ ANTES - Problema
onChange={(e) => {
  updateVariant(variantIndex, "variant_name", e.target.value); // Primera actualización
  // ... cálculos ...
  updateVariant(variantIndex, "_displayName", displayParts.join(" - ")); // Segunda actualización
}}
```

Esto causaba una condición de carrera donde la segunda actualización podía interferir con la primera, impidiendo que React renderizara correctamente el valor del input.

## Solución Implementada

### 1. Refactorización de `onChange`

Ahora se actualiza todo el estado en **una sola operación**:

```typescript
// ✅ DESPUÉS - Solución
onChange={(e) => {
  const newValue = e.target.value;
  const newVariants = [...variants];

  // Actualizar TODO en una sola operación
  const displayParts = [];
  if (newValue) displayParts.push(newValue);
  if (variant.color) displayParts.push(variant.color);

  newVariants[variantIndex] = {
    ...newVariants[variantIndex],
    variant_name: newValue,
    _displayName: displayParts.join(" - ") || `Variante ${variantIndex + 1}`,
    sku: generateSKU(newValue, variant.color || "") // Auto-generar SKU
  };

  setVariants(newVariants);
  onChange(newVariants);
}}
```

**Ventajas:**

- ✅ Un solo `setVariants()` por evento
- ✅ Un solo `onChange()` por evento
- ✅ React renderiza una sola vez
- ✅ El input muestra el texto inmediatamente

### 2. Auto-generación de SKU

Se agregó función `generateSKU()` que crea un código único basado en:

- Variante (ej: "11 Litros" → "11-LIT")
- Color (ej: "Blanco" → "BLA")
- Timestamp (últimos 4 dígitos para unicidad)

```typescript
const generateSKU = (variantName: string, color: string) => {
  let sku = "VAR";

  if (variantName) {
    const cleaned = variantName
      .toUpperCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .map((word) => word.slice(0, 3))
      .join("-");
    sku += `-${cleaned}`;
  }

  if (color) {
    const colorCode = color.toUpperCase().replace(/[^\w]/g, "").slice(0, 3);
    sku += `-${colorCode}`;
  }

  // Timestamp para unicidad
  sku += `-${Date.now().toString().slice(-4)}`;

  return sku;
};
```

**Ejemplos de SKU generados:**

- Variante: "11 Litros", Color: "Blanco" → `VAR-11-LIT-BLA-1234`
- Variante: "1 Tonelada", Color: "" → `VAR-1-TON-5678`
- Variante: "Modelo XL", Color: "Negro" → `VAR-MOD-XL-NEG-9012`

### 3. Campo SKU de Solo Lectura

El campo SKU ahora es `readOnly` con estilo `bg-muted`:

```typescript
<Input
  value={variant.sku || ""}
  readOnly
  className="bg-muted"
  placeholder="Se genera automáticamente"
/>
```

## Archivos Modificados

### `components/admin/variant-editor-simple.tsx`

1. **Agregada función `generateSKU()`** (líneas ~145-172)
2. **Refactorizado onChange de `variant_name`** (líneas ~310-327)
   - Una sola actualización de estado
   - Auto-genera SKU
3. **Refactorizado onChange de `color`** (líneas ~343-360)
   - Una sola actualización de estado
   - Auto-genera SKU
4. **Campo SKU ahora es readOnly** (líneas ~377-390)

## Resultado

✅ **Inputs responden inmediatamente** al escribir
✅ **SKU se genera automáticamente** al cambiar variante o color
✅ **Display name se actualiza** correctamente
✅ **No más race conditions** en el estado

## Cómo Usar

1. Abrir el editor de variantes
2. Escribir en el campo "Variante" (ej: "11 Litros")
   - ✅ El texto aparece mientras escribes
   - ✅ El SKU se genera automáticamente
3. Escribir en el campo "Color" (opcional)
   - ✅ El texto aparece mientras escribes
   - ✅ El SKU se actualiza con el color
4. El SKU es de solo lectura (fondo gris)

## Testing

Para probar:

```bash
# 1. Ir a admin de productos
# 2. Editar un producto
# 3. Hacer clic en "Gestionar Variantes"
# 4. Agregar una variante
# 5. Escribir "11 Litros" en Variante
# 6. Verificar que:
#    - El texto aparece mientras escribes ✓
#    - El título de la tarjeta se actualiza ✓
#    - El SKU se genera (ej: VAR-11-LIT-1234) ✓
# 7. Escribir "Blanco" en Color
# 8. Verificar que:
#    - El texto aparece mientras escribes ✓
#    - El título muestra "11 Litros - Blanco" ✓
#    - El SKU se actualiza (ej: VAR-11-LIT-BLA-5678) ✓
```

## Notas Técnicas

### Por qué funcionó la solución

**Problema original:**

```typescript
onChange={(e) => {
  updateVariant(index, "field1", value1); // setVariants() + onChange()
  updateVariant(index, "field2", value2); // setVariants() + onChange()
}}
```

Esto causaba:

1. Primera actualización de estado → React programa re-render
2. Segunda actualización de estado → React programa otro re-render
3. Posible race condition donde el segundo re-render sobrescribe el primero
4. El input no muestra el valor porque React no sabe cuál es el estado "correcto"

**Solución:**

```typescript
onChange={(e) => {
  const newVariants = [...variants];
  newVariants[index] = { ...newVariants[index], field1: value1, field2: value2 };
  setVariants(newVariants); // UNA sola actualización
  onChange(newVariants);    // UNA sola llamada
}}
```

Esto garantiza:

1. Una sola actualización de estado → React programa un solo re-render
2. Todos los cambios se aplican atómicamente
3. El input siempre muestra el valor correcto

### React Controlled Components

Un input controlado debe cumplir:

```typescript
<Input
  value={estado} // El valor viene del estado
  onChange={(e) => {
    setEstado(e.target.value); // Actualizar estado INMEDIATAMENTE
  }}
/>
```

Si hay múltiples `setEstado()` en un `onChange`, el comportamiento se vuelve impredecible.

## Mejoras Futuras (Opcionales)

1. **Detectar SKU duplicados** y agregar sufijo numérico
2. **Permitir edición manual del SKU** con botón "Editar"
3. **Validar formato del SKU** antes de guardar
4. **Mostrar preview del SKU** mientras se escribe

## Referencias

- React Controlled Components: https://react.dev/reference/react-dom/components/input#controlling-an-input-with-a-state-variable
- React State Updates: https://react.dev/learn/queueing-a-series-of-state-updates
