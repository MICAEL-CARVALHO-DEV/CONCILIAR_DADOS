param(
  [string]$BaseUrl = "http://127.0.0.1:8000",
  [int]$Users = 4
)

$ErrorActionPreference = "Stop"
$BaseUrl = ($BaseUrl.TrimEnd('/'))
if ($Users -lt 2) { throw "Use pelo menos 2 usuarios" }
if ($Users -gt 5) { throw "Use no maximo 5 usuarios (escopo C34)" }

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

$seed = Get-Date -Format "HHmmss"
$pass = "123456"

$owner = "qa_owner_$seed"
$null = Invoke-Json -Method "POST" -Url "$BaseUrl/auth/register" -Headers @{} -Body @{ nome = $owner; perfil = "PROGRAMADOR"; senha = $pass }
$ownerLogin = Invoke-Json -Method "POST" -Url "$BaseUrl/auth/login" -Headers @{} -Body @{ nome = $owner; senha = $pass }
$ownerHeaders = New-AuthHeaders -token ([string]$ownerLogin.token)

$idInterno = "EPI-C34-$seed"
$em = Invoke-Json -Method "POST" -Url "$BaseUrl/emendas" -Headers $ownerHeaders -Body @{
  id_interno = $idInterno
  ano = 2026
  identificacao = "Teste concorrencia C34"
  status_oficial = "Recebido"
}
$eid = $em.id
if (-not $eid) { throw "nao foi possivel criar emenda teste C34" }

$participants = @()
for ($i = 1; $i -le $Users; $i++) {
  $name = "qa_c34_${seed}_$i"
  $null = Invoke-Json -Method "POST" -Url "$BaseUrl/auth/register" -Headers @{} -Body @{ nome = $name; perfil = "CONTABIL"; senha = $pass }
  $login = Invoke-Json -Method "POST" -Url "$BaseUrl/auth/login" -Headers @{} -Body @{ nome = $name; senha = $pass }
  $participants += [pscustomobject]@{ name = $name; token = [string]$login.token }
}

$jobs = @()
foreach ($p in $participants) {
  $jobs += Start-Job -ScriptBlock {
    param($base, $emendaId, $userName, $token)
    $headers = @{
      Authorization = "Bearer $token"
      "X-Session-Token" = $token
      "Content-Type" = "application/json"
    }

    $body = @{ tipo_evento = "NOTE"; origem_evento = "API"; motivo = "c34 concorrencia $userName" } | ConvertTo-Json
    $resp = Invoke-RestMethod -Method POST -Uri "$base/emendas/$emendaId/eventos" -Headers $headers -ContentType "application/json" -Body $body
    [pscustomobject]@{ user = $userName; ok = [bool]$resp.ok }
  } -ArgumentList $BaseUrl, $eid, $p.name, $p.token
}

Wait-Job -Job $jobs | Out-Null
$jobResults = @($jobs | Receive-Job)
$jobs | Remove-Job -Force

$failJobs = @($jobResults | Where-Object { -not $_.ok })
if ($failJobs.Count -gt 0) {
  throw "falha em eventos concorrentes para usuarios: $($failJobs.user -join ', ')"
}

$audit = Invoke-Json -Method "GET" -Url "$BaseUrl/audit" -Headers $ownerHeaders -Body $null
$hits = @($audit | Where-Object {
  $_.emenda_id -eq $eid -and $_.tipo_evento -eq "NOTE" -and [string]$_.motivo -like "c34 concorrencia*"
})

$distinctUsers = @($hits | ForEach-Object { $_.usuario_nome } | Sort-Object -Unique)
if ($hits.Count -lt $Users) {
  throw "audit registrou $($hits.Count) eventos, esperado >= $Users"
}
if ($distinctUsers.Count -lt $Users) {
  throw "audit registrou $($distinctUsers.Count) usuarios distintos, esperado $Users"
}

Write-Host "Teste C34 concorrencia: SUCESSO" -ForegroundColor Green
Write-Host "Emenda teste: $idInterno (id=$eid)"
Write-Host "Usuarios concorrentes: $Users"
Write-Host "Eventos NOTE registrados: $($hits.Count)"
