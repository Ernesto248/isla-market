"use client";

import { useState, useEffect, useMemo } from "react";
import { ProductVariant } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VariantSelectorProps {
  /** ID del producto */
  productId: string;
  /** Lista de variantes disponibles */
  variants: ProductVariant[];
  /** Callback cuando se selecciona una variante */
  onVariantChange: (variant: ProductVariant | null) => void;
  /** Clase CSS adicional */
  className?: string;
  /** Si está deshabilitado */
  disabled?: boolean;
}

interface AttributeOption {
  attributeName: string;
  valueName: string;
  valueId: string;
}

/**
 * VariantSelector: Componente para que los clientes seleccionen variantes de productos
 *
 * Características:
 * - Extrae automáticamente los atributos únicos de las variantes
 * - Permite seleccionar un valor por atributo
 * - Busca la variante que coincide con la combinación seleccionada
 * - Muestra precio y stock de la variante seleccionada
 * - Deshabilita opciones que no tienen variantes disponibles
 * - Maneja estados de sin stock
 */
export function VariantSelector({
  productId,
  variants,
  onVariantChange,
  className,
  disabled = false,
}: VariantSelectorProps) {
  // Estado: { attributeName: valueId }
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );

  // Extraer estructura de atributos de las variantes
  const attributesStructure = useMemo(() => {
    const structure: Record<
      string,
      { name: string; values: Map<string, string> }
    > = {};

    variants.forEach((variant) => {
      variant.attributes?.forEach((attr) => {
        if (!structure[attr.attribute_name]) {
          structure[attr.attribute_name] = {
            name: attr.attribute_name,
            values: new Map(),
          };
        }
        structure[attr.attribute_name].values.set(
          attr.value_id,
          attr.value_name
        );
      });
    });

    return structure;
  }, [variants]);

  // Nombres de atributos ordenados
  const attributeNames = useMemo(
    () => Object.keys(attributesStructure).sort(),
    [attributesStructure]
  );

  // Buscar variante que coincida con la selección actual
  useEffect(() => {
    // Si no hay selección completa, no hay variante seleccionada
    if (Object.keys(selectedAttributes).length !== attributeNames.length) {
      setSelectedVariant(null);
      onVariantChange(null);
      return;
    }

    // Buscar variante que coincida exactamente
    const matchingVariant = variants.find((variant) => {
      // Verificar que tenga todos los atributos seleccionados
      if (variant.attributes?.length !== attributeNames.length) {
        return false;
      }

      // Verificar que cada atributo coincida
      return variant.attributes.every((attr) => {
        return selectedAttributes[attr.attribute_name] === attr.value_id;
      });
    });

    setSelectedVariant(matchingVariant || null);
    onVariantChange(matchingVariant || null);
  }, [selectedAttributes, variants, attributeNames.length, onVariantChange]);

  // Manejar selección de atributo
  const handleAttributeSelect = (attributeName: string, valueId: string) => {
    setSelectedAttributes((prev) => ({
      ...prev,
      [attributeName]: valueId,
    }));
  };

  // Verificar si una opción está disponible
  const isOptionAvailable = (
    attributeName: string,
    valueId: string
  ): boolean => {
    // Crear una selección temporal con esta opción
    const tempSelection = { ...selectedAttributes, [attributeName]: valueId };

    // Verificar si existe alguna variante con esta combinación
    return variants.some((variant) => {
      // Verificar que todos los atributos seleccionados coincidan
      return Object.entries(tempSelection).every(([attrName, valId]) => {
        return variant.attributes?.some(
          (attr) => attr.attribute_name === attrName && attr.value_id === valId
        );
      });
    });
  };

  // Obtener stock disponible de una opción
  const getOptionStock = (attributeName: string, valueId: string): number => {
    const tempSelection = { ...selectedAttributes, [attributeName]: valueId };

    // Encontrar variantes que coincidan con esta selección parcial
    const matchingVariants = variants.filter((variant) => {
      return Object.entries(tempSelection).every(([attrName, valId]) => {
        return variant.attributes?.some(
          (attr) => attr.attribute_name === attrName && attr.value_id === valId
        );
      });
    });

    // Retornar el stock máximo disponible
    return matchingVariants.reduce(
      (max, v) => Math.max(max, v.stock_quantity || 0),
      0
    );
  };

  // Si no hay variantes, no mostrar nada
  if (variants.length === 0) {
    return null;
  }

  // Si solo hay una variante, seleccionarla automáticamente
  if (variants.length === 1) {
    const variant = variants[0];
    if (selectedVariant?.id !== variant.id) {
      setSelectedVariant(variant);
      onVariantChange(variant);
    }

    return (
      <div className={cn("space-y-4", className)}>
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            {variant.attributes?.map((attr) => attr.value_name).join(" • ") ||
              "Variante única"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Selector por cada atributo */}
      {attributeNames.map((attributeName) => {
        const attribute = attributesStructure[attributeName];
        const values = Array.from(attribute.values.entries());

        return (
          <div key={attributeName} className="space-y-2">
            <label className="text-sm font-semibold">
              {attributeName}
              {selectedAttributes[attributeName] && (
                <span className="ml-2 text-muted-foreground font-normal">
                  (
                  {attribute.values.get(selectedAttributes[attributeName]) ||
                    ""}
                  )
                </span>
              )}
            </label>

            {/* Grid de opciones */}
            <div className="flex flex-wrap gap-2">
              {values.map(([valueId, valueName]) => {
                const isSelected =
                  selectedAttributes[attributeName] === valueId;
                const isAvailable = isOptionAvailable(attributeName, valueId);
                const stock = getOptionStock(attributeName, valueId);
                const isOutOfStock = stock === 0;

                return (
                  <Button
                    key={valueId}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    disabled={disabled || !isAvailable || isOutOfStock}
                    onClick={() =>
                      handleAttributeSelect(attributeName, valueId)
                    }
                    className={cn(
                      "relative",
                      !isAvailable && "opacity-50 cursor-not-allowed",
                      isOutOfStock && "opacity-30"
                    )}
                  >
                    {valueName}
                    {isOutOfStock && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs line-through">Sin stock</span>
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Información de la variante seleccionada */}
      {selectedVariant && (
        <div className="pt-3 border-t space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Precio:</span>
            <span className="text-2xl font-bold">
              ${selectedVariant.price.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Stock:</span>
            <Badge
              variant={
                (selectedVariant.stock_quantity || 0) > 10
                  ? "default"
                  : (selectedVariant.stock_quantity || 0) > 0
                  ? "secondary"
                  : "destructive"
              }
            >
              {selectedVariant.stock_quantity || 0} disponibles
            </Badge>
          </div>

          {selectedVariant.sku && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">SKU:</span>
              <span className="text-xs font-mono text-muted-foreground">
                {selectedVariant.sku}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Mensaje si no hay selección completa */}
      {!selectedVariant &&
        Object.keys(selectedAttributes).length > 0 &&
        Object.keys(selectedAttributes).length < attributeNames.length && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Selecciona todas las opciones para ver precio y disponibilidad
            </AlertDescription>
          </Alert>
        )}

      {/* Mensaje si la combinación no está disponible */}
      {!selectedVariant &&
        Object.keys(selectedAttributes).length === attributeNames.length && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Esta combinación no está disponible
            </AlertDescription>
          </Alert>
        )}
    </div>
  );
}
