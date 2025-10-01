# Fix: Eliminación de Imágenes - Digital Ocean Spaces

## 🐛 Problemas Encontrados

### Problema 1: Imágenes duplicadas en UI
**Síntoma:** Al subir una imagen, aparecía duplicada en la interfaz (pero en la DB solo había una).

**Causa raíz:**
```typescript
// ❌ ANTES: Combinaba dos arrays que podían tener la misma imagen
const allImages = [
  ...existingImages.map((url) => ({ url, key: url, originalName: "Existente" })),
  ...uploadedImages,  // ← Esta imagen también estaba en existingImages
];
```

Flujo del problema:
1. Usuario sube imagen → se agrega a `uploadedImages[]` (estado interno)
2. Componente llama a `onUploadComplete(url)` 
3. Padre actualiza su estado y pasa nueva imagen en `existingImages` prop
4. Ahora la imagen está en AMBOS arrays → **duplicada en UI**

**Solución:**
```typescript
// ✅ DESPUÉS: Solo mostrar las imágenes del padre (single source of truth)
const allImages = existingImages.map((url) => ({
  url,
  key: url,
  originalName: "Existente",
}));
```

El componente `ImageUpload` ahora es **stateless** respecto a las imágenes mostradas:
- NO mantiene estado interno de imágenes
- Solo muestra las que vienen por prop (`existingImages`)
- El padre controla completamente qué imágenes se muestran

---

### Problema 2: Redirección al eliminar imagen
**Síntoma:** Al eliminar una imagen, te redirigía a `/admin/products` en lugar de quedarse en el formulario.

**Causa raíz:**
El `useEffect` que carga el producto tenía un `router.push` en el `catch` sin protección:

```typescript
// ❌ ANTES: Se ejecutaba incluso si el componente se desmontaba
useEffect(() => {
  const fetchProduct = async () => {
    try {
      // ... fetch
    } catch (error) {
      toast.error("Error al cargar el producto");
      router.push("/admin/products"); // ← Redirigía sin verificar
    }
  };
  fetchProduct();
}, [params.id, session?.access_token, router]);
```

**Solución:**
Agregamos una bandera `isMounted` para evitar actualizaciones de estado después del desmontaje:

```typescript
// ✅ DESPUÉS: Solo actualiza estado si el componente está montado
useEffect(() => {
  let isMounted = true;

  const fetchProduct = async () => {
    try {
      // ... fetch
      if (isMounted) {
        setFormData(...);
        setUploadedImages(...);
      }
    } catch (error) {
      if (isMounted) {
        toast.error("Error al cargar el producto");
        router.push("/admin/products");
      }
    }
  };

  if (session?.access_token) {
    fetchProduct();
  }

  return () => {
    isMounted = false; // Cleanup
  };
}, [params.id, session?.access_token, router]);
```

---

### Problema 3: Imagen no se eliminaba de Digital Ocean Spaces
**Síntoma:** Al eliminar una imagen de la UI, permanecía en el bucket de DO Spaces ocupando espacio.

**Causa raíz:**
El componente `ImageUpload` no llamaba al endpoint de eliminación del servidor.

**Solución:**
Modificamos `handleRemove` para:

1. **Actualizar UI inmediatamente** (mejor UX)
2. **Eliminar del servidor en segundo plano**
3. **No bloquear UI si falla la eliminación**

```typescript
const handleRemove = async (image: UploadedImage) => {
  try {
    if (!session?.access_token) {
      toast.error("Debes iniciar sesión");
      return;
    }

    // 1. Primero actualizar UI (optimistic update)
    onRemoveImage?.(image.url);

    // 2. Extraer el key del archivo desde la URL
    // URL: https://cms-next.sfo3.digitaloceanspaces.com/products/file-123.jpg
    // Key: products/file-123.jpg
    const urlParts = image.url.split(".digitaloceanspaces.com/");
    const fileKey = urlParts.length > 1 ? urlParts[1] : image.key;

    // 3. Eliminar del servidor en segundo plano
    const response = await fetch(
      `/api/admin/upload?key=${encodeURIComponent(fileKey)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Error al eliminar imagen del servidor:", error);
      toast.warning("La imagen se removió de la lista pero puede quedar en el servidor");
    } else {
      toast.success("Imagen eliminada correctamente");
    }
  } catch (error) {
    console.error("Error deleting image:", error);
    toast.warning("La imagen se removió de la lista pero puede quedar en el servidor");
  }
};
```

**Ventajas de este enfoque:**
- ✅ UI responde inmediatamente (no espera al servidor)
- ✅ Si falla la eliminación del servidor, la imagen no se guarda en DB (se pierde la referencia)
- ✅ El usuario puede seguir trabajando sin interrupciones
- ⚠️ Potencial: imágenes huérfanas en DO Spaces (se puede limpiar con job)

---

## 🔄 Flujo Completo Actualizado

### Al Subir Imagen

```
Usuario selecciona archivo
    ↓
ImageUpload.onDrop()
    ↓
POST /api/admin/upload (sube a DO Spaces)
    ↓
Recibe URL pública
    ↓
onUploadComplete(url) → llama al padre
    ↓
Padre: setUploadedImages(prev => [...prev, url])
    ↓
Padre pasa uploadedImages como existingImages prop
    ↓
ImageUpload re-renderiza mostrando nueva imagen
```

### Al Eliminar Imagen

```
Usuario hace clic en X
    ↓
ImageUpload.handleRemove(image)
    ↓
