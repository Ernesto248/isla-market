"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Category } from "@/lib/types";
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

export default function NewProductPage() {
  const router = useRouter();
  const { session } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Estado del formulario
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    stock_quantity: "",
    weight: "",
    dimensions: "",
    is_active: true,
  });

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
  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, is_active: checked }));
  };

  // Manejar carga de imágenes
  const handleImageUpload = (url: string) => {
    setUploadedImages((prev) => [...prev, url]);
  };

  // Manejar eliminación de imágenes
  const handleImageRemove = (url: string) => {
    setUploadedImages((prev) => prev.filter((img) => img !== url));
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

      const response = await fetch("/api/admin/products", {
        method: "POST",
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
          weight: formData.weight ? parseFloat(formData.weight) : null,
          dimensions: formData.dimensions || null,
          is_active: formData.is_active,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear producto");
      }

      const data = await response.json();
      toast.success("Producto creado correctamente");
      router.push("/admin/products");
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al crear el producto"
      );
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold">Nuevo Producto</h1>
          <p className="text-muted-foreground">
            Crea un nuevo producto para tu catálogo
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
                onCheckedChange={handleSwitchChange}
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

        {/* Detalles físicos */}
        <Card>
          <CardHeader>
            <CardTitle>Detalles Físicos</CardTitle>
            <CardDescription>
              Información sobre el peso y dimensiones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Peso */}
              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>

              {/* Dimensiones */}
              <div className="space-y-2">
                <Label htmlFor="dimensions">Dimensiones</Label>
                <Input
                  id="dimensions"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleChange}
                  placeholder="Ej: 10x20x5 cm"
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
                Creando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Crear Producto
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
