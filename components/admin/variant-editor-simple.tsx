"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Plus, AlertCircle } from "lucide-react";
import type {
  ProductAttribute,
  ProductAttributeValue,
  ProductVariant,
} from "@/lib/types";

interface VariantEditorProps {
  productId?: string;
  initialVariants?: ProductVariant[];
  onChange: (variants: VariantData[]) => void;
  disabled?: boolean;
}

export interface VariantData {
  id?: string;
  attribute_value_ids: string[]; // Se mantendrá vacío en el nuevo sistema
  sku?: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  // Nuevos campos para sistema simplificado
  variant_name?: string; // ej: "11 Litros", "1 Tonelada"
  color?: string; // ej: "Blanco", "Negro"
  attributes_display?: string; // ej: "11 Litros • Blanco"
  _displayName?: string;
  _attributeValues?: { attributeName: string; value: string }[];
}

export function VariantEditor({
  productId,
  initialVariants,
  onChange,
  disabled = false,
}: VariantEditorProps) {
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [variants, setVariants] = useState<VariantData[]>([]);
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar atributos disponibles
  useEffect(() => {
    async function loadAttributes() {
      try {
        setIsLoadingAttributes(true);
        const response = await fetch(
          "/api/admin/attributes?include_values=true&active_only=true"
        );

        if (!response.ok) {
          throw new Error("Failed to load attributes");
        }

        const data = await response.json();
        setAttributes(data);
        setError(null);
      } catch (err) {
        console.error("Error loading attributes:", err);
        setError(
          "No se pudieron cargar los atributos. Por favor, recarga la página."
        );
      } finally {
        setIsLoadingAttributes(false);
      }
    }

    loadAttributes();
  }, []);

  // Cargar variantes iniciales si existen
  useEffect(() => {
    if (initialVariants && initialVariants.length > 0) {
      const variantData: VariantData[] = initialVariants.map((variant) => {
        // Extraer los nuevos campos del sistema simplificado
        const variantAny = variant as any;
        const variantName = variantAny.variant_name || "";
        const color = variantAny.color || "";
        const attributesDisplay = variantAny.attributes_display || "";

        // Generar display name
        let displayName = "";
        if (variantName && color) {
          displayName = `${variantName} - ${color}`;
        } else if (variantName) {
          displayName = variantName;
        } else if (attributesDisplay) {
          displayName = attributesDisplay;
        } else {
          displayName = getVariantDisplayName(variant);
        }

        return {
          id: variant.id,
          attribute_value_ids:
            variant.attribute_values?.map((a: ProductAttributeValue) => a.id) ||
            [],
          sku: variant.sku || "",
          price: variant.price,
          stock_quantity: variant.stock_quantity,
          is_active: variant.is_active,
          // Incluir los nuevos campos del sistema simplificado
          variant_name: variantName,
          color: color,
          attributes_display: attributesDisplay,
          _displayName: displayName,
          _attributeValues: variant.attribute_values?.map(
            (a: ProductAttributeValue) => ({
              attributeName: a.attribute?.display_name || "",
              value: a.value,
            })
          ),
        };
      });

      setVariants(variantData);
    }
  }, [initialVariants]);

  // Obtener nombre descriptivo de variante
  const getVariantDisplayName = (variant: any): string => {
    if (variant.attribute_values && variant.attribute_values.length > 0) {
      return variant.attribute_values.map((av: any) => av.value).join(" | ");
    }
    return variant.sku || "Variante";
  };

  // Agregar nueva variante vacía
  const addVariant = () => {
    const newVariant: VariantData = {
      attribute_value_ids: [],
      sku: "",
      variant_name: "",
      color: "",
      price: 0,
      stock_quantity: 0,
      is_active: true,
      _displayName: "Nueva variante",
      _attributeValues: [],
    };

    const newVariants = [...variants, newVariant];
    setVariants(newVariants);
    onChange(newVariants);
  };

  // Eliminar variante
  const removeVariant = (index: number) => {
    const newVariants = variants.filter((_, i) => i !== index);
    setVariants(newVariants);
    onChange(newVariants);
  };

  // Generar SKU automático
  const generateSKU = (variantName: string, color: string) => {
    let sku = "VAR";

    if (variantName) {
      // Limpiar y convertir a código
      const cleaned = variantName
        .toUpperCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .map((word) => word.slice(0, 3))
        .join("-");
      sku += `-${cleaned}`;
    }

    if (color) {
      const colorCode = color.toUpperCase().replace(/[^\w]/g, "").slice(0, 3);
      sku += `-${colorCode}`;
    }

    // Agregar timestamp para unicidad
    sku += `-${Date.now().toString().slice(-4)}`;

    return sku;
  };

  // Actualizar campo de variante
  const updateVariant = (
    index: number,
    field: keyof VariantData,
    value: any
  ) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
    onChange(newVariants);
  };

  // Toggle selección de atributo para una variante
  const toggleAttributeValue = (
    variantIndex: number,
    attributeId: string,
    valueId: string
  ) => {
    const variant = variants[variantIndex];
    const currentIds = variant.attribute_value_ids || [];

    // Obtener todos los valores de este atributo
    const attribute = attributes.find((a) => a.id === attributeId);
    if (!attribute || !attribute.values) return;

    const attributeValueIds = attribute.values.map((v) => v.id);

    // Remover cualquier valor previo de este atributo
    let newIds = currentIds.filter((id) => !attributeValueIds.includes(id));

    // Si el valor no estaba seleccionado, agregarlo
    if (!currentIds.includes(valueId)) {
      newIds = [...newIds, valueId];
    }

    // Actualizar display name
    const selectedValues: { attributeName: string; value: string }[] = [];
    newIds.forEach((id) => {
      attributes.forEach((attr) => {
        const val = attr.values?.find((v) => v.id === id);
        if (val) {
          selectedValues.push({
            attributeName: attr.display_name,
            value: val.value,
          });
        }
      });
    });

    updateVariant(variantIndex, "attribute_value_ids", newIds);
    updateVariant(variantIndex, "_attributeValues", selectedValues);
    updateVariant(
      variantIndex,
      "_displayName",
      selectedValues.map((v) => v.value).join(" | ") || "Nueva variante"
    );
  };

  if (isLoadingAttributes) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Cargando atributos...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con botón agregar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            Variantes ({variants.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            Agrega y configura las variantes del producto
          </p>
        </div>
        <Button onClick={addVariant} disabled={disabled} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Variante
        </Button>
      </div>

      {/* Lista de variantes */}
      {variants.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No hay variantes. Haz click en &quot;Agregar Variante&quot; para
            crear una.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {variants.map((variant, variantIndex) => (
            <Card key={variantIndex}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {variant._displayName || `Variante ${variantIndex + 1}`}
                    </CardTitle>
                    {variant.id && (
                      <CardDescription className="text-xs">
                        ID: {variant.id.slice(0, 8)}...
                      </CardDescription>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariant(variantIndex)}
                    disabled={disabled}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Campos de la variante */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nombre de Variante */}
                  <div className="space-y-2">
                    <Label htmlFor={`variant-name-${variantIndex}`}>
                      Variante <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`variant-name-${variantIndex}`}
                      value={variant.variant_name || ""}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        const newVariants = [...variants];

                        // Actualizar todo en una sola operación
                        const displayParts = [];
                        if (newValue) displayParts.push(newValue);
                        if (variant.color) displayParts.push(variant.color);

                        newVariants[variantIndex] = {
                          ...newVariants[variantIndex],
                          variant_name: newValue,
                          _displayName:
                            displayParts.join(" - ") ||
                            `Variante ${variantIndex + 1}`,
                          sku: generateSKU(newValue, variant.color || ""),
                        };

                        setVariants(newVariants);
                        onChange(newVariants);
                      }}
                      placeholder="ej: 11 Litros, 1 Tonelada, etc."
                      disabled={disabled}
                    />
                    <p className="text-xs text-muted-foreground">
                      Capacidad, tamaño, modelo, etc.
                    </p>
                  </div>

                  {/* Color */}
                  <div className="space-y-2">
                    <Label htmlFor={`color-${variantIndex}`}>Color</Label>
                    <Input
                      id={`color-${variantIndex}`}
                      value={variant.color || ""}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        const newVariants = [...variants];

                        // Actualizar todo en una sola operación
                        const displayParts = [];
                        if (variant.variant_name)
                          displayParts.push(variant.variant_name);
                        if (newValue) displayParts.push(newValue);

                        newVariants[variantIndex] = {
                          ...newVariants[variantIndex],
                          color: newValue,
                          _displayName:
                            displayParts.join(" - ") ||
                            `Variante ${variantIndex + 1}`,
                          sku: generateSKU(
                            variant.variant_name || "",
                            newValue
                          ),
                        };

                        setVariants(newVariants);
                        onChange(newVariants);
                      }}
                      placeholder="ej: Blanco, Negro, Azul, etc."
                      disabled={disabled}
                    />
                    <p className="text-xs text-muted-foreground">Opcional</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* SKU - Auto-generado */}
                  <div className="space-y-2">
                    <Label htmlFor={`sku-${variantIndex}`}>
                      SKU <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`sku-${variantIndex}`}
                      value={variant.sku || ""}
                      readOnly
                      className="bg-muted"
                      placeholder="Se genera automáticamente"
                      disabled={disabled}
                    />
                    <p className="text-xs text-muted-foreground">
                      Se genera automáticamente
                    </p>
                  </div>

                  {/* Precio */}
                  <div className="space-y-2">
                    <Label htmlFor={`price-${variantIndex}`}>
                      Precio (ARS) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`price-${variantIndex}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={variant.price || ""}
                      onChange={(e) =>
                        updateVariant(
                          variantIndex,
                          "price",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0.00"
                      disabled={disabled}
                    />
                  </div>

                  {/* Stock */}
                  <div className="space-y-2">
                    <Label htmlFor={`stock-${variantIndex}`}>Stock</Label>
                    <Input
                      id={`stock-${variantIndex}`}
                      type="number"
                      min="0"
                      value={variant.stock_quantity || ""}
                      onChange={(e) =>
                        updateVariant(
                          variantIndex,
                          "stock_quantity",
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="0"
                      disabled={disabled}
                    />
                  </div>
                </div>

                {/* Activa */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`active-${variantIndex}`}
                    checked={variant.is_active}
                    onCheckedChange={(checked) =>
                      updateVariant(variantIndex, "is_active", checked)
                    }
                    disabled={disabled}
                  />
                  <Label
                    htmlFor={`active-${variantIndex}`}
                    className="text-sm font-normal"
                  >
                    Variante activa
                  </Label>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resumen */}
      {variants.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total variantes</p>
                <p className="text-2xl font-bold">{variants.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Activas</p>
                <p className="text-2xl font-bold">
                  {variants.filter((v) => v.is_active).length}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Stock total</p>
                <p className="text-2xl font-bold">
                  {variants.reduce(
                    (sum, v) => sum + (v.stock_quantity || 0),
                    0
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Rango de precio</p>
                <p className="text-lg font-bold">
                  {variants.length > 0
                    ? `$${Math.min(
                        ...variants.map((v) => v.price || 0)
                      ).toFixed(2)} - $${Math.max(
                        ...variants.map((v) => v.price || 0)
                      ).toFixed(2)}`
                    : "$0.00"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