1. onRemoveImage(url) → actualiza estado del padre INMEDIATAMENTE
    ↓
   Padre: setUploadedImages(prev => prev.filter(img => img !== url))
    ↓
   UI actualizada (imagen desaparece)
    ↓
2. DELETE /api/admin/upload?key=... (en segundo plano)
    ↓
   Si OK: toast.success("Imagen eliminada correctamente")
   Si FALLA: toast.warning("...puede quedar en el servidor")
    ↓
3. Al guardar formulario, se envía array actualizado sin esa URL
    ↓
   DB actualizada con nuevas imágenes
```

---

## 📝 Cambios en el Código

### ImageUpload Component

**Archivo:** `components/admin/image-upload.tsx`

```diff
- const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  const handleRemove = async (image: UploadedImage) => {
+   // Primero, actualizar UI inmediatamente
+   onRemoveImage?.(image.url);
+
+   // Luego, eliminar del servidor
    const urlParts = image.url.split(".digitaloceanspaces.com/");
    const fileKey = urlParts.length > 1 ? urlParts[1] : image.key;

-   // Eliminar del servidor
    const response = await fetch(
      `/api/admin/upload?key=${encodeURIComponent(fileKey)}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${session.access_token}` } }
    );

    if (!response.ok) {
-     throw new Error(...);
+     console.error(...);
+     toast.warning("La imagen se removió de la lista pero puede quedar en el servidor");
+   } else {
+     toast.success("Imagen eliminada correctamente");
    }
-
-   onRemoveImage?.(image.url);
-   toast.success("Imagen eliminada correctamente");
  };

- const allImages = [
-   ...existingImages.map((url) => ({ url, key: url, originalName: "Existente" })),
-   ...uploadedImages,
- ];
+ const allImages = existingImages.map((url) => ({
+   url,
+   key: url,
+   originalName: "Existente",
+ }));
```

### Edit Product Page

**Archivo:** `app/admin/products/[id]/edit/page.tsx`

```diff
  useEffect(() => {
+   let isMounted = true;
+
    const fetchProduct = async () => {
      try {
        // ... fetch product
-       setFormData(...);
-       setUploadedImages(...);
+       if (isMounted) {
+         setFormData(...);
+         setUploadedImages(...);
+       }
      } catch (error) {
-       toast.error("Error al cargar el producto");
-       router.push("/admin/products");
+       if (isMounted) {
+         toast.error("Error al cargar el producto");
+         router.push("/admin/products");
+       }
      }
    };

    if (session?.access_token) {
      fetchProduct();
    }
+
+   return () => {
+     isMounted = false;
+   };
  }, [params.id, session?.access_token, router]);

  const handleImageRemove = (url: string) => {
+   console.log("Eliminando imagen:", url);
    setUploadedImages((prev) => {
-     return prev.filter((img) => img !== url);
+     const newImages = prev.filter((img) => img !== url);
+     console.log("Imágenes después de eliminar:", newImages);
+     return newImages;
    });
  };
```

---

## ✅ Resultados

### Antes de la mejora
- ❌ Imágenes duplicadas en UI
- ❌ Redirección inesperada al eliminar
- ❌ Imágenes quedaban en DO Spaces ocupando espacio
- ❌ Experiencia de usuario confusa

### Después de la mejora
- ✅ Una sola imagen por archivo (no duplicados)
- ✅ Permaneces en el formulario al eliminar
- ✅ Imágenes se eliminan de DO Spaces automáticamente
- ✅ UI actualizada inmediatamente (optimistic update)
- ✅ Mensajes claros de éxito/error
- ✅ No bloquea UI si falla eliminación del servidor

---

## 🚀 Próximas Mejoras (Opcional)

### 1. Job de Limpieza de Imágenes Huérfanas

Crear un cron job que elimine imágenes no referenciadas:

```typescript
// lib/cleanup-orphan-images.ts
export async function cleanupOrphanImages() {
  // 1. Listar todos los archivos en DO Spaces
  const spacesFiles = await listAllFilesInBucket("products/");
  
  // 2. Obtener todas las URLs de imágenes en la DB
  const { data: products } = await supabase
    .from("products")
    .select("images");
  
  const usedImages = products.flatMap(p => p.images || []);
  
  // 3. Encontrar imágenes huérfanas
  const orphans = spacesFiles.filter(file => {
    const fullUrl = `https://cms-next.sfo3.digitaloceanspaces.com/${file}`;
    return !usedImages.includes(fullUrl);
  });
  
  // 4. Eliminar huérfanas
  for (const orphan of orphans) {
    await deleteFromSpaces(orphan);
  }
  
  return { deleted: orphans.length };
}
```

### 2. Confirmación antes de Eliminar

Agregar diálogo de confirmación para evitar eliminaciones accidentales:

```typescript
const handleRemove = async (image: UploadedImage) => {
  const confirmed = await confirm({
    title: "¿Eliminar imagen?",
    description: "Esta acción no se puede deshacer.",
  });
  
  if (!confirmed) return;
  
  // ... resto del código
};
```

### 3. Papelera de Reciclaje

Mover imágenes eliminadas a una carpeta "trash" por 30 días antes de eliminar definitivamente:

```typescript
// En lugar de DELETE, mover a trash/
const trashKey = file.key.replace("products/", "trash/products/");
await moveFile(file.key, trashKey);

// Job nocturno elimina archivos en trash/ con más de 30 días
```

---

**Fecha de implementación:** 2025-10-01  
**Estado:** ✅ Funcional y probado  
**Build:** ✅ Exitoso
