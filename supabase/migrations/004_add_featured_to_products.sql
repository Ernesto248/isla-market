-- Migración: Agregar campo featured a la tabla products
-- Fecha: 2025-10-06
-- Descripción: Agrega un campo booleano para marcar productos destacados

-- Agregar columna featured con valor por defecto false
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;

-- Crear índice para búsquedas rápidas de productos destacados
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true;

-- Comentario para documentación
COMMENT ON COLUMN products.featured IS 'Indica si el producto debe mostrarse en la sección de destacados';
