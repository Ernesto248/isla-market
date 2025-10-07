# Análisis: Fallos del Servidor Next.js Durante Tests Automatizados

**Fecha:** 7 de octubre de 2025  
**Sistema:** Isla Market - Next.js 13.5.1  
**Testing Tool:** TestSprite MCP con Playwright  
**Estado:** Investigación completada ✅

---

## 🔍 Síntomas Observados

### Errores en Tests Automatizados

Los 20 tests iniciales fallaron con los siguientes errores recurrentes:

1. **`net::ERR_EMPTY_RESPONSE`**

   - Archivos: `_next/static/css/app/layout.css`, `_next/static/chunks/main-app.js`, `_next/static/chunks/webpack.js`
   - Frecuencia: Muy alta (casi todos los tests)
   - Impacto: Assets estáticos no cargan

2. **`Page.goto: Timeout 60000ms exceeded`**

   - URL: `http://localhost:3000/`
   - Frecuencia: Alta
   - Impacto: Páginas nunca terminan de cargar

3. **`ERR_INCOMPLETE_CHUNKED_ENCODING`**

   - Archivos: CSS y JS
   - Frecuencia: Media
   - Impacto: Respuestas HTTP cortadas

4. **React Hydration Errors**

   - Error: "An error occurred during hydration"
   - Frecuencia: Media
   - Impacto: Rendering inconsistente entre servidor y cliente

5. **`ERR_CONNECTION_CLOSED`**
   - Archivos: Imágenes de DigitalOcean Spaces
   - Frecuencia: Baja
   - Impacto: Imágenes no cargan (problema secundario)

---

## ✅ Diagnóstico

### Test 1: Requests HTTP Simples

**Comando ejecutado:**

```bash
node test-server-health.js
```

**Resultados:**

```
http://localhost:3000           → 5/5 exitosos (promedio: 123ms)
http://localhost:3000/?ref=TEST → 5/5 exitosos (promedio: 71ms)
/api/referrals/validate-code    → 5/5 exitosos (promedio: 525ms)
```

**Conclusión:** ✅ El servidor responde perfectamente a requests HTTP normales.

---

### Test 2: Estado del Servidor

**Proceso Next.js:**

- PID: 5760
- CPU: 73.95% (MUY ALTO - indica sobrecarga)
- Memoria: 710 MB (ALTO para dev server)
- Puerto: 3000 (LISTENING)

**Conclusión:** ⚠️ El servidor está bajo alta carga, posiblemente saturado.

---

### Test 3: Análisis de Logs TestSprite

**Patrón detectado:**

- Assets estáticos (\_next/static/\*) fallan consistentemente
- Páginas principales (/) tienen timeouts
- Archivos pequeños (HTML) a veces funcionan
- Errores aparecen solo con navegadores automatizados (Playwright)

**Conclusión:** 🎯 El problema es específico de **Playwright/navegadores automatizados**, no del servidor en sí.

---

## 🧠 Teoría del Problema

### Causa Raíz Probable

**El servidor de desarrollo de Next.js no está optimizado para manejar múltiples navegadores automatizados concurrentes haciendo requests rápidos.**

**Por qué sucede:**

1. **Fast Refresh / HMR (Hot Module Replacement)**

   - Next.js dev tiene watch mode activo
   - Detecta "cambios" cuando múltiples navegadores acceden
   - Re-compila innecesariamente
   - Causa race conditions en assets

2. **Compilación On-Demand**

   - Next.js compila páginas cuando se solicitan por primera vez
   - 20 tests simultáneos = 20 compilaciones simultáneas
   - Sobrecarga el thread único de Node.js
   - Result: Timeouts y respuestas vacías

3. **Webpack Dev Middleware**

   - Sirve assets desde memoria
   - No optimizado para concurrencia alta
   - Buffer interno puede vaciarse/corromperse

4. **Sin Caching Agresivo**
   - Cada request Playwright = nueva compilación
   - No reutiliza assets compilados
   - Multiplica carga CPU/memoria

---

## 💡 Soluciones Propuestas

### Opción 1: Usar Modo Producción (⭐ RECOMENDADO)

**Beneficios:**

- Assets pre-compilados
- Sin HMR ni watch mode
- Optimizado para concurrencia
- Más estable

**Implementación:**

```bash
# 1. Build producción
npm run build

# 2. Iniciar en modo producción
npm start

# 3. Ejecutar tests TestSprite
node testsprite-mcp/dist/index.js generateCodeAndExecute
```

**Desventajas:**

- Requiere rebuild si cambias código
- Más lento para desarrollo iterativo

---

### Opción 2: Optimizar Servidor Dev

**Cambios en `next.config.js`:**

- Deshabilitar Fast Refresh: `reactStrictMode: false`
- Deshabilitar optimizaciones: `swcMinify: false`
- Agregar caching agresivo
- Configurar webpack watchOptions

**Implementación:**

```bash
# Usar script optimizado
.\start-test-server.ps1

# Variables de entorno:
TESTING_MODE=true
NEXT_TELEMETRY_DISABLED=1
```

