"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Product, Category } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/admin/image-upload";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { session } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Estado del formulario
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    stock_quantity: "",
    is_active: true,
    featured: false,
  });

  // Cargar producto existente
  useEffect(() => {
    let isMounted = true; // Para evitar actualizaciones de estado si el componente se desmonta

    const fetchProduct = async () => {
      try {
        setLoadingProduct(true);
        const response = await fetch(`/api/admin/products/${params.id}`, {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Producto no encontrado");
        }

        const data = await response.json();
        const product: Product = data.product;

        if (isMounted) {
          setFormData({
            name: product.name,
            description: product.description || "",
            price: product.price.toString(),
            category_id: product.category_id,
            stock_quantity: (product.stock_quantity || 0).toString(),
            is_active: product.is_active !== false,
            featured: product.featured !== false,
          });

          setUploadedImages(product.images || []);
        }
      } catch (error) {
        console.error("Error loading product:", error);
        if (isMounted) {
          toast.error("Error al cargar el producto");
          router.push("/admin/products");
        }
      } finally {
        if (isMounted) {
          setLoadingProduct(false);
        }
      }
    };

    if (session?.access_token) {
      fetchProduct();
    }

    return () => {
      isMounted = false;
    };
  }, [params.id, session?.access_token, router]);

  // Cargar categorías
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data = await response.json();
          console.log("Categories loaded:", data.categories);
          setCategories(data.categories || []);
        } else {
          console.error("Failed to fetch categories:", response.status);
          toast.error("Error al cargar las categorías");
        }
      } catch (error) {
        console.error("Error loading categories:", error);
        toast.error("Error al cargar las categorías");
      }
    };

    fetchCategories();
  }, []);

  // Manejar cambios en el formulario
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejar cambio en el select
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejar cambio en el switch
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  // Manejar carga de imágenes
  const handleImageUpload = (url: string) => {
    setUploadedImages((prev) => [...prev, url]);
  };

  // Manejar eliminación de imágenes
  const handleImageRemove = (url: string) => {
    console.log("Eliminando imagen:", url);
    setUploadedImages((prev) => {
      const newImages = prev.filter((img) => img !== url);
      console.log("Imágenes después de eliminar:", newImages);
      return newImages;
    });
  };

  // Validar formulario
  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("El nombre es requerido");
      return false;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("El precio debe ser mayor a 0");
      return false;
    }

    if (!formData.category_id) {
      toast.error("La categoría es requerida");
      return false;
    }

    return true;
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          price: parseFloat(formData.price),
          category_id: formData.category_id,
          images: uploadedImages,
          stock_quantity: formData.stock_quantity
            ? parseInt(formData.stock_quantity)
            : 0,
          is_active: formData.is_active,
          featured: formData.featured,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar producto");
      }

      toast.success("Producto actualizado correctamente");
      router.push("/admin/products");
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al actualizar el producto"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/products")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Producto</h1>
          <p className="text-muted-foreground">
            Actualiza la información del producto
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>Datos principales del producto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Miel de Abeja Orgánica"
                required
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe el producto..."
                rows={4}
              />
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <Label htmlFor="category_id">
                Categoría <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) =>
                  handleSelectChange("category_id", value)
                }
                required
                disabled={categories.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      categories.length === 0
                        ? "Cargando categorías..."
                        : "Selecciona una categoría"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No hay categorías disponibles
                    </div>
                  ) : (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {categories.length > 0 && formData.category_id && (
                <p className="text-xs text-muted-foreground">
                  Categoría actual:{" "}
                  {categories.find((c) => c.id === formData.category_id)
                    ?.name || "No encontrada"}
                </p>
              )}
            </div>

            {/* Estado */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Estado</Label>
                <p className="text-sm text-muted-foreground">
                  ¿El producto está activo y visible para los clientes?
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  handleSwitchChange("is_active", checked)
                }
              />
            </div>

            {/* Destacado */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Destacado</Label>
                <p className="text-sm text-muted-foreground">
                  Marcar este producto como destacado en la página principal
                </p>
              </div>
              <Switch
                checked={formData.featured}
                onCheckedChange={(checked) =>
                  handleSwitchChange("featured", checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Precio e inventario */}
        <Card>
          <CardHeader>
            <CardTitle>Precio e Inventario</CardTitle>
            <CardDescription>Información de precio y stock</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Precio */}
              <div className="space-y-2">
                <Label htmlFor="price">
                  Precio (ARS) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Stock */}
              <div className="space-y-2">
                <Label htmlFor="stock_quantity">Cantidad en Stock</Label>
                <Input
                  id="stock_quantity"
                  name="stock_quantity"
                  type="number"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Imágenes */}
        <Card>
          <CardHeader>
            <CardTitle>Imágenes</CardTitle>
            <CardDescription>
              Sube hasta 5 imágenes del producto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload
              onUploadComplete={handleImageUpload}
              onRemoveImage={handleImageRemove}
              folder="products"
              maxFiles={5}
              existingImages={uploadedImages}
            />
          </CardContent>
        </Card>

        {/* Botones */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/products")}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
