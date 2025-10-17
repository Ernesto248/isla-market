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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageUpload } from "@/components/admin/image-upload";
import {
  VariantEditor,
  type VariantData,
} from "@/components/admin/variant-editor-simple";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, Info } from "lucide-react";
import { toast } from "sonner";

export default function NewProductWithVariantsPage() {
  const router = useRouter();
  const { session } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<VariantData[]>([]);

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

  // Cargar categorías
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        } else {
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

  // Manejar toggle de variantes
  const handleHasVariantsChange = (checked: boolean) => {
    setHasVariants(checked);
    if (!checked) {
      setVariants([]);
    }
  };

  // Manejar cambios en variantes
  const handleVariantsChange = (newVariants: VariantData[]) => {
    setVariants(newVariants);
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

    if (!formData.category_id) {
      toast.error("La categoría es requerida");
      return false;
    }

    // Validaciones específicas según si tiene variantes o no
    if (hasVariants) {
      if (variants.length === 0) {
        toast.error("Debes crear al menos una variante");
        return false;
      }

      // Verificar que todas las variantes tengan nombre
      const withoutName = variants.filter(
        (v) => !v.variant_name || v.variant_name.trim() === ""
      );
      if (withoutName.length > 0) {
        toast.error(
          "Todas las variantes deben tener un nombre (ej: 11 Litros, 1 Tonelada)"
        );
        return false;
      }

      // Verificar que todas las variantes tengan precio
      const withoutPrice = variants.filter((v) => !v.price || v.price <= 0);
      if (withoutPrice.length > 0) {
        toast.error("Todas las variantes deben tener un precio válido");
        return false;
      }

      // Verificar que todas las variantes tengan SKU
      const withoutSku = variants.filter((v) => !v.sku || v.sku.trim() === "");
      if (withoutSku.length > 0) {
        toast.error("Todas las variantes deben tener un SKU");
        return false;
      }

      // Verificar SKUs duplicados
      const skus = variants.map((v) => v.sku).filter(Boolean);
      const duplicateSkus = skus.filter(
        (sku, index) => skus.indexOf(sku) !== index
      );
      if (duplicateSkus.length > 0) {
        toast.error("Hay SKUs duplicados en las variantes");
        return false;
      }
    } else {
      // Producto simple - requiere precio
      if (!formData.price || parseFloat(formData.price) <= 0) {
        toast.error("El precio debe ser mayor a 0");
        return false;
      }
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

      if (hasVariants) {
        // Paso 1: Crear el producto con has_variants=true y price=0
        const productResponse = await fetch("/api/admin/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description || null,
            price: 0, // Precio base en 0 para productos con variantes
            category_id: formData.category_id,
            images: uploadedImages,
            stock_quantity: 0,
            is_active: formData.is_active,
            featured: formData.featured,
            has_variants: true, // Indicar que tiene variantes
          }),
        });

        if (!productResponse.ok) {
          const error = await productResponse.json();
          throw new Error(error.error || "Error al crear producto");
        }

        const productData = await productResponse.json();
        const productId = productData.id;

        // Paso 2: Crear las variantes
        let variantsCreated = 0;
        const variantErrors = [];

        for (const variant of variants) {
          try {
            const variantResponse = await fetch(
              `/api/admin/products/${productId}/variants`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({
                  sku: variant.sku,
                  price: variant.price,
                  stock_quantity: variant.stock_quantity,
                  is_active:
                    variant.is_active !== undefined ? variant.is_active : true,
                  attribute_value_ids: variant.attribute_value_ids || [],
                  variant_name: variant.variant_name || null,
                  color: variant.color || null,
                  attributes_display: variant.attributes_display || null,
                }),
              }
            );

            if (variantResponse.ok) {
              variantsCreated++;
            } else {
              const error = await variantResponse.json();
              variantErrors.push(`${variant.sku}: ${error.error}`);
            }
          } catch (error) {
            variantErrors.push(
              `${variant.sku}: ${
                error instanceof Error ? error.message : "Error desconocido"
              }`
            );
          }
        }

        // Mostrar resultado
        if (variantErrors.length > 0) {
          toast.warning(
            `Producto creado. ${variantsCreated} de ${variants.length} variantes creadas correctamente.`
          );
          console.error("Errores al crear variantes:", variantErrors);
        } else {
          toast.success("Producto con variantes creado correctamente");
        }

        router.push("/admin/products");
      } else {
        // Crear producto simple usando endpoint normal
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
            is_active: formData.is_active,
            featured: formData.featured,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Error al crear producto");
        }

        toast.success("Producto creado correctamente");
        router.push("/admin/products");
      }
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
                placeholder="Ej: Refrigerador EcoFrost X"
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

        {/* Tipo de Producto: Simple o con Variantes */}
        <Card>
          <CardHeader>
            <CardTitle>Tipo de Producto</CardTitle>
            <CardDescription>
              Define si este producto tiene variantes (tallas, colores,
              capacidades, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="has-variants">
                  Este producto tiene variantes
                </Label>
                <p className="text-sm text-muted-foreground">
                  Productos como refrigeradores con diferentes capacidades,
                  splits con diferentes tonelajes, etc.
                </p>
              </div>
              <Switch
                id="has-variants"
                checked={hasVariants}
                onCheckedChange={handleHasVariantsChange}
              />
            </div>

            {hasVariants && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Al activar variantes, el precio y stock se definirán
                  individualmente para cada variante. Las imágenes del producto
                  se compartirán entre todas las variantes.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Precio e inventario (solo para productos simples) */}
        {!hasVariants && (
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
        )}

        {/* Editor de variantes (solo si hasVariants = true) */}
        {hasVariants && (
          <VariantEditor onChange={handleVariantsChange} disabled={loading} />
        )}

        {/* Imágenes */}
        <Card>
          <CardHeader>
            <CardTitle>Imágenes</CardTitle>
            <CardDescription>
              {hasVariants
                ? "Sube imágenes del producto. Se compartirán entre todas las variantes."
                : "Sube hasta 5 imágenes del producto"}
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
