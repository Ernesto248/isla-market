# ✅ PASO 2 COMPLETADO: APIs de Atributos (Admin)

**Fecha:** 17 de Octubre, 2025  
**Duración:** ~1 hora  
**Estado:** ✅ COMPLETADO SIN ERRORES

---

## 📝 Lo Que Se Creó

### Estructura de Endpoints

```
/api/admin/attributes/
├── route.ts                          ✅ GET, POST
├── [id]/
│   ├── route.ts                      ✅ GET, PUT, DELETE
│   └── values/
│       ├── route.ts                  ✅ GET, POST
│       └── [valueId]/
│           └── route.ts              ✅ GET, PUT, DELETE
```

---

## 🔌 Endpoints Implementados

### 1. **GET /api/admin/attributes**

**Descripción:** Lista todos los atributos con sus valores

**Query Parameters:**

- `include_values` (boolean, default: true) - Incluir valores de atributos
- `active_only` (boolean, default: false) - Solo atributos activos

**Response:**

```typescript
[
  {
    id: "attr-001",
    name: "capacidad",
    display_name: "Capacidad",
    display_order: 1,
    is_active: true,
    created_at: "2025-10-17T...",
    updated_at: "2025-10-17T...",
    values: [
      {
        id: "val-001",
        attribute_id: "attr-001",
        value: "9 litros",
        display_order: 1,
        is_active: true,
        created_at: "2025-10-17T...",
        updated_at: "2025-10-17T...",
      },
    ],
  },
];
```

---

### 2. **POST /api/admin/attributes**

**Descripción:** Crea un nuevo atributo

**Body:**

```typescript
{
  name: "capacidad",           // Requerido - se normaliza automáticamente
  display_name: "Capacidad",   // Requerido
  display_order: 1             // Opcional, default: 0
}
```

**Validaciones:**

- ✅ `name` es requerido y se normaliza (lowercase, sin espacios)
- ✅ `display_name` es requerido
- ✅ Verifica que no exista otro atributo con el mismo nombre

**Response:** `201 Created`

```typescript
{
  id: "attr-001",
  name: "capacidad",
  display_name: "Capacidad",
  display_order: 1,
  is_active: true,
  created_at: "2025-10-17T...",
  updated_at: "2025-10-17T..."
}
```

---

### 3. **GET /api/admin/attributes/[id]**

**Descripción:** Obtiene un atributo específico con sus valores

**Response:**

```typescript
{
  id: "attr-001",
  name: "capacidad",
  display_name: "Capacidad",
  display_order: 1,
  is_active: true,
  created_at: "2025-10-17T...",
  updated_at: "2025-10-17T...",
  values: [
    { id: "val-001", value: "9 litros", ... },
    { id: "val-002", value: "11 litros", ... }
  ]
}
```

---

### 4. **PUT /api/admin/attributes/[id]**

**Descripción:** Actualiza un atributo existente

**Body:**

```typescript
{
  name?: "nueva_capacidad",      // Opcional
  display_name?: "Nueva Capacidad", // Opcional
  display_order?: 2,              // Opcional
  is_active?: false               // Opcional
}
```

**Validaciones:**

- ✅ Verifica que el atributo existe
- ✅ Si se cambia el nombre, verifica que no exista otro con ese nombre

---

### 5. **DELETE /api/admin/attributes/[id]**

**Descripción:** Elimina un atributo

**Validaciones:**

- ✅ Verifica que el atributo existe
- ✅ No permite eliminar si tiene valores asociados

**Response:**

```typescript
{
  success: true,
  message: "Atributo eliminado exitosamente"
}
```

---

### 6. **GET /api/admin/attributes/[id]/values**

**Descripción:** Lista todos los valores de un atributo

**Query Parameters:**

- `active_only` (boolean, default: false) - Solo valores activos

**Response:**

```typescript
[
  {
    id: "val-001",
    attribute_id: "attr-001",
    value: "9 litros",
    display_order: 1,
    is_active: true,
    created_at: "2025-10-17T...",
    updated_at: "2025-10-17T...",
  },
];
```

---

### 7. **POST /api/admin/attributes/[id]/values**

**Descripción:** Crea un nuevo valor para el atributo

**Body:**

```typescript
{
  value: "9 litros",      // Requerido
  display_order: 1        // Opcional, default: 0
}
```

**Validaciones:**

- ✅ `value` es requerido
- ✅ Verifica que el atributo existe
- ✅ Verifica que no exista otro valor igual para el mismo atributo

**Response:** `201 Created`

---

### 8. **GET /api/admin/attributes/[id]/values/[valueId]**

**Descripción:** Obtiene un valor específico

---

### 9. **PUT /api/admin/attributes/[id]/values/[valueId]**

**Descripción:** Actualiza un valor

**Body:**

```typescript
{
  value?: "11 litros",    // Opcional
  display_order?: 2,      // Opcional
  is_active?: false       // Opcional
}
```

**Validaciones:**

- ✅ Verifica que el valor existe
- ✅ Si se cambia el valor, verifica que no exista otro con el mismo valor

---

### 10. **DELETE /api/admin/attributes/[id]/values/[valueId]**

**Descripción:** Elimina un valor

**Validaciones:**

- ✅ Verifica que el valor existe
- ✅ No permite eliminar si está siendo usado en variantes

