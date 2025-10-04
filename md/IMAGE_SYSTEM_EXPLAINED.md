# Sistema de Gestión de Imágenes - Explicación Detallada

## 📸 Cómo Funciona Actualmente

### Flujo Completo de Imágenes

#### 1. **Crear Producto (Nuevo)**

```
Usuario sube imágenes
    ↓
ImageUpload component
    ↓
Cada imagen se sube a Digital Ocean Spaces
    ↓
URLs se guardan en uploadedImages[] state
    ↓
Al guardar producto → images: uploadedImages
    ↓
Se guarda en DB como array de URLs
```

**Ejemplo en DB:**

```json
{
  "id": "123",
  "name": "Miel Orgánica",
  "images": [
    "https://cms-next.sfo3.digitaloceanspaces.com/products/miel-123456-abc.jpg",
    "https://cms-next.sfo3.digitaloceanspaces.com/products/miel-123457-def.jpg",
    "https://cms-next.sfo3.digitaloceanspaces.com/products/miel-123458-ghi.jpg"
  ]
}
```

#### 2. **Editar Producto (Existente)**

**Antes de la mejora:**

```
❌ Problema: Las imágenes existentes no se podían eliminar
❌ El botón de eliminar estaba deshabilitado para existingImages
❌ Solo se podían eliminar imágenes recién subidas en esta sesión
```

**Después de la mejora:**

```
✅ Ahora se pueden eliminar TODAS las imágenes
✅ Distinción entre imágenes existentes y nuevas
✅ Las existentes se marcan para eliminación (no se borran del servidor hasta guardar)
✅ Las nuevas se eliminan inmediatamente del servidor
```

### Tipos de Eliminación

#### A) **Eliminar Imagen Recién Subida** (en la sesión actual)

```typescript
1. Usuario sube imagen → Se guarda en uploadedImages[]
2. Usuario hace clic en X
3. Se elimina del servidor (Digital Ocean Spaces) INMEDIATAMENTE
4. Se elimina del estado local uploadedImages[]
5. onRemoveImage(url) notifica al padre
```

#### B) **Eliminar Imagen Existente** (ya en DB)

```typescript
1. Imagen viene de existingImages[] (desde la DB)
2. Usuario hace clic en X
3. NO se elimina del servidor todavía
4. onRemoveImage(url) notifica al padre para actualizar su estado
5. Al guardar el formulario, el nuevo array de imágenes se envía
6. La DB se actualiza con el nuevo array (sin la imagen eliminada)
7. La imagen vieja queda huérfana en Digital Ocean Spaces*
```

\*Nota: Podrías implementar un job de limpieza más adelante para eliminar imágenes huérfanas.

## 🔄 Flujo de Estados

### En el Componente ImageUpload

```typescript
// Estado interno
const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

// Props recibidas
existingImages: string[]  // URLs desde la DB
onUploadComplete: (url) => void  // Callback cuando se sube
onRemoveImage: (url) => void  // Callback cuando se elimina

// Array combinado para mostrar
const allImages = [
  ...existingImages.map(url => ({ url, key: url, originalName: "Existente" })),
  ...uploadedImages
];
```

### En el Formulario de Edición (edit/page.tsx)

```typescript
// Estado del formulario
const [uploadedImages, setUploadedImages] = useState<string[]>([]);

// Al cargar el producto
useEffect(() => {
  const product = await fetch(...);
  setUploadedImages(product.images || []);  // Carga imágenes existentes
}, []);

// Cuando se sube una nueva imagen
const handleImageUpload = (url: string) => {
  setUploadedImages(prev => [...prev, url]);  // Agrega al array
};

// Cuando se elimina una imagen
const handleImageRemove = (url: string) => {
  setUploadedImages(prev => prev.filter(img => img !== url));  // Elimina del array
};

// Al guardar
const response = await fetch('/api/admin/products/[id]', {
  method: 'PUT',
  body: JSON.stringify({
    images: uploadedImages  // Envía el array completo actualizado
  })
});
```

## 🎯 Casos de Uso

### Caso 1: Producto con 3 imágenes, quiero agregar 2 más

```
Estado inicial: [img1.jpg, img2.jpg, img3.jpg]
    ↓
Usuario sube img4.jpg → [img1, img2, img3, img4]
Usuario sube img5.jpg → [img1, img2, img3, img4, img5]
    ↓
Guardar → DB: [img1, img2, img3, img4, img5] ✅
```

### Caso 2: Producto con 5 imágenes, quiero eliminar 2

```
Estado inicial: [img1.jpg, img2.jpg, img3.jpg, img4.jpg, img5.jpg]
    ↓
Usuario elimina img2 → [img1, img3, img4, img5]
Usuario elimina img4 → [img1, img3, img5]
    ↓
Guardar → DB: [img1, img3, img5] ✅
Servidor: img2 y img4 quedan huérfanas (no se usan pero existen)
```

### Caso 3: Producto con 3 imágenes, elimino 1 y agrego 2

