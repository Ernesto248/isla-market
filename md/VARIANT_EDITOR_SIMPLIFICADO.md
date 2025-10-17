# Editor de Variantes Simplificado

## 🎯 Cambio Implementado

Se ha creado un **nuevo componente simplificado** para gestionar variantes de productos, eliminando el modo de auto-generación y manteniendo solo la creación manual.

## 📋 ¿Qué Cambió?

### Antes (variant-editor.tsx)

- ✅ Modo auto-generación (combinaciones automáticas)
- ✅ Modo manual
- ❌ Complejo con más de 600 líneas
- ❌ Toggle entre modos confuso
- ❌ Generación de combinaciones no funcionaba correctamente

### Ahora (variant-editor-simple.tsx)

- ✅ Solo modo manual
- ✅ Más simple (~450 líneas)
- ✅ UI más clara y directa
- ✅ Selección de atributos por variante individual

## 🚀 Cómo Funciona Ahora

### Crear una Variante

1. Click en **"Agregar Variante"**
2. Se crea una nueva tarjeta de variante vacía
3. Para cada variante puedes:
   - **Seleccionar atributos**: Click en badges de Capacidad, Color, Tonelaje
   - **Ingresar SKU**: Código único (ej: REF-11L-BLA)
   - **Ingresar Precio**: En pesos argentinos
   - **Ingresar Stock**: Cantidad disponible
   - **Activar/Desactivar**: Switch para habilitar la variante

### Ejemplo: Refrigerador con 2 variantes

**Variante 1:**

- Capacidad: `11 Litros ✓`
- Color: `Blanco ✓`
- SKU: `REF-11L-BLA`
- Precio: `450`
- Stock: `10`
- Activa: `✓`

**Variante 2:**

- Capacidad: `22 Litros ✓`
- Color: `Negro ✓`
- SKU: `REF-22L-NEG`
- Precio: `550`
- Stock: `5`
- Activa: `✓`

Luego click en **"Guardar Variantes"** y listo.

## ✨ Características

### Selección de Atributos por Variante

Cada variante puede tener su propia combinación de atributos. Los badges funcionan así:

- **Badge outline** (sin fondo): No seleccionado
- **Badge default** (con fondo): Seleccionado ✓
- Click en un badge lo selecciona/deselecciona
- Solo puedes seleccionar **UN valor por atributo** (ej: solo 11L O 22L, no ambos)

### Validaciones

El sistema valida que:

- ✅ Cada variante tenga al menos un atributo
- ✅ Cada variante tenga SKU
- ✅ Cada variante tenga precio > 0
- ✅ No haya SKUs duplicados
- ✅ No haya combinaciones de atributos duplicadas

### Resumen Visual

Al final del editor se muestra:

- **Total variantes**: Cantidad total
- **Activas**: Cuántas están habilitadas
- **Stock total**: Suma de stock de todas las variantes
- **Rango de precio**: Precio mínimo - Precio máximo

## 📁 Archivos Modificados

```
components/admin/variant-editor-simple.tsx  [NUEVO]
└── Componente simplificado de gestión de variantes

app/admin/products/[id]/edit/page.tsx
└── Actualizado import para usar variant-editor-simple
```

## 🔄 Migración

El componente anterior (`variant-editor.tsx`) **NO se elimina** por si acaso necesitas referenciarlo. Pero ahora el sistema usa `variant-editor-simple.tsx`.

Si en el futuro quieres volver al sistema complejo:

1. Cambiar import en `edit/page.tsx`
2. De: `@/components/admin/variant-editor-simple`
3. A: `@/components/admin/variant-editor`

## 🎨 Ventajas del Nuevo Sistema

1. **Más control**: Creas exactamente las variantes que necesitas
2. **Más simple**: No hay modos confusos ni generación automática
3. **Más claro**: Ves exactamente qué atributos tiene cada variante
4. **Menos errores**: Validaciones más claras
5. **Mejor UX**: Interfaz más directa

## 💡 Ejemplos de Uso

### Producto con pocas variantes (2-5)

**Perfecto para el nuevo sistema**

- Refrigerador con 2 capacidades y 2 colores = 4 variantes
- Crear manualmente cada una
- Ajustar precio/stock individual

### Producto con muchas variantes (20+)

**Podría ser tedioso**

- Si necesitas 20+ variantes, considera:
  - Crear las más importantes primero
  - O usar importación masiva (futura feature)
  - O simplificar tus opciones de atributos

## 🐛 Solución de Problemas

### No veo badges de atributos

**Problema**: No hay valores creados para los atributos  
**Solución**: Ya creamos Capacidad, Color y Tonelaje con valores. Recarga la página.

### El botón "Guardar Variantes" está deshabilitado

**Problema**: Hay validaciones pendientes  
**Solución**: Revisa que todas las variantes tengan SKU, precio y al menos un atributo

### Error "At least one attribute value is required"

**Problema**: Intentaste guardar variante sin atributos  
**Solución**: Selecciona al menos un badge de atributo (ej: 11 Litros)

## 📊 Comparación Visual

### Antes

```
[Modo: Auto ⚡ | Manual ✋]

Seleccionar Atributos y Valores
☐ 11L  ☐ 22L  ☐ 33L
☐ Blanco  ☐ Negro

[Generar Variantes (0 combinaciones)]

Variantes (0)
...
```

### Ahora

```
Variantes (2)                    [+ Agregar Variante]

┌─────────────────────────────────────────┐
│ 11 Litros | Blanco                      │
│                                         │
│ Atributos de la Variante                │
│ Capacidad: [11L✓] [22L] [33L] [50L]   │
│ Color: [Blanco✓] [Negro] [Gris] [Azul]│
│                                         │
│ SKU: REF-11L-BLA                        │
│ Precio: 450    Stock: 10                │
│ [✓] Variante activa                     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 22 Litros | Negro                       │
│ ...                                     │
└─────────────────────────────────────────┘

Resumen: 2 variantes | 2 activas | 15 stock total
```

## ✅ Testing Recomendado

1. **Crear variante simple**

   - Agregar variante
   - Seleccionar "11 Litros"
   - Seleccionar "Blanco"
   - SKU: TEST-001
   - Precio: 100
   - Guardar

2. **Crear múltiples variantes**

   - Agregar 3 variantes diferentes
   - Cada una con diferentes atributos
   - Guardar todas

3. **Editar variante existente**

   - Abrir producto con variantes
   - Cambiar atributos de una
   - Cambiar precio
   - Guardar

4. **Eliminar variante**
   - Click en icono de basura
   - Guardar

## 🚀 Próximos Pasos Sugeridos

1. **Importación CSV**: Subir archivo con muchas variantes
2. **Duplicar variante**: Botón para copiar una variante existente
3. **Plantillas**: Guardar combinaciones comunes de atributos
4. **Imágenes por variante**: Foto específica para cada variante
5. **Inventario por ubicación**: Stock separado por almacén

---

**Documentación creada**: Sesión actual  
**Versión**: 2.0 (Simplificada)