**Response:**

```typescript
{
  success: true,
  message: "Valor eliminado exitosamente"
}
```

---

## 🛡️ Seguridad y Validaciones

### Validaciones Implementadas

1. **Nombres únicos de atributos:**

   - No pueden existir dos atributos con el mismo nombre
   - El nombre se normaliza automáticamente (lowercase, sin espacios)

2. **Valores únicos por atributo:**

   - No pueden existir dos valores iguales para el mismo atributo
   - Los valores se trimean automáticamente

3. **Eliminación segura:**

   - No se puede eliminar un atributo si tiene valores
   - No se puede eliminar un valor si está en uso en variantes

4. **Verificación de existencia:**
   - Todos los endpoints verifican que el recurso existe antes de operarlo

---

## 📊 Ejemplos de Uso

### Ejemplo 1: Crear Atributo "Capacidad"

```typescript
// POST /api/admin/attributes
const response = await fetch("/api/admin/attributes", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "capacidad",
    display_name: "Capacidad del Refrigerador",
    display_order: 1,
  }),
});

const attribute = await response.json();
// { id: "attr-001", name: "capacidad", ... }
```

---

### Ejemplo 2: Agregar Valores al Atributo

```typescript
// POST /api/admin/attributes/attr-001/values
const values = ["9 litros", "11 litros", "17 litros"];

for (const [index, value] of values.entries()) {
  await fetch("/api/admin/attributes/attr-001/values", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      value: value,
      display_order: index + 1,
    }),
  });
}
```

---

### Ejemplo 3: Listar Atributos con Valores

```typescript
// GET /api/admin/attributes?include_values=true&active_only=true
const response = await fetch(
  "/api/admin/attributes?include_values=true&active_only=true"
);

const attributes = await response.json();
/*
[
  {
    id: "attr-001",
    name: "capacidad",
    display_name: "Capacidad",
    values: [
      { id: "val-001", value: "9 litros" },
      { id: "val-002", value: "11 litros" },
      { id: "val-003", value: "17 litros" }
    ]
  }
]
*/
```

---

### Ejemplo 4: Actualizar un Valor

```typescript
// PUT /api/admin/attributes/attr-001/values/val-001
await fetch("/api/admin/attributes/attr-001/values/val-001", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    value: "9.5 litros",
    display_order: 1,
    is_active: true,
  }),
});
```

---

### Ejemplo 5: Eliminar un Valor (Sin Uso)

```typescript
// DELETE /api/admin/attributes/attr-001/values/val-999
const response = await fetch("/api/admin/attributes/attr-001/values/val-999", {
  method: "DELETE",
});

const result = await response.json();
// { success: true, message: "Valor eliminado exitosamente" }
```

---

## ✅ Archivos Creados

1. ✅ `app/api/admin/attributes/route.ts` (GET, POST)
2. ✅ `app/api/admin/attributes/[id]/route.ts` (GET, PUT, DELETE)
3. ✅ `app/api/admin/attributes/[id]/values/route.ts` (GET, POST)
4. ✅ `app/api/admin/attributes/[id]/values/[valueId]/route.ts` (GET, PUT, DELETE)

**Total:** 4 archivos, 10 endpoints REST

---

## ✅ Validación TypeScript

```bash
✓ route.ts - 0 errores
✓ [id]/route.ts - 0 errores
✓ [id]/values/route.ts - 0 errores
✓ [id]/values/[valueId]/route.ts - 0 errores
✓ Todos los endpoints compilan correctamente
```

---

## 🎯 Próximo Paso

**PASO 3: Crear APIs de Variantes (Admin)**

**Endpoints a crear:**

```
GET    /api/admin/products/[id]/variants              - Listar variantes
POST   /api/admin/products/[id]/variants              - Crear variante
GET    /api/admin/products/[id]/variants/[variantId]  - Obtener variante
PUT    /api/admin/products/[id]/variants/[variantId]  - Actualizar variante
DELETE /api/admin/products/[id]/variants/[variantId]  - Eliminar variante

POST   /api/admin/products/with-variants              - Crear producto completo
```

**Tiempo estimado:** 3 horas

---

## 📋 Checklist del Paso 2

- [x] Endpoint GET /api/admin/attributes
- [x] Endpoint POST /api/admin/attributes
- [x] Endpoint GET /api/admin/attributes/[id]
- [x] Endpoint PUT /api/admin/attributes/[id]
- [x] Endpoint DELETE /api/admin/attributes/[id]
- [x] Endpoint GET /api/admin/attributes/[id]/values
- [x] Endpoint POST /api/admin/attributes/[id]/values
- [x] Endpoint GET /api/admin/attributes/[id]/values/[valueId]
- [x] Endpoint PUT /api/admin/attributes/[id]/values/[valueId]
- [x] Endpoint DELETE /api/admin/attributes/[id]/values/[valueId]
- [x] Validaciones de unicidad
- [x] Validaciones de eliminación segura
- [x] Normalización de datos
- [x] Manejo de errores
- [x] Compilar sin errores TypeScript

**Estado:** ✅ **COMPLETADO AL 100%**

---

## 🚀 Listo para Continuar

Las APIs de atributos están completas y listas para usar. Podemos proceder con confianza al **Paso 3: APIs de Variantes**.

**¿Continuamos con el Paso 3?** 🎯