```
Estado inicial: [img1.jpg, img2.jpg, img3.jpg]
    ↓
Usuario elimina img2 → [img1, img3]
Usuario sube img4.jpg → [img1, img3, img4]
Usuario sube img5.jpg → [img1, img3, img4, img5]
    ↓
Guardar → DB: [img1, img3, img4, img5] ✅
```

## 🛡️ Validaciones

### En ImageUpload Component

```typescript
// Límite de imágenes
const totalImages = existingImages.length + uploadedImages.length + acceptedFiles.length;
if (totalImages > maxFiles) {
  toast.error(`Solo puedes subir hasta ${maxFiles} imágenes`);
  return;
}

// Tipo de archivo
accept: {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
}

// Tamaño máximo
maxSize: 5 * 1024 * 1024 // 5MB
```

## 📊 Estructura de Datos

### En Digital Ocean Spaces

```
Bucket: cms-next
Carpeta: products/
Archivos:
  - miel-1696234567-abc123.jpg
  - miel-1696234568-def456.jpg
  - miel-1696234569-ghi789.jpg

URL Pública:
https://cms-next.sfo3.digitaloceanspaces.com/products/miel-1696234567-abc123.jpg
```

### En Base de Datos (PostgreSQL/Supabase)

```sql
-- Tabla products
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  price DECIMAL(10,2),
  category_id UUID,
  images TEXT[],  -- Array de URLs ← AQUÍ
  stock_quantity INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Ejemplo de registro
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Miel de Abeja Orgánica",
  "images": [
    "https://cms-next.sfo3.digitaloceanspaces.com/products/miel-1696234567-abc123.jpg",
    "https://cms-next.sfo3.digitaloceanspaces.com/products/miel-1696234568-def456.jpg",
    "https://cms-next.sfo3.digitaloceanspaces.com/products/miel-1696234569-ghi789.jpg"
  ]
}
```

## 🔍 Debugging

### Ver qué imágenes tiene un producto

**En el formulario de edición:**

```javascript
console.log("Imágenes existentes:", existingImages);
console.log("Imágenes en formulario:", uploadedImages);
```

**En la API:**

```javascript
const { data: product } = await supabase
  .from("products")
  .select("id, name, images")
  .eq("id", productId)
  .single();

console.log("Imágenes en DB:", product.images);
```

**En Digital Ocean Spaces:**

- Ve al panel de DO Spaces
- Bucket: cms-next
- Carpeta: products/
- Verás todos los archivos subidos

## 🎨 UI/UX

### Indicadores Visuales

```tsx
// Imagen existente
<Card>
  <img src={existingImage} />
  <Button onClick={removeExisting}>
    <X /> {/* Se puede eliminar */}
  </Button>
  <p className="text-xs">Existente</p>
</Card>

// Imagen nueva (recién subida)
<Card>
  <img src={newImage} />
  <Button onClick={removeNew}>
    <X /> {/* Se elimina del servidor */}
  </Button>
  <p className="text-xs">{fileName}</p>
</Card>
```

### Toast Notifications

```typescript
// Al subir
toast.success("3 imágenes subidas correctamente");

// Al eliminar existente
toast.success("Imagen marcada para eliminación");

// Al eliminar nueva
toast.success("Imagen eliminada correctamente");

// Al guardar
toast.success("Producto actualizado correctamente");
```

## 🚀 Mejoras Futuras (Opcional)

### 1. Limpieza de Imágenes Huérfanas

```typescript
// Job nocturno que busca imágenes en DO Spaces
// que no están referenciadas en ningún producto
async function cleanOrphanImages() {
  const spacesImages = await listAllImagesInSpaces();
  const dbImages = await getAllProductImages();

  const orphans = spacesImages.filter((img) => !dbImages.includes(img));

  for (const orphan of orphans) {
    await deleteFromSpaces(orphan);
  }
}
```

### 2. Orden de Imágenes

```typescript
// Permitir arrastrar y soltar para reordenar
<DndContext onDragEnd={handleDragEnd}>
  <SortableContext items={images}>
    {images.map((img) => (
      <SortableImage key={img} url={img} />
    ))}
  </SortableContext>
</DndContext>
```

### 3. Imagen Principal

```typescript
// Marcar la primera imagen como principal
const mainImage = images[0];

// O agregar campo is_main en el array
images: [
  { url: "img1.jpg", is_main: true },
  { url: "img2.jpg", is_main: false },
];
```

## ✅ Checklist de Funcionalidad

- [x] Subir múltiples imágenes (hasta 5)
- [x] Vista previa de imágenes
- [x] Eliminar imágenes recién subidas
- [x] Eliminar imágenes existentes
- [x] Validación de tipo de archivo
- [x] Validación de tamaño (5MB)
- [x] Validación de cantidad máxima
- [x] Toast notifications
- [x] Loading states
- [x] Drag & drop
- [x] Responsive design
- [x] URLs públicas en Digital Ocean Spaces
- [x] Array de imágenes en base de datos

---

**Fecha de implementación:** 2025-10-01  
**Estado:** ✅ Funcional y probado
