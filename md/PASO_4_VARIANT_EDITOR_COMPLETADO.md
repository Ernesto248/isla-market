# ✅ PASO 4 COMPLETADO: Componente VariantEditor (Admin UI)

**Fecha:** 17 de Octubre, 2025  
**Duración:** ~2.5 horas  
**Estado:** ✅ COMPLETADO SIN ERRORES

---

## 📝 Lo Que Se Creó

### Componentes Creados

```
components/admin/
└── variant-editor.tsx              ✅ Editor completo de variantes
```

---

## 🎨 Componente: VariantEditor

### Descripción General

El `VariantEditor` es un componente React avanzado que proporciona una interfaz visual completa para gestionar variantes de productos en el panel de administración.

### Características Principales

#### 1. **Dos Modos de Trabajo**

- **Modo Automático:** Selecciona atributos y valores, genera todas las combinaciones automáticamente
- **Modo Manual:** Agrega variantes una por una con control total

#### 2. **Generación Automática de Combinaciones**

- Selección visual de atributos (Capacidad, Color, Tonelaje, etc.)
- Selección de valores con badges interactivos
- Generación de producto cartesiano (todas las combinaciones posibles)
- Límite de 50 combinaciones para evitar problemas de rendimiento
- Mantiene variantes existentes al regenerar

#### 3. **Gestión de Variantes**

- **Campos por variante:**
  - SKU (opcional)
  - Precio (requerido)
  - Stock
  - Estado activo/inactivo
- Edición en tiempo real
- Eliminación individual
- Vista de resumen con estadísticas

#### 4. **Validaciones en Tiempo Real**

- ✅ Precios válidos (> 0)
- ✅ SKUs únicos
- ✅ Combinaciones de atributos únicas
- ✅ Alertas visuales de errores

#### 5. **Información Visual**

- Display name de cada variante (ej: "9 litros + Blanco")
- Badges de atributos
- Contador de combinaciones en botón de generar
- Resumen con totales (variantes, activas, stock, errores)

---

## 📊 Props del Componente

```typescript
interface VariantEditorProps {
  productId?: string; // ID del producto (modo edición)
  initialVariants?: ProductVariant[]; // Variantes existentes
  onChange: (variants: VariantData[]) => void; // Callback al cambiar
  disabled?: boolean; // Deshabilitar edición
}
```

---

## 🔄 Flujo de Uso

### Modo Automático (Recomendado)

```
1. Usuario activa "Generación automática"
2. Selecciona atributo "Capacidad" → valores: 9L, 11L, 17L
3. Selecciona atributo "Color" → valores: Blanco, Negro
4. Click en "Generar Variantes (6 combinaciones)"
5. Sistema crea 6 variantes:
   - 9L + Blanco
   - 9L + Negro
   - 11L + Blanco
   - 11L + Negro
   - 17L + Blanco
   - 17L + Negro
6. Usuario edita precio y stock de cada una
7. Click en "Guardar Producto"
```

### Modo Manual

```
1. Usuario desactiva "Generación automática"
2. Click en "Agregar Variante"
3. Edita campos manualmente (SKU, precio, stock)
4. Repite para cada variante necesaria
5. Click en "Guardar Producto"
```

---

## 🎯 Estructura del Componente

### 1. **Sección: Modo de Generación**

```tsx
<Card>
  <Switch> Generación automática
  <Description> del modo seleccionado
</Card>
```

### 2. **Sección: Selección de Atributos** (solo modo auto)

```tsx
<Card>
  {attributes.map(attr => (
    <div>
      <Label> {attr.display_name}
      <div> Badges de valores (clickeables)
    </div>
  ))}
  <Button> Generar Variantes (X combinaciones)
</Card>
```

### 3. **Sección: Lista de Variantes**

