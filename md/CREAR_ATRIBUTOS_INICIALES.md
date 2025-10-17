# Crear Atributos Iniciales para Variantes

## Problema

El VariantEditor no muestra checkboxes para seleccionar atributos porque **no hay atributos creados en la base de datos**.

## Solución Rápida: Insertar Atributos de Prueba

### Opción 1: Usando Supabase SQL Editor

Ejecuta este SQL en Supabase Dashboard → SQL Editor:

```sql
-- Insertar atributos
INSERT INTO product_attributes (name, display_name, display_order, is_active)
VALUES
  ('capacidad', 'Capacidad', 1, true),
  ('color', 'Color', 2, true),
  ('tonelaje', 'Tonelaje', 3, true)
ON CONFLICT (name) DO NOTHING;

-- Obtener IDs de los atributos recién creados
DO $$
DECLARE
  capacidad_id uuid;
  color_id uuid;
  tonelaje_id uuid;
BEGIN
  -- Obtener IDs
  SELECT id INTO capacidad_id FROM product_attributes WHERE name = 'capacidad';
  SELECT id INTO color_id FROM product_attributes WHERE name = 'color';
  SELECT id INTO tonelaje_id FROM product_attributes WHERE name = 'tonelaje';

  -- Insertar valores para Capacidad
  INSERT INTO product_attribute_values (attribute_id, value, display_order, is_active)
  VALUES
    (capacidad_id, '11 Litros', 1, true),
    (capacidad_id, '22 Litros', 2, true),
    (capacidad_id, '33 Litros', 3, true)
  ON CONFLICT DO NOTHING;

  -- Insertar valores para Color
  INSERT INTO product_attribute_values (attribute_id, value, display_order, is_active)
  VALUES
    (color_id, 'Blanco', 1, true),
    (color_id, 'Negro', 2, true),
    (color_id, 'Gris', 3, true),
    (color_id, 'Azul', 4, true)
  ON CONFLICT DO NOTHING;

  -- Insertar valores para Tonelaje
  INSERT INTO product_attribute_values (attribute_id, value, display_order, is_active)
  VALUES
    (tonelaje_id, '1 Tonelada', 1, true),
    (tonelaje_id, '2 Toneladas', 2, true),
    (tonelaje_id, '3 Toneladas', 3, true),
    (tonelaje_id, '5 Toneladas', 4, true)
  ON CONFLICT DO NOTHING;
END $$;

-- Verificar que se crearon correctamente
SELECT
  pa.name,
  pa.display_name,
  pav.value,
  pav.display_order
FROM product_attributes pa
LEFT JOIN product_attribute_values pav ON pav.attribute_id = pa.id
ORDER BY pa.display_order, pav.display_order;
```

### Opción 2: Usando MCP Tool (Supabase)

Si tienes acceso a herramientas MCP:

```sql
-- Crear atributos
INSERT INTO product_attributes (name, display_name, display_order, is_active)
VALUES
  ('capacidad', 'Capacidad', 1, true),
  ('color', 'Color', 2, true),
  ('tonelaje', 'Tonelaje', 3, true);
```

Luego insertar valores (necesitarás los UUIDs de los atributos creados).

## Verificación

Después de ejecutar el SQL:

1. Recarga la página del VariantEditor
2. Deberías ver checkboxes/badges para:
   - **Capacidad**: 11 Litros, 22 Litros, 33 Litros
   - **Color**: Blanco, Negro, Gris, Azul
   - **Tonelaje**: 1 Tonelada, 2 Toneladas, 3 Toneladas, 5 Toneladas

## Próximos Pasos (Recomendado)

Crear una interfaz de administración para gestionar atributos:

**Ubicación sugerida:** `/admin/attributes`

**Funcionalidad:**

- Ver lista de atributos
- Crear nuevo atributo
- Editar atributo existente
- Agregar valores a un atributo
- Ordenar atributos y valores (display_order)
- Activar/desactivar atributos

Esto evitará tener que usar SQL cada vez que necesites un nuevo atributo.

## Atributos Comunes por Tipo de Producto

### Ropa

- Talla: XS, S, M, L, XL, XXL
- Color: Rojo, Azul, Negro, Blanco
- Material: Algodón, Poliéster, Lana

### Electrónica

- Capacidad: 64GB, 128GB, 256GB, 512GB
- Color: Negro, Blanco, Azul, Rojo
- Modelo: Standard, Pro, Plus

### Refrigeradores

- Capacidad: 11L, 22L, 33L, 50L
- Color: Blanco, Negro, Inox
- Tipo: Mini, Compacto, Full Size

### Vehículos/Maquinaria

- Tonelaje: 1T, 2T, 3T, 5T
- Motor: Diesel, Gasolina, Eléctrico
- Transmisión: Manual, Automática
