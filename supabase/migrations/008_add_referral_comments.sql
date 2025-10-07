-- =====================================================
-- COMENTARIOS DESCRIPTIVOS PARA TABLAS DE REFERIDOS
-- Fecha: 6 de octubre de 2025
-- =====================================================

-- Tabla: referral_program_config
COMMENT ON TABLE referral_program_config IS 'Configuración global del programa de referidos';
COMMENT ON COLUMN referral_program_config.default_commission_rate IS 'Tasa de comisión por defecto (%)';
COMMENT ON COLUMN referral_program_config.default_duration_months IS 'Duración por defecto del programa (meses)';
COMMENT ON COLUMN referral_program_config.is_program_active IS 'Si el programa está activo globalmente';

-- Tabla: referrers
COMMENT ON TABLE referrers IS 'Usuarios que pueden referir clientes (asignados manualmente por admins)';
COMMENT ON COLUMN referrers.referral_code IS 'Código único del referidor (ej: JUAN2024)';
COMMENT ON COLUMN referrers.commission_rate IS 'Tasa de comisión específica para este referidor (%)';
COMMENT ON COLUMN referrers.duration_months IS 'Duración del programa para este referidor (meses)';
COMMENT ON COLUMN referrers.total_referrals IS 'Total de personas referidas (histórico)';
COMMENT ON COLUMN referrers.active_referrals IS 'Referencias actualmente activas (no expiradas)';
COMMENT ON COLUMN referrers.total_orders IS 'Total de órdenes generadas por referidos';
COMMENT ON COLUMN referrers.total_sales IS 'Suma total de ventas generadas ($)';
COMMENT ON COLUMN referrers.total_commissions IS 'Suma total de comisiones ganadas ($)';

-- Tabla: referrals
COMMENT ON TABLE referrals IS 'Relaciones entre referidores y usuarios referidos';
COMMENT ON COLUMN referrals.expires_at IS 'Fecha de expiración (calculada automáticamente)';
COMMENT ON COLUMN referrals.is_active IS 'Si la referencia está activa (puede cambiar a false si expira o se desactiva manualmente)';
COMMENT ON COLUMN referrals.total_orders IS 'Órdenes realizadas por este referido';
COMMENT ON COLUMN referrals.total_spent IS 'Total gastado por este referido ($)';
COMMENT ON COLUMN referrals.total_commission_generated IS 'Comisión total generada por este referido ($)';
COMMENT ON COLUMN referrals.last_order_at IS 'Fecha de la última orden del referido';

-- Tabla: referral_commissions
COMMENT ON TABLE referral_commissions IS 'Comisiones generadas por cada orden "paid" (creadas automáticamente por trigger)';
COMMENT ON COLUMN referral_commissions.order_total IS 'Total de la orden ($)';
COMMENT ON COLUMN referral_commissions.commission_rate IS 'Tasa de comisión aplicada en el momento (%)';
COMMENT ON COLUMN referral_commissions.commission_amount IS 'Monto de comisión calculado ($)';
