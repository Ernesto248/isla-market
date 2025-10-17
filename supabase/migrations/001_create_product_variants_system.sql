-- =====================================================
-- MIGRACIÓN: Sistema de Variantes de Productos
-- Fecha: 17 de octubre de 2025
-- Descripción: Crea tablas para soportar variantes de productos con atributos
-- =====================================================

-- 1. Tabla de atributos de productos (Ej: Capacidad, Color, Tonelaje)
CREATE TABLE IF NOT EXISTS product_attributes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE, -- nombre interno (capacidad, color)
  display_name VARCHAR(100) NOT NULL, -- nombre para mostrar (Capacidad, Color)
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE product_attributes IS 'Atributos que definen las variantes de productos (Ej: Capacidad, Color, Tonelaje)';

-- 2. Tabla de valores de atributos (Ej: 9L, 11L, Blanco, Negro)
CREATE TABLE IF NOT EXISTS product_attribute_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attribute_id UUID NOT NULL REFERENCES product_attributes(id) ON DELETE CASCADE,
  value VARCHAR(100) NOT NULL, -- valor del atributo (9 litros, Blanco)
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(attribute_id, value) -- No permitir valores duplicados para el mismo atributo
);

COMMENT ON TABLE product_attribute_values IS 'Valores posibles para cada atributo (Ej: 9L, 11L, 17L para Capacidad)';

-- 3. Agregar columna has_variants a products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;

COMMENT ON COLUMN products.has_variants IS 'Indica si el producto tiene variantes. Si es true, precio/stock están en product_variants';

-- 4. Tabla de variantes de productos
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100) UNIQUE, -- SKU único de la variante
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  image_url TEXT, -- Imagen específica de esta variante (opcional)
  attributes_display TEXT, -- String formateado: "11 litros • Blanco"
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE product_variants IS 'Variantes específicas de productos (Ej: Refrigerador 9L Blanco, Refrigerador 11L Negro)';
COMMENT ON COLUMN product_variants.attributes_display IS 'String pre-calculado con atributos para mostrar en UI (Ej: "11 litros • Negro")';

-- 5. Tabla de relación N:N entre variantes y valores de atributos
CREATE TABLE IF NOT EXISTS product_variant_attributes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  attribute_value_id UUID NOT NULL REFERENCES product_attribute_values(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(variant_id, attribute_value_id) -- Una variante no puede tener el mismo valor dos veces
);

COMMENT ON TABLE product_variant_attributes IS 'Relación entre variantes y sus valores de atributos (Ej: Variante X tiene "9 litros" y "Blanco")';

-- =====================================================
-- ÍNDICES para mejorar performance
-- =====================================================

-- Índices en product_attributes
CREATE INDEX IF NOT EXISTS idx_product_attributes_name ON product_attributes(name);
CREATE INDEX IF NOT EXISTS idx_product_attributes_active ON product_attributes(is_active);

-- Índices en product_attribute_values
CREATE INDEX IF NOT EXISTS idx_attribute_values_attribute ON product_attribute_values(attribute_id);
CREATE INDEX IF NOT EXISTS idx_attribute_values_active ON product_attribute_values(is_active);

-- Índices en product_variants
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_variants_active ON product_variants(is_active);

