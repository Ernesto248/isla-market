# Sistema de Referidos - Tracking Interno para Comisiones

## Fecha

10 de Octubre, 2025

## Modelo de Negocio Correcto

### 🎯 Principio Fundamental

El sistema de referidos es **completamente interno** para tracking de comisiones del administrador. Los usuarios finales **NO deben ver** ningún mensaje sobre:

- ❌ Códigos de referido
- ❌ Quién los refirió
- ❌ Si el código era válido o inválido
- ❌ Si el referidor está activo o inactivo

### ✅ Comportamiento Correcto

1. **Usuario se registra con código**: Se guarda silenciosamente en localStorage
2. **Usuario confirma email y hace login**: El sistema intenta procesar el código
3. **Código válido**: Se crea la relación (solo visible en panel admin)
4. **Código inválido/referidor inactivo**: Usuario se registra normalmente, NO se muestra error
5. **Usuario final**: Nunca ve ningún mensaje relacionado con referidos

---

## Implementación Actual

### 1. Captura Silenciosa del Código (auth-modal.tsx)

```tsx
// Si hay código de referido, guardarlo silenciosamente (solo para tracking interno de comisiones)
if (referralCode) {
  localStorage.setItem("pending_referral_code", referralCode);
}

// Mensaje genérico - el sistema de referidos es interno
toast.success("¡Cuenta creada! Revisa tu email para confirmar.");
```

**✅ Resultado:**

- Usuario ve mensaje genérico de registro exitoso
- Código se guarda en background
- NO hay mención de referidos

---

### 2. Procesamiento Silencioso (auth-context.tsx)

```tsx
// Procesar código de referido pendiente (silencioso para el usuario)
const pendingReferralCode = localStorage.getItem("pending_referral_code");

if (pendingReferralCode && session?.access_token) {
  try {
    // Validar el código
    const validationResponse = await fetch(
      `/api/referrals/validate-code?code=${encodeURIComponent(
        pendingReferralCode
      )}`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (!validationResponse.ok) {
      // Código inválido o referidor inactivo - simplemente limpiar y continuar
      console.log(
        "Código de referido inválido o referidor inactivo - usuario registrado sin referidor"
      );
      localStorage.removeItem("pending_referral_code");
      return;
    }

    // Si el código es válido, intentar crear la relación
    const response = await fetch("/api/referrals/create-referral-link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        referral_code: pendingReferralCode,
      }),
    });

    if (response.ok) {
      console.log(
        "Relación de referido creada exitosamente (interno para comisiones)"
      );
    } else {
      const data = await response.json();
      console.log(
        "No se pudo crear relación de referido:",
        data.error || "Error desconocido"
      );
    }

    // Siempre limpiar el código pendiente
    localStorage.removeItem("pending_referral_code");
  } catch (error) {
    console.error("Error procesando código de referido:", error);
    localStorage.removeItem("pending_referral_code");
  }
}
```

**✅ Resultado:**

- Usuario NO ve ningún toast/mensaje
- Solo console.log para debugging del admin
- Si código es inválido: Usuario se registra normalmente
- Si código es válido: Se crea relación en background

---

## Flujos de Usuario (Desde su Perspectiva)

### Caso 1: Código Válido ✅

1. **Registro**: `"¡Cuenta creada! Revisa tu email para confirmar."`
2. **Confirma email y hace login**: Entra a la web normalmente
3. **Experiencia**: Usuario NO sabe que fue referido

**Backend (invisible):**

- ✅ Relación de referido creada
- ✅ Referidor recibirá comisiones de sus compras
- ✅ Visible en panel de admin

### Caso 2: Código Inválido ❌

1. **Registro**: `"¡Cuenta creada! Revisa tu email para confirmar."`
2. **Confirma email y hace login**: Entra a la web normalmente
3. **Experiencia**: Usuario NO sabe que el código era inválido

**Backend (invisible):**

- ❌ No se crea relación de referido
- ❌ Usuario no tiene referidor asignado
- ℹ️ Console.log para debugging

### Caso 3: Referidor Inactivo 🚫

1. **Registro**: `"¡Cuenta creada! Revisa tu email para confirmar."`
2. **Confirma email y hace login**: Entra a la web normalmente
3. **Experiencia**: Usuario NO sabe que el referidor está inactivo

**Backend (invisible):**

- ❌ No se crea relación de referido
- ❌ Usuario no tiene referidor asignado
- ℹ️ Console.log para debugging

---

## Comparación: Antes vs Ahora

| Escenario              | ❌ Antes (Incorrecto)                                     | ✅ Ahora (Correcto) |
| ---------------------- | --------------------------------------------------------- | ------------------- |
| **Código válido**      | 🎉 Toast: "¡Bienvenido! Has sido referido por Juan Pérez" | Silencio total      |
| **Código inválido**    | ❌ Toast: "Código de referido inválido..."                | Silencio total      |
| **Referidor inactivo** | ❌ Toast: "El código no existe o está inactivo"           | Silencio total      |
| **Ya tiene referidor** | ℹ️ Toast: "Ya tienes un referidor asignado"               | Silencio total      |
| **Error de red**       | ❌ Toast: "Error al procesar código..."                   | Silencio total      |

---

## Por Qué Este Enfoque

### 1. **Simplicidad para el Usuario**

- Usuario no necesita entender qué es un "código de referido"
- Proceso de registro limpio y directo
- Sin confusión sobre "quién me refirió" o "por qué recibí este código"

### 2. **Sistema Interno de Comisiones**

- Los referidos son para tracking de comisiones del admin
- Admin ve en su panel quién refirió a quién
- Cálculo automático de comisiones cuando orden es "pagado" o "entregado"

