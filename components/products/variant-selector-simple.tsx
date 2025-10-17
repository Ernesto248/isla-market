"use client";

import { useState, useEffect } from "react";
import { ProductVariant } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface VariantSelectorSimpleProps {
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

/**
 * VariantSelectorSimple: Selector de variantes simplificado
 *
 * Para variantes creadas con el sistema ultra-simple (variant_name + color)
 * Muestra las variantes como una lista de opciones seleccionables
 */
export function VariantSelectorSimple({
  productId,
  variants,
  onVariantChange,
  className,
  disabled = false,
}: VariantSelectorSimpleProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );

  // Solo variantes activas
  const activeVariants = variants.filter((v) => v.is_active !== false);

  // Auto-seleccionar primera variante disponible
  useEffect(() => {
    if (activeVariants.length > 0 && !selectedVariant) {
      const firstVariant = activeVariants[0];
      setSelectedVariant(firstVariant);
      onVariantChange(firstVariant);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVariants.length, selectedVariant]);

  // Si no hay variantes, no mostrar nada
  if (variants.length === 0) {
    return null;
  }

  // Si no hay variantes activas
  if (activeVariants.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          No hay variantes disponibles para este producto
        </AlertDescription>
      </Alert>
    );
  }

  const handleSelectVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    onVariantChange(variant);
  };

  // Obtener el nombre de display de la variante
  const getVariantDisplayName = (variant: ProductVariant): string => {
    // Construir desde variant_name y color (preferir esto sobre attributes_display)
    const parts = [];
    if (variant.variant_name) parts.push(variant.variant_name);
    if (variant.color) parts.push(variant.color);

    if (parts.length > 0) {
      return parts.join(" - ");
    }

    // Fallback: usar attributes_display si existe y no parece un SKU
    if (
      variant.attributes_display &&
      !variant.attributes_display.startsWith("VAR-")
    ) {
      return variant.attributes_display;
    }

    // Último fallback
    return `Variante ${variant.id.slice(0, 8)}`;
  };

  // Si solo hay una variante, mostrar mensaje simple
  if (activeVariants.length === 1) {
    const variant = activeVariants[0];

    return (
      <div className={cn("space-y-3", className)}>
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="font-medium">{getVariantDisplayName(variant)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {variant.stock_quantity || 0} disponibles
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <label className="text-sm font-semibold flex items-center gap-2">
          <Package className="h-4 w-4" />
          Selecciona una opción
        </label>

        {/* Lista de variantes */}
        <div className="grid grid-cols-1 gap-2">
          {activeVariants.map((variant) => {
            const isSelected = selectedVariant?.id === variant.id;
            const isOutOfStock = (variant.stock_quantity || 0) === 0;
            const displayName = getVariantDisplayName(variant);

            return (
              <button
                key={variant.id}
                onClick={() => handleSelectVariant(variant)}
                disabled={disabled || isOutOfStock}
                className={cn(
                  "w-full text-left p-4 rounded-lg border-2 transition-all",
                  "hover:border-primary hover:bg-accent/50",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  isSelected
                    ? "border-primary bg-accent shadow-sm"
                    : "border-border",
                  isOutOfStock && "opacity-50"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm sm:text-base truncate">
                      {displayName}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Precio */}
                    <div className="text-right">
                      <div className="font-bold text-base sm:text-lg">
                        ${variant.price.toFixed(2)}
                      </div>
                      {!isOutOfStock && (
                        <div className="text-xs text-muted-foreground">
                          {variant.stock_quantity} disponibles
                        </div>
                      )}
                    </div>

                    {/* Badge de estado */}
                    {isOutOfStock ? (
                      <Badge variant="destructive" className="text-xs">
                        Sin stock
                      </Badge>
                    ) : isSelected ? (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-border" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Información de la variante seleccionada */}
      {selectedVariant && (
        <Alert className="bg-accent/50 border-primary/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="font-medium">
              Seleccionaste: {getVariantDisplayName(selectedVariant)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Precio: ${selectedVariant.price.toFixed(2)} • Stock:{" "}
              {selectedVariant.stock_quantity || 0} unidades
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
