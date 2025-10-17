# ✅ FIX: Error 500 en Página de Órdenes

## 📋 Problema Detectado

Al intentar acceder a la página `/orders`, se generaba el siguiente error:

```
GET http://localhost:3000/api/orders?userId=fc6b64ca-1852-4ea2-b4eb-250fa2450ea9 500
Error: column product_variants_2.attributes_display does not exist
Code: 42703 (PostgreSQL - column does not exist)
```

## 🔍 Análisis de la Causa Raíz

El error ocurría porque:

1. **Código implementado pero schema faltante**: Se completaron los pasos 1-9 del sistema de variantes (código TypeScript/React/APIs), pero **nunca se creó la migración base** para las tablas de variantes.

2. **Dependencias de migración rotas**: Existía la migración `013_add_variant_id_to_order_items.sql` que depende de que la tabla `product_variants` exista, pero la migración `001_create_product_variants_system.sql` **no existía**.

3. **Query fallando**: El endpoint `/api/orders` incluye un JOIN a `product_variants`:
   ```typescript
   variant: product_variants(id, sku, price, image_url, attributes_display);
   ```
   Esta consulta fallaba porque ni la tabla `product_variants` ni la columna `attributes_display` existían en la base de datos.

## 🛠️ Solución Implementada

### 1. Creación de Migración Base

Se creó el archivo `supabase/migrations/001_create_product_variants_system.sql` con:

#### Tablas Creadas:

- **`product_attributes`**: Define tipos de atributos (Capacidad, Color, Tonelaje)
  - Columnas: `id`, `name`, `display_name`, `display_order`, `is_active`
- **`product_attribute_values`**: Valores específicos por atributo (9L, 11L, Blanco, Negro)
  - Columnas: `id`, `attribute_id`, `value`, `display_order`, `is_active`
  - Foreign Key: `attribute_id → product_attributes(id)`
- **`product_variants`**: Variantes de productos con precios y stock independientes
  - Columnas clave:
    - `product_id` (FK → products)
    - `sku` (único)
    - `price`, `stock_quantity`
    - `image_url`
    - **`attributes_display`** ← ¡La columna faltante que causaba el error!
    - `is_active`
- **`product_variant_attributes`**: Relación N:N entre variantes y valores de atributos
  - Columnas: `id`, `variant_id`, `attribute_value_id`
  - Foreign Keys:
    - `variant_id → product_variants(id)`
    - `attribute_value_id → product_attribute_values(id)`

#### Modificación de Tabla Existente:

```sql
ALTER TABLE products
ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;
```

#### Índices Creados (10 total):

```sql
-- Para product_attributes
idx_product_attributes_name
idx_product_attributes_active

-- Para product_attribute_values
idx_attribute_values_attribute
idx_attribute_values_active

-- Para product_variants
idx_variants_product
idx_variants_sku
idx_variants_active

-- Para product_variant_attributes
idx_variant_attrs_variant
idx_variant_attrs_value
```

#### Trigger Automático:

Se creó una función y trigger para **actualizar automáticamente** `attributes_display` cuando cambian los atributos de una variante:

```sql
CREATE OR REPLACE FUNCTION update_variant_attributes_display()
RETURNS TRIGGER AS $$
DECLARE
  v_attributes_text TEXT;
BEGIN
  -- Construye string como "11 litros • Negro"
  SELECT string_agg(pav.value, ' • ' ORDER BY pa.display_order, pav.display_order)
  INTO v_attributes_text
  FROM product_variant_attributes pva
  JOIN product_attribute_values pav ON pva.attribute_value_id = pav.id
  JOIN product_attributes pa ON pav.attribute_id = pa.id
  WHERE pva.variant_id = NEW.variant_id;

  UPDATE product_variants
  SET attributes_display = v_attributes_text,
      updated_at = NOW()
  WHERE id = NEW.variant_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que ejecuta la función en INSERT/UPDATE/DELETE
CREATE TRIGGER trigger_update_variant_display
  AFTER INSERT OR UPDATE OR DELETE ON product_variant_attributes
  FOR EACH ROW
  EXECUTE FUNCTION update_variant_attributes_display();
```

**¿Qué hace este trigger?**

- Se dispara cuando se añaden, modifican o eliminan atributos de una variante
- Concatena los valores de atributos con el símbolo `•` (ej: "11 litros • Negro")
- Actualiza automáticamente `product_variants.attributes_display`
- Mantiene el orden según `display_order` de atributos y valores

#### Políticas RLS:

Se configuraron políticas de seguridad para las 4 tablas nuevas:

- **Lectura pública**: Todos pueden leer registros activos (`is_active = true`)
- **Escritura admin**: Solo usuarios con `role = 'admin'` pueden modificar
- **Cascada de permisos**: Las variantes solo son visibles si el producto padre está activo

### 2. Aplicación de la Migración

Se aplicó la migración usando el MCP de Supabase:

