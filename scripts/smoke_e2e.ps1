$ErrorActionPreference = "Stop"

$base = "http://127.0.0.1:8000"
Write-Host "[smoke] lendo openapi..."

$openapi = Invoke-RestMethod "$base/openapi.json"
$paths = $openapi.paths.PSObject.Properties.Name
$hasVersionar = $paths -contains "/emendas/{emenda_id}/versionar"
$usesBearer = $hasVersionar

Write-Host "[smoke] versionar presente: $hasVersionar"
if ($usesBearer) { Write-Host "[smoke] auth esperado: Bearer" } else { Write-Host "[smoke] auth esperado: X-Session-Token" }

$user = "qa_" + (Get-Date -Format "HHmmss")
$pass = "123456"

Write-Host "[smoke] register $user"
$regBody = @{ nome = $user; perfil = "PROGRAMADOR"; senha = $pass } | ConvertTo-Json
$null = Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType "application/json" -Body $regBody

Write-Host "[smoke] login"
$loginBody = @{ nome = $user; senha = $pass } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType "application/json" -Body $loginBody
$token = $login.token
if (-not $token) { throw "token nao retornou" }

if ($usesBearer) {
  $headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
} else {
  $headers = @{ "X-Session-Token" = $token; "Content-Type" = "application/json" }
}

$idInterno = "EPI-2026-" + (Get-Date -Format "HHmmss")
Write-Host "[smoke] criando emenda $idInterno"
$emBody = @{ id_interno = $idInterno; ano = 2026; identificacao = "Smoke E2E"; status_oficial = "Recebido" } | ConvertTo-Json
$em = Invoke-RestMethod -Method Post -Uri "$base/emendas" -Headers $headers -Body $emBody
if (-not $em.id) { throw "id da emenda nao retornou" }
$eid = $em.id

Write-Host "[smoke] criando evento"
$evBody = @{ usuario_nome = $user; setor = "PROGRAMADOR"; tipo_evento = "NOTE"; motivo = "smoke" } | ConvertTo-Json
$null = Invoke-RestMethod -Method Post -Uri "$base/emendas/$eid/eventos" -Headers $headers -Body $evBody

if ($hasVersionar) {
  Write-Host "[smoke] versionando emenda"
  $verBody = @{ motivo = "smoke version" } | ConvertTo-Json
  $null = Invoke-RestMethod -Method Post -Uri "$base/emendas/$eid/versionar" -Headers $headers -Body $verBody
}

$emendas = Invoke-RestMethod -Method Get -Uri "$base/emendas" -Headers $headers
$audit = Invoke-RestMethod -Method Get -Uri "$base/audit" -Headers $headers

$emendasCount = @($emendas).Count
$auditCount = @($audit).Count

Write-Host "[smoke] emendas: $emendasCount"
Write-Host "[smoke] audit: $auditCount"
Write-Host "[smoke] OK"

