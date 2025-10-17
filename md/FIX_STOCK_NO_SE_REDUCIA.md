# Fix: Stock No Se Reducía al Crear Órdenes

## 🔴 Problema Detectado

Cuando se creaba una orden con productos que tienen variantes (Refrigerador EKO), el stock **NO se reducía automáticamente**.

### Ejemplo del Problema

**Orden creada:**

- 2 unidades de "11 Litros - Gris"
- 2 unidades de "9 Litros - Gris"

**Estado del stock:**

- ANTES de la orden: 10 y 20 unidades
- DESPUÉS de la orden: 10 y 20 unidades ❌ (debería ser 8 y 18)

## 🔍 Causa Raíz

El trigger de base de datos que reduce el stock automáticamente **NO ESTABA APLICADO**.

### Verificación del Problema

```sql
-- Buscar trigger en order_items
SELECT trigger_name
FROM information_schema.triggers
WHERE event_object_table = 'order_items';

-- Resultado: [] (vacío) ❌
```

A pesar de que existía un archivo de migración `013_add_variant_id_to_order_items.sql` con el trigger, **nunca se aplicó a la base de datos**.

### Por Qué Pasó

1. ✅ La columna `variant_id` SÍ existe en `order_items`
2. ❌ El trigger para reducir stock NO existe
3. ❌ Las funciones auxiliares NO existen

Posiblemente la migración se aplicó parcialmente o se ejecutó una versión sin el trigger.

## 🛠️ Solución Implementada

### 1. Crear Función `get_stock_source()`

Esta función determina de dónde obtener el stock:

```sql
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
      COALESCE(p.stock_quantity, 0) as current_stock
    FROM products p
    WHERE p.id = p_product_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

**Propósito:**

- Si el `order_item` tiene `variant_id`, busca el stock en `product_variants`
- Si no tiene `variant_id`, busca el stock en `products`

### 2. Crear Función `reduce_order_stock()`

Esta función es ejecutada por el trigger:

```sql
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
```

**Características:**

- ✅ Detecta automáticamente si es variante o producto
- ✅ Valida que hay suficiente stock antes de reducir
- ✅ Lanza excepción si stock insuficiente (previene overselling)
- ✅ Registra en logs la reducción de stock

### 3. Crear Trigger `trigger_reduce_order_stock`

```sql
DROP TRIGGER IF EXISTS trigger_reduce_order_stock ON order_items;
CREATE TRIGGER trigger_reduce_order_stock
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION reduce_order_stock();
```

**Funcionamiento:**

- Se ejecuta **DESPUÉS** de insertar un `order_item`
- Se ejecuta **POR CADA FILA** insertada
- Llama a `reduce_order_stock()` automáticamente

### 4. Corrección Manual de Stock Existente

Como la orden ya se había creado sin reducir stock, lo corregí manualmente:

```sql
-- Reducir 2 unidades de "11 Litros - Gris"
UPDATE product_variants
SET stock_quantity = stock_quantity - 2
WHERE id = '55d1b0f1-c8ea-4cd7-93de-b754355226ff';

-- Reducir 2 unidades de "9 Litros - Gris"
UPDATE product_variants
SET stock_quantity = stock_quantity - 2
WHERE id = '21edb663-814e-49c4-a989-bd1fb64a784d';
```

**Resultado:**

- "11 Litros - Gris": 10 → 8 unidades ✅
- "9 Litros - Gris": 20 → 18 unidades ✅

## 📊 Flujo Completo Corregido

### Antes del Fix ❌

```
Cliente → Checkout → API /orders/create → Crear order_items
                                              ↓
                                          DB: order_items insertado
                                              ↓
                                          ❌ Stock NO se reduce
                                              ↓
                                          Stock: 20 unidades (incorrecto)
```

### Después del Fix ✅

```
Cliente → Checkout → API /orders/create → Crear order_items
                                              ↓
                                          DB: order_items insertado
                                              ↓
                                          ✅ TRIGGER se ejecuta automáticamente
                                              ↓
                                          reduce_order_stock() función
                                              ↓
                                          get_stock_source() detecta variante
                                              ↓
                                          UPDATE product_variants
                                              ↓
                                          Stock: 18 unidades ✅
