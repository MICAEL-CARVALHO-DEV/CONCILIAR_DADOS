param(
  [string]$BaseUrl = "http://127.0.0.1:8000",
  [string]$UserName = "MICAEL_DEV",
  [string]$Password = "",
  [string]$Objective = "Criar plano de melhoria de performance para listagem de emendas",
  [string]$Contexto = "Backend FastAPI com SQLAlchemy; evitar regressao em /emendas e /audit",
  [string[]]$Criterios = @(
    "Nao quebrar endpoints existentes",
    "Sugerir testes de regressao",
    "Priorizar mudancas de baixo risco"
  ),
  [ValidateSet("planejar", "implementar", "revisar", "completo")]
  [string]$Mode = "completo",
  [switch]$NoHelpers,
  [int]$MaxTokens = 1200,
  [double]$Temperature = 0.2,
  [string]$OutFile = ""
)

$ErrorActionPreference = "Stop"
$base = $BaseUrl.TrimEnd("/")

function Get-PlainPassword([string]$CurrentValue, [string]$PromptLabel) {
  if ($CurrentValue) { return $CurrentValue }

  $secure = Read-Host -Prompt $PromptLabel -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}

function Get-HttpErrorDetail([object]$ErrorRecord) {
  try {
    $detailsMessage = [string]$ErrorRecord.ErrorDetails.Message
    if (-not [string]::IsNullOrWhiteSpace($detailsMessage)) {
      return $detailsMessage.Trim()
    }
  } catch {}

  try {
    $response = $ErrorRecord.Exception.Response
    if ($null -eq $response) { return ($ErrorRecord.Exception.Message | Out-String).Trim() }
    $stream = $response.GetResponseStream()
    if ($null -eq $stream) { return ($ErrorRecord.Exception.Message | Out-String).Trim() }
    $reader = New-Object System.IO.StreamReader($stream)
    $raw = $reader.ReadToEnd()
    if (-not [string]::IsNullOrWhiteSpace($raw)) { return $raw.Trim() }
    return ($ErrorRecord.Exception.Message | Out-String).Trim()
  } catch {
    return ($ErrorRecord.Exception.Message | Out-String).Trim()
  }
}

function Invoke-Json {
  param(
    [string]$Method,
    [string]$Url,
    [hashtable]$Headers,
    [object]$Body
  )

  if ($null -ne $Body) {
    $json = $Body | ConvertTo-Json -Depth 20
    return Invoke-RestMethod -Method $Method -Uri $Url -Headers $Headers -ContentType "application/json" -Body $json
  }

  return Invoke-RestMethod -Method $Method -Uri $Url -Headers $Headers
}

Write-Host "[ai-workflow] base: $base"
Write-Host "[ai-workflow] usuario: $UserName"

# 0) Health
try {
  $health = Invoke-Json -Method "GET" -Url "$base/health" -Headers @{} -Body $null
  Write-Host ("[ai-workflow] health ok={0} providers={1}" -f $health.ok, $health.ai_configured_providers) -ForegroundColor Green
} catch {
  $detail = Get-HttpErrorDetail $_
  throw "falha no /health: $detail"
}

# 1) Login
$plainPassword = Get-PlainPassword -CurrentValue $Password -PromptLabel "Senha de $UserName"
try {
  $login = Invoke-Json -Method "POST" -Url "$base/auth/login" -Headers @{} -Body @{
    nome = $UserName
    senha = $plainPassword
  }
} catch {
  $detail = Get-HttpErrorDetail $_
  throw "falha no /auth/login: $detail"
}

$token = [string]$login.token
if (-not $token) {
  throw "login sem token. usuario precisa estar ativo e com credencial valida."
}
Write-Host "[ai-workflow] login OK" -ForegroundColor Green

$authHeaders = @{
  Authorization = "Bearer $token"
}

# 2) Status dos providers (opcional, ajuda no diagnostico)
try {
  $providers = Invoke-Json -Method "GET" -Url "$base/ai/providers/status" -Headers $authHeaders -Body $null
  $configured = @($providers.providers | Where-Object { $_.configured -eq $true } | ForEach-Object { $_.provider_id })
  Write-Host ("[ai-workflow] providers configurados: {0}" -f ($configured -join ", ")) -ForegroundColor Green
} catch {
  $detail = Get-HttpErrorDetail $_
  Write-Host ("[ai-workflow] aviso: nao foi possivel consultar providers: {0}" -f $detail) -ForegroundColor Yellow
}

# 3) Executa workflow
$payload = @{
  objective = $Objective
  contexto = $Contexto
  criterios = @($Criterios)
  mode = $Mode
  include_helpers = (-not $NoHelpers.IsPresent)
  max_tokens = $MaxTokens
  temperature = $Temperature
}

Write-Host ("[ai-workflow] executando mode={0} helpers={1}" -f $Mode, (-not $NoHelpers.IsPresent))
try {
  $result = Invoke-Json -Method "POST" -Url "$base/ai/workflows/review-loop" -Headers $authHeaders -Body $payload
} catch {
  $detail = Get-HttpErrorDetail $_
  throw "falha no /ai/workflows/review-loop: $detail"
}

Write-Host "[ai-workflow] OK" -ForegroundColor Green
Write-Host ("  workflow_id: {0}" -f $result.workflow_id)
Write-Host ("  mode:        {0}" -f $result.mode)
Write-Host ("  warnings:    {0}" -f (@($result.warnings).Count))
Write-Host ("  steps:       {0}" -f (@($result.steps).Count))
Write-Host ""
Write-Host "===== FINAL OUTPUT ====="
Write-Output $result.final_output

if ($OutFile) {
  $dir = Split-Path -Parent $OutFile
  if ($dir -and -not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }
  ($result | ConvertTo-Json -Depth 30) | Set-Content -Encoding UTF8 $OutFile
  Write-Host ("[ai-workflow] resultado salvo em: {0}" -f $OutFile) -ForegroundColor Green
}
