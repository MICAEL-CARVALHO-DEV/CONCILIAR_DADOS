param(
  [string]$ApiBaseUrl = "https://sec-emendas-api.onrender.com",
  [string]$FrontOrigin = "https://conciliar-dados.pages.dev",
  [string]$LoginUser = "",
  [string]$LoginPass = "",
  [string]$ExpectBranch = "",
  [switch]$SkipCors,
  [switch]$SkipLogin,
  [switch]$ExpectProduction = $true,
  [switch]$RequireReady = $true
)

$ErrorActionPreference = "Stop"

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
$deployService = [string]($health.deployment.service)
$deployBranch = [string]($health.deployment.branch)
$deployCommit = [string]($health.deployment.commit)
if ($deployService -or $deployBranch -or $deployCommit) {
  Write-Host ("  deploy service={0} branch={1} commit={2}" -f $deployService, $deployBranch, $deployCommit) -ForegroundColor DarkCyan
}

if ($ExpectProduction) {
  Assert-True ($health.app_env -eq "production") "/health.app_env deveria ser production"
  Assert-True ($health.auth_enabled -eq $true) "/health.auth_enabled deveria ser true"
  Assert-True ($health.db_auto_bootstrap -eq $false) "/health.db_auto_bootstrap deveria ser false em producao"
  Assert-True ($health.demo_mode -eq $false) "/health.demo_mode deveria ser false em producao"
}

if ($ExpectBranch) {
  Assert-True ($deployBranch -eq $ExpectBranch) "/health.deployment.branch diferente da branch esperada"
}

if ($RequireReady) {
  Assert-True ($null -ne $health.production_ready) "/health sem production_ready"
  Assert-True ($health.production_ready -eq $true) "/health.production_ready deveria ser true"
  $runtimeWarnings = @($health.runtime_warnings)
  Assert-True ($runtimeWarnings.Count -eq 0) "/health.runtime_warnings deveria estar vazio"
}

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

  $statusCode = 0
  $allowOrigin = ""
  try {
    $preflight = Invoke-WebRequest -Method Options -Uri "$base/auth/login" -Headers $corsHeaders
    $statusCode = [int]$preflight.StatusCode
    $allowOrigin = [string]$preflight.Headers["Access-Control-Allow-Origin"]
  } catch {
    # Fallback para ambientes onde Invoke-WebRequest falha em OPTIONS.
    Add-Type -AssemblyName System.Net.Http
    $client = [System.Net.Http.HttpClient]::new()
    $req = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Options, "$base/auth/login")
    $req.Headers.TryAddWithoutValidation("Origin", $FrontOrigin) | Out-Null
    $req.Headers.TryAddWithoutValidation("Access-Control-Request-Method", "POST") | Out-Null
    $req.Headers.TryAddWithoutValidation("Access-Control-Request-Headers", "content-type") | Out-Null
    $resp = $client.SendAsync($req).GetAwaiter().GetResult()
    $statusCode = [int]$resp.StatusCode
    if ($resp.Headers.Contains("Access-Control-Allow-Origin")) {
      $allowOrigin = ($resp.Headers.GetValues("Access-Control-Allow-Origin") | Select-Object -First 1)
    }
    $client.Dispose()
  }

  Assert-True ($statusCode -ge 200 -and $statusCode -lt 300) "preflight retornou status invalido"
  if ($allowOrigin -and $allowOrigin -ne "*") {
    Assert-True ($allowOrigin -eq $FrontOrigin) "Access-Control-Allow-Origin diferente da origin do front"
  }
  Write-Host ("  preflight={0} allow-origin={1}" -f $statusCode, ($allowOrigin -replace "\s+", "")) -ForegroundColor Green
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
  Write-Step "Login foi pulado (use -LoginUser e -LoginPass para validar autenticacao real)."
}

Write-Host ""
Write-Host "[smoke-deploy] OK - stack validada." -ForegroundColor Green
