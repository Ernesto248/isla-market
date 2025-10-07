/**
 * Script de diagnóstico para probar la salud del servidor Next.js
 * durante tests automatizados
 */

const http = require("http");

function testServerHealth(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const req = http.get(url, (res) => {
      const duration = Date.now() - startTime;
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          duration,
          contentLength: data.length,
          headers: res.headers,
          success: true,
        });
      });
    });

    req.on("error", (err) => {
      reject({
        error: err.message,
        duration: Date.now() - startTime,
        success: false,
      });
    });

    req.setTimeout(timeout, () => {
      req.destroy();
      reject({
        error: "Timeout",
        duration: Date.now() - startTime,
        success: false,
      });
    });
  });
}

async function runHealthChecks() {
  console.log("🔍 Iniciando diagnóstico del servidor Next.js...\n");

  const urls = [
    "http://localhost:3000",
    "http://localhost:3000/?ref=TESTCODE123",
    "http://localhost:3000/api/referrals/validate-code?code=TEST",
  ];

  for (const url of urls) {
    console.log(`📡 Probando: ${url}`);

    // Hacer 5 requests rápidos para simular carga de tests
    const results = [];
    for (let i = 0; i < 5; i++) {
      try {
        const result = await testServerHealth(url, 10000);
        results.push(result);
        console.log(
          `  ✅ Request ${i + 1}: ${result.statusCode} - ${
            result.duration
          }ms - ${result.contentLength} bytes`
        );
      } catch (error) {
        results.push(error);
        console.log(
          `  ❌ Request ${i + 1}: ${error.error} - ${error.duration}ms`
        );
      }

      // Pequeño delay entre requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Calcular estadísticas
    const successful = results.filter((r) => r.success).length;
    const avgDuration =
      results.filter((r) => r.success).reduce((sum, r) => sum + r.duration, 0) /
      (successful || 1);

    console.log(
      `  📊 Resumen: ${successful}/5 exitosos, promedio: ${avgDuration.toFixed(
        0
      )}ms\n`
    );
  }

  console.log("✅ Diagnóstico completado");
}

// Verificar memoria del proceso
console.log("💾 Uso de memoria del proceso Node actual:");
const memUsage = process.memoryUsage();
console.log(`  Heap usado: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
console.log(
  `  Heap total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`
);
console.log(`  RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB\n`);

runHealthChecks().catch(console.error);
