param(
  [string]$BaseUrl = "https://sec-emendas-api.onrender.com",
  [string]$OwnerUser = "",
  [string]$OwnerPass = "",
  [string]$DefaultPassword = "123456",
  [string]$ApgUser1 = "beta_apg_1",
  [string]$ApgUser2 = "beta_apg_2",
  [string]$ContabilUser1 = "beta_contabil_1",
  [string]$ContabilUser2 = "beta_contabil_2"
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

function Ensure-UserAndLogin {
  param(
    [string]$Name,
    [string]$Role,
    [string]$Password,
    [hashtable]$OwnerHeaders
  )

  $email = ($Name + "@teste.local").ToLower()
  try {
    $null = Invoke-Json -Method "POST" -Url "$base/auth/register" -Headers $OwnerHeaders -Body @{
      nome = $Name
      email = $email
      perfil = $Role
      senha = $Password
    }
  } catch {
    $status = Get-HttpStatusCode $_
    if ($status -ne 409) {
      throw
    }
  }

  $login = Invoke-Json -Method "POST" -Url "$base/auth/login" -Headers @{} -Body @{
    nome = $Name
    senha = $Password
  }
  $token = [string]$login.token
  if (-not $token) { throw "login sem token para $Name" }

  return [pscustomobject]@{
    name = $Name
    role = $Role
    token = $token
  }
}

if (-not $OwnerUser -or -not $OwnerPass) {
  throw "Informe -OwnerUser e -OwnerPass para executar o Item 8."
}

Write-Host "[item8] health"
$health = Invoke-Json -Method "GET" -Url "$base/health" -Headers @{} -Body $null
if (-not $health.ok) { throw "health retornou ok=false" }

Write-Host "[item8] validando contrato minimo (row_version + plan_a/plan_b)"
$openapi = Invoke-Json -Method "GET" -Url "$base/openapi.json" -Headers @{} -Body $null
$emendaOutProps = @($openapi.components.schemas.EmendaOut.properties.PSObject.Properties.Name)
$eventoProps = @($openapi.components.schemas.EventoCreate.properties.PSObject.Properties.Name)
$missing = @()
if ($emendaOutProps -notcontains "row_version") { $missing += "EmendaOut.row_version" }
if ($emendaOutProps -notcontains "plan_a") { $missing += "EmendaOut.plan_a" }
if ($emendaOutProps -notcontains "plan_b") { $missing += "EmendaOut.plan_b" }
if ($eventoProps -notcontains "expected_row_version") { $missing += "EventoCreate.expected_row_version" }
if ($missing.Count -gt 0) {
  throw ("API sem contrato minimo para Item 8. Faltando: " + ($missing -join ", "))
}

Write-Host "[item8] login owner $OwnerUser"
$ownerLogin = Invoke-Json -Method "POST" -Url "$base/auth/login" -Headers @{} -Body @{
  nome = $OwnerUser
  senha = $OwnerPass
}
$ownerToken = [string]$ownerLogin.token
if (-not $ownerToken) { throw "owner sem token" }
$ownerHeaders = New-AuthHeaders -token $ownerToken

Write-Host "[item8] garantindo 4 usuarios (2 APG + 2 CONTABIL)"
$users = @()
$users += Ensure-UserAndLogin -Name $ApgUser1 -Role "APG" -Password $DefaultPassword -OwnerHeaders $ownerHeaders
$users += Ensure-UserAndLogin -Name $ApgUser2 -Role "APG" -Password $DefaultPassword -OwnerHeaders $ownerHeaders
$users += Ensure-UserAndLogin -Name $ContabilUser1 -Role "CONTABIL" -Password $DefaultPassword -OwnerHeaders $ownerHeaders
$users += Ensure-UserAndLogin -Name $ContabilUser2 -Role "CONTABIL" -Password $DefaultPassword -OwnerHeaders $ownerHeaders

$seed = Get-Date -Format "HHmmss"
$idInterno = "EPI-ITEM8-$seed"

Write-Host "[item8] criando emenda de teste $idInterno"
$em = Invoke-Json -Method "POST" -Url "$base/emendas" -Headers $ownerHeaders -Body @{
  id_interno = $idInterno
  ano = 2026
  identificacao = "Item 8 - teste real 4 usuarios"
  plan_a = "A0"
  plan_b = "B0"
  status_oficial = "Recebido"
}
$eid = [int]$em.id
if ($eid -le 0) { throw "nao foi possivel criar emenda de teste Item 8" }

$full = Invoke-Json -Method "GET" -Url "$base/emendas/$eid" -Headers $ownerHeaders -Body $null
$rv0 = [int]$full.row_version
if ($rv0 -le 0) { throw "row_version invalido na emenda de teste" }

Write-Host "[item8] 4 usuarios registrando NOTE em paralelo"
$jobs = @()
foreach ($u in $users) {
  $jobs += Start-Job -ScriptBlock {
    param($baseArg, $eidArg, $userNameArg, $tokenArg)
    $headers = @{
      Authorization = "Bearer $tokenArg"
      "X-Session-Token" = $tokenArg
      "Content-Type" = "application/json"
    }
    $body = @{
      tipo_evento = "NOTE"
      origem_evento = "UI"
      motivo = "item8 note $userNameArg"
    } | ConvertTo-Json

    $resp = Invoke-RestMethod -Method "POST" -Uri "$baseArg/emendas/$eidArg/eventos" -Headers $headers -ContentType "application/json" -Body $body
    [pscustomobject]@{
      user = $userNameArg
      ok = [bool]$resp.ok
    }
  } -ArgumentList $base, $eid, $u.name, $u.token
}

Wait-Job -Job $jobs | Out-Null
$jobResults = @($jobs | Receive-Job)
$jobs | Remove-Job -Force

$failed = @($jobResults | Where-Object { -not $_.ok })
if ($failed.Count -gt 0) {
  throw ("falha em note paralelo: " + (($failed | ForEach-Object { $_.user }) -join ", "))
}

$apg1 = @($users | Where-Object { $_.name -eq $ApgUser1 })[0]
$apg2 = @($users | Where-Object { $_.name -eq $ApgUser2 })[0]
$cont1 = @($users | Where-Object { $_.name -eq $ContabilUser1 })[0]

$apg1Headers = New-AuthHeaders -token $apg1.token
$apg2Headers = New-AuthHeaders -token $apg2.token
$cont1Headers = New-AuthHeaders -token $cont1.token

Write-Host "[item8] conflito otimista APG x APG (esperado 409 na versao antiga)"
$edit1 = Invoke-Json -Method "POST" -Url "$base/emendas/$eid/eventos" -Headers $apg1Headers -Body @{
  tipo_evento = "EDIT_FIELD"
  campo_alterado = "Plano A"
  valor_antigo = "A0"
  valor_novo = "A1"
  motivo = "item8 apg1"
  expected_row_version = $rv0
}
$rv1 = [int]$edit1.row_version
if ($rv1 -le $rv0) { throw "row_version nao evoluiu no edit APG1" }

$conflict409 = $false
try {
  $null = Invoke-Json -Method "POST" -Url "$base/emendas/$eid/eventos" -Headers $apg2Headers -Body @{
    tipo_evento = "EDIT_FIELD"
    campo_alterado = "Plano B"
    valor_antigo = "B0"
    valor_novo = "B_CONFLITO"
    motivo = "item8 apg2 stale"
    expected_row_version = $rv0
  }
} catch {
  $code = Get-HttpStatusCode $_
  if ($code -eq 409) { $conflict409 = $true } else { throw }
}
if (-not $conflict409) { throw "nao retornou 409 no conflito APG x APG" }

$edit2 = Invoke-Json -Method "POST" -Url "$base/emendas/$eid/eventos" -Headers $apg2Headers -Body @{
  tipo_evento = "EDIT_FIELD"
  campo_alterado = "Plano B"
  valor_antigo = "B0"
  valor_novo = "B1"
  motivo = "item8 apg2 retry"
  expected_row_version = $rv1
}

Write-Host "[item8] validando bloqueio de status para CONTABIL (esperado 403)"
$contabilStatus403 = $false
try {
  $null = Invoke-Json -Method "POST" -Url "$base/emendas/$eid/status" -Headers $cont1Headers -Body @{
    novo_status = "Em analise"
    motivo = "item8 contabil status"
    expected_row_version = [int]$edit2.row_version
  }
} catch {
  $code = Get-HttpStatusCode $_
  if ($code -eq 403) { $contabilStatus403 = $true } else { throw }
}
if (-not $contabilStatus403) { throw "CONTABIL conseguiu alterar status, esperado bloqueio 403" }

$got = Invoke-Json -Method "GET" -Url "$base/emendas/$eid" -Headers $ownerHeaders -Body $null
if ($got.plan_a -ne "A1" -or $got.plan_b -ne "B1") {
  throw "persistencia final Plano A/B invalida no Item 8"
}

$audit = Invoke-Json -Method "GET" -Url "$base/audit" -Headers $ownerHeaders -Body $null
$auditByEmenda = @($audit | Where-Object { [int]$_.emenda_id -eq $eid })
$noteRows = @($auditByEmenda | Where-Object { $_.tipo_evento -eq "NOTE" -and [string]$_.motivo -like "item8 note *" })
$noteUsers = @($noteRows | ForEach-Object { [string]$_.usuario_nome } | Sort-Object -Unique)
if ($noteUsers.Count -lt 4) {
  throw "auditoria nao registrou os 4 usuarios no NOTE paralelo"
}

$result = [pscustomobject]@{
  ok = $true
  base_url = $base
  emenda_id = $eid
  id_interno = $idInterno
  users = @($users | ForEach-Object { "$($_.name):$($_.role)" })
  note_users = $noteUsers
  conflict_409 = $conflict409
  contabil_status_403 = $contabilStatus403
  plan_a_final = $got.plan_a
  plan_b_final = $got.plan_b
  audit_rows_for_emenda = @($auditByEmenda).Count
}

Write-Host "[item8] OK"
$result | ConvertTo-Json -Compress
