param(
  [string]$BaseUrl = "http://127.0.0.1:8000",
  [string]$OwnerUser = "",
  [string]$OwnerPass = "",
  [string]$TestRole = "APG",
  [switch]$SkipSmoke
)

$ErrorActionPreference = "Stop"
$base = $BaseUrl.TrimEnd("/")

function Invoke-Json {
  param(
    [string]$Method,
    [string]$Url,
    [hashtable]$Headers,
    [object]$Body
  )

  if ($null -ne $Body) {
    $json = $Body | ConvertTo-Json -Depth 10
    return Invoke-RestMethod -Method $Method -Uri $Url -Headers $Headers -ContentType "application/json" -Body $json
  }

  return Invoke-RestMethod -Method $Method -Uri $Url -Headers $Headers
}

function New-AuthHeaders([string]$token) {
  return @{
    Authorization = "Bearer $token"
    "X-Session-Token" = $token
    "Content-Type" = "application/json"
  }
}

function Get-HttpStatusCode($err) {
  try {
    if ($err.Exception.Response -and $err.Exception.Response.StatusCode) {
      return [int]$err.Exception.Response.StatusCode
    }
  } catch {}
  return -1
}

if (-not $OwnerUser) { $OwnerUser = $env:SEC_OWNER_USER }
if (-not $OwnerPass) { $OwnerPass = $env:SEC_OWNER_PASS }
if (-not $OwnerUser -or -not $OwnerPass) {
  throw "Informe -OwnerUser e -OwnerPass (ou variaveis SEC_OWNER_USER/SEC_OWNER_PASS)."
}

Write-Host "[hmlg] health check em $base/health"
$health = Invoke-Json -Method "GET" -Url "$base/health" -Headers @{} -Body $null
if (-not $health.ok) { throw "health retornou ok=false" }

Write-Host "[hmlg] validando contrato minimo da API (OpenAPI)"
$openapi = Invoke-Json -Method "GET" -Url "$base/openapi.json" -Headers @{} -Body $null
$emendaOutProps = @($openapi.components.schemas.EmendaOut.properties.PSObject.Properties.Name)
$eventoProps = @($openapi.components.schemas.EventoCreate.properties.PSObject.Properties.Name)
$versionarProps = @($openapi.components.schemas.EmendaVersionarIn.properties.PSObject.Properties.Name)

$missing = @()
if ($emendaOutProps -notcontains "row_version") { $missing += "EmendaOut.row_version" }
if ($emendaOutProps -notcontains "plan_a") { $missing += "EmendaOut.plan_a" }
if ($emendaOutProps -notcontains "plan_b") { $missing += "EmendaOut.plan_b" }
if ($eventoProps -notcontains "expected_row_version") { $missing += "EventoCreate.expected_row_version" }
if ($versionarProps -notcontains "expected_row_version") { $missing += "EmendaVersionarIn.expected_row_version" }
if ($versionarProps -notcontains "plan_a") { $missing += "EmendaVersionarIn.plan_a" }
if ($versionarProps -notcontains "plan_b") { $missing += "EmendaVersionarIn.plan_b" }

if ($missing.Count -gt 0) {
  $joined = ($missing -join ", ")
  throw "API publicada desatualizada para este teste. Faltando: $joined. Publique o backend mais recente e rode novamente."
}

if (-not $SkipSmoke) {
  Write-Host "[hmlg] smoke e2e"
  $smokeScript = Join-Path $PSScriptRoot "smoke_e2e.ps1"
  powershell -ExecutionPolicy Bypass -File $smokeScript -BaseUrl $base -OwnerUser $OwnerUser -OwnerPass $OwnerPass -TestRole $TestRole
  if ($LASTEXITCODE -ne 0) {
    throw "smoke_e2e falhou com codigo $LASTEXITCODE"
  }
}

Write-Host "[hmlg] login owner $OwnerUser"
$login = Invoke-Json -Method "POST" -Url "$base/auth/login" -Headers @{} -Body @{
  nome = $OwnerUser
  senha = $OwnerPass
}
$token = [string]$login.token
if (-not $token) { throw "login sem token" }
$headers = New-AuthHeaders -token $token

