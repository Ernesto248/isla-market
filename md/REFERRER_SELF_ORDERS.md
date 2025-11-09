# Permitir Pedidos de Referidores Propios

**Fecha:** 8 de noviembre de 2025  
**Estado:** ✅ Listo para aplicar

## 📋 Resumen

Se implementó la funcionalidad para que los referidores puedan hacer sus propios pedidos y ganar comisiones en ellos, como si fueran sus propios clientes referidos.

## 🎯 Objetivo

Permitir que los referidores:

1. Hagan pedidos normalmente en la plataforma
2. Ganen comisiones automáticamente en sus propias compras
3. Vean sus propias órdenes en sus estadísticas de referidos

## 🔧 Cambios Implementados

### 1. **Migración de Base de Datos** (`016_allow_referrer_self_orders.sql`)

#### a) Eliminación de Restricción de Auto-Referencia

- **Antes:** Un usuario NO podía referirse a sí mismo
- **Ahora:** Los referidores SÍ pueden tener una auto-referencia
- Se reemplazó `prevent_self_referral()` por `validate_referral()`

#### b) Trigger Automático para Primera Orden

- **Función:** `auto_assign_referrer_on_order()`
- **Cuándo se ejecuta:** ANTES de insertar una nueva orden
- **Qué hace:**
  1. Verifica si el usuario que hace la orden es un referidor activo
  2. Si es referidor y NO tiene auto-referencia, la crea automáticamente
  3. Esto permite que las órdenes subsiguientes generen comisiones

#### c) Auto-Referencias para Referidores Existentes

- Script que crea automáticamente relaciones de auto-referencia
- Se ejecuta una sola vez para todos los referidores activos existentes
- Solo crea la relación si no existe ya

### 2. **Flujo Completo del Sistema**

```
┌─────────────────────────────────────────────────────────────────┐
│ Referidor hace un pedido                                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ TRIGGER: auto_assign_referrer_on_order()                        │
│ - Detecta que es un referidor activo                            │
│ - Verifica si ya tiene auto-referencia                          │
│ - Si NO existe, la crea automáticamente                         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ Orden se crea con estado "pendiente"                            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ Orden se actualiza a "pagado" (pago confirmado)                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ TRIGGER: create_referral_commission()                           │
│ - Busca si el user_id tiene un referidor activo                 │
│ - Encuentra la auto-referencia del referidor                    │
│ - Crea comisión en referral_commissions                         │
│ - Actualiza estadísticas en referrals y referrers               │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Impacto en las Tablas

### `referrals`

```sql
-- Ejemplo de auto-referencia
INSERT INTO referrals (
  referrer_id,        -- ID del referidor en tabla referrers
  referred_user_id,   -- Mismo user_id (auto-referencia)
  referral_code,      -- Su propio código
  commission_rate,    -- Su tasa de comisión (ej: 3.00%)
  expires_at,         -- Fecha de expiración
  is_active           -- true
)
```

### `referral_commissions`

- Las órdenes del referidor generan comisiones normalmente
- La comisión se calcula: `order_total * (commission_rate / 100)`
- Se vincula a la auto-referencia en `referrals`

### `referrers`

- Las estadísticas se actualizan automáticamente:
  - `total_orders` incluye sus propias órdenes
  - `total_sales` incluye sus propias compras
  - `total_commissions` incluye las comisiones de sus compras

## 🚀 Cómo Aplicar la Migración

### Opción 1: Usando Supabase MCP (Recomendado)

```typescript
// Activar herramientas de Supabase
activate_supabase_database_migrations()

// Aplicar la migración
mcp_supabase_apply_migration({
  branch: "main",
  migration_name: "016_allow_referrer_self_orders",
  sql: [CONTENIDO DEL ARCHIVO 016_allow_referrer_self_orders.sql]
})
```

### Opción 2: Manualmente en Supabase Dashboard

1. Ir a Supabase Dashboard → SQL Editor
2. Copiar contenido de `016_allow_referrer_self_orders.sql`
3. Ejecutar el script completo
4. Verificar que no haya errores

### Opción 3: CLI de Supabase

```bash
# Si tienes Supabase CLI instalado
supabase db push
```

## ✅ Verificación Post-Migración

### 1. Verificar que los triggers existen

```sql
-- Verificar triggers
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name IN (
  'trg_validate_referral',
  'trg_auto_assign_referrer_on_order'
)
ORDER BY trigger_name;
```

### 2. Verificar auto-referencias creadas

```sql
-- Ver referidores con auto-referencia
SELECT
  r.referral_code,
  u.full_name,
  u.email,
  ref.created_at as auto_referencia_creada
FROM referrers r
JOIN users u ON r.user_id = u.id
JOIN referrals ref ON ref.referrer_id = r.id AND ref.referred_user_id = r.user_id
WHERE r.is_active = true
ORDER BY ref.created_at DESC;
```

### 3. Probar con una orden de prueba

```sql
-- Simular orden de un referidor
-- (El trigger debe crear la auto-referencia automáticamente)
```

## 📝 Notas Importantes

1. **Retroactividad:** Los referidores existentes obtienen su auto-referencia automáticamente
2. **Nuevos referidores:** La auto-referencia se crea en su primera orden
3. **Comisiones:** Se calculan de la misma forma que para clientes referidos
4. **Estadísticas:** Incluyen las compras propias del referidor
5. **Sin impacto visual:** Los clientes normales no ven ningún cambio

## 🐛 Troubleshooting

### Problema: "Un usuario no puede referirse a sí mismo"

**Solución:** La migración aún no se aplicó. Aplicar `016_allow_referrer_self_orders.sql`

### Problema: Referidor no ve comisiones de sus propias órdenes

**Verificar:**

1. Que existe la auto-referencia en tabla `referrals`
2. Que la orden está en estado "pagado"
3. Que el referidor está activo (`is_active = true`)
4. Que la auto-referencia no está expirada

### Problema: Error al crear auto-referencia

**Verificar:**

1. Que no exista ya una auto-referencia duplicada
2. Que el referidor tenga todos los campos requeridos

## 🔍 Monitoreo

### Ver todas las auto-referencias

```sql
SELECT
  r.referral_code,
  u.full_name,
  ref.total_orders as ordenes_propias,
  ref.total_spent as gastado_propio,
  ref.total_commission_generated as comisiones_propias
FROM referrers r
JOIN users u ON r.user_id = u.id
JOIN referrals ref ON ref.referrer_id = r.id AND ref.referred_user_id = r.user_id
WHERE r.is_active = true;
```

### Ver comisiones de órdenes propias

```sql
SELECT
  rc.order_id,
  o.created_at,
  rc.order_total,
  rc.commission_rate,
  rc.commission_amount,
  u.full_name as referidor
FROM referral_commissions rc
JOIN orders o ON rc.order_id = o.id
JOIN referrers r ON rc.referrer_id = r.id
JOIN users u ON r.user_id = u.id
WHERE rc.referred_user_id = rc.referrer_id  -- Auto-referencia
ORDER BY o.created_at DESC;
```

## 🎉 Beneficios

1. ✅ Incentiva a los referidores a comprar en su propia plataforma
2. ✅ Simplifica la gestión (no necesitan crear cuentas separadas)
3. ✅ Aumenta la lealtad de los referidores
4. ✅ Sistema completamente automatizado
5. ✅ Sin cambios en la UI para usuarios normales
