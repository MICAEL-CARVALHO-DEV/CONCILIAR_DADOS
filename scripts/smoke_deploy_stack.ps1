$ErrorActionPreference = "Stop"

param(
  [string]$ApiBaseUrl = "https://sec-emendas-api.onrender.com",
  [string]$FrontOrigin = "https://micael-carvalho-dev.github.io",
  [string]$LoginUser = "",
  [string]$LoginPass = "",
  [switch]$SkipCors,
  [switch]$SkipLogin
)

function Write-Step([string]$msg) {
  Write-Host "[smoke-deploy] $msg" -ForegroundColor Cyan
}

function Assert-True([bool]$cond, [string]$msg) {
  if (-not $cond) {
    throw "[FALHA] $msg"
  }
}

$base = ($ApiBaseUrl.TrimEnd('/'))
Write-Step "API base: $base"
if (-not $SkipCors) {
  Write-Step "Front origin: $FrontOrigin"
}

# 1) Health
Write-Step "GET /health"
$health = Invoke-RestMethod -Method Get -Uri "$base/health"
Assert-True ($health.ok -eq $true) "/health sem ok=true"
Write-Host ("  ok={0} auth_enabled={1} env={2}" -f $health.ok, $health.auth_enabled, $health.app_env) -ForegroundColor Green

# 2) OpenAPI + rotas criticas
Write-Step "GET /openapi.json"
$openapi = Invoke-RestMethod -Method Get -Uri "$base/openapi.json"
$paths = @($openapi.paths.PSObject.Properties.Name)
Assert-True ($paths -contains "/auth/login") "rota /auth/login ausente"
Assert-True ($paths -contains "/auth/register") "rota /auth/register ausente"
Assert-True ($paths -contains "/auth/recovery-request") "rota /auth/recovery-request ausente"
Assert-True ($paths -contains "/roles") "rota /roles ausente"
Write-Host "  rotas criticas presentes" -ForegroundColor Green

# 3) Roles
Write-Step "GET /roles"
$roles = Invoke-RestMethod -Method Get -Uri "$base/roles"
Assert-True ($null -ne $roles.roles) "/roles sem payload de perfis"
Write-Host ("  roles={0}" -f (($roles.roles | ForEach-Object { "$_" }) -join ",")) -ForegroundColor Green

# 4) CORS preflight (frontend -> backend)
if (-not $SkipCors) {
  Write-Step "OPTIONS /auth/login (preflight CORS)"
  $corsHeaders = @{
    Origin = $FrontOrigin
    "Access-Control-Request-Method" = "POST"
    "Access-Control-Request-Headers" = "content-type"
  }
  $preflight = Invoke-WebRequest -Method Options -Uri "$base/auth/login" -Headers $corsHeaders
  Assert-True ($preflight.StatusCode -ge 200 -and $preflight.StatusCode -lt 300) "preflight retornou status invalido"
  $allowOrigin = [string]$preflight.Headers["Access-Control-Allow-Origin"]
  if ($allowOrigin -and $allowOrigin -ne "*") {
    Assert-True ($allowOrigin -eq $FrontOrigin) "Access-Control-Allow-Origin diferente da origin do front"
  }
  Write-Host ("  preflight={0} allow-origin={1}" -f $preflight.StatusCode, ($allowOrigin -replace "\s+", "")) -ForegroundColor Green
}

# 5) Login opcional (somente se credenciais forem passadas)
if (-not $SkipLogin -and $LoginUser -and $LoginPass) {
  Write-Step "POST /auth/login (credencial de validacao)"
  $body = @{ nome = $LoginUser; senha = $LoginPass } | ConvertTo-Json
  try {
    $login = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType "application/json" -Body $body
    Assert-True ([string]::IsNullOrWhiteSpace([string]$login.token) -eq $false) "login sem token"
    Write-Host "  login OK (token recebido)" -ForegroundColor Green
  } catch {
    Write-Host "  login falhou com as credenciais informadas." -ForegroundColor Yellow
    throw
  }
} else {
  Write-Step "Login foi pulado (use -LoginUser e -LoginPass para validar autenticação real)."
}

Write-Host ""
Write-Host "[smoke-deploy] OK - stack validada." -ForegroundColor Green
