# 🚀 Guía Rápida: Gestión de Variantes

## Para Administradores

### 📝 ¿Qué son las variantes?

Las variantes permiten vender el **mismo producto en diferentes configuraciones**. Por ejemplo:

**Producto:** Refrigerador EKO  
**Variantes:**

- 11 Litros - Blanco - $450
- 11 Litros - Negro - $450
- 22 Litros - Blanco - $550
- 22 Litros - Negro - $550

Cada variante puede tener:

- ✅ SKU único
- ✅ Precio diferente
- ✅ Stock independiente
- ✅ Atributos específicos (color, tamaño, capacidad, etc.)

---

## 🎯 Casos de Uso

### 1️⃣ Crear un Producto Nuevo con Variantes

1. Ir a **Admin → Productos → Crear Nuevo Producto**
2. Llenar información básica (nombre, descripción, categoría, imágenes)
3. **NO** llenar precio ni stock
4. Click en "Habilitar Variantes"
5. En el editor de variantes:
   - **Opción A - Auto-generación:**
     - Seleccionar atributos (ej: Capacidad, Color)
     - Click "Generar Combinaciones"
     - Ajustar precios y stock para cada combinación
   - **Opción B - Manual:**
     - Click "Agregar Variante Manual"
     - Ingresar SKU, precio, stock
     - Seleccionar valores de atributos
6. Click "Guardar Variantes"
7. Click "Crear Producto"

---

### 2️⃣ Agregar Variantes a un Producto Existente

**Ejemplo:** Tienes "Camiseta Básica" sin variantes, quieres agregar tallas y colores

1. Ir a **Admin → Productos**
2. Click en el producto
3. Click "Editar"
4. Click "Habilitar Variantes"
5. En el editor:
   - Seleccionar atributos: Talla (S, M, L, XL) y Color (Rojo, Azul, Negro)
   - Click "Generar Combinaciones" → Se crean 12 variantes automáticamente
   - Ajustar precio y stock para cada una
6. Click "Guardar Variantes"
7. Click "Guardar Cambios"

**⚠️ Nota:** Una vez habilitadas las variantes, el precio y stock del producto base ya no se usan.

---

### 3️⃣ Editar Variantes Existentes

**Ejemplo:** Cambiar el precio de la variante "11 Litros" de $450 a $500

1. Ir a **Admin → Productos**
2. Click en el producto (verás badge `[X var]`)
3. Click "Editar"
4. En el alert "Producto con Variantes", click "Gestionar Variantes"
5. En el editor, modificar:
   - Precio de variante específica
   - Stock
   - SKU
   - Activar/desactivar variante
6. Click "Guardar Variantes"

---

### 4️⃣ Eliminar Variantes

1. Abrir editor de variantes (pasos 1-4 del caso anterior)
2. Click en el ícono de eliminar (🗑️) en la variante
3. Click "Guardar Variantes"

**Comportamiento:**

- **Si la variante NO tiene órdenes:** Se elimina permanentemente
- **Si la variante tiene órdenes:** Se desactiva (soft delete) para mantener historial

---

### 5️⃣ Ver Información de Variantes

**En la lista de productos:**

- Badge muestra cantidad: `[3 var]`
- Precio muestra rango: `$400.00 - $600.00`
- Stock muestra suma de todas las variantes activas

**En la página de edición:**

- Alert muestra cada variante con:
  - SKU
  - Atributos (ej: "11 Litros | Blanco")
  - Precio
  - Stock disponible

---

## 🛠️ Modo Auto-generación vs Manual

### Auto-generación (Recomendado para muchas variantes)

**Cuándo usar:**

- Producto con múltiples atributos
- Todas las combinaciones son válidas
- Ejemplo: Ropa (Tallas × Colores), Botellas (Capacidades × Materiales)

**Pasos:**

1. Seleccionar atributos (ej: Talla, Color)
2. Seleccionar valores para cada atributo
3. Click "Generar Combinaciones"
4. Se crean todas las combinaciones automáticamente
5. Ajustar precios/stock según necesites

**Ejemplo:**

- Atributos: Talla (S, M, L) × Color (Rojo, Azul)
- Resultado: 6 variantes (S-Rojo, S-Azul, M-Rojo, M-Azul, L-Rojo, L-Azul)

### Modo Manual (Recomendado para pocas variantes)

**Cuándo usar:**

- Solo algunas combinaciones son válidas
- Pocas variantes (1-5)
- Ejemplo: Refrigerador solo en 11L y 22L (no todas las combinaciones)

**Pasos:**

1. Click "Agregar Variante Manual"
2. Llenar formulario:
   - SKU (único)
   - Precio
   - Stock
   - Seleccionar atributos
3. Repetir para cada variante

---

## ⚠️ Validaciones Importantes

El sistema **NO permite**:

❌ **SKUs duplicados**

