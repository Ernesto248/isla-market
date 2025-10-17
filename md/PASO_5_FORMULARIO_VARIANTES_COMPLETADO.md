# ✅ PASO 5 COMPLETADO: Formulario de Producto con Variantes

**Fecha:** 17 de Octubre, 2025  
**Duración:** ~1.5 horas  
**Estado:** ✅ COMPLETADO SIN ERRORES

---

## 📝 Lo Que Se Creó

### Archivos Modificados/Creados

```
app/admin/products/new/
├── page.tsx                    ✅ Nuevo formulario con soporte de variantes
└── page-simple.tsx.bak         📦 Respaldo del formulario original
```

---

## 🎨 Componente: NewProductWithVariantsPage

### Descripción General

Formulario mejorado para crear productos que soporta tanto **productos simples** como **productos con variantes**. El usuario puede alternar entre ambos modos con un simple switch.

---

## ✨ Características Principales

### 1. **Modo Dual: Simple vs Variantes**

#### Producto Simple (tradicional)

- Campo de precio único
- Campo de stock único
- Se envía al endpoint tradicional: `POST /api/admin/products`

#### Producto con Variantes

- Sin campos de precio/stock en formulario principal
- Integra componente `VariantEditor`
- Se envía al endpoint especial: `POST /api/admin/products/with-variants`

### 2. **Toggle Inteligente**

```tsx
<Switch
  id="has-variants"
  checked={hasVariants}
  onCheckedChange={handleHasVariantsChange}
/>
```

**Comportamiento:**

- ✅ Al activar: oculta precio/stock, muestra `VariantEditor`
- ✅ Al desactivar: limpia variantes, muestra precio/stock
- ✅ Alerta informativa explica el cambio

### 3. **Validaciones Condicionales**

#### Para Productos Simples:

```typescript
if (!formData.price || parseFloat(formData.price) <= 0) {
  toast.error("El precio debe ser mayor a 0");
  return false;
}
```

#### Para Productos con Variantes:

```typescript
if (variants.length === 0) {
  toast.error("Debes crear al menos una variante");
  return false;
}

// Verificar precios válidos
const withoutPrice = variants.filter((v) => !v.price || v.price <= 0);

// Verificar SKUs duplicados
const duplicateSkus = skus.filter((sku, index) => skus.indexOf(sku) !== index);

// Verificar combinaciones duplicadas
const duplicateCombinations = combinations.filter(...);
```

### 4. **Envío Inteligente**

```typescript
if (hasVariants) {
  // Endpoint especial para productos con variantes
  await fetch("/api/admin/products/with-variants", {
    method: "POST",
    body: JSON.stringify({
      product: { name, description, category_id, images, ... },
      variants: variants.map(v => ({
        attribute_value_ids: v.attribute_value_ids,
        price: v.price,
        stock_quantity: v.stock_quantity,
        sku: v.sku || undefined,
        is_active: v.is_active,
      })),
    }),
  });
} else {
  // Endpoint tradicional para productos simples
  await fetch("/api/admin/products", {
    method: "POST",
    body: JSON.stringify({
      name, description, price, stock_quantity, ...
    }),
  });
}
```

### 5. **Gestión de Errores Parciales**

```typescript
if (data.errors && data.errors.length > 0) {
  toast.warning(
    `Producto creado pero con ${data.errors.length} error(es) en variantes`
  );
} else {
  toast.success("Producto con variantes creado correctamente");
}
```

---

## 🔄 Flujo de Usuario

### Crear Producto Simple

```
1. Usuario llena nombre, descripción, categoría
2. Switch "Tiene variantes" = OFF
3. Llena precio: $299.99
4. Llena stock: 50
5. Sube imágenes
6. Click "Crear Producto"
7. → POST /api/admin/products
8. ✅ Producto creado
```

### Crear Producto con Variantes

```
1. Usuario llena nombre, descripción, categoría
2. Switch "Tiene variantes" = ON
3. VariantEditor aparece
4. Usuario selecciona atributos (Capacidad: 9L, 11L, 17L)
5. Usuario selecciona atributos (Color: Blanco, Negro)
6. Click "Generar Variantes (6 combinaciones)"
7. Usuario edita precio/stock de cada variante:
   - 9L + Blanco: $299.99, stock: 50
   - 9L + Negro: $299.99, stock: 30
   - 11L + Blanco: $349.99, stock: 40
   - ... etc
8. Sube imágenes (compartidas)
9. Click "Crear Producto"
10. → POST /api/admin/products/with-variants
11. ✅ Producto + 6 variantes creadas
```

