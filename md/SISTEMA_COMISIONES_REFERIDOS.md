# Sistema de Comisiones para Referidos

## ✅ Funcionamiento Actual (Correcto)

### 1. Asignación de Comisiones

El sistema asigna comisiones **en el momento que una orden cambia a estado "pagado" o "entregado"**, NO al crear la orden.

```sql
-- Trigger: create_referral_commission()
-- Se ejecuta: AFTER INSERT OR UPDATE OF status ON orders
```

### 2. Lógica de Asignación

Cuando una orden cambia a "pagado" o "entregado":

1. **Busca el referidor ACTUAL del cliente** en ese momento
2. Verifica que el referidor esté activo
3. Verifica que el referral no haya expirado
4. Crea la comisión si todo es válido

**Importante**: Usa `ON CONFLICT (order_id) DO NOTHING` para proteger contra duplicados.

### 3. Protección de Comisiones Existentes

```sql
INSERT INTO referral_commissions (...)
VALUES (...)
ON CONFLICT (order_id) DO NOTHING;
```

Esta cláusula **garantiza** que:

- ✅ Si una orden ya tiene comisión asignada, NO se cambia
- ✅ No se pueden crear comisiones duplicadas para la misma orden
- ✅ Las órdenes ya pagadas mantienen su comisión original

## 📋 Escenarios de Uso

### Escenario 1: Cliente sin Referidor → Se le asigna Referidor A

**Orden 1** (pendiente):

- Cuando se paga → Comisión para Referidor A ✅

**Orden 2** (pendiente):

- Cuando se paga → Comisión para Referidor A ✅

**Orden 3** (ya pagada, sin referidor):

- No se modifica, sigue sin comisión ✅

---

### Escenario 2: Cliente tiene Referidor A → Se cambia a Referidor B

**Orden 4** (pendiente, creada cuando tenía Referidor A):

- Cuando se paga → Comisión para Referidor B ✅
- **Razón**: Se busca el referidor actual al momento del pago

**Orden 5** (ya pagada con comisión de Referidor A):

- NO se modifica ✅
- Comisión sigue siendo de Referidor A
- `ON CONFLICT (order_id) DO NOTHING` lo protege

**Orden 6** (nueva orden, después del cambio):

- Cuando se paga → Comisión para Referidor B ✅

---

### Escenario 3: Cliente tiene Referidor A → Se elimina el referidor

**Órdenes pendientes**:

- Cuando se pagan → No se crea comisión (no hay referidor activo) ✅

**Órdenes ya pagadas**:

- Mantienen la comisión de Referidor A ✅

---

## 🔒 Garantías del Sistema

1. **Una orden = Una comisión máximo**

   - Constraint UNIQUE en `referral_commissions(order_id)`

2. **Órdenes pagadas son inmutables**

   - `ON CONFLICT DO NOTHING` protege comisiones existentes

3. **Referidor actual al pago**

   - Se busca el referidor en el momento de marcar como pagado/entregado
   - No se "congela" al crear la orden

4. **No hay reasignación automática**
   - Cambiar el referidor de un cliente NO afecta órdenes ya pagadas
   - Solo afecta órdenes futuras y pendientes

---

## 🎯 Beneficios de Esta Lógica

### Para el Negocio:

- ✅ El referidor actual se lleva la comisión de órdenes pendientes
- ✅ Incentiva a referidores a mantener clientes activos
- ✅ No hay comisiones duplicadas
- ✅ No se pierden comisiones por cambios administrativos

### Para los Referidores:

- ✅ Las comisiones ya pagadas no se les quitan
- ✅ Transparencia: la comisión se asigna cuando se confirma el pago
- ✅ No hay retroactividad: órdenes pasadas no se reasignan

### Para los Clientes:

- ✅ Pueden cambiar de referidor sin afectar órdenes anteriores
- ✅ El sistema es justo y transparente

---

## 🔧 Código Relevante

### Trigger Principal

**Archivo**: `supabase/migrations/012_update_referral_trigger_include_delivered.sql`

```sql
CREATE OR REPLACE FUNCTION create_referral_commission()
RETURNS TRIGGER AS $$
DECLARE
  referral_record RECORD;
BEGIN
  -- Procesar si el estado cambió a "pagado" o "entregado"
  IF (NEW.status IN ('pagado', 'entregado')) AND
     (TG_OP = 'INSERT' OR OLD.status NOT IN ('pagado', 'entregado')) THEN

    -- Buscar referidor ACTUAL
    SELECT r.*, rf.user_id as referrer_user_id
    INTO referral_record
    FROM referrals r
    JOIN referrers rf ON r.referrer_id = rf.id
    WHERE r.referred_user_id = NEW.user_id
      AND r.is_active = true
      AND r.expires_at > NOW()
      AND rf.is_active = true
    LIMIT 1;

    -- Crear comisión con protección de duplicados
    IF FOUND THEN
      INSERT INTO referral_commissions (...)
      VALUES (...)
      ON CONFLICT (order_id) DO NOTHING; -- ⭐ CLAVE
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Tabla de Comisiones

**Constraint**: UNIQUE en `order_id`

```sql
CREATE TABLE referral_commissions (
  id UUID PRIMARY KEY,
  order_id UUID UNIQUE NOT NULL,  -- ⭐ CLAVE
  referrer_id UUID NOT NULL,
  -- ... otros campos
);
```

---

## ❌ Lo que NO hace el sistema

- ❌ NO congela el referidor al crear la orden
- ❌ NO reasigna comisiones de órdenes ya pagadas
- ❌ NO permite múltiples comisiones para la misma orden
- ❌ NO modifica comisiones existentes al cambiar referidor

---

## 📝 Notas Importantes

1. **Cambios de referidor**: Solo afectan órdenes futuras y pendientes
2. **Órdenes sin referidor**: Si se pagan sin referidor asignado, no generan comisión
3. **Expiración de referrals**: Si el referral expira antes de que se pague la orden, no se crea comisión
4. **Referidores inactivos**: Si el referidor se desactiva, sus órdenes pendientes no generarán comisión al pagarse

---

**Última actualización**: 15 de noviembre de 2025  
**Estado**: Sistema funcionando correctamente según especificaciones