### 3. **Robustez**

- Si código es inválido: Usuario se registra igual
- Si referidor se desactiva: Usuario se registra igual
- Si hay error de red: Usuario se registra igual
- **El registro del usuario NUNCA falla por problemas de referidos**

### 4. **Transparencia para Admin**

- Console.log muestra lo que pasó con el código
- Panel de admin muestra relaciones de referidos activas
- Sistema de comisiones funciona automáticamente

---

## Archivos Modificados

### 1. `components/auth/auth-modal.tsx`

```tsx
// ANTES (❌ Incorrecto - mostraba código al usuario)
if (referralCode) {
  localStorage.setItem("pending_referral_code", referralCode);
  toast.success(
    `¡Cuenta creada! Serás referido por el código: ${referralCode}...`,
    { duration: 5000 }
  );
}

// AHORA (✅ Correcto - silencioso)
if (referralCode) {
  localStorage.setItem("pending_referral_code", referralCode);
}
toast.success("¡Cuenta creada! Revisa tu email para confirmar.");
```

### 2. `contexts/auth-context.tsx`

```tsx
// ANTES (❌ Incorrecto - toasts al usuario)
if (!validationResponse.ok) {
  toast.error("Código de referido inválido: ...");
  return;
}

if (response.ok) {
  toast.success(
    `¡Bienvenido! Has sido referido por ${validationData.referrer_name}`
  );
} else {
  toast.error("No se pudo procesar el código...");
}

// AHORA (✅ Correcto - solo console.log)
if (!validationResponse.ok) {
  console.log(
    "Código de referido inválido o referidor inactivo - usuario registrado sin referidor"
  );
  localStorage.removeItem("pending_referral_code");
  return;
}

if (response.ok) {
  console.log(
    "Relación de referido creada exitosamente (interno para comisiones)"
  );
} else {
  console.log("No se pudo crear relación de referido:", data.error);
}
```

---

## Características del Sistema

### ✅ Implementado

- **Links permanentes**: Los códigos NO expiran por tiempo
- **Sin límites**: No hay máximo de personas que un referidor puede referir
- **Actualización manual**: Estados de orden se cambian manualmente (no webhooks)
- **Comisiones automáticas**: Se calculan al marcar orden como "pagado" o "entregado"
- **Procesamiento silencioso**: Usuario NO ve mensajes sobre referidos
- **Registro robusto**: Usuario se registra aunque código sea inválido

### 🎯 Uso del Sistema

- **Para usuarios**: Invisible, no necesitan saber nada
- **Para referidores**: Panel en `/profile` para ver sus estadísticas
- **Para admin**: Panel en `/admin/referrers` para gestionar todo

---

## Testing

### Pruebas Manuales Recomendadas

#### 1. Código Válido

```bash
# 1. Obtener código de referidor activo desde panel admin
# 2. Construir URL: https://tusitio.com/?ref=ABC123
# 3. Registrar nuevo usuario
# 4. Verificar: Usuario ve solo mensaje genérico
# 5. Verificar en admin: Relación de referido creada
```

#### 2. Código Inválido

```bash
# 1. Usar URL: https://tusitio.com/?ref=CODIGOINVALIDO
# 2. Registrar nuevo usuario
# 3. Verificar: Usuario ve solo mensaje genérico (igual que caso 1)
# 4. Verificar en admin: Usuario NO tiene referidor asignado
# 5. Verificar console.log: "Código de referido inválido..."
```

#### 3. Referidor Desactivado

```bash
# 1. Desactivar referidor desde panel admin
# 2. Usar su código: https://tusitio.com/?ref=CODIGO_DESACTIVADO
# 3. Registrar nuevo usuario
# 4. Verificar: Usuario ve solo mensaje genérico
# 5. Verificar en admin: Usuario NO tiene referidor asignado
```

#### 4. Sin Código

```bash
# 1. Registrarse normalmente: https://tusitio.com/
# 2. Verificar: Usuario ve mensaje genérico
# 3. Verificar en admin: Usuario NO tiene referidor asignado
```

---

## Modelo de Negocio Final

### Para el Admin

1. **Crear referidores** en `/admin/referrers`
2. **Asignar código único** a cada referidor (ej: `JUAN2025`)
3. **Compartir link**: `https://tusitio.com/?ref=JUAN2025`
4. **Ver estadísticas**: Cuántos usuarios refirió cada uno
5. **Calcular comisiones**: Automático cuando orden es "pagado" o "entregado"
6. **Pagar comisiones**: Manualmente según configuración (mensual, trimestral, etc.)

### Para el Referidor

1. **Recibe su link personalizado** del admin
2. **Comparte el link** en redes sociales, WhatsApp, etc.
3. **Ve sus estadísticas** en `/profile` (si es referidor activo)
4. **Recibe comisiones** según las ventas de sus referidos

### Para el Usuario Final

1. **Entra por link de referido** (o no)
2. **Se registra normalmente** - proceso idéntico
3. **NO ve nada relacionado con referidos**
4. **Compra productos normalmente**
5. **NO sabe quién lo refirió** (ni le importa)

---

## Conclusión

Este enfoque hace que el sistema de referidos sea:

- ✅ **Invisible** para usuarios finales
- ✅ **Robusto** (registro nunca falla por referidos)
- ✅ **Simple** (usuario solo ve mensaje genérico)
- ✅ **Funcional** (admin trackea comisiones correctamente)
- ✅ **Permanente** (códigos no expiran)
- ✅ **Escalable** (sin límite de referidos)

El usuario tiene la mejor experiencia posible: **registro simple y directo**, mientras el admin tiene el tracking necesario para **calcular comisiones automáticamente**.
