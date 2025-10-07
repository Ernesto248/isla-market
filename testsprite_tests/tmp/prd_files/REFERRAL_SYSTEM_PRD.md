# Product Requirements Document: Sistema de Referidos

**Isla Market - Referral Program**  
**Versión:** 1.0  
**Fecha:** 7 de octubre de 2025

---

## 1. Resumen Ejecutivo

Sistema de referidos que permite a usuarios seleccionados (referidores) invitar a nuevos clientes y ganar comisiones por sus compras. El sistema incluye panel de administración, dashboard para referidores, y seguimiento automático de comisiones.

---

## 2. Objetivos del Producto

- ✅ Incentivar el crecimiento orgánico mediante referencias de usuarios
- ✅ Recompensar a referidores con comisiones por ventas generadas
- ✅ Proveer herramientas de administración y seguimiento
- ✅ Automatizar el cálculo y registro de comisiones

---

## 3. Roles de Usuario

### 3.1 Administrador

- Acceso completo al panel de admin
- Gestión de referidores (crear, editar, desactivar)
- Visualización de métricas y estadísticas globales
- Acceso al dashboard de referidos y ranking

### 3.2 Referidor (Usuario con privilegios especiales)

- Código de referido único (ej: `JENIFERCAS1393`)
- Enlace de invitación personalizado
- Dashboard personal con estadísticas
- Visualización de referidos y comisiones

### 3.3 Usuario Referido

- Se registra usando código de referido
- Código almacenado automáticamente al signup
- Genera comisiones al realizar compras
- Sin acceso especial, usuario normal

### 3.4 Usuario Normal

- No ve opción "Mis Referidos" en menú
- Puede convertirse en referidor si admin lo habilita

---

## 4. Funcionalidades Principales

### 4.1 Panel de Administración - Referidores

**Ruta:** `/admin/referrers`

**Características:**

- Lista de todos los referidores con búsqueda y filtros
- Columnas: Código, Usuario, Comisión, Referidos, Ventas, Estado
- Acciones: Ver detalles, Editar, Desactivar
- Botón "Nuevo Referidor"

**Filtros:**

- Estado: Activos / Inactivos / Todos
- Búsqueda por código o nombre de usuario

### 4.2 Crear Nuevo Referidor

**Ruta:** `/admin/referrers/new`

**Campos del Formulario:**

- Usuario: Selección de usuarios existentes (select)
- Código de Referido: Generación automática basada en nombre (editable)
- Tasa de Comisión: Porcentaje (%) - default: 3%
- Duración: Meses de validez del referido - default: 12 meses
- Notas: Campo opcional para información adicional

**Validaciones:**

- Usuario único (no puede tener múltiples códigos activos)
- Código único en el sistema
- Comisión entre 0-100%
- Duración mínima: 1 mes

### 4.3 Editar Referidor

**Ruta:** `/admin/referrers/[id]/edit`

**Campos Editables:**

- Tasa de Comisión
- Duración en meses
- Estado (Activo/Inactivo)
- Notas

**Campos No Editables:**

- Usuario asignado
- Código de referido

### 4.4 Detalles de Referidor

**Ruta:** `/admin/referrers/[id]`

**Secciones:**

1. **Header:** Código, Estado, Usuario, Botones (Editar, Desactivar)

2. **Estadísticas (4 Cards):**

   - Tasa de Comisión
   - Referidos Activos
   - Ventas Generadas
   - Comisiones Ganadas

3. **Información del Referidor:**

   - Usuario, Email, Código, Duración, Fecha de Creación, Estado, Notas

4. **Lista de Referidos (Colapsable):**

   - Tabla con: Usuario, Email, Estado, Fecha de Registro, Fecha de Expiración
   - Botón de colapsar/expandir con icono chevron
   - Estados: Convertido (con órdenes), Activo, Expirado

5. **Historial de Comisiones (Colapsable):**
   - Tabla con: Pedido, Referido, Total del Pedido, Comisión, Estado, Fecha
   - Botón de colapsar/expandir con icono chevron

### 4.5 Dashboard de Referidos (Admin)

**Ruta:** `/admin/referrers/dashboard`

**Secciones:**

1. **Estadísticas Globales (4 Cards):**

   - Referidores Totales (activos)
   - Referidos Totales (activos)
   - Ventas Generadas (total acumulado)
   - Comisiones Generadas (total acumulado)