---

## 📊 Estructura del Formulario

### Sección 1: Información Básica

```tsx
<Card>
  <Input> Nombre (requerido)
  <Textarea> Descripción
  <Select> Categoría (requerido)
  <Switch> Estado (activo/inactivo)
  <Switch> Destacado
</Card>
```

### Sección 2: Tipo de Producto ⭐ (NUEVO)

```tsx
<Card>
  <Switch> Este producto tiene variantes
  {hasVariants && (
    <Alert> Información sobre variantes
  )}
</Card>
```

### Sección 3A: Precio e Inventario (Productos Simples)

```tsx
{!hasVariants && (
  <Card>
    <Input> Precio (requerido)
    <Input> Stock
  </Card>
)}
```

### Sección 3B: Editor de Variantes (Productos con Variantes)

```tsx
{
  hasVariants && (
    <VariantEditor onChange={handleVariantsChange} disabled={loading} />
  );
}
```

### Sección 4: Imágenes

```tsx
<Card>
  <ImageUpload>
  <Description> "Se compartirán entre variantes" (si aplica)
</Card>
```

### Sección 5: Botones

```tsx
<div>
  <Button variant="outline"> Cancelar
  <Button type="submit"> Crear Producto
</div>
```

---

## 🎯 Validaciones Implementadas

### Validaciones Comunes (Ambos Tipos)

- ✅ Nombre requerido
- ✅ Categoría requerida

### Validaciones para Productos Simples

- ✅ Precio > 0 (requerido)
- ✅ Stock >= 0 (opcional, default: 0)

### Validaciones para Productos con Variantes

- ✅ Al menos 1 variante
- ✅ Todas las variantes con precio > 0
- ✅ SKUs únicos (si se proporcionan)
- ✅ Combinaciones de atributos únicas
- ✅ Sin combinaciones duplicadas

---

## 📋 Estados del Formulario

```typescript
interface FormState {
  // Datos básicos del producto
  formData: {
    name: string;
    description: string;
    price: string; // Solo para productos simples
    category_id: string;
    stock_quantity: string; // Solo para productos simples
    is_active: boolean;
    featured: boolean;
  };

  // Control de variantes
  hasVariants: boolean; // Toggle principal
  variants: VariantData[]; // Array de variantes

  // Imágenes
  uploadedImages: string[];

  // UI
  loading: boolean;
  categories: Category[];
}
```

---

## 🔧 Funciones Clave

### 1. `handleHasVariantsChange(checked)`

```typescript
const handleHasVariantsChange = (checked: boolean) => {
  setHasVariants(checked);
  if (!checked) {
    setVariants([]); // Limpiar variantes al desactivar
  }
};
```

### 2. `handleVariantsChange(newVariants)`

```typescript
const handleVariantsChange = (newVariants: VariantData[]) => {
  setVariants(newVariants);
};
```

### 3. `validateForm()`

```typescript
const validateForm = () => {
  // Validaciones comunes
  if (!formData.name.trim()) return false;
  if (!formData.category_id) return false;

  // Validaciones condicionales
  if (hasVariants) {
    // Validar variantes
  } else {
    // Validar precio/stock
  }

  return true;
};
```

### 4. `handleSubmit(e)`

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) return;

  try {
    setLoading(true);

    if (hasVariants) {
      // POST /api/admin/products/with-variants
    } else {
      // POST /api/admin/products
    }

    toast.success("Producto creado");
    router.push("/admin/products");
  } catch (error) {
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};
```

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Producto Simple (Miel)

```
Nombre: Miel de Abeja Orgánica
Descripción: Miel pura de la isla
Categoría: Alimentos
Tiene variantes: NO
Precio: $450.00
Stock: 100
Imágenes: [honey1.jpg, honey2.jpg]

→ POST /api/admin/products
→ Producto simple creado ✓
```

### Ejemplo 2: Producto con Variantes (Refrigerador)

```
Nombre: Refrigerador EcoFrost X
Descripción: Refrigerador eficiente
Categoría: Electrodomésticos
Tiene variantes: SÍ

