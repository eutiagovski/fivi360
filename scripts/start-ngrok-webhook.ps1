# Expõe o webhook mercadoPagoWebhook (emulador Functions :5001) via ngrok.
# Pré-requisitos: firebase emulators rodando + NGROK_AUTHTOKEN em .env.local

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $ProjectRoot ".env.local"
$FunctionsPort = 5001
$WebhookPath = "/fivi360/southamerica-east1/mercadoPagoWebhook"
$NgrokApi = "http://127.0.0.1:4040/api/tunnels"

function Read-EnvValue {
    param([string]$Name)

    if (-not (Test-Path $EnvFile)) {
        return $null
    }

    foreach ($line in Get-Content $EnvFile) {
        if ($line -match "^\s*$Name\s*=\s*(.+)\s*$") {
            return $Matches[1].Trim().Trim('"').Trim("'")
        }
    }

    return $null
}

$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Write-Error "ngrok não encontrado. Instale com: winget install Ngrok.Ngrok"
}

try {
    Invoke-WebRequest -Uri "http://127.0.0.1:$FunctionsPort" -UseBasicParsing -TimeoutSec 3 | Out-Null
} catch {
    if ($_.Exception.Message -notmatch "404|405|500") {
        Write-Error "Emulador Functions não responde em http://127.0.0.1:$FunctionsPort. Rode: npm run emulators"
    }
}

$authtoken = Read-EnvValue "NGROK_AUTHTOKEN"

if (-not $authtoken) {
    Write-Host ""
    Write-Host "NGROK_AUTHTOKEN não encontrado em .env.local" -ForegroundColor Yellow
    Write-Host "1. Crie conta: https://dashboard.ngrok.com/signup"
    Write-Host "2. Copie o token: https://dashboard.ngrok.com/get-started/your-authtoken"
    Write-Host "3. Adicione em .env.local: NGROK_AUTHTOKEN=seu_token"
    Write-Host "4. Rode novamente: npm run ngrok:webhook"
    Write-Host ""
    exit 1
}

ngrok config add-authtoken $authtoken | Out-Null
ngrok update 2>$null | Out-Null

$existing = Get-Process -Name ngrok -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Encerrando ngrok anterior (PID $($existing.Id))..."
    Stop-Process -Id $existing.Id -Force
    Start-Sleep -Seconds 1
}

Write-Host "Iniciando ngrok na porta $FunctionsPort..."
Start-Process -FilePath "ngrok" -ArgumentList @("http", "$FunctionsPort", "--log=stdout") -WindowStyle Minimized | Out-Null

$publicUrl = $null

for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Seconds 1

    try {
        $response = Invoke-RestMethod -Uri $NgrokApi -TimeoutSec 2
        $tunnel = $response.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1

        if ($tunnel.public_url) {
            $publicUrl = $tunnel.public_url.TrimEnd("/")
            break
        }
    } catch {
        continue
    }
}

if (-not $publicUrl) {
    Write-Error "Não foi possível obter a URL pública do ngrok. Verifique http://127.0.0.1:4040"
}

$webhookUrl = "$publicUrl$WebhookPath"

Write-Host ""
Write-Host "=== Túnel ngrok ativo ===" -ForegroundColor Green
Write-Host "Dashboard: http://127.0.0.1:4040"
Write-Host "Webhook Mercado Pago:"
Write-Host $webhookUrl -ForegroundColor Cyan
Write-Host ""
Write-Host "Configure esta URL no painel MP (Webhooks / Notificações IPN)."
Write-Host "Eventos serão salvos em billingWebhookEvents no Firestore Emulator."
Write-Host ""
