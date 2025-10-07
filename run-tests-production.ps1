# Script para ejecutar tests TestSprite en modo PRODUCCIÓN
# Soluciona problemas de ERR_EMPTY_RESPONSE y timeouts

param(
    [switch]$SkipBuild,
    [string[]]$TestIds = @("TC007", "TC009", "TC020")
)

$ErrorActionPreference = "Stop"

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🧪 TestSprite - Modo Producción" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Verificar si hay un servidor corriendo en puerto 3000
Write-Host "🔍 Verificando puerto 3000..." -ForegroundColor Yellow
$processOnPort = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($processOnPort) {
    $pid = $processOnPort.OwningProcess
    Write-Host "  ⚠️  Servidor detectado en puerto 3000 (PID: $pid)" -ForegroundColor Yellow
    Write-Host "  🛑 Deteniendo servidor anterior..." -ForegroundColor Red
    Stop-Process -Id $pid -Force
    Write-Host "  ✅ Servidor detenido" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "  ✅ Puerto 3000 libre" -ForegroundColor Green
}
Write-Host ""

# Build si no se especifica -SkipBuild
if (-not $SkipBuild) {
    Write-Host "🔨 Compilando aplicación..." -ForegroundColor Yellow
    Write-Host "  (Esto puede tomar 1-2 minutos)" -ForegroundColor Gray
    Write-Host ""
    
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error en build" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "  ✅ Build completado" -ForegroundColor Green
} else {
    Write-Host "⏭️  Saltando build (usando build existente)" -ForegroundColor Gray
}
Write-Host ""

# Iniciar servidor en modo producción en background
Write-Host "🚀 Iniciando servidor en modo PRODUCCIÓN..." -ForegroundColor Yellow
Write-Host "  URL: http://localhost:3000" -ForegroundColor Gray
Write-Host "  Modo: Production (optimizado para tests)" -ForegroundColor Gray
Write-Host ""

$job = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm start
}

Write-Host "  ⏳ Esperando a que servidor esté listo..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Verificar que servidor respondió
$maxAttempts = 10
$attempt = 0
$serverReady = $false

while ($attempt -lt $maxAttempts -and -not $serverReady) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            $serverReady = $true
            Write-Host "  ✅ Servidor listo y respondiendo" -ForegroundColor Green
        }
    } catch {
        $attempt++
        Write-Host "  ⏳ Intento $attempt/$maxAttempts..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $serverReady) {
    Write-Host "  ❌ Servidor no responde después de $maxAttempts intentos" -ForegroundColor Red
    Stop-Job -Job $job
    Remove-Job -Job $job
    exit 1
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🧪 Ejecutando Tests" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$testIdsStr = $TestIds -join ", "
Write-Host "  Tests a ejecutar: $testIdsStr" -ForegroundColor Gray
Write-Host "  Créditos estimados: ~$($TestIds.Count * 8)" -ForegroundColor Gray
Write-Host ""

# Ejecutar TestSprite
try {
    node C:\Users\mleon\AppData\Local\npm-cache\_npx\8ddf6bea01b2519d\node_modules\@testsprite\testsprite-mcp\dist\index.js generateCodeAndExecute
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "✅ Tests completados" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Resultados en: testsprite_tests/tmp/raw_report.md" -ForegroundColor Cyan
    
} catch {
    Write-Host ""
    Write-Host "❌ Error ejecutando tests" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
} finally {
    # Detener servidor
    Write-Host ""
    Write-Host "🛑 Deteniendo servidor..." -ForegroundColor Yellow
    Stop-Job -Job $job
    Remove-Job -Job $job
    Write-Host "  ✅ Servidor detenido" -ForegroundColor Green
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