```tsx
<Card>
  {variants.map(variant => (
    <Card>
      <Label> Nombre de la variante
      <Badges> Atributos
      <Input> SKU, Precio, Stock
      <Switch> Activa
      <Button> Eliminar
    </Card>
  ))}
</Card>
```

### 4. **Sección: Resumen**

```tsx
<Card>
  <Stats>- Total Variantes - Activas - Stock Total - Errores</Stats>
</Card>
```

---

## 💾 Estructura de Datos: VariantData

```typescript
interface VariantData {
  id?: string; // ID si es variante existente
  attribute_value_ids: string[]; // IDs de valores seleccionados
  sku?: string; // SKU único
  price: number; // Precio de esta variante
  stock_quantity: number; // Stock disponible
  is_active: boolean; // Activa o no

  // Datos temporales para UI (no se envían al backend)
  _displayName?: string; // Ej: "9 litros + Blanco"
  _attributeValues?: {
    attributeName: string; // Ej: "Capacidad"
    value: string; // Ej: "9 litros"
  }[];
}
```

---

## 🔧 Funciones Clave

### 1. `handleAttributeValueToggle(attributeId, valueId)`

Maneja la selección/deselección de valores de atributos.

### 2. `generateVariantCombinations()`

Genera el producto cartesiano de todos los valores seleccionados.

**Algoritmo:**

```typescript
// Input: { capacidad: [9L, 11L], color: [Blanco, Negro] }
// Output: [
//   [9L, Blanco],
//   [9L, Negro],
//   [11L, Blanco],
//   [11L, Negro]
// ]
```

### 3. `handleGenerateVariants()`

Crea las variantes a partir de las combinaciones, manteniendo datos existentes.

### 4. `getDisplayInfo(attributeValueIds)`

Obtiene información visual de una combinación de valores.

### 5. `updateVariant(index, field, value)`

Actualiza un campo específico de una variante.

### 6. `validationErrors` (useMemo)

Calcula errores de validación en tiempo real.

---

## 📋 Validaciones Implementadas

### 1. **Precio Válido**

```typescript
const withoutPrice = variants.filter((v) => !v.price || v.price <= 0);
if (withoutPrice.length > 0) {
  errors.push(`${withoutPrice.length} variante(s) sin precio válido`);
}
```

### 2. **SKUs Únicos**

```typescript
const skus = variants.map((v) => v.sku).filter(Boolean);
const duplicateSkus = skus.filter((sku, i) => skus.indexOf(sku) !== i);
if (duplicateSkus.length > 0) {
  errors.push(`SKUs duplicados: ${uniqueDupes.join(", ")}`);
}
```

### 3. **Combinaciones Únicas**

```typescript
const combinations = variants.map((v) =>
  [...v.attribute_value_ids].sort().join("-")
);
const duplicateCombinations = combinations.filter(
  (combo, i) => combo && combinations.indexOf(combo) !== i
);
```

---

## 🎨 Ejemplo de Uso

### Crear Producto con Variantes

```tsx
import {
  VariantEditor,
  type VariantData,
} from "@/components/admin/variant-editor";

function ProductFormWithVariants() {
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<VariantData[]>([]);

  const handleVariantsChange = (newVariants: VariantData[]) => {
    setVariants(newVariants);
  };

  const handleSubmit = async () => {
    if (hasVariants) {
      // Usar endpoint /api/admin/products/with-variants
      await fetch("/api/admin/products/with-variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: {
            name: "Refrigerador X",
            category_id: "cat-001",
            // ... otros campos
          },
          variants: variants.map((v) => ({
            attribute_value_ids: v.attribute_value_ids,
            price: v.price,
            stock_quantity: v.stock_quantity,
            sku: v.sku,
            is_active: v.is_active,
          })),
        }),
      });
    }
  };

  return (
    <form>
      {/* Campos del producto */}
      <Input name="name" placeholder="Nombre del producto" />

      {/* Toggle para variantes */}
      <Switch checked={hasVariants} onCheckedChange={setHasVariants} />

      {/* Editor de variantes */}
      {hasVariants && <VariantEditor onChange={handleVariantsChange} />}

      <Button onClick={handleSubmit}>Guardar</Button>
    </form>
  );
}
```

