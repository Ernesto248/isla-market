# Guía de Testing para TestSprite - Sistema de Referidos

**Fecha:** 7 de octubre de 2025  
**Sistema:** Isla Market - Referral Program  
**Testing Tool:** TestSprite MCP

---

## 🎯 Objetivo

Esta guía documenta cómo ejecutar correctamente los tests automatizados del sistema de referidos usando TestSprite, con especial énfasis en el manejo correcto de códigos de referido vía URL.

---

## 🔑 Consideración CRÍTICA: Códigos de Referido por URL

### ⚠️ Decisión de Diseño

El sistema de referidos de Isla Market **NO incluye un campo manual de input** para que usuarios escriban códigos de referido. En su lugar, el código se detecta **automáticamente vía parámetro de URL**.

### ✅ Implementación Actual

```typescript
// El código se detecta así:
const urlParams = new URLSearchParams(window.location.search);
const refParam = urlParams.get("ref"); // Ejemplo: ?ref=JENIFERCAS1393

// Si existe, se muestra banner verde:
{
  referralCode && (
    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
      <p>Código de referido: {referralCode}</p>
    </div>
  );
}
```

### 🚫 Lo que NO existe

```typescript
// ❌ Este campo NO existe en el sistema:
<Input
  id="referralCode"
  name="referralCode"
  placeholder="Ingresa código de referido"
/>
```

---

## 📋 Cómo Escribir Tests Correctos

### ✅ Test CORRECTO: Signup con Código de Referido

```python
# TC007: Signup flow con código de referido
def test_signup_with_referral_code():
    # 1. Navegar a home con código en URL
    page.goto("http://localhost:3000/?ref=JENIFERCAS1393")

    # 2. Abrir modal de signup
    page.click('button:has-text("Registrarse")')

    # 3. Verificar que banner verde aparece
    banner = page.locator('div.bg-green-50')
    assert banner.is_visible()
    assert "JENIFERCAS1393" in banner.text_content()

    # 4. Completar formulario de signup
    page.fill('input[name="firstName"]', "Test")
    page.fill('input[name="lastName"]', "User")
    page.fill('input[type="email"]', "test@example.com")
    page.fill('input[type="password"]', "password123")
    page.fill('input[name="confirmPassword"]', "password123")

    # 5. Submit
    page.click('button[type="submit"]')

    # 6. Verificar relación creada en DB
    referral = query_db("SELECT * FROM referrals WHERE referral_code = 'JENIFERCAS1393'")
    assert referral is not None
```

### ❌ Test INCORRECTO

```python
# ❌ NO HACER ESTO - Campo no existe
def test_signup_incorrect():
    page.goto("http://localhost:3000/")
    page.click('button:has-text("Registrarse")')

    # ❌ Este campo NO existe en el sistema
    page.fill('input[name="referralCode"]', "JENIFERCAS1393")  # FALLO
```

---

## 🧪 Test Cases del Sistema

### TC007: Signup Flow con Código de Referido

**Objetivo:** Verificar que usuarios pueden registrarse usando enlace con código de referido

**Pre-requisitos:**

- Referidor existe en DB con código `TESTREF123`
- Referidor está activo (`is_active = true`)
- Código no está expirado

**Pasos:**

1. Navegar a `http://localhost:3000/?ref=TESTREF123`
2. Verificar que banner verde aparece con texto del código
3. Click en botón "Registrarse"
4. Completar formulario (firstName, lastName, email, password, confirmPassword)
5. Submit formulario
6. Verificar toast de éxito menciona "código de referido"
7. **Backend:** Verificar registro en tabla `referrals`
   - `referral_code = 'TESTREF123'`
   - `is_active = true`
   - `expires_at` calculado correctamente

**Resultado Esperado:** ✅ Usuario registrado con relación de referido activa

---

### TC009: Generación Automática de Comisiones

**Objetivo:** Verificar que comisiones se crean automáticamente cuando orden cambia a "paid"

**Pre-requisitos:**

- Usuario referido existe y está activo
- Referidor tiene comisión de 5%
- Usuario referido tiene orden "pendiente"

**Pasos:**

1. Login como admin
2. Navegar a `/admin/orders`
3. Buscar orden del usuario referido
4. Cambiar status de "pendiente" → "paid"
5. Verificar que comisión se crea en `referral_commissions`
6. Verificar cálculo: `commission_amount = order_total * 0.05`
7. Verificar stats se actualizan en dashboard

**Resultado Esperado:** ✅ Comisión creada con monto correcto

---

### TC020: End-to-End Referral Flow

**Objetivo:** Verificar flujo completo desde creación de referidor hasta comisión