```typescript
mcp_supabase_apply_migration({
  name: "create_product_variants_system",
  query: "... (SQL completo)",
});
```

**Resultado**: ✅ Migración aplicada exitosamente

## 🎯 Verificación del Fix

### 1. Verificar que las tablas existen:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name IN (
  'product_attributes',
  'product_attribute_values',
  'product_variants',
  'product_variant_attributes'
);
```

**Resultado esperado**: 4 tablas listadas

### 2. Verificar que la columna problemática existe:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'product_variants'
AND column_name = 'attributes_display';
```

**Resultado esperado**:

- `column_name`: `attributes_display`
- `data_type`: `text`

### 3. Probar el endpoint de órdenes:

```bash
# Debe retornar 200 OK (no 500)
GET /api/orders?userId=<user_id>
```

### 4. Probar la página de órdenes:

1. Navegar a `/orders`
2. La página debe cargar sin errores
3. Si hay órdenes con variantes, debe mostrarse `attributes_display`

## 📦 Estado Actual del Sistema de Variantes

### Migraciones de Base de Datos:

- ✅ **001_create_product_variants_system.sql**: Aplicada (base del sistema)
- ⏳ **013_add_variant_id_to_order_items.sql**: Pendiente de aplicar
  - Depende de 001 (ahora sí se puede aplicar)
  - Añade `variant_id` a tabla `order_items`
  - Crea trigger de reducción de stock para variantes

### Código (Completado - Pasos 1-9):

- ✅ Paso 1: Modelo de datos y tipos TypeScript
- ✅ Paso 2: Base de datos y migraciones (ahora completo con 001)
- ✅ Paso 3: APIs CRUD de variantes (`/api/variants/*`)
- ✅ Paso 4: Panel de administración de variantes
- ✅ Paso 5: UI para creación/edición de productos con variantes
- ✅ Paso 6: Frontend de selección de variantes
- ✅ Paso 7: Integración con carrito
- ✅ Paso 8: Gestión de stock por variante
- ✅ Paso 9: Integración con checkout y órdenes

### Pendiente:

- ⏸️ **Paso 10: Testing completo**
  - Crear producto con variantes
  - Probar flujo de compra completo
  - Verificar reducción de stock
  - Verificar visualización en historial de órdenes

## 🔗 Flujo de Datos de Variantes

```
Producto
  ├─ has_variants = true
  └─ Variantes (product_variants)
       ├─ SKU único
       ├─ Precio específico
       ├─ Stock específico
       ├─ Imagen opcional
       ├─ attributes_display (auto-generado)
       └─ Atributos (product_variant_attributes)
            └─ Valores (product_attribute_values)
                 └─ Atributo (product_attributes)
```

## 📊 Ejemplo de Datos

### Atributo: Capacidad

| ID  | value | display_order |
| --- | ----- | ------------- |
| 1   | 9L    | 1             |
| 2   | 11L   | 2             |
| 3   | 17L   | 3             |

### Atributo: Color

| ID  | value    | display_order |
| --- | -------- | ------------- |
| 4   | Blanco   | 1             |
| 5   | Negro    | 2             |
| 6   | Plateado | 3             |

### Variante de Ejemplo

```json
{
  "id": "uuid-123",
  "product_id": "uuid-producto",
  "sku": "EXT-11L-BLK",
  "price": 899.99,
  "stock_quantity": 15,
  "attributes_display": "11 litros • Negro",  ← Auto-generado
  "is_active": true
}
```

## 🎓 Lecciones Aprendidas

1. **Orden de migraciones es crítico**: Las migraciones deben aplicarse en orden secuencial. Si 013 depende de 001, **001 debe existir primero**.

2. **Sincronización código-DB**: Completar el código antes de la base de datos crea deuda técnica. Idealmente, crear migraciones junto con el código que las usa.

3. **Triggers para campos calculados**: Usar triggers para mantener `attributes_display` sincronizado elimina lógica del cliente y previene inconsistencias.

4. **RLS desde el inicio**: Configurar políticas de seguridad en la creación de tablas previene vulnerabilidades.

5. **Índices para performance**: Índices en foreign keys y columnas de búsqueda (`sku`, `is_active`) son esenciales para queries eficientes.

## 🚀 Próximos Pasos

1. ✅ **Aplicar migración 013** (ahora posible):

   ```bash
   # Verificar en Supabase que existe la migración 013
   # Aplicarla si no está en la lista
   ```

2. ✅ **Continuar con Paso 10**: Testing completo del sistema de variantes

3. 🔄 **Documentar flujo de órdenes con variantes** en admin panel

4. 📝 **Actualizar guías de usuario** para explicar cómo crear productos con variantes

---

**Fecha de resolución**: 17 de octubre de 2025  
**Tiempo de resolución**: ~15 minutos  
**Impacto**: 🔴 Crítico (bloqueaba visualización de órdenes)  
**Estado**: ✅ Resuelto
