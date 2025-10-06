-- Migración: Agregar campo slug a la tabla products
-- Fecha: 2025-10-04
-- Descripción: Agrega un campo slug único para URLs amigables en los productos

-- Agregar columna slug
ALTER TABLE products 
ADD COLUMN slug TEXT;

-- Crear función para generar slug desde el nombre
CREATE OR REPLACE FUNCTION generate_slug(text_input TEXT)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
BEGIN
  -- Convertir a minúsculas, reemplazar espacios y caracteres especiales
  slug := lower(text_input);
  slug := regexp_replace(slug, '[áàäâ]', 'a', 'g');
  slug := regexp_replace(slug, '[éèëê]', 'e', 'g');
  slug := regexp_replace(slug, '[íìïî]', 'i', 'g');
  slug := regexp_replace(slug, '[óòöô]', 'o', 'g');
  slug := regexp_replace(slug, '[úùüû]', 'u', 'g');
  slug := regexp_replace(slug, '[ñ]', 'n', 'g');
  slug := regexp_replace(slug, '[^a-z0-9\s-]', '', 'g');
  slug := regexp_replace(slug, '\s+', '-', 'g');
  slug := regexp_replace(slug, '-+', '-', 'g');
  slug := trim(both '-' from slug);
  
  RETURN slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Generar slugs para productos existentes
UPDATE products 
SET slug = generate_slug(name) || '-' || substring(id::text, 1, 8)
WHERE slug IS NULL;

-- Hacer el campo slug NOT NULL y UNIQUE
ALTER TABLE products 
ALTER COLUMN slug SET NOT NULL,
ADD CONSTRAINT products_slug_unique UNIQUE (slug);

-- Crear índice para búsquedas rápidas por slug
CREATE INDEX idx_products_slug ON products(slug);

-- Crear trigger para generar slug automáticamente al insertar/actualizar
CREATE OR REPLACE FUNCTION auto_generate_product_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  slug_exists BOOLEAN;
  counter INTEGER := 0;
BEGIN
  -- Si ya tiene slug y no cambió el nombre, mantener el slug
  IF NEW.slug IS NOT NULL AND (TG_OP = 'UPDATE' AND OLD.name = NEW.name) THEN
    RETURN NEW;
  END IF;

  -- Generar slug base desde el nombre
  base_slug := generate_slug(NEW.name);
  final_slug := base_slug;

  -- Verificar si el slug ya existe y agregar número si es necesario
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM products 
      WHERE slug = final_slug 
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) INTO slug_exists;

    EXIT WHEN NOT slug_exists;

    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar el trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_product_slug ON products;
CREATE TRIGGER trigger_auto_generate_product_slug
  BEFORE INSERT OR UPDATE OF name
  ON products
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_product_slug();

-- Comentarios para documentación
COMMENT ON COLUMN products.slug IS 'URL-friendly slug generado automáticamente desde el nombre del producto';
COMMENT ON FUNCTION generate_slug(TEXT) IS 'Convierte texto a formato slug (minúsculas, sin acentos, guiones)';
COMMENT ON FUNCTION auto_generate_product_slug() IS 'Genera automáticamente el slug del producto al insertar o actualizar';
