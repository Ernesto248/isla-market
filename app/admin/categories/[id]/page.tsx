"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Category } from "@/lib/types";

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params?.id as string;
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form data
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isActive, setIsActive] = useState(true);

  // Redirigir si no está autenticado o no es admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Cargar datos de la categoría
  useEffect(() => {
    const loadCategory = async () => {
      if (!categoryId || !user || user.role !== "admin") return;

      try {
        setLoading(true);
        const response = await fetch(`/api/categories/${categoryId}`);
        const data: Category = await response.json();

        if (!response.ok) {
          throw new Error("Error al cargar la categoría");
        }

        setName(data.name);
        setDescription(data.description || "");
        setSlug(data.slug);
        setImageUrl(data.image_url || "");
        setIsActive(data.is_active ?? true);
      } catch (error) {
        console.error("Error loading category:", error);
        toast.error("Error al cargar la categoría");
        router.push("/admin/categories");
      } finally {
        setLoading(false);
      }
    };

    loadCategory();
  }, [categoryId, user, router]);

  // Auto-generar slug desde el nombre
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleNameChange = (value: string) => {
    setName(value);
  };

  // Handle image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload image to Digital Ocean Spaces
  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return imageUrl || null;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("folder", "categories");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error al subir la imagen");
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error al subir la imagen");
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Update category
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    if (!slug.trim()) {
      toast.error("El slug es requerido");
      return;
    }

    try {
      setSaving(true);

      // Upload image if selected
      let finalImageUrl = imageUrl;
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }

      // Update category
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          slug: slug.trim(),
          image_url: finalImageUrl || null,
          is_active: isActive,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar la categoría");
      }

      toast.success("Categoría actualizada exitosamente");
      router.push("/admin/categories");
    } catch (error: any) {
      console.error("Error updating category:", error);
      toast.error(error.message || "Error al actualizar la categoría");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading || !user || user.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/admin/categories")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Editar Categoría
          </h1>
          <p className="text-muted-foreground mt-1">
            Actualiza la información de la categoría
          </p>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información de la Categoría</CardTitle>
            <CardDescription>
              Actualiza los campos que desees modificar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ej: Electrónica"
                required
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">
                Slug <span className="text-destructive">*</span>
              </Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Ej: electronica"
                required
              />
              <p className="text-xs text-muted-foreground">
                URL amigable. Evita cambiarla si ya existen productos con esta
                categoría.
              </p>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción breve de la categoría..."
                rows={3}
              />
            </div>

            {/* Imagen */}
            <div className="space-y-2">
              <Label htmlFor="image">Imagen</Label>
              {imagePreview || imageUrl ? (
                <div className="relative w-full h-48 border rounded-md overflow-hidden">
                  <img
                    src={imagePreview || imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview("");
                      setImageUrl("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-md p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <Label
                    htmlFor="image-upload"
                    className="cursor-pointer text-sm text-primary hover:underline"
                  >
                    Haz clic para subir una imagen
                  </Label>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG, JPG, GIF hasta 10MB
                  </p>
                </div>
              )}
            </div>

            {/* Estado Activo */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is-active">Estado Activo</Label>
                <p className="text-xs text-muted-foreground">
                  Las categorías inactivas no se muestran en la tienda
                </p>
              </div>
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/categories")}
            disabled={saving || uploading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || uploading}>
            {saving || uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {uploading ? "Subiendo imagen..." : "Guardando..."}
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