- Cada variante debe tener un SKU único
- Ejemplo: No puedes tener dos variantes con SKU "REF-11L"

❌ **Precios inválidos**

- Precio debe ser mayor a 0
- Precio debe ser numérico

❌ **Combinaciones duplicadas**

- No puedes tener dos variantes con los mismos atributos
- Ejemplo: No puedes tener dos variantes "11L - Blanco"

❌ **Stock negativo**

- Stock debe ser 0 o mayor

---

## 💡 Consejos y Mejores Prácticas

### SKUs Informativos

**❌ Malo:** VAR1, VAR2, VAR3  
**✅ Bueno:** REF-11L-BLA, REF-22L-BLA, REF-11L-NEG

### Precios Estratégicos

- Variantes "premium" (colores especiales, tamaños grandes) pueden tener precio mayor
- Usa la columna de precio para diferenciar

### Gestión de Stock

- Desactiva variantes sin stock en lugar de eliminarlas
- Mantiene historial de órdenes
- Puedes reactivar cuando vuelva el stock

### Atributos Consistentes

**Ejemplo de Refrigeradores:**

- ✅ Usar siempre "Capacidad" (no mezclar con "Tamaño" o "Litros")
- ✅ Valores: "11 Litros", "22 Litros", "33 Litros"

### Nombres de Producto

**❌ Malo:** "Refrigerador 11L Blanco"  
**✅ Bueno:** "Refrigerador EKO" con variantes de capacidad y color

El nombre del producto debe ser genérico, las variantes especifican los detalles.

---

## 🔍 Resolución de Problemas

### El producto muestra $0.00 en la lista

**Causa:** Producto tiene variantes pero el precio base no se actualizó  
**Solución:** Normal, el sistema mostrará el rango de precios de las variantes automáticamente

### No puedo guardar las variantes

**Posibles causas:**

1. **SKU duplicado:** Revisa que todos los SKUs sean únicos
2. **Precio vacío:** Todas las variantes deben tener precio
3. **Combinación duplicada:** No puedes tener dos variantes iguales

### El botón "Gestionar Variantes" no aparece

**Causa:** El producto no está en modo variantes  
**Solución:** Click en "Habilitar Variantes" primero

### Eliminé una variante pero sigue apareciendo

**Causa:** La variante tiene órdenes asociadas, se desactivó en lugar de eliminarse  
**Solución:** Normal, esto mantiene el historial. La variante no será visible para clientes.

---

## 📊 Ejemplo Completo: Refrigerador

### Configuración Inicial

**Producto Base:**

- Nombre: Refrigerador EKO
- Descripción: Refrigerador compacto ideal para oficinas
- Categoría: Electrodomésticos
- Imágenes: [foto1.jpg, foto2.jpg]

### Atributos

**Capacidad:**

- 11 Litros
- 22 Litros

**Color:**

- Blanco
- Negro

### Variantes Generadas (Auto-generación)

| SKU         | Capacidad | Color  | Precio | Stock |
| ----------- | --------- | ------ | ------ | ----- |
| REF-11L-BLA | 11 Litros | Blanco | $450   | 10    |
| REF-11L-NEG | 11 Litros | Negro  | $450   | 8     |
| REF-22L-BLA | 22 Litros | Blanco | $550   | 5     |
| REF-22L-NEG | 22 Litros | Negro  | $550   | 5     |

### Resultado en Admin

- Lista de productos muestra: "Refrigerador EKO | $450.00 - $550.00 | [4 var] | 28 unidades"
- Clientes pueden seleccionar capacidad y color
- Stock se gestiona independientemente por variante

---

## 🎓 Preguntas Frecuentes

**P: ¿Puedo convertir un producto con variantes en producto simple?**  
R: Actualmente no desde la UI. Contacta soporte técnico.

**P: ¿Puedo tener diferentes imágenes para cada variante?**  
R: Próximamente. Por ahora todas las variantes comparten las imágenes del producto base.

**P: ¿Cuántas variantes puedo tener por producto?**  
R: No hay límite técnico, pero recomendamos máximo 50 para mejor UX.

**P: ¿Se puede importar variantes desde Excel?**  
R: Próximamente. Por ahora usa auto-generación para muchas variantes.

**P: ¿Qué pasa con las órdenes si elimino una variante?**  
R: Las órdenes se mantienen. La variante se desactiva pero no se borra.

**P: ¿Puedo cambiar los atributos de una variante después de crearla?**  
R: Sí, desde el editor de variantes puedes cambiar cualquier campo.

---

## 📞 Soporte

Si encuentras algún problema:

1. Revisa esta guía
2. Consulta la documentación técnica en `md/VARIANT_MANAGEMENT_IMPLEMENTATION.md`
3. Contacta al equipo de desarrollo

---

**Última actualización:** Sesión actual  
**Versión:** 1.0
