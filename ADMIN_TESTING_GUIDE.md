# Guía Rápida: Cómo Probar el Panel de Administración

## 🚀 Inicio Rápido

### 1. Asignar Rol de Administrador

Primero, necesitas marcar tu usuario como administrador en la base de datos de Supabase.

#### Opción A: Usando Supabase Dashboard
1. Ve a https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a **Table Editor** → **users**
4. Encuentra tu usuario (busca por email)
5. Edita la fila y cambia `role` de `customer` a `admin`
6. Guarda los cambios

#### Opción B: Usando SQL Editor
```sql
-- Reemplaza 'tu-email@ejemplo.com' con tu email
UPDATE users 
SET role = 'admin' 
WHERE email = 'tu-email@ejemplo.com';

-- Verificar que funcionó
SELECT id, email, role, full_name 
FROM users 
WHERE email = 'tu-email@ejemplo.com';
```

### 2. Iniciar Sesión en la Aplicación

1. Inicia el servidor de desarrollo:
   ```bash
   pnpm dev
   ```

2. Abre http://localhost:3000

3. Si no has iniciado sesión, haz clic en el botón de login/registro

4. Inicia sesión con tu cuenta que ahora tiene rol `admin`

### 3. Acceder al Panel de Administración

1. Una vez autenticado, navega a: **http://localhost:3000/admin**

2. Deberías ver el dashboard con:
   - ✅ 4 tarjetas de métricas en la parte superior
   - ✅ Gráfica de ventas (área)
   - ✅ Gráfica de órdenes (barras)
   - ✅ Tabla de órdenes recientes

---

## 🧪 Escenarios de Prueba

### ✅ Prueba 1: Acceso Autorizado (Usuario Admin)

**Pasos**:
1. Asegúrate de tener `role = 'admin'` en la base de datos
2. Inicia sesión
3. Navega a `/admin`

**Resultado Esperado**:
- ✅ Se muestra el dashboard completo
- ✅ Sidebar visible en desktop
- ✅ Hamburger menu visible en móvil
- ✅ Datos estadísticos cargados

### ❌ Prueba 2: Acceso Denegado (Usuario No Admin)

**Pasos**:
1. Crea otro usuario o cambia tu rol a `customer`:
   ```sql
   UPDATE users SET role = 'customer' WHERE email = 'tu-email@ejemplo.com';
   ```
2. Inicia sesión con ese usuario
3. Intenta navegar a `/admin`

**Resultado Esperado**:
- ❌ Redirige a la página principal (`/`)
- ❌ Muestra notificación: "No tienes permisos de administrador"
- ❌ No se carga el contenido del admin

### 📊 Prueba 3: Verificar API de Estadísticas

**Usando el navegador**:
1. Con tu usuario admin autenticado, abre la consola del navegador (F12)
2. Ve a la pestaña **Network**
3. Navega a `/admin`
4. Busca la llamada a `/api/admin/stats`
5. Haz clic en ella y ve a **Response**

**Resultado Esperado**:
```json
{
  "sales": {
    "total": number,
    "average": number,
    "byDay": [...]
  },
  "orders": {
    "total": number,
    "byStatus": [...],
    "recent": [...]
  },
  "products": {...},
  "categories": {...}
}
```

**Usando curl** (en terminal separada):
```bash
# Reemplaza {tu-token} con el token de autenticación
curl -H "Authorization: Bearer {tu-token}" \
  http://localhost:3000/api/admin/stats?period=30
```

### 📱 Prueba 4: Responsive Design

**Desktop (>768px)**:
- ✅ Sidebar visible a la izquierda (ancho fijo 256px)
- ✅ 4 columnas en las tarjetas de métricas
- ✅ 2 columnas en las gráficas
- ✅ Tabla completa de órdenes

**Tablet (768px - 1024px)**:
- ✅ Sidebar visible
- ✅ 2 columnas en métricas
- ✅ 1-2 columnas en gráficas

**Móvil (<768px)**:
- ✅ Sidebar oculto, hamburger menu visible
- ✅ 1 columna en métricas
- ✅ 1 columna en gráficas
- ✅ Tabla con scroll horizontal

### 🎨 Prueba 5: Dark Mode

**Pasos**:
1. Navega a `/admin`
2. Cambia el tema usando el selector de tema (si está implementado en el header)
   - O cambia las preferencias del sistema

**Resultado Esperado**:
- ✅ Todos los componentes se adaptan al tema oscuro
- ✅ Gráficas mantienen buena visibilidad
- ✅ Contraste adecuado en todos los elementos

---

## 📝 Datos de Prueba (Opcional)

Si tu base de datos está vacía y quieres ver el dashboard con datos reales:

### Insertar Productos de Prueba
```sql
INSERT INTO products (name, description, price, stock, category_id, images, is_active)
VALUES 
  ('Producto 1', 'Descripción del producto 1', 1500, 25, 'uuid-categoria', '["https://via.placeholder.com/400"]', true),
  ('Producto 2', 'Descripción del producto 2', 2500, 8, 'uuid-categoria', '["https://via.placeholder.com/400"]', true),
  ('Producto 3', 'Descripción del producto 3', 3000, 50, 'uuid-categoria', '["https://via.placeholder.com/400"]', true);
```

