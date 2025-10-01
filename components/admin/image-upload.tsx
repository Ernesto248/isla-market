"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

interface ImageUploadProps {
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: string) => void;
  folder?: string;
  maxFiles?: number;
  existingImages?: string[];
  onRemoveImage?: (url: string) => void;
}

interface UploadedImage {
  url: string;
  key: string;
  originalName: string;
}

export function ImageUpload({
  onUploadComplete,
  onUploadError,
  folder = "products",
  maxFiles = 5,
  existingImages = [],
  onRemoveImage,
}: ImageUploadProps) {
  const { session } = useAuth();
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!session?.access_token) {
        toast.error("Debes iniciar sesión para subir imágenes");
        return;
      }

      // Validar número máximo de archivos
      const currentImageCount = existingImages.length;
      if (currentImageCount + acceptedFiles.length > maxFiles) {
        toast.error(`Solo puedes subir hasta ${maxFiles} imágenes`);
        return;
      }

      setUploading(true);

      try {
        // Subir cada archivo
        const uploadPromises = acceptedFiles.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", folder);

          const response = await fetch("/api/admin/upload", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Error al subir imagen");
          }

          return await response.json();
        });

        const results = await Promise.all(uploadPromises);

        // Notificar al componente padre sobre cada imagen subida
        // El padre se encargará de agregarlas a su estado
        results.forEach((result) => {
          onUploadComplete?.(result.url);
        });

        toast.success(
          `${results.length} imagen${results.length > 1 ? "es" : ""} subida${
            results.length > 1 ? "s" : ""
          } correctamente`
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error al subir imágenes";
        toast.error(errorMessage);
        onUploadError?.(errorMessage);
      } finally {
        setUploading(false);
      }
    },
    [
      session,
      folder,
      maxFiles,
      existingImages.length,
      onUploadComplete,
      onUploadError,
    ]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "image/gif": [".gif"],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: uploading,
    multiple: maxFiles > 1,
  });

  const handleRemove = async (image: UploadedImage) => {
    try {
      if (!session?.access_token) {
        toast.error("Debes iniciar sesión");
        return;
      }

      // Primero, notificar al componente padre para actualizar UI inmediatamente
      onRemoveImage?.(image.url);

      // Luego, eliminar del servidor (Digital Ocean Spaces) en segundo plano
      // Extraer el key del archivo desde la URL
      // URL: https://cms-next.sfo3.digitaloceanspaces.com/products/file-123.jpg
      // Key: products/file-123.jpg
      const urlParts = image.url.split(".digitaloceanspaces.com/");
      const fileKey = urlParts.length > 1 ? urlParts[1] : image.key;

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
        // No lanzamos error aquí para no afectar la UI
        // La imagen ya se removió del estado y no se guardará en la DB
        toast.warning(
          "La imagen se removió de la lista pero puede quedar en el servidor"
        );
      } else {
        toast.success("Imagen eliminada correctamente");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al eliminar imagen";
      console.error("Error deleting image:", error);
      // La imagen ya se removió del estado, así que solo mostramos warning
      toast.warning(
        "La imagen se removió de la lista pero puede quedar en el servidor"
      );
    }
  };

  // Mostrar solo las imágenes que vienen del padre (existingImages)
  // El padre maneja todo el estado de las imágenes
  const allImages = existingImages.map((url) => ({
    url,
    key: url,
    originalName: "Existente",
  }));

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <Card
        {...getRootProps()}
        className={`border-2 border-dashed p-6 transition-colors cursor-pointer ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Subiendo imágenes...
              </p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {isDragActive
                    ? "Suelta las imágenes aquí"
                    : "Arrastra imágenes aquí o haz clic para seleccionar"}
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, WebP o GIF (máximo 5MB)
                </p>
                <p className="text-xs text-muted-foreground">
                  Máximo {maxFiles} imagen{maxFiles > 1 ? "es" : ""}
                </p>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Preview de imágenes */}
      {allImages.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {allImages.map((image, index) => (
            <Card key={image.key} className="relative group overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={image.url}
                  alt={image.originalName}
                  className="w-full h-full object-cover"
                />
                {/* Overlay con botón de eliminar */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemove(image)}
                    className="h-8 w-8"
                    title="Eliminar imagen"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-2 bg-muted">
                <p className="text-xs truncate" title={image.originalName}>
                  {image.originalName}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {allImages.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay imágenes cargadas</p>
        </div>
      )}
    </div>
  );
}