```

## 🧪 Testing

### Test 1: Orden con Variante

1. **Preparación:**

   ```sql
   -- Verificar stock inicial
   SELECT variant_name, stock_quantity
   FROM product_variants
   WHERE variant_name = '9 Litros';
   -- Resultado: 18 unidades
   ```

2. **Crear orden:**

   - Producto: Refrigerador EKO
   - Variante: "9 Litros - Gris"
   - Cantidad: 1

3. **Verificación:**
   ```sql
   -- Verificar stock después
   SELECT variant_name, stock_quantity
   FROM product_variants
   WHERE variant_name = '9 Litros';
   -- Resultado esperado: 17 unidades ✅
   ```

### Test 2: Orden con Producto Simple (Sin Variantes)

1. **Preparación:**

   ```sql
   -- Verificar stock inicial
   SELECT name, stock_quantity
   FROM products
   WHERE name = 'Miel de abeja';
   -- Resultado: 100 unidades
   ```

2. **Crear orden:**

   - Producto: Miel de abeja (sin variantes)
   - Cantidad: 3

3. **Verificación:**
   ```sql
   -- Verificar stock después
   SELECT name, stock_quantity
   FROM products
   WHERE name = 'Miel de abeja';
   -- Resultado esperado: 97 unidades ✅
   ```

### Test 3: Stock Insuficiente (Validación)

1. **Preparación:**

   ```sql
   -- Variante con poco stock
   UPDATE product_variants
   SET stock_quantity = 1
   WHERE variant_name = '11 Litros';
   ```

2. **Intentar crear orden:**

   - Producto: Refrigerador EKO
   - Variante: "11 Litros - Gris"
   - Cantidad: 5 (más que el disponible)

3. **Resultado esperado:**
   ```
   ❌ ERROR: Stock insuficiente. Disponible: 1, Solicitado: 5
   ```
   - La orden NO se crea
   - El stock NO se modifica
   - El usuario ve error claro

### Test 4: Orden Múltiple (Varios Productos)

1. **Crear orden con:**

   - 2x "9 Litros - Gris" (stock: 18)
   - 1x "11 Litros - Gris" (stock: 8)
   - 3x Miel de abeja (stock: 100)

2. **Resultado esperado:**
   - "9 Litros": 18 → 16 ✅
   - "11 Litros": 8 → 7 ✅
   - Miel: 100 → 97 ✅

## 📋 Verificación del Sistema

### Ver Trigger Activo

```sql
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_reduce_order_stock';
```

**Resultado esperado:**

```
trigger_name: trigger_reduce_order_stock
event_manipulation: INSERT
action_timing: AFTER
event_object_table: order_items
✅
```

### Ver Funciones Creadas

```sql
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name IN ('reduce_order_stock', 'get_stock_source')
AND routine_schema = 'public';
```

**Resultado esperado:**

```
reduce_order_stock - FUNCTION ✅
get_stock_source - FUNCTION ✅
```

### Probar Función Manualmente

```sql
-- Probar con variante
SELECT * FROM get_stock_source(
  'e6e7181b-10fa-41c1-9c65-4185fa4d9022',  -- product_id
  '21edb663-814e-49c4-a989-bd1fb64a784d'   -- variant_id
);
-- Resultado: source_type=variant, current_stock=18

-- Probar sin variante
SELECT * FROM get_stock_source(
  'algún-product-id',
  NULL
);
-- Resultado: source_type=product, current_stock=X
```

## 🎯 Estado Actual del Sistema

### Stock Corregido

| Variante         | SKU                 | Stock Antes | Vendidas | Stock Actual |
| ---------------- | ------------------- | ----------- | -------- | ------------ |
| 9 Litros - Gris  | VAR-9-LIT-GRI-0924  | 20          | 2        | **18** ✅    |
| 11 Litros - Gris | VAR-11-LIT-GRI-8028 | 10          | 2        | **8** ✅     |

### Trigger Activo

✅ **trigger_reduce_order_stock** - Activo en `order_items`
✅ **reduce_order_stock()** - Función creada
✅ **get_stock_source()** - Función auxiliar creada

### Órdenes Futuras

Todas las órdenes creadas **a partir de ahora** reducirán el stock automáticamente:

- ✅ Productos simples → reduce `products.stock_quantity`
- ✅ Productos con variantes → reduce `product_variants.stock_quantity`
- ✅ Validación de stock insuficiente
- ✅ Logs automáticos de reducción

## 🔗 Migración Aplicada

**Nombre:** `add_stock_reduction_trigger_for_variants`

**Contenido:**

1. Función `get_stock_source()`
2. Función `reduce_order_stock()`
3. Trigger `trigger_reduce_order_stock`

**Fecha aplicación:** 17 de octubre de 2025

## ⚠️ Notas Importantes

### Órdenes Anteriores

Las órdenes creadas **ANTES** de este fix no redujeron el stock. Si hay más órdenes antiguas que debieron reducir stock, deberás:

1. Identificarlas:

   ```sql
   SELECT o.id, o.created_at, oi.quantity, oi.variant_id
   FROM orders o
   JOIN order_items oi ON oi.order_id = o.id
   WHERE o.created_at < '2025-10-17 16:00:00'
   AND oi.variant_id IS NOT NULL;
   ```

2. Reducir stock manualmente por cada una

### Cancelación de Órdenes

El trigger solo funciona en **INSERT**. Si permites cancelar órdenes, deberás:

1. Crear trigger para **DELETE** o **UPDATE** de `order_items`
2. Incrementar el stock cuando se cancela
3. Validar que el estado de la orden permita cancelación

### Backup

Antes de crear órdenes de prueba, considera hacer backup del stock:

```sql
CREATE TABLE product_variants_backup AS
SELECT * FROM product_variants;

CREATE TABLE products_backup AS
SELECT * FROM products;
```

## 📝 Conclusión

✅ **Trigger creado** y funcionando
✅ **Stock corregido** para la orden reciente
✅ **Sistema listo** para reducir stock automáticamente en futuras órdenes
✅ **Validación de stock** previene overselling

Ahora el sistema maneja correctamente el inventario tanto para productos simples como para productos con variantes.