Atributos seleccionados:
- Capacidad: 9L, 11L, 17L
- Color: Blanco, Negro

Variantes generadas (6):
1. 9L + Blanco   → $299.99, stock: 50
2. 9L + Negro    → $299.99, stock: 30
3. 11L + Blanco  → $349.99, stock: 40
4. 11L + Negro   → $349.99, stock: 25
5. 17L + Blanco  → $449.99, stock: 20
6. 17L + Negro   → $449.99, stock: 15

Imágenes: [ref1.jpg, ref2.jpg] (compartidas)

→ POST /api/admin/products/with-variants
→ Producto + 6 variantes creadas ✓
```

### Ejemplo 3: Cambio de Modo Durante Edición

```
1. Usuario empieza llenando formulario como simple
2. Llena precio: $300
3. Llena stock: 50
4. Cambia de opinión → activa "Tiene variantes"
5. Precio/stock desaparecen
6. VariantEditor aparece
7. Crea variantes
8. Guarda producto con variantes ✓
```

---

## ⚠️ Consideraciones Importantes

### 1. **Imágenes Compartidas**

Cuando un producto tiene variantes, todas las variantes comparten las mismas imágenes del producto. En futuras versiones se podría permitir imágenes específicas por variante.

### 2. **Precio/Stock en Producto Padre**

Para productos con variantes:

- `products.price` = 0 (no se usa)
- `products.stock_quantity` = 0 (no se usa)
- Los precios y stocks reales están en `product_variants`

### 3. **Validación de Atributos**

El formulario no valida si los atributos existen antes de generar variantes. Esto lo maneja el componente `VariantEditor` que carga los atributos de la API.

### 4. **Manejo de Errores Parciales**

Si al crear un producto con 10 variantes, 2 fallan, el producto se crea con las 8 exitosas. Se muestra un warning al usuario.

---

## 🚀 Mejoras Futuras (Opcionales)

### 1. **Auto-save / Draft**

Guardar el formulario automáticamente cada X segundos para no perder datos.

### 2. **Preview del Producto**

Vista previa de cómo se verá el producto en la tienda antes de guardarlo.

### 3. **Importación Masiva**

Permitir importar múltiples productos con variantes desde CSV/Excel.

### 4. **Templates**

Plantillas de productos comunes (Refrigeradores, Splits, Ropa, etc.) con atributos predefinidos.

### 5. **Validación de Nombres**

Verificar si ya existe un producto con el mismo nombre antes de guardar.

---

## ✅ Archivos Creados/Modificados

1. ✅ `app/admin/products/new/page.tsx` - Formulario con soporte de variantes
2. 📦 `app/admin/products/new/page-simple.tsx.bak` - Respaldo del original

**Total:** 1 archivo modificado, 1 respaldo

---

## ✅ Validación TypeScript

```bash
✓ page.tsx - 0 errores
✓ Importaciones correctas
✓ Props tipadas correctamente
✓ Callbacks con tipos explícitos
```

---

## 🎯 Próximo Paso

**PASO 6: Integrar en Página de Edición de Productos**

**Tareas:**

1. Modificar `/admin/products/[id]/edit/page.tsx`
2. Cargar variantes existentes si las hay
3. Permitir editar/agregar/eliminar variantes
4. Manejar actualización de productos con/sin variantes
5. Validar cambios de modo (simple → variantes, variantes → simple)

**Tiempo estimado:** 2 horas

---

## 📋 Checklist del Paso 5

- [x] Componente NewProductWithVariantsPage creado
- [x] Toggle "Este producto tiene variantes"
- [x] Integración condicional de VariantEditor
- [x] Ocultar precio/stock cuando hasVariants = true
- [x] Validaciones condicionales
- [x] Envío a endpoint correcto según modo
- [x] Manejo de errores parciales
- [x] Alert informativo sobre variantes
- [x] Respaldo del formulario original
- [x] Compilar sin errores TypeScript
- [x] Documentación completa

**Estado:** ✅ **COMPLETADO AL 100%**

---

## 🚀 Listo para Continuar

El formulario de creación de productos está completo y soporta tanto productos simples como productos con variantes.

**¿Continuamos con el Paso 6: Página de Edición?** ✏️

Esto permitirá editar productos existentes, incluyendo la gestión de sus variantes.
