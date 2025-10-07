# Script para iniciar Next.js optimizado para testing con TestSprite
# Resuelve problemas de ERR_EMPTY_RESPONSE y timeouts

Write-Host "🧪 Iniciando servidor Next.js en modo testing..." -ForegroundColor Cyan
Write-Host ""

# Limpiar cache de Next.js
Write-Host "🧹 Limpiando cache de Next.js..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "  ✅ Cache eliminado" -ForegroundColor Green
} else {
    Write-Host "  ℹ️  No hay cache para limpiar" -ForegroundColor Gray
}
Write-Host ""

# Configurar variables de entorno para optimizar
$env:NODE_ENV = "development"
$env:TESTING_MODE = "true"
$env:NEXT_TELEMETRY_DISABLED = "1"

Write-Host "⚙️  Variables de entorno configuradas:" -ForegroundColor Yellow
Write-Host "  NODE_ENV: $env:NODE_ENV" -ForegroundColor Gray
Write-Host "  TESTING_MODE: $env:TESTING_MODE" -ForegroundColor Gray
Write-Host "  NEXT_TELEMETRY_DISABLED: $env:NEXT_TELEMETRY_DISABLED" -ForegroundColor Gray
Write-Host ""

Write-Host "🚀 Iniciando servidor..." -ForegroundColor Cyan
Write-Host "  URL: http://localhost:3000" -ForegroundColor Gray
Write-Host "  Modo: Testing optimizado" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Para detener el servidor presiona Ctrl+C" -ForegroundColor Yellow
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Iniciar Next.js con configuración optimizada
npm run dev