### Insertar Órdenes de Prueba
```sql
-- Primero crea una orden
INSERT INTO orders (user_id, total, status, shipping_address, billing_address)
VALUES 
  ('tu-user-id', 3000, 'delivered', '{"street": "Calle 123", "city": "Ciudad"}', '{"street": "Calle 123", "city": "Ciudad"}');

-- Luego agrega items a la orden
INSERT INTO order_items (order_id, product_id, quantity, price_at_time)
VALUES 
  ('order-id-generado', 'product-id', 2, 1500);
```

---

## 🐛 Problemas Comunes

### Problema: "Loading..." infinito en el dashboard

**Causas posibles**:
1. Error en la API de stats
2. Usuario no autenticado correctamente
3. Error en el backend de Supabase

**Soluciones**:
```bash
# 1. Verifica la consola del navegador (F12)
# Busca errores en rojo

# 2. Verifica que el servidor esté corriendo
pnpm dev

# 3. Verifica las variables de entorno
# En .env.local:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # Importante para el admin

# 4. Prueba la API directamente
# Ve a: http://localhost:3000/api/admin/stats
# (en el navegador con sesión iniciada)
```

### Problema: Gráficas no se muestran

**Solución**:
```bash
# Verifica que recharts esté instalado
pnpm list recharts

# Si no está, instálalo
pnpm add recharts

# Limpia caché y reconstruye
rm -rf .next
pnpm build
pnpm dev
```

### Problema: 401 Unauthorized en API

**Causas**:
- Token de autenticación expirado
- Usuario no tiene rol admin
- Service role key incorrecta

**Solución**:
```sql
-- 1. Verifica tu rol
SELECT email, role FROM users WHERE email = 'tu-email@ejemplo.com';

-- 2. Si no es admin, actualízalo
UPDATE users SET role = 'admin' WHERE email = 'tu-email@ejemplo.com';

-- 3. Cierra sesión y vuelve a iniciar sesión
```

### Problema: Sidebar no responde en móvil

**Solución**:
1. Limpia el caché del navegador
2. Verifica que `vaul` esté instalado (para el drawer):
   ```bash
   pnpm list vaul
   ```
3. Reconstruye:
   ```bash
   rm -rf .next && pnpm dev
   ```

---

## 🎯 Checklist de Pruebas

Antes de dar por completada la Fase 1, verifica:

- [ ] Usuario puede acceder a `/admin` si es admin
- [ ] Usuario NO admin es redirigido con mensaje
- [ ] Stats cards muestran datos correctos
- [ ] Gráfica de ventas se renderiza correctamente
- [ ] Gráfica de órdenes se renderiza con colores
- [ ] Tabla de órdenes recientes muestra datos
- [ ] Alerta de bajo inventario aparece (si aplica)
- [ ] Sidebar funciona en desktop
- [ ] Hamburger menu funciona en móvil
- [ ] Links de navegación están preparados
- [ ] Botón "Volver a la tienda" funciona
- [ ] Dark mode funciona correctamente
- [ ] Build de producción compila sin errores:
  ```bash
  pnpm build
  ```

---

## 🔍 Logs y Debugging

### Ver logs del servidor Next.js
```bash
# La terminal donde corriste `pnpm dev` mostrará:
- Rutas accedidas
- Errores de compilación
- Advertencias de TypeScript
```

### Ver logs de la API
Agrega console.log en `app/api/admin/stats/route.ts`:
```typescript
export async function GET(request: Request) {
  console.log("📊 Stats API called");
  const admin = await requireAdmin(request);
  console.log("✅ Admin verified:", admin.id);
  // ... resto del código
}
```

### Ver logs de autenticación
En `lib/admin-auth.ts`:
```typescript
export async function requireAdmin(request: Request) {
  console.log("🔒 Checking admin access...");
  const admin = await verifyAdminFromRequest(request);
  console.log("👤 User role:", admin.role);
  return admin;
}
```

---

## 📸 Capturas Esperadas

### Dashboard Desktop
```
┌────────────────────────────────────────────────────────────┐
│ Sidebar      │  Dashboard Header                          │
│              ├────────────────────────────────────────────│
│ 📊 Dashboard │  [Ventas] [Órdenes] [Productos] [Ticket]   │
│ 📦 Productos ├────────────────────────────────────────────│
│ 🛒 Órdenes   │  [Gráfica Ventas] [Gráfica Órdenes]       │
│ 👥 Clientes  ├────────────────────────────────────────────│
│              │  [Tabla Órdenes Recientes]                 │
└────────────────────────────────────────────────────────────┘
```

### Dashboard Móvil
```
┌──────────────────────────┐
│ ☰ Panel Admin            │
├──────────────────────────┤
│ [Ventas Totales]         │
│ [Órdenes]                │
│ [Productos Activos]      │
│ [Ticket Promedio]        │
├──────────────────────────┤
│ [Gráfica Ventas]         │
├──────────────────────────┤
│ [Gráfica Órdenes]        │
├──────────────────────────┤
│ [Órdenes Recientes]      │
└──────────────────────────┘
```

---

## ✅ Prueba Final

Ejecuta todos estos comandos para validar:

```bash
# 1. Limpiar todo
rm -rf .next
rm -rf node_modules/.cache

# 2. Verificar dependencias
pnpm list recharts date-fns @tanstack/react-table react-dropzone

# 3. Verificar tipos
pnpm typecheck

# 4. Build de producción
pnpm build

# 5. Iniciar en producción
pnpm start

# 6. Acceder a http://localhost:3000/admin
```

Si todos los pasos se completan sin errores, ¡la Fase 1 está lista! 🎉

---

**Siguiente paso**: Configurar Digital Ocean Spaces para la gestión de imágenes de productos.