**Pasos:**

1. **Admin:** Crear referidor con código `E2ETEST456`, comisión 10%
2. **Usuario nuevo:** Acceder a `/?ref=E2ETEST456`
3. **Usuario nuevo:** Completar signup
4. **Usuario referido:** Login y hacer compra de $100
5. **Admin:** Cambiar orden a "paid"
6. **Verificar:**
   - Referido aparece en `/admin/referrers/[id]` (sección "Lista de Referidos")
   - Comisión de $10 aparece en "Historial de Comisiones"
   - Stats globales actualizadas en `/admin/referrers/dashboard`
   - Referidor ve comisión en `/profile/referrals`

**Resultado Esperado:** ✅ Flujo completo funcional

---

## 🔧 Configuración de TestSprite

### Bootstrap Inicial

```bash
# Ejecutar antes de tests
node testsprite-mcp/dist/index.js bootstrap
```

**Parámetros:**

- `localPort`: 3000 (Next.js dev server)
- `type`: "frontend"
- `projectPath`: "c:\\Users\\mleon\\code\\market\\isla-market"
- `testScope`: "codebase"

### Ejecutar Tests Específicos

```bash
# Ejecutar solo tests críticos
node testsprite-mcp/dist/index.js generateCodeAndExecute
```

**Configuración:**

- `testIds`: `["TC007", "TC009", "TC020"]`
- `additionalInstruction`: "Usar URLs con ?ref=CODIGO para signup con referidos"

---

## 📊 Interpretación de Resultados

### ✅ Test Exitoso

```markdown
#### Test TC007

- **Status:** ✅ Passed
- **Test Error:** None
- **Analysis:** Signup con código completado exitosamente. Relación de referido creada en DB.
```

### ❌ Test Fallido (Código no detectado)

```markdown
#### Test TC007

- **Status:** ❌ Failed
- **Test Error:** missing referral code input field
- **Analysis:** Test intentó buscar campo de input manual. Debe usar URL con ?ref=CODIGO
```

### ❌ Test Fallido (Usuario ya existe)

```markdown
#### Test TC007

- **Status:** ❌ Failed
- **Test Error:** AuthApiError: User already registered (422)
- **Analysis:** Email ya registrado. Usar email único por test run.
```

---

## 🐛 Problemas Comunes y Soluciones

### Problema 1: "Missing referral code input field"

**Causa:** Test busca campo `<input>` que no existe

**Solución:** Actualizar test para usar URL con `?ref=CODIGO`

---

### Problema 2: "User already registered (422)"

**Causa:** Email de test ya usado en signup anterior

**Solución:** Generar emails únicos:

```python
import time
email = f"test_{int(time.time())}@example.com"
```

---

### Problema 3: "net::ERR_EMPTY_RESPONSE"

**Causa:** Servidor Next.js no responde

**Solución:**

1. Reiniciar dev server: `npm run dev`
2. Verificar puerto 3000 libre
3. Esperar a que server esté listo antes de tests

---

### Problema 4: "Sesión inválida detectada"

**Causa:** Token JWT expirado o inválido

**Solución:** Hacer fresh login antes de tests que requieren auth

---

## 📈 Métricas de Testing

### Cobertura Esperada

- ✅ Signup con código: TC007
- ✅ Signup sin código: (signup normal, no test específico)
- ✅ Validación de código: API `/api/referrals/validate-code`
- ✅ Creación de relación: API `/api/referrals/create-referral-link`
- ✅ Generación de comisión: Trigger on orders
- ✅ Dashboards: TC011, TC020

### Tests Críticos (Prioridad Alta)

1. **TC007** - Signup flow (core functionality)
2. **TC009** - Commission generation (business logic)
3. **TC020** - End-to-end (integration)

### Tests Secundarios

- TC001-TC006: Admin panel
- TC010-TC019: Edge cases y validaciones

---

## 📝 Notas Finales

### Créditos TestSprite

- Plan Free: 150 créditos
- Cada test run consume ~7-8 créditos por test
- Test suite completo (20 tests): ~150 créditos
- Test suite crítico (3 tests): ~25 créditos

**Recomendación:** Ejecutar tests críticos primero para validar funcionalidad core antes de gastar créditos en tests secundarios.

---

## 🔗 Referencias

- **PRD:** `REFERRAL_SYSTEM_PRD.md`
- **Código Auth Modal:** `components/auth/auth-modal.tsx` (líneas 69-82)
- **API Validación:** `app/api/referrals/validate-code/route.ts`
- **API Creación:** `app/api/referrals/create-referral-link/route.ts`

---

**Última actualización:** 7 de octubre de 2025
