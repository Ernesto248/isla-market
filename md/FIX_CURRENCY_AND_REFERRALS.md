# Fix: Moneda y Comisiones de Referidos

**Fecha:** 10 de octubre de 2025  
**Tipo:** Corrección de bugs (UI + Base de datos)  
**Prioridad:** Alta

---

## 🐛 Problemas Identificados

### 1. Símbolo de Moneda Incorrecto

**Ubicaciones afectadas:**

- `app/admin/referrers/dashboard/page.tsx` - Ventas y comisiones
- `app/profile/referrals/page.tsx` - Panel de referidos del usuario

**Problema:**

- Mostraba símbolo de euros (€) en lugar de pesos dominicanos ($)
- En algunos lugares mostraba "RD$" con formato incorrecto

**Causa raíz:**
La función `formatCurrency` en `lib/utils.ts` estaba configurada con:

```typescript
currency: "EUR"; // ❌ Euros
```

### 2. Comisiones No Incluían Órdenes "Entregado"

**Ubicaciones afectadas:**

- Trigger `create_referral_commission` en la base de datos
- Estadísticas de referrers y referidos

**Problema:**

- Solo se creaban comisiones cuando una orden tenía status "pagado"
- Las órdenes con status "entregado" no generaban comisiones
- Lógica inconsistente: una orden "entregada" implica que está pagada

**Causa raíz:**
El trigger SQL solo verificaba:

```sql
IF NEW.status = 'pagado' THEN  -- ❌ Solo pagado
```

---

## ✅ Soluciones Implementadas

### 1. Corrección del Formato de Moneda

**Archivo:** `lib/utils.ts`

**Antes:**

```typescript
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR", // ❌ Euros
  }).format(amount);
}
```

**Después:**

```typescript
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP", // ✅ Pesos Dominicanos
    minimumFractionDigits: 2,
  }).format(amount);
}
```

**Resultado:**

- ✅ Ahora muestra: `RD$1,524.92` en lugar de `€1,524.92`
- ✅ Formato correcto para República Dominicana (es-DO)
- ✅ Siempre muestra 2 decimales para montos de dinero

---

### 2. Inclusión de Órdenes "Entregado" en Comisiones

**Archivo creado:** `supabase/migrations/012_update_referral_trigger_include_delivered.sql`

**Cambios en el trigger:**

**Antes:**

```sql
-- Solo procesaba órdenes con status "pagado"
IF NEW.status = 'pagado' AND (TG_OP = 'INSERT' OR OLD.status != 'pagado') THEN
```

**Después:**

```sql
-- Ahora procesa órdenes con status "pagado" O "entregado"
IF (NEW.status IN ('pagado', 'entregado')) AND
   (TG_OP = 'INSERT' OR OLD.status NOT IN ('pagado', 'entregado')) THEN
```

**Lógica de negocio:**

1. Una orden con status "entregado" necesariamente está pagada
2. El flujo normal es: `pendiente` → `pagado` → `entregado`
3. Ambos estados ("pagado" y "entregado") representan ventas confirmadas
4. Las comisiones deben generarse en cualquiera de estos dos estados

---

## 📊 Impacto de los Cambios

### Páginas Afectadas (Positivamente)

1. **Admin Dashboard - Referidos** (`/admin/referrers/dashboard`)

   - ✅ Ventas generadas ahora muestran RD$ correctamente
   - ✅ Comisiones totales en formato correcto
   - ✅ Incluye órdenes entregadas en estadísticas

2. **Perfil de Usuario - Mis Referidos** (`/profile/referrals`)

   - ✅ Panel de estadísticas con moneda correcta
   - ✅ Tabla de referidos activos con formato RD$
   - ✅ Tabla de comisiones recientes con moneda correcta
   - ✅ Incluye comisiones de órdenes entregadas

3. **Admin Stats - Ventas Confirmadas** (cambio previo relacionado)
   - ✅ Consistente con la lógica de incluir "entregado"

---

## 🔍 Ejemplos de Formato

### Antes vs Después

| Ubicación          | Antes     | Después     |
| ------------------ | --------- | ----------- |
| Ventas Generadas   | €1,524.92 | RD$1,524.92 |
| Comisiones Totales | €45.75    | RD$45.75    |
| Total Gastado      | €614.99   | RD$614.99   |
| Comisión por Orden | €18.45    | RD$18.45    |

---

## 🗃️ Base de Datos: Migración Detallada

### Archivos de Migración Relacionados

1. **009_fix_referral_trigger_status.sql**

   - Cambió "paid" a "pagado" (inglés → español)
   - Solo incluía status "pagado"

2. **012_update_referral_trigger_include_delivered.sql** (NUEVO)
   - Incluye status "entregado" además de "pagado"
   - Actualiza función `create_referral_commission()`
   - Actualiza función `update_referrer_stats()`

### Función del Trigger: create_referral_commission()

**Responsabilidades:**