2. **Métricas del Programa:**

   - Promedio de comisión por referidor
   - Tasa de conversión de referidos
   - Tasa de activación de referidores
   - Referidos por referidor (promedio)

3. **Estado del Programa:**

   - Referidores activos/inactivos
   - Referidos activos/expirados

4. **Top 10 Referidores:**
   - Ranking por comisiones generadas
   - Columnas: Rank, Código, Usuario, Referidos, Ventas, Comisiones
   - Medallas 🥇🥈🥉 para los primeros 3 lugares
   - Click en fila para ver detalles

### 4.6 Página de Códigos de Referido

**Ruta:** `/admin/referrers/codes`

**Características:**

- Lista de todos los códigos con búsqueda
- Columnas: Código, Usuario, Email, Tasa de Comisión, Estado
- Botón "Copiar" para copiar código al clipboard
- Botón "Compartir" para generar enlace de invitación
- Búsqueda en tiempo real

### 4.7 Dashboard de Referidor (Usuario)

**Ruta:** `/profile/referrals`

**Acceso:** Solo usuarios con `is_referrer = true`

**Secciones:**

1. **Header:**

   - Código de referido
   - Enlace de invitación con botones: Copiar, Compartir

2. **Estadísticas (4 Cards):**

   - Referidos Totales
   - Referidos Activos
   - Ventas Generadas
   - Comisiones Ganadas

3. **Tabla de Referidos:**

   - Usuario, Email, Fecha de Registro, Estado, Órdenes, Total Gastado

4. **Historial de Comisiones:**
   - Pedido, Fecha, Total del Pedido, Comisión

### 4.8 Menú "Mis Referidos"

**Ubicación:** Header dropdown (solo visible para referidores)

**Lógica:**

- API verifica si usuario es referidor activo: `/api/referrals/check-status`
- Si `is_referrer = true`, mostrar opción en menú
- Si `is_referrer = false`, ocultar opción

---

## 5. Flujo de Usuario

### 5.1 Flujo Completo del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUJO DE REFERIDOS                           │
└─────────────────────────────────────────────────────────────────┘

1. Admin crea referidor
   │
   ├─→ Selecciona usuario
   ├─→ Genera código (ej: JENIFERCAS1393)
   ├─→ Define comisión (3%) y duración (12 meses)
   └─→ Guarda en DB

2. Referidor obtiene código
   │
   ├─→ Accede a /profile/referrals
   ├─→ Ve su código y enlace
   └─→ Comparte con potenciales clientes

3. Usuario nuevo usa código al registrarse
   │
   ├─→ Accede al enlace: /?ref=JENIFERCAS1393
   ├─→ Código guardado en localStorage
   ├─→ Completa signup
   └─→ Relación creada en tabla referrals

4. Usuario referido realiza compra
   │
   ├─→ Agrega productos al carrito
   ├─→ Completa checkout
   └─→ Orden creada con status "pendiente"

5. Admin marca orden como "pagado"
   │
   ├─→ Trigger verifica si usuario tiene referidor activo
   ├─→ Crea comisión en referral_commissions
   ├─→ Actualiza estadísticas de referrals
   └─→ Actualiza estadísticas de referrers

6. Comisión visible en dashboards
   │
   ├─→ Dashboard del referidor
   ├─→ Detalles del referidor (admin)
   └─→ Dashboard global (admin)
```

### 5.2 Flujo de Signup con Código de Referido

```
Usuario accede: https://isla-market.com/?ref=JENIFERCAS1393
   │
   ↓
Código guardado en localStorage: "pendingReferralCode"
   │
   ↓
Usuario hace signup (email + contraseña)
   │
   ↓
Auth context detecta evento SIGNED_IN
   │
   ↓
Llama API: POST /api/referrals/create-referral-link
   │
   ├─→ Busca referidor por código
   ├─→ Calcula expires_at (created_at + duration_months)
   ├─→ Crea registro en referrals
   └─→ Limpia localStorage
   │
   ↓