-- Índices en product_variant_attributes
CREATE INDEX IF NOT EXISTS idx_variant_attrs_variant ON product_variant_attributes(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_attrs_value ON product_variant_attributes(attribute_value_id);

-- =====================================================
-- FUNCIÓN: Actualizar attributes_display al crear/modificar variante
-- =====================================================

CREATE OR REPLACE FUNCTION update_variant_attributes_display()
RETURNS TRIGGER AS $$
DECLARE
  v_attributes_text TEXT;
BEGIN
  -- Construir el string de atributos
  SELECT string_agg(pav.value, ' • ' ORDER BY pa.display_order, pav.display_order)
  INTO v_attributes_text
  FROM product_variant_attributes pva
  JOIN product_attribute_values pav ON pva.attribute_value_id = pav.id
  JOIN product_attributes pa ON pav.attribute_id = pa.id
  WHERE pva.variant_id = NEW.variant_id;
  
  -- Actualizar la variante con el texto generado
  UPDATE product_variants
  SET attributes_display = v_attributes_text,
      updated_at = NOW()
  WHERE id = NEW.variant_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar attributes_display automáticamente
DROP TRIGGER IF EXISTS trigger_update_variant_display ON product_variant_attributes;
CREATE TRIGGER trigger_update_variant_display
  AFTER INSERT OR UPDATE OR DELETE ON product_variant_attributes
  FOR EACH ROW
  EXECUTE FUNCTION update_variant_attributes_display();

COMMENT ON FUNCTION update_variant_attributes_display IS 'Actualiza el campo attributes_display cuando cambian los atributos de una variante';

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variant_attributes ENABLE ROW LEVEL SECURITY;

-- Políticas para product_attributes
CREATE POLICY "Todos pueden leer atributos activos"
  ON product_attributes FOR SELECT
  USING (is_active = true);

CREATE POLICY "Solo admins pueden modificar atributos"
  ON product_attributes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Políticas para product_attribute_values
CREATE POLICY "Todos pueden leer valores activos"
  ON product_attribute_values FOR SELECT
  USING (is_active = true);

CREATE POLICY "Solo admins pueden modificar valores"
  ON product_attribute_values FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Políticas para product_variants
CREATE POLICY "Todos pueden leer variantes activas de productos activos"
  ON product_variants FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_variants.product_id
      AND products.is_active = true
    )
  );

CREATE POLICY "Solo admins pueden modificar variantes"
  ON product_variants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Políticas para product_variant_attributes
CREATE POLICY "Todos pueden leer relaciones de variantes activas"
  ON product_variant_attributes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM product_variants
      WHERE product_variants.id = product_variant_attributes.variant_id
      AND product_variants.is_active = true
    )
  );

CREATE POLICY "Solo admins pueden modificar relaciones"
  ON product_variant_attributes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- =====================================================
-- DATOS DE EJEMPLO (Opcional - comentar si no se necesitan)
-- =====================================================

-- Atributo: Capacidad
INSERT INTO product_attributes (name, display_name, display_order)
VALUES ('capacidad', 'Capacidad', 1)
ON CONFLICT (name) DO NOTHING;

-- Valores de Capacidad
INSERT INTO product_attribute_values (attribute_id, value, display_order)
SELECT 
  (SELECT id FROM product_attributes WHERE name = 'capacidad'),
  value,
  display_order
FROM (
  VALUES 
    ('9 litros', 1),
    ('11 litros', 2),
    ('17 litros', 3)
) AS v(value, display_order)
ON CONFLICT (attribute_id, value) DO NOTHING;

-- Atributo: Color
INSERT INTO product_attributes (name, display_name, display_order)
VALUES ('color', 'Color', 2)
ON CONFLICT (name) DO NOTHING;

-- Valores de Color
INSERT INTO product_attribute_values (attribute_id, value, display_order)
SELECT 
  (SELECT id FROM product_attributes WHERE name = 'color'),
  value,
  display_order
FROM (
  VALUES 
    ('Blanco', 1),
    ('Negro', 2),
    ('Plateado', 3)
) AS v(value, display_order)
ON CONFLICT (attribute_id, value) DO NOTHING;

-- Atributo: Tonelaje (para splits)
INSERT INTO product_attributes (name, display_name, display_order)
VALUES ('tonelaje', 'Tonelaje', 3)
ON CONFLICT (name) DO NOTHING;

-- Valores de Tonelaje
INSERT INTO product_attribute_values (attribute_id, value, display_order)
SELECT 
  (SELECT id FROM product_attributes WHERE name = 'tonelaje'),
  value,
  display_order
FROM (
  VALUES 
    ('1 Ton', 1),
    ('1.5 Ton', 2),
    ('2 Ton', 3),
    ('2.5 Ton', 4)
) AS v(value, display_order)
ON CONFLICT (attribute_id, value) DO NOTHING;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Query para verificar que las tablas fueron creadas:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name LIKE 'product_%';

-- Query para verificar atributos y valores de ejemplo:
-- SELECT 
--   pa.name,
--   pa.display_name,
--   COUNT(pav.id) as valores_count
-- FROM product_attributes pa
-- LEFT JOIN product_attribute_values pav ON pa.id = pav.attribute_id
-- GROUP BY pa.id, pa.name, pa.display_name
-- ORDER BY pa.display_order;
