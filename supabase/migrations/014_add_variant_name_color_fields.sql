-- Migration: Agregar campos variant_name y color a product_variants
-- Para el sistema ultra-simple de variantes

-- Agregar columnas variant_name y color a product_variants
ALTER TABLE product_variants
ADD COLUMN IF NOT EXISTS variant_name TEXT,
ADD COLUMN IF NOT EXISTS color TEXT;

-- Agregar comentarios
COMMENT ON COLUMN product_variants.variant_name IS 'Nombre descriptivo de la variante (ej: "11 Litros", "1 Tonelada")';
COMMENT ON COLUMN product_variants.color IS 'Color de la variante (opcional, ej: "Blanco", "Negro")';

-- Actualizar attributes_display para variantes existentes que usen variant_name y color
-- (esto ayudará a la transición si hay variantes existentes)
UPDATE product_variants
SET attributes_display = 
  CASE 
    WHEN variant_name IS NOT NULL AND color IS NOT NULL THEN variant_name || ' - ' || color
    WHEN variant_name IS NOT NULL THEN variant_name
    WHEN color IS NOT NULL THEN color
    ELSE attributes_display
  END
WHERE variant_name IS NOT NULL OR color IS NOT NULL;
