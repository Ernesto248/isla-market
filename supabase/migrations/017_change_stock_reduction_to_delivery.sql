-- =====================================================
-- MIGRACIÓN: Cambiar reducción de stock a cuando se entrega la orden
-- Fecha: 9 de noviembre de 2025
-- Descripción: La reducción de stock ahora ocurre cuando la orden se marca como "entregado"
--              en lugar de cuando se crea la orden
-- =====================================================

-- 1. Eliminar el trigger actual que reduce stock al crear order_item
DROP TRIGGER IF EXISTS trigger_reduce_order_stock ON order_items;

COMMENT ON FUNCTION reduce_order_stock() IS 
'[DEPRECADO] Ya no se usa en INSERT de order_items. Ver trigger en orders';

-- 2. Crear nueva función para reducir stock cuando la orden se entrega
CREATE OR REPLACE FUNCTION reduce_stock_on_delivery()
RETURNS TRIGGER AS $$
DECLARE
  v_order_item RECORD;
  v_stock_source RECORD;
  v_new_stock INTEGER;
BEGIN
  -- Solo procesar si el estado cambió a "entregado"
  IF NEW.status = 'entregado' AND (OLD.status IS NULL OR OLD.status != 'entregado') THEN
    
    RAISE NOTICE 'Orden % marcada como entregada. Reduciendo stock...', NEW.id;
    
    -- Iterar sobre todos los items de la orden
    FOR v_order_item IN 
      SELECT product_id, variant_id, quantity
      FROM order_items
      WHERE order_id = NEW.id
    LOOP
      -- Obtener la fuente de stock (variante o producto)
      SELECT * INTO v_stock_source
      FROM get_stock_source(v_order_item.product_id, v_order_item.variant_id);
      
      IF NOT FOUND THEN
        RAISE WARNING 'No se encontró el producto/variante para reducir stock: product_id=%, variant_id=%', 
          v_order_item.product_id, v_order_item.variant_id;
        CONTINUE;
      END IF;
      
      -- Calcular nuevo stock
      v_new_stock := v_stock_source.current_stock - v_order_item.quantity;
      
      -- Validar que no sea negativo (advertencia, no error)
      IF v_new_stock < 0 THEN
        RAISE WARNING 'Stock insuficiente para producto/variante %: Disponible: %, Solicitado: %', 
          v_stock_source.source_id, v_stock_source.current_stock, v_order_item.quantity;
        -- Continuar de todos modos, el admin puede corregir manualmente
        v_new_stock := 0;
      END IF;
      
      -- Reducir stock según la fuente
      IF v_stock_source.source_type = 'variant' THEN
        -- Reducir stock de variante
        UPDATE product_variants
        SET stock_quantity = v_new_stock
        WHERE id = v_order_item.variant_id;
        
        RAISE NOTICE 'Stock de variante % reducido: % → %', 
          v_order_item.variant_id, v_stock_source.current_stock, v_new_stock;
      ELSE
        -- Reducir stock de producto
        UPDATE products
        SET stock_quantity = v_new_stock
        WHERE id = v_order_item.product_id;
        
        RAISE NOTICE 'Stock de producto % reducido: % → %', 
          v_order_item.product_id, v_stock_source.current_stock, v_new_stock;
      END IF;
    END LOOP;
    
    RAISE NOTICE 'Stock reducido exitosamente para orden %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear trigger en la tabla orders para reducir stock cuando se entrega
CREATE TRIGGER trigger_reduce_stock_on_delivery
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'entregado')
  EXECUTE FUNCTION reduce_stock_on_delivery();

COMMENT ON TRIGGER trigger_reduce_stock_on_delivery ON orders IS 
'Reduce automáticamente el stock cuando una orden es marcada como entregada';

COMMENT ON FUNCTION reduce_stock_on_delivery() IS 
'Reduce el stock de productos/variantes cuando una orden cambia a estado "entregado"';

-- 4. Crear función para restaurar stock si se cancela una orden entregada (opcional)
CREATE OR REPLACE FUNCTION restore_stock_on_cancel()
RETURNS TRIGGER AS $$
DECLARE
  v_order_item RECORD;
  v_stock_source RECORD;
  v_new_stock INTEGER;
BEGIN
  -- Solo procesar si se cancela una orden que estaba entregada
  IF NEW.status = 'cancelado' AND OLD.status = 'entregado' THEN
    
    RAISE NOTICE 'Orden % cancelada después de entrega. Restaurando stock...', NEW.id;
    
    -- Iterar sobre todos los items de la orden
    FOR v_order_item IN 
      SELECT product_id, variant_id, quantity
      FROM order_items
      WHERE order_id = NEW.id
    LOOP
      -- Obtener la fuente de stock
      SELECT * INTO v_stock_source
      FROM get_stock_source(v_order_item.product_id, v_order_item.variant_id);
      
      IF NOT FOUND THEN
        RAISE WARNING 'No se encontró el producto/variante para restaurar stock';
        CONTINUE;
      END IF;
      
      -- Calcular nuevo stock (sumar de vuelta)
      v_new_stock := v_stock_source.current_stock + v_order_item.quantity;
      
      -- Restaurar stock según la fuente
      IF v_stock_source.source_type = 'variant' THEN
        UPDATE product_variants
        SET stock_quantity = v_new_stock
        WHERE id = v_order_item.variant_id;
        
        RAISE NOTICE 'Stock de variante % restaurado: % → %', 
          v_order_item.variant_id, v_stock_source.current_stock, v_new_stock;
      ELSE
        UPDATE products
        SET stock_quantity = v_new_stock
        WHERE id = v_order_item.product_id;
        
        RAISE NOTICE 'Stock de producto % restaurado: % → %', 
          v_order_item.product_id, v_stock_source.current_stock, v_new_stock;
      END IF;
    END LOOP;
    
    RAISE NOTICE 'Stock restaurado exitosamente para orden %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear trigger para restaurar stock si se cancela orden entregada
CREATE TRIGGER trigger_restore_stock_on_cancel
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'cancelado' AND OLD.status = 'entregado')
  EXECUTE FUNCTION restore_stock_on_cancel();

COMMENT ON TRIGGER trigger_restore_stock_on_cancel ON orders IS 
'Restaura el stock si una orden entregada es cancelada';

COMMENT ON FUNCTION restore_stock_on_cancel() IS 
'Restaura el stock de productos/variantes si una orden entregada es cancelada';

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Las órdenes existentes NO se verán afectadas
-- 2. Solo las nuevas órdenes que se marquen como "entregado" reducirán stock
-- 3. Si necesitas ajustar el stock de órdenes anteriores, hazlo manualmente
-- 4. El trigger de cancelación solo funciona si la orden estaba "entregado"

