# Sistema de Referidos - Resumen Rápido

## 🎯 Regla de Oro

**El sistema de referidos es INVISIBLE para el usuario final**

---

## Usuario Final (Cliente)

### ✅ Lo que VE:

- Mensaje genérico: `"¡Cuenta creada! Revisa tu email para confirmar."`
- Proceso de registro normal
- Ninguna mención de códigos o referidores

### ❌ Lo que NO VE:

- Códigos de referido
- Quién lo refirió
- Si el código era válido/inválido
- Errores de referidos
- Mensajes sobre comisiones

---

## Admin

### ✅ Lo que PUEDE hacer:

- Ver relaciones de referidos en `/admin/referrers`
- Crear/desactivar referidores
- Ver estadísticas de cada referidor
- Calcular comisiones automáticamente
- Compartir links: `https://tusitio.com/?ref=ABC123`

### 📊 Tracking Automático:

- Si código es válido → Relación creada (invisible para usuario)
- Si código es inválido → Usuario se registra igual (sin relación)
- Comisiones se calculan cuando orden es "pagado" o "entregado"

---

## Comportamiento Actual

| Situación              | Usuario Final Ve | Backend Hace        | Admin Ve          |
| ---------------------- | ---------------- | ------------------- | ----------------- |
| **Código válido**      | Mensaje genérico | ✅ Crea relación    | ✅ Nueva relación |
| **Código inválido**    | Mensaje genérico | ❌ No crea relación | Sin cambios       |
| **Referidor inactivo** | Mensaje genérico | ❌ No crea relación | Sin cambios       |
| **Sin código**         | Mensaje genérico | Sin acción          | Sin cambios       |

**En TODOS los casos, el usuario ve exactamente lo mismo: registro exitoso genérico**

---

## Archivos Clave

1. **`auth-modal.tsx`** → Guarda código silenciosamente, mensaje genérico
2. **`auth-context.tsx`** → Procesa código en background, sin toasts
3. **`validate-code/route.ts`** → API de validación (solo backend)
4. **`create-referral-link/route.ts`** → API de creación (solo backend)

---

## Testing Rápido

```bash
# 1. Código válido
URL: /?ref=ABC123 → Mensaje genérico → Check admin: relación creada

# 2. Código inválido
URL: /?ref=FAKE → Mensaje genérico → Check admin: sin relación

# 3. Sin código
URL: / → Mensaje genérico → Check admin: sin relación
```

**Resultado esperado en los 3 casos**: Usuario ve exactamente el mismo mensaje de éxito.

---

## Por Qué Este Diseño

1. **Usuario no necesita saber** → Registro más simple
2. **Código inválido no rompe registro** → Más robusto
3. **Admin trackea comisiones** → Sistema interno funcional
4. **Links permanentes** → No expiran, sin límites
