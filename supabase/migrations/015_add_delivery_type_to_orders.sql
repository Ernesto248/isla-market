-- Migración: Agregar soporte para tipo de entrega (domicilio vs recogida en tienda)
-- Fecha: 2025-10-26
-- Descripción: 
-- - Agrega campo delivery_type a orders ('home_delivery' o 'store_pickup')
-- - Agrega campo shipping_fee a orders (cargo adicional por envío)
-- - Hace opcionales los campos de dirección en shipping_addresses para permitir recogida

-- 1. Agregar delivery_type a orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'home_delivery' CHECK (delivery_type IN ('home_delivery', 'store_pickup'));

-- 2. Agregar shipping_fee a orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(10, 2) DEFAULT 0.00;

-- 3. Actualizar órdenes existentes con valores por defecto
UPDATE orders 
SET delivery_type = 'home_delivery', 
    shipping_fee = 0.00
WHERE delivery_type IS NULL;

-- 4. Hacer delivery_type NOT NULL después de actualizar datos existentes
ALTER TABLE orders
ALTER COLUMN delivery_type SET NOT NULL;

-- 5. Hacer campos de dirección opcionales en shipping_addresses
-- (para permitir recogida en tienda donde solo se necesita nombre, apellido y teléfono)
ALTER TABLE shipping_addresses
ALTER COLUMN street DROP NOT NULL;

ALTER TABLE shipping_addresses
ALTER COLUMN house_number DROP NOT NULL;

ALTER TABLE shipping_addresses
ALTER COLUMN between_streets DROP NOT NULL;

ALTER TABLE shipping_addresses
ALTER COLUMN neighborhood DROP NOT NULL;

ALTER TABLE shipping_addresses
ALTER COLUMN province DROP NOT NULL;

-- 6. Agregar comentarios para documentación
COMMENT ON COLUMN orders.delivery_type IS 'Tipo de entrega: home_delivery (entrega a domicilio con cargo adicional) o store_pickup (recogida en tienda sin cargo)';
COMMENT ON COLUMN orders.shipping_fee IS 'Cargo adicional por envío a domicilio (USD). 0.00 para recogida en tienda';
COMMENT ON COLUMN shipping_addresses.street IS 'Calle (requerido solo para home_delivery)';
COMMENT ON COLUMN shipping_addresses.house_number IS 'Número de casa (requerido solo para home_delivery)';
COMMENT ON COLUMN shipping_addresses.between_streets IS 'Entre calles (requerido solo para home_delivery)';
COMMENT ON COLUMN shipping_addresses.neighborhood IS 'Barrio (requerido solo para home_delivery)';
COMMENT ON COLUMN shipping_addresses.province IS 'Provincia (requerido solo para home_delivery)';

-- 7. Crear índice para mejorar queries por tipo de entrega
CREATE INDEX IF NOT EXISTS idx_orders_delivery_type ON orders(delivery_type);

-- Nota: Las políticas RLS existentes siguen aplicándose sin cambios