---

## 🎯 Casos de Uso

### Caso 1: Producto Simple sin Variantes

```
Usuario NO activa variantes → Usa formulario normal
```

### Caso 2: Producto con 2 Atributos (6 variantes)

```
Capacidad: 9L, 11L, 17L
Color: Blanco, Negro
→ Genera 6 combinaciones automáticamente
```

### Caso 3: Producto con 3 Atributos (12 variantes)

```
Capacidad: 9L, 11L
Color: Blanco, Negro, Gris
Tipo: Estándar, Premium
→ Genera 2 × 3 × 2 = 12 combinaciones
```

### Caso 4: Editar Variantes Existentes

```
Producto ya tiene 6 variantes
→ VariantEditor las carga en modo manual
→ Usuario puede agregar, editar o eliminar
```

---

## ⚠️ Límites y Restricciones

### 1. **Máximo 50 Combinaciones**

```typescript
if (combinations.length > 50) {
  setError("Demasiadas combinaciones (máximo 50)...");
  return;
}
```

**Razón:** Evitar sobrecarga en UI y base de datos.

### 2. **Precios Requeridos**

Todas las variantes deben tener precio > 0 antes de guardar.

### 3. **Combinaciones Únicas**

No puede haber dos variantes con los mismos valores de atributos.

---

## 🚀 Mejoras Futuras (Opcionales)

### 1. **Bulk Edit**

- Aplicar mismo precio a múltiples variantes
- Aplicar mismo stock a múltiples variantes

### 2. **Importación CSV**

- Importar variantes desde archivo CSV
- Template descargable

### 3. **Preview de Imágenes**

- Subir imagen específica por variante
- Vista previa en la tabla

### 4. **Pricing Inteligente**

- Sugerir precios basados en atributos
- Incrementos automáticos (9L = $299, 11L = $349, etc.)

### 5. **Stock Alerts**

- Alertas visuales para stock bajo
- Recomendaciones de reabastecimiento

---

## ✅ Archivos Creados

1. ✅ `components/admin/variant-editor.tsx` (683 líneas)

**Total:** 1 archivo principal

---

## ✅ Validación TypeScript

```bash
✓ variant-editor.tsx - 0 errores
✓ Todas las props tipadas correctamente
✓ Callbacks con tipos explícitos
✓ UseMemo para validaciones optimizado
```

---

## 🎯 Próximo Paso

**PASO 5: Integrar VariantEditor en Formulario de Producto**

**Tareas:**

1. Modificar o crear `ProductFormWithVariants`
2. Agregar toggle "Este producto tiene variantes"
3. Integrar `VariantEditor` condicionalmente
4. Manejar envío de datos al endpoint correcto
5. Manejar modo edición vs creación

**Tiempo estimado:** 2 horas

---

## 📋 Checklist del Paso 4

- [x] Componente VariantEditor creado
- [x] Modo automático de generación
- [x] Modo manual de agregado
- [x] Selección visual de atributos con badges
- [x] Generación de combinaciones (producto cartesiano)
- [x] Edición de campos (SKU, precio, stock, activo)
- [x] Validaciones en tiempo real
- [x] Display names dinámicos
- [x] Resumen con estadísticas
- [x] Eliminación de variantes
- [x] Límite de 50 combinaciones
- [x] Alertas de errores visuales
- [x] Compilar sin errores TypeScript
- [x] Props correctamente tipadas
- [x] Documentación completa

**Estado:** ✅ **COMPLETADO AL 100%**

---

## 🚀 Listo para Continuar

El componente `VariantEditor` está completo y listo para integrarse en el formulario de productos del admin.

**¿Continuamos con el Paso 5: Integrar en ProductForm?** 📝
