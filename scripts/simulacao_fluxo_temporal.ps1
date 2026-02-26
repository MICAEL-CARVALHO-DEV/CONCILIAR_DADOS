param(
  [string]$BaseUrl = "http://127.0.0.1:8000",
  [int]$Users = 3,
  [int]$DelayMinutes = 120,
  [int]$Ano = 2026,
  [string]$Identificacao = "Teste fluxo temporal",
  [string[]]$StatusSequence = @("Em analise", "Pendente", "Aguardando execucao", "Em execucao", "Concluido"),
  [switch]$NoteOnly = $false,
  [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"
$BaseUrl = $BaseUrl.TrimEnd("/")

if ($Users -lt 2) { throw "Use pelo menos 2 usuarios para simular fluxo temporal." }
if ($DelayMinutes -lt 0) { throw "DelayMinutes deve ser >= 0." }
if (-not $StatusSequence -or $StatusSequence.Count -eq 0) { throw "StatusSequence nao pode ser vazia." }

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

function Register-And-Login {
  param(
    [string]$Name,
    [string]$Perfil,
    [string]$Password
  )

  try {
    $null = Invoke-Json -Method "POST" -Url "$BaseUrl/auth/register" -Headers @{} -Body @{
      nome = $Name
      perfil = $Perfil
      senha = $Password
    }
  } catch {
    if ($_.Exception.Message -notmatch "409|ja existe") { throw }
  }

  $login = Invoke-Json -Method "POST" -Url "$BaseUrl/auth/login" -Headers @{} -Body @{
    nome = $Name
    senha = $Password
  }

  if (-not $login.token) { throw "token vazio para usuario $Name" }
  return [string]$login.token
}

$seed = Get-Date -Format "yyyyMMdd_HHmmss"
$pass = "123456"
$owner = "qa_tempo_owner_$seed"
$ownerToken = Register-And-Login -Name $owner -Perfil "PROGRAMADOR" -Password $pass
$ownerHeaders = New-AuthHeaders -token $ownerToken

$idInterno = "EPI-TEMP-$seed"
$emenda = Invoke-Json -Method "POST" -Url "$BaseUrl/emendas" -Headers $ownerHeaders -Body @{
  id_interno = $idInterno
  ano = $Ano
  identificacao = $Identificacao
  status_oficial = "Recebido"
}

$emendaId = $emenda.id
if (-not $emendaId) { throw "nao foi possivel criar emenda de teste temporal." }

$participants = @()
for ($i = 1; $i -le $Users; $i++) {
  $name = "qa_tempo_${seed}_$i"
  $token = Register-And-Login -Name $name -Perfil "APG" -Password $pass
  $participants += [pscustomobject]@{
    index = $i
    name = $name
    token = $token
  }
}

Write-Host ""
Write-Host "=== Simulacao temporal de fluxo ===" -ForegroundColor Cyan
Write-Host "Emenda: $idInterno (id=$emendaId)"
Write-Host "Usuarios: $Users"
Write-Host "Pausa entre usuarios: $DelayMinutes minuto(s)"
Write-Host "Modo: " -NoNewline
if ($NoteOnly) { Write-Host "NOTE_ONLY" -ForegroundColor Yellow } else { Write-Host "STATUS_AND_NOTE" -ForegroundColor Green }
if ($DryRun) { Write-Host "DryRun: ON (nao grava eventos)" -ForegroundColor Yellow }
Write-Host ""

for ($i = 0; $i -lt $participants.Count; $i++) {
  $p = $participants[$i]
  $headers = New-AuthHeaders -token $p.token
  $status = $StatusSequence[$i % $StatusSequence.Count]
  $plannedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")

  Write-Host ("[{0}] usuario={1} status={2}" -f $plannedAt, $p.name, $status) -ForegroundColor Gray

  if (-not $DryRun) {
    if (-not $NoteOnly) {
      $statusResp = Invoke-Json -Method "POST" -Url "$BaseUrl/emendas/$emendaId/status" -Headers $headers -Body @{
        novo_status = $status
        motivo = "simulacao temporal: usuario $($p.name)"
      }
      if (-not $statusResp.ok) { throw "falha ao alterar status para $($p.name)" }
    }

    $eventResp = Invoke-Json -Method "POST" -Url "$BaseUrl/emendas/$emendaId/eventos" -Headers $headers -Body @{
      tipo_evento = "NOTE"
      origem_evento = "API"
      motivo = "simulacao temporal: alteracao por $($p.name) no passo $($p.index)"
    }
    if (-not $eventResp.ok) { throw "falha ao registrar NOTE para $($p.name)" }
  }

  $hasNext = ($i -lt ($participants.Count - 1))
  if ($hasNext -and $DelayMinutes -gt 0) {
    Write-Host "Aguardando $DelayMinutes minuto(s) para proximo usuario..." -ForegroundColor DarkYellow
    Start-Sleep -Seconds ($DelayMinutes * 60)
  }
}

if (-not $DryRun) {
  $audit = Invoke-Json -Method "GET" -Url "$BaseUrl/audit" -Headers $ownerHeaders -Body $null
  $hits = @($audit | Where-Object {
    $_.emenda_id -eq $emendaId -and $_.tipo_evento -eq "NOTE" -and [string]$_.motivo -like "simulacao temporal:*"
  })
  $usersHit = @($hits | ForEach-Object { $_.usuario_nome } | Sort-Object -Unique)

  Write-Host ""
  Write-Host "Resultado final:" -ForegroundColor Cyan
  Write-Host "- Emenda: $idInterno (id=$emendaId)"
  Write-Host "- Eventos NOTE simulados: $($hits.Count)"
  Write-Host "- Usuarios distintos no audit: $($usersHit.Count)"
  Write-Host "- Lista de usuarios: $($usersHit -join ', ')"
  Write-Host ""
}

Write-Host "Simulacao temporal concluida." -ForegroundColor Green
