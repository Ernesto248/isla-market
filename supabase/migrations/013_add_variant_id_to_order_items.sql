-- =====================================================
-- MIGRACIÓN: Agregar soporte de variantes a order_items
-- Fecha: 17 de octubre de 2025
-- Descripción: Agregar variant_id a order_items para soportar productos con variantes
-- =====================================================

-- 1. Agregar columna variant_id a order_items
ALTER TABLE order_items
ADD COLUMN variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;

-- 2. Crear índice para mejorar performance en queries
CREATE INDEX idx_order_items_variant ON order_items(variant_id);

-- 3. Comentarios para documentación
COMMENT ON COLUMN order_items.variant_id IS 'ID de la variante seleccionada del producto. NULL para productos sin variantes.';

-- 4. Función para obtener stock a reducir (variante o producto)
-- Esta función determina de dónde reducir el stock
CREATE OR REPLACE FUNCTION get_stock_source(
  p_product_id UUID,
  p_variant_id UUID DEFAULT NULL
)
RETURNS TABLE (
  source_type TEXT,
  source_id UUID,
  current_stock INTEGER
) AS $$
BEGIN
  -- Si hay variant_id, usar stock de variante
  IF p_variant_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      'variant'::TEXT as source_type,
      pv.id as source_id,
      pv.stock_quantity as current_stock
    FROM product_variants pv
    WHERE pv.id = p_variant_id;
  ELSE
    -- Si no hay variante, usar stock del producto
    RETURN QUERY
    SELECT 
      'product'::TEXT as source_type,
      p.id as source_id,
      COALESCE(p.stock_quantity, p.stock, 0) as current_stock
    FROM products p
    WHERE p.id = p_product_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. Función mejorada para reducir stock (variante o producto)
CREATE OR REPLACE FUNCTION reduce_order_stock()
RETURNS TRIGGER AS $$
DECLARE
  v_stock_source RECORD;
  v_new_stock INTEGER;
BEGIN
  -- Obtener la fuente de stock (variante o producto)
  SELECT * INTO v_stock_source
  FROM get_stock_source(NEW.product_id, NEW.variant_id);
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró el producto o variante para reducir stock';
  END IF;
  
  -- Calcular nuevo stock
  v_new_stock := v_stock_source.current_stock - NEW.quantity;
  
  -- Validar que no sea negativo
  IF v_new_stock < 0 THEN
    RAISE EXCEPTION 'Stock insuficiente. Disponible: %, Solicitado: %', 
      v_stock_source.current_stock, NEW.quantity;
  END IF;
  
  -- Reducir stock según la fuente
  IF v_stock_source.source_type = 'variant' THEN
    -- Reducir stock de variante
    UPDATE product_variants
    SET stock_quantity = v_new_stock
    WHERE id = NEW.variant_id;
    
    RAISE NOTICE 'Stock de variante % reducido: % → %', 
      NEW.variant_id, v_stock_source.current_stock, v_new_stock;
  ELSE
    -- Reducir stock de producto
    UPDATE products
    SET stock_quantity = v_new_stock
    WHERE id = NEW.product_id;
    
    RAISE NOTICE 'Stock de producto % reducido: % → %', 
      NEW.product_id, v_stock_source.current_stock, v_new_stock;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear trigger para reducir stock automáticamente al crear order_item
-- (Reemplazar trigger existente si existe)
DROP TRIGGER IF EXISTS trigger_reduce_order_stock ON order_items;
CREATE TRIGGER trigger_reduce_order_stock
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION reduce_order_stock();

COMMENT ON TRIGGER trigger_reduce_order_stock ON order_items IS 
'Reduce automáticamente el stock del producto o variante cuando se crea un order_item';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Query para verificar la columna fue agregada:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'order_items' AND column_name = 'variant_id';

-- Query para probar la función get_stock_source:
-- SELECT * FROM get_stock_source('product-id-here', 'variant-id-here');
-- SELECT * FROM get_stock_source('product-id-here', NULL);