1. Se ejecuta después de INSERT o UPDATE en la tabla `orders`
2. Verifica si el status cambió a "pagado" o "entregado"
3. Busca si el usuario tiene un referidor activo
4. Crea un registro en `referral_commissions`
5. Actualiza estadísticas en tabla `referrals`

**Campos actualizados en `referrals`:**

- `total_orders`: Cuenta de órdenes confirmadas
- `total_spent`: Suma del monto de las órdenes
- `total_commission_generated`: Suma de comisiones generadas
- `last_order_at`: Fecha de la última orden

### Función del Trigger: update_referrer_stats()

**Responsabilidades:**

1. Se ejecuta después de INSERT en `referral_commissions`
2. Recalcula todas las estadísticas del referrer
3. Cuenta referidos únicos
4. Suma órdenes totales
5. Suma ventas totales
6. Suma comisiones totales

**Campos actualizados en `referrers`:**

- `total_referrals`: Cantidad de personas referidas
- `total_orders`: Órdenes generadas por referidos
- `total_sales`: Ventas totales de referidos
- `total_commissions`: Comisiones acumuladas
- `last_commission_at`: Fecha de última comisión

---

## 🧪 Casos de Prueba

### Test 1: Formato de Moneda

**Páginas a verificar:**

1. `/admin/referrers/dashboard`
2. `/profile/referrals`

**Verificar:**

- [ ] Símbolo de moneda es "RD$" (no "€")
- [ ] Formato numérico correcto (1,234.56)
- [ ] Siempre muestra 2 decimales

### Test 2: Comisiones con Órdenes Entregadas

**Escenario:**

1. Usuario A es referidor
2. Usuario B se registra con código de A
3. Usuario B hace una orden (status: pendiente)
4. Orden cambia a "pagado" → debe crear comisión
5. Orden cambia a "entregado" → debe actualizar stats

**Verificar:**

- [ ] Comisión se crea cuando status = "pagado"
- [ ] Comisión se crea cuando status = "entregado" (si no existía)
- [ ] Estadísticas se actualizan correctamente
- [ ] No se crean comisiones duplicadas

### Test 3: Estadísticas Históricas

**Después de aplicar la migración:**

- [ ] Órdenes antiguas con status "entregado" deben considerarse
- [ ] Las estadísticas deben recalcularse correctamente
- [ ] Panel de admin muestra números actualizados

---

## 📝 Notas Adicionales

### Consideraciones de Moneda

- **Locale:** `es-DO` (Español - República Dominicana)
- **Código ISO:** `DOP` (Dominican Peso)
- **Símbolo:** `RD$`
- **Formato:** Separador de miles con coma, decimales con punto

### Lógica de Estados de Orden

```
pendiente → pagado → entregado
   ❌         ✅         ✅
           (genera      (también
           comisión)    genera si
                        no existe)
```

### Prevención de Duplicados

El trigger incluye:

```sql
ON CONFLICT (order_id) DO NOTHING;
```

Esto previene que se creen múltiples comisiones para la misma orden.

---

## 🚀 Pasos para Aplicar

### 1. Aplicar Migración de Base de Datos

```bash
# Opción A: Supabase CLI
supabase db push

# Opción B: SQL directo en Supabase Dashboard
# Copiar y ejecutar el contenido de:
# supabase/migrations/012_update_referral_trigger_include_delivered.sql
```

### 2. Desplegar Código

```bash
# Los cambios en lib/utils.ts ya están aplicados
# Hacer commit y push a Vercel
git add .
git commit -m "fix: Corregir moneda (EUR→DOP) e incluir órdenes entregadas en comisiones"
git push origin main
```

### 3. Verificación Post-Deploy

1. Revisar dashboard de referidos
2. Verificar formato de moneda
3. Comprobar que comisiones incluyen órdenes entregadas
4. Validar estadísticas actualizadas

---

## 🔗 Archivos Modificados

### Código Frontend

- ✅ `lib/utils.ts` - Función formatCurrency actualizada

### Base de Datos

- ✅ `supabase/migrations/012_update_referral_trigger_include_delivered.sql` - Nuevo trigger

### Archivos Sin Cambios (usan formatCurrency)

- `app/admin/referrers/dashboard/page.tsx` - Solo usa la función
- `app/profile/referrals/page.tsx` - Solo usa la función
- `app/admin/referrers/[id]/page.tsx` - Solo usa la función

**Beneficio:** Al centralizar el formato en `formatCurrency`, todos los lugares que lo usan se actualizan automáticamente. ✨

---

## ✅ Estado Final

**Moneda:**

- ✅ Formato correcto: RD$ en lugar de €
- ✅ Locale correcto: es-DO
- ✅ Decimales consistentes: siempre 2

**Comisiones:**

- ✅ Se generan con status "pagado"
- ✅ Se generan con status "entregado"
- ✅ Estadísticas incluyen ambos estados
- ✅ Sin comisiones duplicadas

**Consistencia:**

- ✅ Alineado con cambios previos en admin/stats
- ✅ Alineado con cambios en admin/analytics
- ✅ Lógica de negocio coherente en todo el sistema