**Archivo creado:** `start-test-server.ps1`

**Desventajas:**

- No elimina completamente el problema
- Requiere configuración especial

---

### Opción 3: Reducir Concurrencia de Tests

**TestSprite Config:**

- Ejecutar tests secuencialmente (más lento pero más estable)
- Reducir número de tests por run
- Agregar delays entre navegaciones

**Implementación:**

```javascript
// En testsprite config
{
  "concurrency": 1,  // Un test a la vez
  "navigationTimeout": 90000,  // 90 segundos
  "actionDelay": 500  // 500ms entre acciones
}
```

**Desventajas:**

- Tests mucho más lentos
- Gasta más créditos (tiempo x créditos)

---

### Opción 4: Reiniciar Servidor Entre Test Runs

**Script de reinicio automático:**

```bash
# Matar proceso actual
Stop-Process -Id 5760 -Force

# Limpiar cache
Remove-Item -Recurse -Force .next

# Reiniciar servidor
npm run dev
```

**Desventajas:**

- Manual o requiere automatización
- Downtime entre runs

---

## 📊 Comparación de Soluciones

| Solución             | Efectividad | Complejidad | Velocidad Tests | Recomendado |
| -------------------- | ----------- | ----------- | --------------- | ----------- |
| **Modo Producción**  | ⭐⭐⭐⭐⭐  | ⭐⭐        | ⭐⭐⭐⭐⭐      | ✅ SÍ       |
| Optimizar Dev        | ⭐⭐⭐      | ⭐⭐⭐⭐    | ⭐⭐⭐          | 🤔 Tal vez  |
| Reducir Concurrencia | ⭐⭐⭐      | ⭐          | ⭐              | ❌ No       |
| Reiniciar Servidor   | ⭐⭐        | ⭐⭐⭐      | ⭐⭐            | ❌ No       |

---

## 🎯 Recomendación Final

### Estrategia A: Tests en Producción (Para validación final)

```bash
# 1. Build
npm run build

# 2. Start production
npm start

# 3. Run tests
cd testsprite_tests
node ../node_modules/@testsprite/testsprite-mcp/dist/index.js generateCodeAndExecute
```

**Usar cuando:**

- Quieres validar comportamiento final
- Tienes cambios estables
- Necesitas resultados confiables

---

### Estrategia B: Dev con Reinicio (Para desarrollo iterativo)

```bash
# Antes de cada test run:
# 1. Detener servidor actual (Ctrl+C)
# 2. Limpiar cache
Remove-Item -Recurse -Force .next

# 3. Reiniciar servidor
npm run dev

# 4. Esperar a que esté listo
Start-Sleep -Seconds 10

# 5. Ejecutar tests
node testsprite-mcp/dist/index.js generateCodeAndExecute
```

**Usar cuando:**

- Estás desarrollando features
- Necesitas ver cambios rápido
- Haces tests frecuentes

---

## 📝 Archivos Creados

1. **`test-server-health.js`**

   - Script de diagnóstico
   - Verifica salud del servidor con HTTP requests

2. **`start-test-server.ps1`**

   - Inicia servidor optimizado para testing
   - Limpia cache automáticamente
   - Configura variables de entorno

3. **`next.config.test.js`**
   - Configuración alternativa de Next.js
   - Desactiva optimizaciones problemáticas
   - Pendiente de activar

---

## 🔬 Experimentos Adicionales Sugeridos

### Experimento 1: Probar con Producción

```bash
npm run build && npm start
# Luego ejecutar 3 tests críticos
```

**Hipótesis:** Tests pasarán sin errores de assets

---

### Experimento 2: Reducir a 1 Test

```bash
# Solo TC007
node testsprite-mcp/dist/index.js generateCodeAndExecute --testIds TC007
```

**Hipótesis:** Un solo navegador no satura el servidor

---

### Experimento 3: Aumentar Memoria Node

```bash
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run dev
```

**Hipótesis:** Más memoria = menos crashes de assets

---

## 🚀 Próximos Pasos

### Inmediato (ahora)

1. ✅ Análisis completado
2. ⏭️ **Probar Estrategia A**: Build + Production + Tests
3. ⏭️ Validar si tests pasan en producción

### Si funciona en producción

4. Documentar en `TESTSPRITE_TESTING_GUIDE.md`
5. Crear script automatizado `run-tests-production.ps1`
6. Agregar al README instrucciones de testing

### Si NO funciona en producción

4. Investigar configuración de Playwright en TestSprite
5. Revisar timeouts y retries
6. Contactar soporte de TestSprite

---

## 📚 Referencias

- **Next.js Performance:** https://nextjs.org/docs/advanced-features/measuring-performance
- **Playwright Best Practices:** https://playwright.dev/docs/best-practices
- **Next.js Build Output:** https://nextjs.org/docs/deployment

---

**Última actualización:** 7 de octubre de 2025  
**Status:** ✅ Diagnóstico completado - Listo para probar solución
