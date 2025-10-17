"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Trash2, Plus, RefreshCw, AlertCircle } from "lucide-react";
import type {
  ProductAttribute,
  ProductAttributeValue,
  ProductVariant,
} from "@/lib/types";

interface VariantEditorProps {
  productId?: string; // Opcional - si está editando un producto existente
  initialVariants?: ProductVariant[]; // Variantes existentes (modo edición)
  onChange: (variants: VariantData[]) => void; // Callback cuando cambian las variantes
  disabled?: boolean;
}

export interface VariantData {
  id?: string; // ID si es variante existente
  attribute_value_ids: string[];
  sku?: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  // Información temporal para mostrar en UI
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
  const [selectedAttributes, setSelectedAttributes] = useState<
    Map<string, string[]>
  >(new Map());
  const [variants, setVariants] = useState<VariantData[]>([]);
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoGenerateMode, setAutoGenerateMode] = useState(true);

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
      const variantData: VariantData[] = initialVariants.map((variant) => ({
        id: variant.id,
        attribute_value_ids:
          variant.attribute_values?.map((a: ProductAttributeValue) => a.id) ||
          [],
        sku: variant.sku || "",
        price: variant.price,
        stock_quantity: variant.stock_quantity,
        is_active: variant.is_active,
        _displayName: getVariantDisplayName(variant),
        _attributeValues: variant.attribute_values?.map(
          (a: ProductAttributeValue) => ({
            attributeName: a.attribute?.display_name || "",
            value: a.value,
          })
        ),
      }));

      setVariants(variantData);
      setAutoGenerateMode(false);
    }
  }, [initialVariants]);

  // Manejar selección de valores de atributos
  const handleAttributeValueToggle = (attributeId: string, valueId: string) => {
    if (disabled) return;

    const newSelected = new Map(selectedAttributes);
    const current = newSelected.get(attributeId) || [];

    if (current.includes(valueId)) {
      // Deseleccionar
      const filtered = current.filter((id) => id !== valueId);
      if (filtered.length === 0) {
        newSelected.delete(attributeId);
      } else {
        newSelected.set(attributeId, filtered);
      }
    } else {
      // Seleccionar
      newSelected.set(attributeId, [...current, valueId]);
    }

    setSelectedAttributes(newSelected);
  };

  // Generar todas las combinaciones posibles
  const generateVariantCombinations = () => {
    if (selectedAttributes.size === 0) {
      return [];
    }

    // Obtener arrays de valores seleccionados
    const attributeArrays = Array.from(selectedAttributes.entries()).map(
      ([attrId, valueIds]) => ({
        attributeId: attrId,
        valueIds,
      })
    );

    // Generar producto cartesiano
    const combinations: string[][] = [[]];

    for (const { valueIds } of attributeArrays) {
      const newCombinations: string[][] = [];
      for (const combination of combinations) {
        for (const valueId of valueIds) {
          newCombinations.push([...combination, valueId]);
        }
      }
      combinations.length = 0;
      combinations.push(...newCombinations);
    }

    return combinations;
  };

  // Generar variantes automáticamente
  const handleGenerateVariants = () => {
    const combinations = generateVariantCombinations();

    if (combinations.length === 0) {
      setError(
        "Selecciona al menos un atributo y valor para generar variantes"
      );
      return;
    }

    if (combinations.length > 50) {
      setError(
        "Demasiadas combinaciones (máximo 50). Reduce las opciones seleccionadas."
      );
      return;
    }

    const newVariants: VariantData[] = combinations.map((attributeValueIds) => {
      // Buscar si ya existe esta combinación
      const existingVariant = variants.find((v) => {
        const sorted1 = [...v.attribute_value_ids].sort().join("-");
        const sorted2 = [...attributeValueIds].sort().join("-");
        return sorted1 === sorted2;
      });

      if (existingVariant) {
        return existingVariant; // Mantener datos existentes
      }

      // Crear nueva variante
      const displayInfo = getDisplayInfo(attributeValueIds);
      return {
        attribute_value_ids: attributeValueIds,
        sku: "",
        price: 0,
        stock_quantity: 0,
        is_active: true,
        _displayName: displayInfo.displayName,
        _attributeValues: displayInfo.attributeValues,
      };
    });

    setVariants(newVariants);
    onChange(newVariants);
    setError(null);
  };

  // Obtener información de display para una combinación
  const getDisplayInfo = (attributeValueIds: string[]) => {
    const attributeValues: { attributeName: string; value: string }[] = [];
    const displayParts: string[] = [];

    for (const valueId of attributeValueIds) {
      for (const attribute of attributes) {
        const value = attribute.values?.find((v) => v.id === valueId);
        if (value) {
          attributeValues.push({
            attributeName: attribute.display_name,
            value: value.value,
          });
          displayParts.push(value.value);
          break;
        }
      }
    }

    return {
      displayName: displayParts.join(" + "),
      attributeValues,
    };
  };

  // Obtener nombre de display de una variante
  const getVariantDisplayName = (variant: ProductVariant): string => {
    if (!variant.attribute_values || variant.attribute_values.length === 0) {
      return "Sin atributos";
    }
    return variant.attribute_values
      .map((a: ProductAttributeValue) => a.value)
      .join(" + ");
  };

  // Actualizar una variante específica
  const updateVariant = (
    index: number,
    field: keyof VariantData,
    value: any
  ) => {
    if (disabled) return;

    const newVariants = [...variants];
    newVariants[index] = {
      ...newVariants[index],
      [field]: value,
    };
    setVariants(newVariants);
    onChange(newVariants);
  };

  // Eliminar una variante
  const removeVariant = (index: number) => {
    if (disabled) return;

    const newVariants = variants.filter((_, i) => i !== index);
    setVariants(newVariants);
    onChange(newVariants);
  };

  // Agregar variante manual
  const addManualVariant = () => {
    const newVariant: VariantData = {
      attribute_value_ids: [],
      sku: "",
      price: 0,
      stock_quantity: 0,
      is_active: true,
      _displayName: "Nueva variante",
      _attributeValues: [],
    };

    setVariants([...variants, newVariant]);
    onChange([...variants, newVariant]);
  };

  // Validar variantes
  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    if (variants.length === 0) {
      return errors;
    }

    // Verificar que todas tengan precio
    const withoutPrice = variants.filter((v) => !v.price || v.price <= 0);
    if (withoutPrice.length > 0) {
      errors.push(`${withoutPrice.length} variante(s) sin precio válido`);
    }

    // Verificar SKUs duplicados
    const skus = variants.map((v) => v.sku).filter(Boolean);
    const duplicateSkus = skus.filter(
      (sku, index) => skus.indexOf(sku) !== index
    );
    if (duplicateSkus.length > 0) {
      const uniqueDupes = Array.from(new Set(duplicateSkus));
      errors.push(`SKUs duplicados: ${uniqueDupes.join(", ")}`);
    }

    // Verificar combinaciones duplicadas
    const combinations = variants.map((v) =>
      [...v.attribute_value_ids].sort().join("-")
    );
    const duplicateCombinations = combinations.filter(
      (combo, index) => combo && combinations.indexOf(combo) !== index
    );
    if (duplicateCombinations.length > 0) {
      errors.push(
        `${duplicateCombinations.length} combinación(es) duplicada(s)`
      );
    }

    return errors;
  }, [variants]);

  if (isLoadingAttributes) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Cargando atributos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && attributes.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modo de trabajo */}
      <Card>
        <CardHeader>
          <CardTitle>Modo de Generación</CardTitle>
          <CardDescription>
            Elige cómo quieres crear las variantes del producto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-generate"
              checked={autoGenerateMode}
              onCheckedChange={setAutoGenerateMode}
              disabled={disabled}
            />
            <Label htmlFor="auto-generate">
              Generación automática de combinaciones
            </Label>
          </div>
          {autoGenerateMode && (
            <p className="text-sm text-muted-foreground">
              Selecciona atributos y valores, luego genera todas las
              combinaciones automáticamente.
            </p>
          )}
          {!autoGenerateMode && (
            <p className="text-sm text-muted-foreground">
              Agrega variantes manualmente una por una.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Selección de atributos (solo en modo auto) */}
      {autoGenerateMode && (
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Atributos y Valores</CardTitle>
            <CardDescription>
              Marca los valores que deseas incluir en las variantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attributes.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No hay atributos disponibles. Crea atributos primero en la
                  sección de Atributos.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {attributes.map((attribute) => (
                  <div key={attribute.id} className="space-y-2">
                    <Label className="text-base font-semibold">
                      {attribute.display_name}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {attribute.values?.map((value) => {
                        const isSelected = selectedAttributes
                          .get(attribute.id)
                          ?.includes(value.id);
                        return (
                          <Badge
                            key={value.id}
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer hover:bg-primary/90"
                            onClick={() =>
                              handleAttributeValueToggle(attribute.id, value.id)
                            }
                          >
                            {value.value}
                            {isSelected && " ✓"}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <Button
                  onClick={handleGenerateVariants}
                  disabled={disabled || selectedAttributes.size === 0}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generar Variantes ({generateVariantCombinations().length}{" "}
                  combinaciones)
                </Button>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista de variantes generadas/manuales */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Variantes ({variants.length})</CardTitle>
              <CardDescription>
                Configura el precio y stock de cada variante
              </CardDescription>
            </div>
            {!autoGenerateMode && (
              <Button onClick={addManualVariant} disabled={disabled} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Variante
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {variants.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No hay variantes.{" "}
                {autoGenerateMode
                  ? "Genera combinaciones arriba"
                  : "Agrega una variante manualmente"}
                .
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {/* Errores de validación */}
              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside">
                      {validationErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Tabla de variantes */}
              {variants.map((variant, index) => (
                <Card key={index} className="relative">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Nombre de la variante */}
                      <div>
                        <Label className="text-base font-semibold">
                          {variant._displayName || "Variante sin nombre"}
                        </Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {variant._attributeValues?.map((av, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-xs"
                            >
                              {av.attributeName}: {av.value}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Campos de la variante */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`sku-${index}`}>SKU</Label>
                          <Input
                            id={`sku-${index}`}
                            value={variant.sku || ""}
                            onChange={(e) =>
                              updateVariant(index, "sku", e.target.value)
                            }
                            placeholder="Opcional"
                            disabled={disabled}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`price-${index}`}>
                            Precio <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id={`price-${index}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={variant.price || ""}
                            onChange={(e) =>
                              updateVariant(
                                index,
                                "price",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            disabled={disabled}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`stock-${index}`}>Stock</Label>
                          <Input
                            id={`stock-${index}`}
                            type="number"
                            min="0"
                            value={variant.stock_quantity || 0}
                            onChange={(e) =>
                              updateVariant(
                                index,
                                "stock_quantity",
                                parseInt(e.target.value) || 0
                              )
                            }
                            disabled={disabled}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`active-${index}`}>Activa</Label>
                          <div className="flex items-center h-10">
                            <Switch
                              id={`active-${index}`}
                              checked={variant.is_active}
                              onCheckedChange={(checked) =>
                                updateVariant(index, "is_active", checked)
                              }
                              disabled={disabled}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Botón eliminar */}
                      <div className="flex justify-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeVariant(index)}
                          disabled={disabled}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen */}
      {variants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Variantes</p>
                <p className="text-2xl font-bold">{variants.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Activas</p>
                <p className="text-2xl font-bold">
                  {variants.filter((v) => v.is_active).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stock Total</p>
                <p className="text-2xl font-bold">
                  {variants.reduce((sum, v) => sum + v.stock_quantity, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Errores</p>
                <p className="text-2xl font-bold text-red-500">
                  {validationErrors.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