Usuario ahora es referido activo
```

---

## 6. Estructura de Base de Datos

### 6.1 Tabla: referral_program_config

- `id`: UUID (PK)
- `default_commission_rate`: Decimal (default: 3.0)
- `default_duration_months`: Integer (default: 12)
- `is_active`: Boolean (default: true)
- `created_at`, `updated_at`: Timestamps

### 6.2 Tabla: referrers

- `id`: UUID (PK)
- `user_id`: UUID (FK → users, UNIQUE)
- `referral_code`: String (UNIQUE, indexed)
- `commission_rate`: Decimal
- `duration_months`: Integer
- `is_active`: Boolean
- `total_referrals`: Integer (auto-updated)
- `active_referrals`: Integer (auto-updated)
- `total_orders`: Integer (auto-updated)
- `total_sales`: Decimal (auto-updated)
- `total_commissions`: Decimal (auto-updated)
- `notes`: Text
- `created_at`, `updated_at`: Timestamps

### 6.3 Tabla: referrals

- `id`: UUID (PK)
- `referrer_id`: UUID (FK → referrers)
- `referred_user_id`: UUID (FK → users, UNIQUE)
- `referral_code`: String
- `commission_rate`: Decimal
- `is_active`: Boolean
- `expires_at`: Timestamp
- `total_orders`: Integer (default: 0)
- `total_spent`: Decimal (default: 0)
- `total_commission_generated`: Decimal (default: 0)
- `last_order_at`: Timestamp
- `created_at`: Timestamp

**Constraints:**

- UNIQUE (referred_user_id) - Un usuario solo puede ser referido una vez
- CHECK: referrer_id != referred_user_id (prevenir auto-referencia)

### 6.4 Tabla: referral_commissions

- `id`: UUID (PK)
- `referral_id`: UUID (FK → referrals)
- `referrer_id`: UUID (FK → referrers)
- `order_id`: UUID (FK → orders, UNIQUE)
- `referred_user_id`: UUID (FK → users)
- `order_total`: Decimal
- `commission_rate`: Decimal
- `commission_amount`: Decimal
- `created_at`: Timestamp

**Constraints:**

- UNIQUE (order_id) - Una orden solo genera una comisión

---

## 7. APIs del Sistema

### 7.1 Admin APIs

**GET** `/api/admin/referrers`

- Lista todos los referidores con filtros y búsqueda
- Query params: `search`, `status`, `sort_by`
- Respuesta: Array de referidores con info de usuario

**POST** `/api/admin/referrers`

- Crea nuevo referidor
- Body: `user_id`, `referral_code`, `commission_rate`, `duration_months`, `notes`

**GET** `/api/admin/referrers/[id]`

- Detalles completos de un referidor
- Incluye: referrals[], commissions[]

**PUT** `/api/admin/referrers/[id]`

- Actualiza referidor existente
- Body: `commission_rate`, `duration_months`, `is_active`, `notes`

**DELETE** `/api/admin/referrers/[id]`

- Desactiva referidor (soft delete)

**GET** `/api/admin/referrers/stats`

- Estadísticas globales del programa
- Query params: `period` (all, month, week)
- Respuesta: overview, averages, commissions_per_month

**GET** `/api/admin/referrers/ranking`

- Ranking de referidores por métricas
- Query params: `sort_by`, `limit`, `include_inactive`

### 7.2 User APIs

**GET** `/api/referrals/check-status`

- Verifica si usuario es referidor activo
- Respuesta: `{ is_referrer: boolean, referrer_id: string | null }`

**GET** `/api/referrals/my-stats`

- Dashboard stats del referidor
- Respuesta: referrer info, referrals[], commissions[]

**POST** `/api/referrals/create-referral-link`

- Crea relación de referido al hacer signup
- Body: `referral_code`
- Llamado automáticamente por auth-context

---

## 8. Triggers y Automatización

### 8.1 prevent_self_referral

- Se ejecuta: BEFORE INSERT/UPDATE en `referrals`
- Previene que un usuario se refiera a sí mismo

### 8.2 set_referral_expiry

- Se ejecuta: BEFORE INSERT en `referrals`
- Calcula automáticamente `expires_at` basado en `duration_months`

### 8.3 update_referrer_stats

- Se ejecuta: AFTER INSERT/UPDATE en `referrals`
- Actualiza contadores en tabla `referrers`

### 8.4 create_referral_commission

- Se ejecuta: AFTER INSERT/UPDATE de status en `orders`
- Cuando orden cambia a "pagado":
  - Busca referidor activo del usuario
  - Crea comisión en `referral_commissions`
  - Actualiza estadísticas en `referrals`

### 8.5 update_referrer_stats_from_commission

- Se ejecuta: AFTER INSERT en `referral_commissions`
- Actualiza `total_orders`, `total_sales`, `total_commissions` en `referrers`

---

## 9. Reglas de Negocio

### 9.1 Comisiones

- Solo se generan cuando orden está en estado "pagado"
- Una orden solo genera una comisión (UNIQUE constraint)
- Comisión calculada: `order_total * (commission_rate / 100)`
- Ejemplo: Orden de €100 con 3% = €3.00 de comisión

### 9.2 Expiración de Referidos

- Referido activo por `duration_months` desde su registro
- Después de expiración: `is_active = false`
- Órdenes después de expiración NO generan comisión

### 9.3 Estados de Referidos

- **Activo**: Dentro de periodo de validez, puede generar comisiones
- **Convertido**: Ha realizado al menos una compra
- **Expirado**: Fuera de periodo de validez

### 9.4 Códigos de Referido

- Generados automáticamente: `NOMBRE + APELLIDO + 4 dígitos`
- Ejemplo: Jenifer Casalis → `JENIFERCAS1393`
- Únicos en el sistema (UNIQUE constraint)
- Case-insensitive en búsqueda

---

## 10. Casos de Uso para Testing

### 10.1 Happy Path

✅ Admin crea referidor exitosamente
✅ Usuario se registra con código válido
✅ Usuario referido realiza compra
✅ Comisión se genera automáticamente
✅ Estadísticas se actualizan correctamente
✅ Dashboard muestra datos correctos

### 10.2 Edge Cases

⚠️ Usuario intenta auto-referirse
⚠️ Código de referido inválido o expirado
⚠️ Usuario ya tiene referidor activo
⚠️ Orden cancelada después de generar comisión
⚠️ Referidor desactivado con referidos activos

### 10.3 Validaciones

❌ Crear referidor con usuario ya existente
❌ Código de referido duplicado
❌ Comisión fuera de rango (0-100%)
❌ Duración menor a 1 mes
❌ Usuario no-admin accediendo a admin panel

---

## 11. Métricas de Éxito

### 11.1 KPIs del Sistema

- Tasa de conversión de referidos (referidos con órdenes / referidos totales)
- Promedio de comisión por referidor
- Ventas totales generadas por referidos
- Tasa de activación de referidores

### 11.2 Performance

- Dashboard carga en < 2 segundos
- APIs responden en < 500ms
- Triggers se ejecutan sin bloquear órdenes

---

## 12. Seguridad y Permisos

### 12.1 Row Level Security (RLS)

- `referrers`: Solo admin puede ver/modificar
- `referrals`: Admin ve todo, usuarios solo sus propios datos
- `referral_commissions`: Admin ve todo, referidores solo sus comisiones

### 12.2 Autenticación

- Admin panel requiere `requireAdmin(request)`
- User APIs requieren Bearer token válido
- Check de `is_referrer` para acceso a dashboard personal

---

## 13. Tecnologías Utilizadas

- **Frontend:** Next.js 13.5.1, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes, Supabase (PostgreSQL)
- **Auth:** Supabase Auth con JWT tokens
- **Database:** PostgreSQL con triggers y funciones
- **Estado:** React Context API, localStorage para pending codes

---

## 14. Dependencias con Otros Módulos

- **Users:** Sistema de usuarios de Supabase
- **Orders:** Trigger escucha cambios en tabla `orders`
- **Products:** Órdenes incluyen productos comprados
- **Auth:** Verificación de admin y user roles

---

## 15. Notas de Implementación

### Completado ✅

- [x] 4 tablas de base de datos con RLS
- [x] 5 triggers automatizados
- [x] 12 endpoints de API (7 admin, 5 user)
- [x] 6 páginas de admin UI
- [x] 1 dashboard de usuario
- [x] Integración con signup flow
- [x] Menú condicional en header
- [x] Secciones colapsables en detalles
- [x] Fix de estadísticas del dashboard
- [x] Tests unitarios pendientes

### Testing Prioritario 🧪

1. Flujo completo de referido (signup → orden → comisión)
2. Dashboard de admin (métricas correctas)
3. Triggers de base de datos
4. APIs de admin y user
5. Permisos y seguridad

---

**Última actualización:** 7 de octubre de 2025  
**Estado:** ✅ Implementado y en producción
