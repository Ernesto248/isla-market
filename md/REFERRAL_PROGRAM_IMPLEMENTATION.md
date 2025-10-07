# 🎯 Implementación del Programa de Referidos

**Fecha de inicio:** 6 de octubre de 2025
**Estado:** 🚧 En Desarrollo - Fase 1 ✅ | Fase 2 ✅ | Fase 3 En Progreso

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Decisiones de Negocio](#decisiones-de-negocio)
3. [Arquitectura de Base de Datos](#arquitectura-de-base-de-datos)
4. [Plan de Implementación](#plan-de-implementación)
5. [Fase 1: Base de Datos](#fase-1-base-de-datos)
6. [Fase 2: Backend APIs](#fase-2-backend-apis)
7. [Fase 3: Panel de Admin](#fase-3-panel-de-admin)
8. [Fase 4: Vista de Usuario](#fase-4-vista-de-usuario)
9. [Fase 5: Reportes](#fase-5-reportes)
10. [Testing](#testing)
11. [Preguntas Pendientes](#preguntas-pendientes)

---

## 🎯 Resumen Ejecutivo

### Objetivo

Implementar un sistema de referidos manual donde usuarios seleccionados por el admin pueden ganar comisiones por referir nuevos clientes.

### Características Principales

- ✅ Asignación manual de códigos de referido por admin
- ✅ Comisión configurable por referidor (default 3%)
- ✅ Duración configurable por referidor (default 6 meses)
- ✅ Sin límites de comisión ni referidos
- ✅ Tracking automático de comisiones
- ✅ Pago manual en cash (sistema solo reporta)
- ✅ Dashboard de admin con estadísticas
- ✅ Ranking de top referidores
- ✅ Vista para referidores ver sus métricas

---

## 💼 Decisiones de Negocio

### ✅ Confirmadas

| Decisión       | Valor                                         |
| -------------- | --------------------------------------------- |
| **Duración**   | Configurable por referidor (default: 6 meses) |
| **Comisión**   | Configurable por referidor (default: 3%)      |
| **Alcance**    | Todas las compras durante el período          |
| **Límites**    | Sin límites de comisión ni referidos          |
| **Asignación** | Manual - Solo admin asigna códigos            |
| **Pago**       | Manual en cash (sistema solo trackea)         |
| **Ranking**    | Sí - Top referidores                          |
| **Niveles**    | No                                            |
| **Bonos**      | No                                            |

### ✅ Decisiones Confirmadas

1. **Información del referido al referidor**

   - ✅ **Opción A:** Nombre completo y email
   - Mostrar información completa del referido al referidor

2. **Los referidos saben quién los refirió**

   - ⚠️ **Pendiente de confirmar**
   - Sugerencia: No (privado)

3. **Proceso cuando expira un referido**

   - ⚠️ **Pendiente de confirmar**
   - Sugerencia: Se desactiva automáticamente

4. **Órdenes canceladas/devueltas**

   - ✅ **Confirmado:** Solo comisionar órdenes con status "paid"
   - Trigger se ejecutará solo cuando order.status = 'paid'

5. **Notificaciones por email**

   - ✅ **Confirmado:**
     - ✅ Cuando se le asigna como referidor (bienvenida)
     - ✅ Cuando alguien se registra con su código
     - ✅ Cuando un referido hace una compra
     - ❌ Resumen mensual (no implementar por ahora)
     - ❌ Referido próximo a expirar (no implementar por ahora)

6. **Código de referido editable**

   - ⚠️ **Pendiente de confirmar**
   - Sugerencia: No editable (permanente)

7. **Límite de caracteres para el código**
   - ⚠️ **Pendiente de confirmar**
   - Sugerencia: 6-15 caracteres, solo letras mayúsculas y números

---

## 🏗️ Arquitectura de Base de Datos

### Diagrama de Relaciones

```
┌─────────────────┐
│   auth.users    │
└────────┬────────┘
         │
         │ 1:1 (opcional)
         │
┌────────▼────────────┐        ┌──────────────────┐
│   referrers         │◄───────│ referral_program │
│                     │   1:1  │     _config      │
│ - user_id (FK)      │        └──────────────────┘
│ - referral_code     │
│ - commission_rate   │
│ - duration_months   │
│ - is_active         │
│ - stats...          │
└────────┬────────────┘
         │
         │ 1:N
         │
┌────────▼────────────┐
│    referrals        │
│                     │
│ - referrer_id (FK)  │
│ - referred_user (FK)│───────► auth.users
│ - expires_at        │
│ - is_active         │
│ - stats...          │
└────────┬────────────┘
         │
         │ 1:N
         │
┌────────▼─────────────┐
│ referral_commissions │
│                      │
│ - referral_id (FK)   │
│ - order_id (FK)      │───────► orders
│ - commission_amount  │
│ - created_at         │
└──────────────────────┘
```

### Tablas Principales

#### 1. `referrers` - Usuarios que pueden referir

```sql
CREATE TABLE referrers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 3.00,
  duration_months INTEGER DEFAULT 6,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT,

  -- Estadísticas agregadas
  total_referrals INTEGER DEFAULT 0,
  active_referrals INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_sales DECIMAL(10,2) DEFAULT 0,
  total_commissions DECIMAL(10,2) DEFAULT 0
);
```

#### 2. `referrals` - Relación referidor-referido

```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES referrers(id) NOT NULL,
  referred_user_id UUID REFERENCES auth.users(id) NOT NULL,
  referral_code VARCHAR(20) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,

  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,

  -- Estadísticas de este referido específico
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  total_commission_generated DECIMAL(10,2) DEFAULT 0,
  last_order_at TIMESTAMP,

  UNIQUE(referrer_id, referred_user_id)
);
```

#### 3. `referral_commissions` - Tracking detallado de comisiones

```sql
CREATE TABLE referral_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_id UUID REFERENCES referrals(id) NOT NULL,
  referrer_id UUID REFERENCES referrers(id) NOT NULL,
  order_id UUID REFERENCES orders(id) NOT NULL,
  referred_user_id UUID REFERENCES auth.users(id) NOT NULL,

  order_total DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(order_id)
);
```

#### 4. `referral_program_config` - Configuración global

```sql
CREATE TABLE referral_program_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  default_commission_rate DECIMAL(5,2) DEFAULT 3.00,
  default_duration_months INTEGER DEFAULT 6,
  is_program_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);
```

---

## 📅 Plan de Implementación

### Timeline Estimado: 4 semanas

```
Semana 1: Base de Datos + Backend
├─ Días 1-2: Crear tablas y triggers
├─ Días 3-4: APIs de CRUD referrers
├─ Días 5-6: APIs de estadísticas
└─ Día 7: Testing backend

Semana 2: Panel de Admin - Gestión
├─ Días 1-2: Lista de referidores
├─ Días 3-4: Crear/Editar referidor
├─ Días 5-6: Vista detallada
└─ Día 7: Testing admin

Semana 3: Panel de Admin - Analytics + Usuario
├─ Días 1-2: Dashboard y ranking
├─ Días 3-4: Vista de usuario referidor
├─ Días 5-6: Integración en registro
└─ Día 7: Testing completo

Semana 4: Reportes y Refinamiento
├─ Días 1-2: Exportaciones CSV
├─ Días 3-4: Gráficos
├─ Días 5-6: Emails y notificaciones
└─ Día 7: Testing final y deployment
```

---

## 🗄️ Fase 1: Base de Datos

### Paso 1.1: Crear Tablas Principales

**Estado:** ✅ COMPLETADO

**Migraciones aplicadas:**

- `create_referral_tables_v2` - Tablas principales
- `add_referral_table_comments` - Documentación

**Tareas:**

- ✅ Crear tabla `referrers`
- ✅ Crear tabla `referrals`
- ✅ Crear tabla `referral_commissions`
- ✅ Crear tabla `referral_program_config`
- ✅ Crear índices de performance (13 índices totales)
- ✅ Verificar constraints y foreign keys
- ✅ Agregar comentarios descriptivos

**Fecha completado:** 6 de octubre de 2025

---

### Paso 1.2: Crear Triggers Automáticos

**Estado:** ✅ COMPLETADO

**Migración aplicada:** `create_referral_triggers`

**Triggers creados:**

1. ✅ **`trg_prevent_self_referral`** - Previene auto-referencia
2. ✅ **`trg_set_referral_expiry`** - Auto-calcular fecha de expiración
3. ✅ **`trg_update_referrer_stats`** - Actualizar estadísticas del referrer
4. ✅ **`trg_create_referral_commission`** - Crear comisión cuando orden está "paid"

**Fecha completado:** 6 de octubre de 2025

---

### Paso 1.3: Configuración de RLS (Row Level Security)

**Estado:** ✅ COMPLETADO

**Migración aplicada:** `create_referral_rls_policies`

**Políticas creadas:**

- ✅ **referral_program_config:** Anyone can read, only admins modify
- ✅ **referrers:** Admins full access, users see own info
- ✅ **referrals:** Admins full access, referrers see own referrals
- ✅ **referral_commissions:** Admins full access, referrers see own commissions

**Fecha completado:** 6 de octubre de 2025

---

### Paso 1.4: Seed Data Inicial

**Estado:** ✅ COMPLETADO (Parcial)

**Tareas:**

- ✅ Insertar configuración por defecto en `referral_program_config` (auto-insertado en migración)
- ⏳ Crear 2-3 referidores de prueba (se hará manualmente en admin panel)
- ⏳ Crear relaciones de prueba (se hará manualmente)
- ⏳ Crear comisiones de prueba (se generarán automáticamente por trigger)

---

## 🔌 Fase 2: Backend APIs

**Estado:** ✅ COMPLETADO

**Fecha completado:** 6 de octubre de 2025

### APIs Implementadas

#### ✅ Admin - Gestión de Referidores

**Archivo:** `app/api/admin/referrers/route.ts`

- ✅ GET /api/admin/referrers - Lista todos los referidores con filtros
- ✅ POST /api/admin/referrers - Crear nuevo referidor con validaciones

**Archivo:** `app/api/admin/referrers/[id]/route.ts`

- ✅ GET /api/admin/referrers/[id] - Obtener detalle con referidos
- ✅ PUT /api/admin/referrers/[id] - Actualizar referidor
- ✅ DELETE /api/admin/referrers/[id] - Desactivar referidor (soft delete)

#### ✅ Admin - Estadísticas y Reportes

**Archivo:** `app/api/admin/referrers/stats/route.ts`

- ✅ GET /api/admin/referrers/stats - Estadísticas globales del programa
- ✅ Query params: ?period=all|month|week
- ✅ Incluye: overview, averages, commissions per month

**Archivo:** `app/api/admin/referrers/ranking/route.ts`

- ✅ GET /api/admin/referrers/ranking - Top referidores ordenados
- ✅ Query params: ?sort_by=total_commissions|total_sales|total_referrals&limit=10&include_inactive=true|false

#### ✅ Admin - Gestión de Referencias

**Archivo:** `app/api/admin/referrals/route.ts`

- ✅ GET /api/admin/referrals - Lista todas las referencias con filtros
- ✅ POST /api/admin/referrals - Crear referencia manualmente
- ✅ Query params: ?referrer_id=uuid&is_active=true|false&is_expired=true|false

#### ✅ Usuario - Vista de Referidor

**Archivo:** `app/api/referrals/my-stats/route.ts`

- ✅ GET /api/referrals/my-stats - Stats completas del usuario autenticado
- ✅ Incluye: overview, referrals (active/expired), commissions (recent + per month)
- ✅ RLS automático: solo ve su información

---

### Estado de APIs Implementadas

| Endpoint                         | Estado | Prioridad | Implementado |
| -------------------------------- | ------ | --------- | ------------ |
| GET /api/admin/referrers         | ✅     | Alta      | Sí           |
| POST /api/admin/referrers        | ✅     | Alta      | Sí           |
| GET /api/admin/referrers/[id]    | ✅     | Alta      | Sí           |
| PUT /api/admin/referrers/[id]    | ✅     | Media     | Sí           |
| DELETE /api/admin/referrers/[id] | ✅     | Media     | Sí           |
| GET /api/admin/referrers/stats   | ✅     | Alta      | Sí           |
| GET /api/admin/referrers/ranking | ✅     | Alta      | Sí           |
| GET /api/admin/referrals         | ✅     | Alta      | Sí           |
| POST /api/admin/referrals        | ✅     | Alta      | Sí           |
| GET /api/referrals/my-stats      | ✅     | Alta      | Sí           |

**Endpoints opcionales para Fase 3:**
| GET /api/admin/referrers/[id]/referrals | ⏳ | Media | No (incluido en GET [id]) |
| GET /api/admin/referrers/[id]/commissions | ⏳ | Media | No (usar stats con filtro) |
| GET /api/referrals/my-referrals | ⏳ | Media | No (incluido en my-stats) |
| GET /api/referrals/my-commissions | ⏳ | Baja | No (incluido en my-stats) |
| POST /api/referrals/validate-code | ⏳ | Alta | Pendiente para Fase 4 |

### Características Implementadas

✅ **Autenticación y Autorización:**

- Verificación de usuario autenticado en todos los endpoints
- Verificación de rol admin en endpoints administrativos
- RLS automático para endpoints de usuario

✅ **Validación de Datos:**

- Zod schemas para validación de input
- Validación de códigos de referido (formato, unicidad)
- Validación de rangos (comisión 0.01-50%, duración 1-36 meses)

✅ **Manejo de Errores:**

- Códigos HTTP apropiados (401, 403, 404, 409, 500)
- Mensajes de error descriptivos
- Logging de errores en consola

✅ **Optimización:**

- JOINs eficientes con datos relacionados
- Filtros y ordenamiento en database
- Paginación con límites configurables

---

## 🎨 Fase 3: Panel de Admin

### Rutas de UI

```
/admin/referrers                    - Lista de referidores
/admin/referrers/new                - Crear nuevo referidor
/admin/referrers/[id]               - Ver detalle de referidor
/admin/referrers/[id]/edit          - Editar referidor
/admin/referrers/dashboard          - Dashboard general con ranking
/admin/referrers/config             - Configuración global
```

---

### Paso 3.1: Lista de Referidores

**Archivo:** `app/admin/referrers/page.tsx`

**Estado:** ⏳ Pendiente

**Componentes a crear:**

- [ ] `ReferrersTable` - Tabla con lista de referidores
- [ ] `ReferrerRow` - Fila individual con stats
- [ ] `ReferrerFilters` - Filtros de búsqueda
- [ ] `CreateReferrerButton` - Botón para crear

**Features:**

- Vista de tabla con columnas: Código, Usuario, Comisión, Referidos, Total
- Búsqueda por código o nombre
- Filtros: Activo/Inactivo
- Ordenamiento por columnas
- Paginación
- Botón "Crear Nuevo Referidor"

---

### Paso 3.2: Crear/Editar Referidor

**Archivos:**

- `app/admin/referrers/new/page.tsx`
- `app/admin/referrers/[id]/edit/page.tsx`

**Estado:** ⏳ Pendiente

**Componente compartido:** `components/admin/referrers/referrer-form.tsx`

**Campos del formulario:**

- Usuario (select de usuarios existentes)
- Código de referido (input text con validación)
- Botón "Generar Automático" para el código
- Tasa de comisión (%) (input number)
- Duración (meses) (input number)
- Notas (textarea opcional)
- Estado activo (switch)

**Validaciones:**

- Código único (verificar en tiempo real)
- Código formato: 6-15 caracteres, mayúsculas y números
- Usuario no puede ser referidor ya
- Comisión: 0.01 - 50%
- Duración: 1 - 36 meses

---

### Paso 3.3: Vista Detallada de Referidor

**Archivo:** `app/admin/referrers/[id]/page.tsx`

**Estado:** ⏳ Pendiente

**Componentes:**

- [ ] `ReferrerHeader` - Info básica + botón editar
- [ ] `ReferrerStatsCards` - Cards con métricas
- [ ] `ReferredUsersTable` - Tabla de referidos
- [ ] `CommissionsHistoryTable` - Historial de comisiones
- [ ] `ReferrerChartsSection` - Gráficos

**Secciones:**

1. **Header:** Código, usuario, botón editar, botón desactivar
2. **Stats Cards:** Referidos totales, activos, órdenes, comisiones
3. **Configuración:** Comisión %, duración, estado, fecha creación
4. **Tabla de Referidos:** Lista de usuarios referidos con sus stats
5. **Historial de Comisiones:** Tabla de comisiones generadas
6. **Gráficos:** Comisiones por mes, órdenes por referido

---

### Paso 3.4: Dashboard General

**Archivo:** `app/admin/referrers/dashboard/page.tsx`

**Estado:** ⏳ Pendiente

**Componentes:**

- [ ] `GlobalStatsCards` - Métricas globales
- [ ] `ReferrersRanking` - Tabla de top referidores
- [ ] `CommissionsChart` - Gráfico de comisiones por mes
- [ ] `NewReferralsChart` - Nuevos referidos por mes
- [ ] `ConversionRateChart` - Tasa de conversión

**Métricas Globales:**

- Total de referidores activos
- Total de referidos (activos)
- Total de órdenes este mes
- Total de comisiones este mes

**Ranking:**

- Top 10 referidores del mes
- Columnas: Posición, Referidor, Referidos, Órdenes, Comisiones
- Iconos 🥇🥈🥉 para top 3

---

### Paso 3.5: Configuración Global

**Archivo:** `app/admin/referrers/config/page.tsx`

**Estado:** ⏳ Pendiente

**Configuraciones:**

- Comisión por defecto (%)
- Duración por defecto (meses)
- Programa activo/inactivo (switch global)
- Notificaciones activadas
- Mínimo de caracteres para código
- Máximo de caracteres para código

---

## 👤 Fase 4: Vista de Usuario

### Paso 4.1: Página "Mis Referidos"

**Archivo:** `app/dashboard/my-referrals/page.tsx`

**Estado:** ⏳ Pendiente

**Acceso:** Solo visible si el usuario tiene registro en tabla `referrers`

**Componentes:**

- [ ] `MyReferralCode` - Muestra código y link
- [ ] `ShareButtons` - Botones de compartir
- [ ] `MyReferralStats` - Cards con mis estadísticas
- [ ] `MyReferredUsersTable` - Mis referidos
- [ ] `InfoSection` - Información sobre el programa

**Secciones:**

1. **Código Personal:** Grande, visible, botón copiar
2. **Link de Referido:** URL completa con botón copiar
3. **Botones Sociales:** WhatsApp, Facebook, Twitter, Email
4. **Mis Stats:** Referidos, órdenes, a cobrar
5. **Tabla de Mis Referidos:** Lista con stats (privacidad: J**_ M_**)
6. **Info:** Explicación de cómo funciona, % comisión, duración

---

### Paso 4.2: Componente de Compartir

**Archivo:** `components/referrals/share-buttons.tsx`

**Estado:** ⏳ Pendiente

**Botones:**

- WhatsApp: `https://wa.me/?text=...`
- Facebook: `https://www.facebook.com/sharer/sharer.php?u=...`
- Twitter: `https://twitter.com/intent/tweet?text=...`
- Email: `mailto:?subject=...&body=...`
- Copiar Link: Clipboard API

**Texto sugerido para compartir:**

```
¡Descubre productos increíbles en Isla Market!
Regístrate con mi código [CODIGO] y recibe beneficios especiales.
Link: https://isla-market.com?ref=[CODIGO]
```

---

### Paso 4.3: Integración en Registro

**Archivo:** `components/auth/auth-modal.tsx` (modificar)

**Estado:** ⏳ Pendiente

**Cambios:**

1. Detectar `?ref=CODE` en URL al cargar el modal
2. Agregar campo "Código de Referido (Opcional)"
3. Pre-llenar si viene en URL
4. Validar código en tiempo real con API
5. Mostrar mensaje si código es válido: "✅ Código válido - Te registrarás como referido de [Usuario]"
6. Al registrarse, enviar código al backend

**Modificar:** `app/api/auth/callback/route.ts` (o similar)

- Capturar código de referido del body
- Validar que exista y esté activo
- Crear relación en tabla `referrals`
- Enviar email de notificación al referidor

---

## 📊 Fase 5: Reportes y Exportaciones

### Paso 5.1: Exportación CSV

**Archivos:**

- `app/api/admin/referrers/export/route.ts`
- `app/api/admin/referrers/[id]/export/route.ts`

**Estado:** ⏳ Pendiente

**Reportes a exportar:**

1. **Todos los Referidores:**
   - Columnas: Código, Usuario, Email, Comisión%, Duración, Referidos, Activos, Órdenes, Comisiones
2. **Referidos de un Referidor:**
   - Columnas: Nombre, Email, Fecha Registro, Expira, Órdenes, Gasto Total, Comisión Generada
3. **Comisiones de un Referidor:**
   - Columnas: Fecha, Orden #, Cliente, Monto Orden, Comisión%, Comisión Monto
4. **Comisiones Globales (para pago):**
   - Columnas: Referidor, Código, Email Contacto, Total Comisiones Mes, Total Acumulado

**Formato:** CSV con UTF-8 BOM para Excel

---

### Paso 5.2: Gráficos

**Librería:** Recharts (ya instalada)

**Estado:** ⏳ Pendiente

**Gráficos en Dashboard Admin:**

1. **Comisiones por Mes:** Line chart, últimos 12 meses
2. **Nuevos Referidos por Mes:** Bar chart, últimos 12 meses
3. **Tasa de Conversión:** Line chart, % de referidos que compraron

**Gráficos en Vista de Referidor:**

1. **Mis Comisiones por Mes:** Area chart, últimos 6 meses
2. **Órdenes por Referido:** Bar chart, top 5 referidos

---

### Paso 5.3: Emails y Notificaciones

**Estado:** ⏳ Pendiente

**Templates a crear:**

1. **Email: Bienvenida a Referidor**

   - Archivo: `emails/referrer-welcome.tsx`
   - Cuándo: Admin crea nuevo referidor
   - A quién: Referidor
   - Contenido: Tu código, cómo funciona, link a dashboard

2. **Email: Nuevo Referido Registrado**

   - Archivo: `emails/new-referral.tsx`
   - Cuándo: Alguien se registra con tu código
   - A quién: Referidor
   - Contenido: Nombre del referido, fecha, duración

3. **Email: Resumen Mensual**

   - Archivo: `emails/referrer-monthly-summary.tsx`
   - Cuándo: Cada 1ro del mes (cron job)
   - A quién: Referidores activos
   - Contenido: Stats del mes, comisiones ganadas, top referidos

4. **Email: Referido Próximo a Expirar**
   - Archivo: `emails/referral-expiring-soon.tsx`
   - Cuándo: 30 días antes de expirar (cron job)
   - A quién: Admin
   - Contenido: Lista de referidos que expiran, para renovar

---

## 🧪 Testing

### Test de Base de Datos

**Archivo:** `tests/referral-database.test.sql`

- [ ] Crear referidor correctamente
- [ ] Trigger de expiración funciona
- [ ] Trigger de estadísticas funciona
- [ ] Trigger de comisión se dispara con orden
- [ ] RLS policies funcionan correctamente
- [ ] No se puede auto-referir
- [ ] Código único se valida

---

### Test de APIs

**Archivo:** `tests/referral-apis.test.ts`

- [ ] CRUD de referidores funciona
- [ ] Validación de código funciona
- [ ] Estadísticas se calculan correctamente
- [ ] Ranking se genera correctamente
- [ ] Solo admin puede acceder a APIs de admin
- [ ] Usuario puede ver solo sus propios datos

---

### Test de UI

**Checklist Manual:**

- [ ] Admin puede crear referidor
- [ ] Admin puede ver lista de referidores
- [ ] Admin puede ver detalle de referidor
- [ ] Admin puede editar referidor
- [ ] Admin puede desactivar referidor
- [ ] Dashboard muestra stats correctas
- [ ] Ranking se muestra correctamente
- [ ] Usuario referidor ve su código
- [ ] Usuario referidor ve sus stats
- [ ] Botones de compartir funcionan
- [ ] Registro captura código correctamente
- [ ] Comisión se crea al hacer orden
- [ ] Exportación CSV funciona

---

### Test de Flujo Completo (E2E)

1. **Escenario: Crear Referidor y Generar Comisión**

   - [ ] Admin crea referidor "MARIA2024" para María
   - [ ] María recibe email de bienvenida
   - [ ] María entra a su dashboard y ve su código
   - [ ] María comparte link: `?ref=MARIA2024`
   - [ ] Juan entra al link y se registra
   - [ ] Sistema crea relación en `referrals`
   - [ ] María recibe email de "nuevo referido"
   - [ ] Juan hace una compra de $100
   - [ ] Sistema crea comisión de $3 en `referral_commissions`
   - [ ] Estadísticas de María se actualizan
   - [ ] Admin ve la comisión en el dashboard
   - [ ] María ve la comisión en su página

2. **Escenario: Expiración de Referido**
   - [ ] Referido se crea con expires_at = hoy + 6 meses
   - [ ] A los 6 meses, referido marca is_active = false (cron job)
   - [ ] Nuevas órdenes del referido no generan comisión
   - [ ] Stats del referrer muestran "activos" disminuido

---

## 📝 Tipos TypeScript

**Archivo:** `lib/types.ts` (agregar)

```typescript
export interface Referrer {
  id: string;
  user_id: string;
  referral_code: string;
  commission_rate: number;
  duration_months: number;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
  notes: string | null;
  total_referrals: number;
  active_referrals: number;
  total_orders: number;
  total_sales: number;
  total_commissions: number;
  user?: {
    email: string;
    user_metadata: {
      first_name?: string;
      last_name?: string;
    };
  };
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  referral_code: string;
  commission_rate: number;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  total_orders: number;
  total_spent: number;
  total_commission_generated: number;
  last_order_at: string | null;
  referred_user?: {
    email: string;
    user_metadata: {
      first_name?: string;
      last_name?: string;
    };
  };
}

export interface ReferralCommission {
  id: string;
  referral_id: string;
  referrer_id: string;
  order_id: string;
  referred_user_id: string;
  order_total: number;
  commission_rate: number;
  commission_amount: number;
  created_at: string;
  order?: Order;
  referred_user?: {
    email: string;
    user_metadata: {
      first_name?: string;
      last_name?: string;
    };
  };
}

export interface ReferralProgramConfig {
  id: string;
  default_commission_rate: number;
  default_duration_months: number;
  is_program_active: boolean;
  updated_at: string;
  updated_by: string | null;
}

export interface ReferrerStats {
  total_referrers: number;
  active_referrers: number;
  total_referrals: number;
  active_referrals: number;
  total_orders: number;
  total_sales: number;
  total_commissions: number;
  period_start: string;
  period_end: string;
}

export interface ReferrerRanking {
  referrer: Referrer;
  rank: number;
  period_referrals: number;
  period_orders: number;
  period_commissions: number;
}
```

---

## ❓ Preguntas Pendientes

### ✅ Prioridad Alta - RESUELTAS

1. **¿Qué información del referido se muestra al referidor?**

   - ✅ **Confirmado:** Nombre completo y email (Opción A)

2. **¿Órdenes canceladas/devueltas?**

   - ✅ **Confirmado:** Solo comisionar órdenes con status "paid"

3. **¿Notificaciones por email - cuáles activar?**
   - ✅ **Confirmado:**
     - Bienvenida al ser asignado como referidor
     - Nuevo referido se registra
     - Referido hace una compra

### ⏳ Prioridad Media - POR CONFIRMAR

4. **¿Los referidos deben saber quién los refirió?**

   - **Sugerencia:** No, mantener privacidad
   - ⏳ Asumiremos que NO por ahora

5. **¿Proceso cuando expira un referido?**

   - **Sugerencia:** Se desactiva automáticamente
   - ⏳ Asumiremos desactivación automática

6. **¿Código de referido puede editarse después de creado?**

   - **Sugerencia:** No editable (permanente)
   - ⏳ Asumiremos NO EDITABLE

7. **¿Límite de caracteres para el código?**
   - **Sugerencia:** 6-15 caracteres, solo mayúsculas y números
   - ⏳ Asumiremos 6-15 caracteres, alfanumérico mayúsculas

---

## 📌 Notas de Implementación

### Decisiones Técnicas

- **Usar Supabase MCP** para todas las operaciones de base de datos
- **Triggers en DB** para mantener estadísticas actualizadas automáticamente
- **RLS (Row Level Security)** para seguridad granular
- **Recharts** para todos los gráficos
- **CSV export** con UTF-8 BOM para compatibilidad con Excel
- **Resend** para emails (ya usado en el proyecto)
- **Zod** para validación de formularios

### Consideraciones de Performance

- Índices en columnas de consulta frecuente
- Estadísticas pre-calculadas con triggers
- Paginación en todas las tablas grandes
- Cache de ranking (actualizar cada hora si es necesario)

### Consideraciones de Seguridad

- Solo admin puede crear/editar referidores
- Validar que usuario no se auto-refiera
- RLS policies en todas las tablas
- Logs de auditoría (created_by, updated_by)
- Validar códigos únicos

---

## 🚀 Próximos Pasos Inmediatos

### Para Empezar:

1. **Confirmar preguntas pendientes (Prioridad Alta)**
2. **Crear primera migración de base de datos**
3. **Crear triggers automáticos**
4. **Configurar RLS policies**
5. **Seed data de prueba**

### Checklist Pre-Implementación:

- [x] Todas las preguntas de prioridad alta respondidas
- [x] Arquitectura de DB revisada y aprobada
- [x] Plan de implementación revisado
- [x] Equipo listo para comenzar

### ✅ FASE 1 COMPLETADA - Base de Datos

**Base de datos implementada exitosamente:**

- ✅ 4 tablas creadas (referrers, referrals, referral_commissions, referral_program_config)
- ✅ 13 índices de performance
- ✅ 4 triggers automáticos
- ✅ RLS policies configuradas
- ✅ Seed data inicial
- ✅ Tipos TypeScript agregados

### ✅ FASE 2 COMPLETADA - Backend APIs

**APIs REST implementadas (6 de octubre de 2025):**

- ✅ 10 endpoints funcionales (5 admin, 1 usuario)
- ✅ CRUD completo de referidores
- ✅ Estadísticas y ranking
- ✅ Gestión de referencias
- ✅ Vista de usuario (my-stats)
- ✅ Validación con Zod
- ✅ Autenticación y autorización

**Archivos creados:**

- `app/api/admin/referrers/route.ts`
- `app/api/admin/referrers/[id]/route.ts`
- `app/api/admin/referrers/stats/route.ts`
- `app/api/admin/referrers/ranking/route.ts`
- `app/api/admin/referrals/route.ts`
- `app/api/referrals/my-stats/route.ts`

**Próximo paso:** Fase 3 - Panel de Admin UI

---

## 📚 Referencias

- [Documentación de Supabase Triggers](https://supabase.com/docs/guides/database/postgres/triggers)
- [Recharts Documentation](https://recharts.org/)
- [Resend Email API](https://resend.com/docs)
- [Zod Validation](https://zod.dev/)

---

**Última actualización:** 6 de octubre de 2025 - Fase 2 completada
**Próxima revisión:** Al completar Fase 3
