param(
  [string]$BaseUrl = "http://127.0.0.1:8000",
  [string]$OwnerUser = "",
  [string]$OwnerPass = "",
  [string]$TestRole = "APG"
)

$ErrorActionPreference = "Stop"
$base = $BaseUrl.TrimEnd('/')

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

function New-AuthHeaders([string]$token, [bool]$usesBearer) {
  if ($usesBearer) {
    return @{
      Authorization = "Bearer $token"
      "X-Session-Token" = $token
      "Content-Type" = "application/json"
    }
  }

  return @{
    "X-Session-Token" = $token
    "Content-Type" = "application/json"
  }
}

Write-Host "[smoke] lendo openapi..."
$openapi = Invoke-RestMethod "$base/openapi.json"
$paths = $openapi.paths.PSObject.Properties.Name
$hasVersionar = $paths -contains "/emendas/{emenda_id}/versionar"
$usesBearer = $hasVersionar

Write-Host "[smoke] versionar presente: $hasVersionar"
if ($usesBearer) { Write-Host "[smoke] auth esperado: Bearer" } else { Write-Host "[smoke] auth esperado: X-Session-Token" }

$role = ($TestRole.Trim().ToUpper())
$allowedRoles = @("APG", "SUPERVISAO", "CONTABIL", "POWERBI")
if ($allowedRoles -notcontains $role) {
  throw "TestRole invalido. Use APG, SUPERVISAO, CONTABIL ou POWERBI."
}

$user = "qa_smoke_" + (Get-Date -Format "HHmmss")
$pass = "123456"
$email = ($user + "@teste.local").ToLower()

if (-not $OwnerUser) { $OwnerUser = $env:SEC_OWNER_USER }
if (-not $OwnerPass) { $OwnerPass = $env:SEC_OWNER_PASS }

$actorRole = $role
if ($OwnerUser -and $OwnerPass) {
  Write-Host "[smoke] login owner $OwnerUser"
  $ownerLogin = Invoke-Json -Method "POST" -Url "$base/auth/login" -Headers @{} -Body @{
    nome = $OwnerUser
    senha = $OwnerPass
  }

  $ownerToken = [string]$ownerLogin.token
  if (-not $ownerToken) { throw "owner sem token" }
  $ownerHeaders = New-AuthHeaders -token $ownerToken -usesBearer $usesBearer

  Write-Host "[smoke] register $user (perfil=$role, aprovado pelo owner)"
  $null = Invoke-Json -Method "POST" -Url "$base/auth/register" -Headers $ownerHeaders -Body @{
    nome = $user
    email = $email
    perfil = $role
    senha = $pass
  }
} else {
  $actorRole = "PROGRAMADOR"
  Write-Host "[smoke] owner nao informado; tentando bootstrap PROGRAMADOR"
  try {
    $null = Invoke-Json -Method "POST" -Url "$base/auth/register" -Headers @{} -Body @{
      nome = $user
      perfil = "PROGRAMADOR"
      senha = $pass
    }
  } catch {
    $statusCode = -1
    try { $statusCode = [int]$_.Exception.Response.StatusCode } catch {}
    if ($statusCode -eq 403) {
      throw "existe PROGRAMADOR ativo. Rode com -OwnerUser e -OwnerPass para criar usuario de teste nao PROGRAMADOR."
    }
    throw
  }
}

Write-Host "[smoke] login $user"
$login = Invoke-Json -Method "POST" -Url "$base/auth/login" -Headers @{} -Body @{
  nome = $user
  senha = $pass
}
$token = [string]$login.token
if (-not $token) { throw "token nao retornou" }

$headers = New-AuthHeaders -token $token -usesBearer $usesBearer
$idInterno = "EPI-2026-" + (Get-Date -Format "HHmmss")

Write-Host "[smoke] criando emenda $idInterno"
$em = Invoke-Json -Method "POST" -Url "$base/emendas" -Headers $headers -Body @{
  id_interno = $idInterno
  ano = 2026
  identificacao = "Smoke E2E"
  status_oficial = "Recebido"
}
if (-not $em.id) { throw "id da emenda nao retornou" }
$eid = $em.id

Write-Host "[smoke] criando evento"
$null = Invoke-Json -Method "POST" -Url "$base/emendas/$eid/eventos" -Headers $headers -Body @{
  usuario_nome = $user
  setor = $actorRole
  tipo_evento = "NOTE"
  motivo = "smoke"
}

if ($hasVersionar) {
  Write-Host "[smoke] versionando emenda"
  $null = Invoke-Json -Method "POST" -Url "$base/emendas/$eid/versionar" -Headers $headers -Body @{
    motivo = "smoke version"
  }
}

$emendas = Invoke-Json -Method "GET" -Url "$base/emendas" -Headers $headers -Body $null
$audit = Invoke-Json -Method "GET" -Url "$base/audit" -Headers $headers -Body $null

$emendasCount = @($emendas).Count
$auditCount = @($audit).Count

Write-Host "[smoke] usuario teste perfil: $actorRole"
Write-Host "[smoke] emendas: $emendasCount"
Write-Host "[smoke] audit: $auditCount"
Write-Host "[smoke] OK"