$idInterno = "EPI-HMLG-" + (Get-Date -Format "HHmmss")
Write-Host "[hmlg] criando emenda $idInterno"
$em = Invoke-Json -Method "POST" -Url "$base/emendas" -Headers $headers -Body @{
  id_interno = $idInterno
  ano = 2026
  identificacao = "Homologacao Publicacao 5min"
  plan_a = "A0"
  plan_b = "B0"
  status_oficial = "Recebido"
}

$eid = [int]$em.id
$rv0 = [int]$em.row_version
if ($eid -le 0) { throw "nao recebeu id da emenda" }
if ($rv0 -le 0) { throw "nao recebeu row_version da emenda" }

Write-Host "[hmlg] editando Plano A com row_version atual"
$r1 = Invoke-Json -Method "POST" -Url "$base/emendas/$eid/eventos" -Headers $headers -Body @{
  tipo_evento = "EDIT_FIELD"
  campo_alterado = "Plano A"
  valor_antigo = "A0"
  valor_novo = "A1"
  motivo = "homologacao plano a"
  expected_row_version = $rv0
}
$rv1 = [int]$r1.row_version
if ($rv1 -le $rv0) { throw "row_version nao evoluiu apos editar Plano A" }

Write-Host "[hmlg] validando conflito 409 (versao antiga)"
$conflict409 = $false
try {
  $null = Invoke-Json -Method "POST" -Url "$base/emendas/$eid/eventos" -Headers $headers -Body @{
    tipo_evento = "EDIT_FIELD"
    campo_alterado = "Plano B"
    valor_antigo = "B0"
    valor_novo = "B_CONFLITO"
    motivo = "deve conflitar"
    expected_row_version = $rv0
  }
} catch {
  $statusCode = Get-HttpStatusCode $_
  if ($statusCode -eq 409) {
    $conflict409 = $true
  } else {
    throw
  }
}
if (-not $conflict409) { throw "esperado conflito 409 nao ocorreu" }

Write-Host "[hmlg] editando Plano B com row_version correto"
$r2 = Invoke-Json -Method "POST" -Url "$base/emendas/$eid/eventos" -Headers $headers -Body @{
  tipo_evento = "EDIT_FIELD"
  campo_alterado = "Plano B"
  valor_antigo = "B0"
  valor_novo = "B1"
  motivo = "homologacao plano b"
  expected_row_version = $rv1
}
$rv2 = [int]$r2.row_version

$got = Invoke-Json -Method "GET" -Url "$base/emendas/$eid" -Headers $headers -Body $null
if ($got.plan_a -ne "A1" -or $got.plan_b -ne "B1") {
  throw "persistencia Plano A/B falhou apos eventos"
}

Write-Host "[hmlg] versionando emenda com Plano A/B"
$ver = Invoke-Json -Method "POST" -Url "$base/emendas/$eid/versionar" -Headers $headers -Body @{
  motivo = "homologacao versao"
  plan_a = "A2"
  plan_b = "B2"
  expected_row_version = $rv2
}
if ($ver.plan_a -ne "A2" -or $ver.plan_b -ne "B2") {
  throw "versionar nao carregou Plano A/B"
}

$audit = Invoke-Json -Method "GET" -Url "$base/audit" -Headers $headers -Body $null
$auditForEmenda = @($audit | Where-Object { [int]$_.emenda_id -eq $eid })

$result = [pscustomobject]@{
  ok = $true
  base_url = $base
  emenda_id = $eid
  id_interno = $idInterno
  conflict_409 = $conflict409
  plan_a_after_events = $got.plan_a
  plan_b_after_events = $got.plan_b
  versioned_plan_a = $ver.plan_a
  versioned_plan_b = $ver.plan_b
  audit_rows_for_emenda = @($auditForEmenda).Count
}

Write-Host "[hmlg] OK"
$result | ConvertTo-Json -Compress
