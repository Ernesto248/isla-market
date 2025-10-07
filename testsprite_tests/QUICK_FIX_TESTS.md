# 🎯 Quick Fix: Ejecutar Tests TestSprite con Éxito

## 📋 Resumen del Problema

**Síntomas:**

- ❌ 20 tests fallando con `ERR_EMPTY_RESPONSE`
- ❌ Timeouts de 60 segundos
- ❌ Assets estáticos (CSS/JS) no cargan

**Causa:**

- Next.js dev server se satura con múltiples navegadores automatizados
- Compilación on-demand no optimizada para concurrencia

**Solución:**

- ✅ Usar modo PRODUCCIÓN con assets pre-compilados

---

## 🚀 Ejecutar Tests (Modo Producción)

### Opción 1: Script Automatizado (Recomendado)

```powershell
.\run-tests-production.ps1
```

**Esto automáticamente:**

1. Detiene servidor actual si existe
2. Compila la aplicación (`npm run build`)
3. Inicia servidor en modo producción
4. Ejecuta los 3 tests críticos
5. Detiene el servidor al terminar

**Parámetros opcionales:**

```powershell
# Saltar build (usar build existente)
.\run-tests-production.ps1 -SkipBuild

# Ejecutar tests específicos
.\run-tests-production.ps1 -TestIds "TC001","TC002","TC003"
```

---

### Opción 2: Manual (Paso a Paso)

```powershell
# 1. Detener servidor dev si está corriendo
# Presiona Ctrl+C en la terminal del servidor

# 2. Compilar aplicación
npm run build

# 3. Iniciar en modo producción
npm start

# 4. En otra terminal, ejecutar tests
node C:\Users\mleon\AppData\Local\npm-cache\_npx\8ddf6bea01b2519d\node_modules\@testsprite\testsprite-mcp\dist\index.js generateCodeAndExecute
```

---

## 📊 Resultados Esperados

### Con Dev Server (Antes)

```
Progress ████████████████████████████████████████ 20/20
❌ 0 passed | ❌ 20 failed
Errores: ERR_EMPTY_RESPONSE, Timeouts
```

### Con Production Server (Después)

```
Progress ████████████████████████████████████████ 3/3
✅ 2-3 passed | ❌ 0-1 failed
Sin errores de assets
```

---

## 🔧 Troubleshooting

### Problema: "Puerto 3000 ya en uso"

```powershell
# Ver qué proceso usa el puerto
netstat -ano | findstr :3000

# Detener el proceso (reemplazar PID)
Stop-Process -Id <PID> -Force
```

---

### Problema: "Build falla"

```powershell
# Limpiar cache de Next.js
Remove-Item -Recurse -Force .next

# Limpiar node_modules si persiste
Remove-Item -Recurse -Force node_modules
npm install

# Volver a intentar build
npm run build
```

---

### Problema: "Tests siguen fallando"

**Posibles causas:**

1. **Código del sistema tiene bugs** → Revisar logs específicos de cada test
2. **Base de datos no tiene datos** → Crear referidor de prueba manualmente
3. **Variables de entorno faltantes** → Verificar `.env.local`

**Verificación manual:**

```powershell
# Probar signup con código en navegador manual
# 1. Abrir: http://localhost:3000/?ref=TESTCODE123
# 2. Verificar que banner verde aparece
# 3. Completar signup
# 4. Verificar en DB: SELECT * FROM referrals
```

---

## 📁 Archivos de Referencia

| Archivo                                        | Descripción                       |
| ---------------------------------------------- | --------------------------------- |
| `testsprite_tests/SERVER_DIAGNOSIS.md`         | Análisis técnico completo         |
| `run-tests-production.ps1`                     | Script automatizado de tests      |
| `test-server-health.js`                        | Diagnóstico de salud del servidor |
| `REFERRAL_SYSTEM_PRD.md`                       | PRD con flujo de URL actualizado  |
| `testsprite_tests/TESTSPRITE_TESTING_GUIDE.md` | Guía completa de testing          |

---

## ⏱️ Tiempos Estimados

| Tarea                       | Tiempo          |
| --------------------------- | --------------- |
| Build inicial               | ~2 minutos      |
| Iniciar servidor producción | ~5 segundos     |
| Ejecutar 3 tests críticos   | ~10 minutos     |
| **TOTAL**                   | **~12 minutos** |

---

## 💰 Créditos TestSprite

- Plan Free: **150 créditos**
- Costo por test: **~7-8 créditos**
- Tests críticos (3): **~25 créditos**
- Tests completos (20): **~150 créditos**

**Recomendación:** Ejecutar primero los 3 críticos para validar que funciona antes de gastar todos los créditos.

---

## ✅ Checklist Pre-Tests

Antes de ejecutar tests, verificar:

- [ ] Servidor dev detenido (Ctrl+C)
- [ ] Puerto 3000 libre (`netstat -ano | findstr :3000`)
- [ ] Variables de entorno en `.env.local`
- [ ] Base de datos Supabase accesible
- [ ] Referidor de prueba existe en DB
- [ ] Build exitoso (`npm run build`)
- [ ] Servidor producción responde (`http://localhost:3000`)

---

## 🎯 Próximos Pasos

1. **Ahora:** Ejecutar `.\run-tests-production.ps1`
2. **Revisar:** Resultados en `testsprite_tests/tmp/raw_report.md`
3. **Si pasan:** Documentar éxito y celebrar 🎉
4. **Si fallan:** Revisar logs específicos de cada test y arreglar bugs del código

---

**Creado:** 7 de octubre de 2025  
**Última actualización:** 7 de octubre de 2025
