# 🔍 Debug en Vivo: Referidos no aparecen en Vercel

**Fecha:** 10 de octubre de 2025  
**Usuario:** Ernest (ernestoleonard8@gmail.com)  
**Status:** 🔧 Debugging en curso

---

## ✅ Datos Confirmados

### **Base de Datos (Producción):**

```json
{
  "user_id": "fc6b64ca-1852-4ea2-b4eb-250fa2450ea9",
  "email": "ernestoleonard8@gmail.com",
  "referral_code": "ERNESTLEON5590",
  "is_active": true,
  "commission_rate": 3
}
```

✅ El usuario **SÍ es referidor** en la base de datos  
✅ El campo `is_active` es **true**  
✅ Hay **4 referidores activos** en total  
✅ Las variables de entorno están **correctamente configuradas**

---

## ❌ Problema

A pesar de que el usuario es referidor en la DB, la opción **"Mis Referidos"** NO aparece en el menú dropdown en Vercel (producción).

---

## 🔧 Cambios Aplicados (Debugging Mejorado)

### **1. Logs en el Header (`components/layout/header.tsx`)**

Agregados logs en el useEffect que verifica el estado de referidor:

```typescript
useEffect(() => {
  if (user && session?.access_token) {
    console.log("[Header] Checking referrer status for:", user.email);
    console.log("[Header] Has access token:", !!session.access_token);

    fetch("/api/referrals/check-status", ...)
      .then((res) => {
        console.log("[Header] API response status:", res.status);
        return res.json();
      })
      .then((data) => {
        console.log("[Header] API response data:", data);
        setIsReferrer(data.is_referrer || false);
        console.log("[Header] isReferrer set to:", data.is_referrer || false);
      })
      .catch((error) => {
        console.error("[Header] Error checking referrer status:", error);
        setIsReferrer(false);
      });
  }
}, [user, session]);
```

### **2. Log en el Renderizado**

Agregado log para ver el valor de `isReferrer` al momento de renderizar:

```typescript
{
  (() => {
    console.log("[Header] Rendering menu, isReferrer:", isReferrer);
    return (
      isReferrer && (
        <DropdownMenuItem asChild>
          <Link href="/profile/referrals">Mis Referidos</Link>
        </DropdownMenuItem>
      )
    );
  })();
}
```

---

## 🧪 Cómo Diagnosticar Ahora

### **Paso 1: Deploy con Logs**

```bash
git add .
git commit -m "Add comprehensive debug logs for referrals menu"
git push
```

### **Paso 2: Abrir DevTools en Vercel**

1. Ve a: **https://isla-market.com**
2. Presiona **F12** para abrir DevTools
3. Ve a la pestaña **Console**
4. Limpia la consola (icono 🚫)

### **Paso 3: Iniciar Sesión**

Inicia sesión con: **ernestoleonard8@gmail.com**

### **Paso 4: Observar los Logs**

Deberías ver algo como:

**Caso Exitoso (esperado):**

```
[Header] Checking referrer status for: ernestoleonard8@gmail.com
[Header] Has access token: true
[Header] API response status: 200
[Header] API response data: { is_referrer: true, referrer_id: "...", ... }
[Header] isReferrer set to: true
[Header] Rendering menu, isReferrer: true
```

**Caso con Problema:**

```
[Header] No user or session, setting isReferrer to false
// O
[Header] Checking referrer status for: ernestoleonard8@gmail.com
[Header] Has access token: true
[Header] API response status: 401
[Header] Error checking referrer status: {...}
```

### **Paso 5: Abrir el Menú de Usuario**

1. Click en el **icono de perfil** (User icon) en el header
2. Observa el log adicional:

```
[Header] Rendering menu, isReferrer: true/false
```

---

## 🎯 Diagnósticos Según los Logs

### **Si ves: `[Header] No user or session`**

**Problema:** El contexto de autenticación no está disponible

**Solución:**

- Verificar que `AuthProvider` esté envolviendo la app
- Revisar `/app/layout.tsx`

### **Si ves: `API response status: 401`**

**Problema:** Token de autenticación inválido

**Posibles causas:**

1. El token expiró
2. La clave `SUPABASE_SERVICE_ROLE_KEY` es incorrecta
3. Problema con JWT de Supabase

**Solución:**

- Cerrar sesión y volver a iniciar
- Verificar variables en Vercel
- Revisar logs del servidor

### **Si ves: `API response status: 500`**

**Problema:** Error en el servidor

**Solución:**

- Ir a: Vercel → Logs → Functions
- Buscar logs de `/api/referrals/check-status`
- Ver el error específico

### **Si ves: `isReferrer set to: false` pero la DB dice true**

**Problema:** La API no está encontrando el usuario

**Posibles causas:**

1. El `user.id` no coincide con el `user_id` de la tabla
2. Query SQL tiene un problema
3. RLS (Row Level Security) bloqueando la consulta

**Solución:**

- Verificar el `user_id` en los logs del servidor
- Comparar con el ID de la DB
- Revisar políticas RLS en Supabase

### **Si ves: `Rendering menu, isReferrer: false` constantemente**

**Problema:** El estado no se está actualizando

**Posibles causas:**

1. El useEffect no se está ejecutando
2. La dependencia del useEffect está mal
3. Re-render antes de que complete la petición

**Solución:**

- Verificar que el useEffect se ejecute (ver logs)
- Agregar timeout artificial para testing
- Revisar ciclo de vida del componente

---

## 🔬 Test Adicional: Forzar el Valor

Si quieres confirmar que el problema es la API y no el rendering, puedes hacer:

### **En `components/layout/header.tsx`:**

```typescript
// Cambio temporal solo para test
const [isReferrer, setIsReferrer] = useState(true); // ← Forzar a true

// Comenta el useEffect temporalmente
// useEffect(() => { ... }, [user, session]);
```

Si con esto **SÍ aparece** "Mis Referidos", confirmas que:

- ✅ El rendering funciona
- ❌ El problema está en la llamada a la API o el useEffect

---

## 📊 Posibles Escenarios

| Logs Observados                    | Diagnóstico                | Fix                             |
| ---------------------------------- | -------------------------- | ------------------------------- |
| `No user or session`               | Auth context no disponible | Verificar AuthProvider          |
| `status: 401`                      | Token inválido             | Renovar sesión / Verificar keys |
| `status: 500`                      | Error en servidor          | Ver logs de Vercel              |
| `isReferrer: false` (DB dice true) | Query no encuentra usuario | Verificar user_id               |
| `Rendering: false` siempre         | Estado no actualiza        | Verificar useEffect             |
| No aparecen logs                   | Script no ejecuta          | Cache del browser               |

---

## 🚀 Próximos Pasos

1. **Hacer commit y deploy:**

   ```bash
   git add .
   git commit -m "Add debug logs for referrals menu"
   git push
   ```

2. **Esperar deploy en Vercel** (~1-2 min)

3. **Abrir DevTools y Console**

4. **Iniciar sesión con ernestoleonard8@gmail.com**

5. **Copiar TODOS los logs que empiecen con `[Header]`**

6. **Reportar los logs aquí**

---

## 💡 Comando Rápido para Deploy

```bash
# Si estás en PowerShell:
git add . ; git commit -m "Add debug logs for referrals" ; git push
```

---

**Status:** 🔧 Logs agregados, esperando deploy y resultados  
**Archivos modificados:** `components/layout/header.tsx`  
**Próximo paso:** Deploy → DevTools → Reportar logs
