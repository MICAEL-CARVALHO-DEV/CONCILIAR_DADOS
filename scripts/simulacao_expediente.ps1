param(
  [string]$BaseUrl = "http://127.0.0.1:8000",
  [int]$Ano = 2026,
  [string]$Identificacao = "Teste fluxo expediente",
  [string[]]$Schedule = @("09:00", "11:00", "14:00", "16:00"),
  [string[]]$StatusSequence = @("Em analise", "Pendente", "Aguardando execucao", "Em execucao", "Concluido"),
  [switch]$FastForward = $false,
  [int]$FastForwardSeconds = 5,
  [switch]$NoteOnly = $false,
  [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"
$BaseUrl = $BaseUrl.TrimEnd("/")

if (-not $Schedule -or $Schedule.Count -eq 0) { throw "Schedule nao pode ser vazio." }
if (-not $StatusSequence -or $StatusSequence.Count -eq 0) { throw "StatusSequence nao pode ser vazia." }
if ($FastForwardSeconds -lt 1) { throw "FastForwardSeconds deve ser >= 1." }

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

function Parse-ScheduleTime([string]$hhmm) {
  if ($hhmm -notmatch "^\d{2}:\d{2}$") { throw "Horario invalido: $hhmm (use HH:mm)" }
  $parts = $hhmm.Split(":")
  $h = [int]$parts[0]
  $m = [int]$parts[1]
  if ($h -lt 0 -or $h -gt 23 -or $m -lt 0 -or $m -gt 59) { throw "Horario invalido: $hhmm" }
  return [pscustomobject]@{ Hour = $h; Minute = $m; Raw = $hhmm }
}

function Get-NextOccurrence([int]$hour, [int]$minute) {
  $now = Get-Date
  $target = Get-Date -Hour $hour -Minute $minute -Second 0
  if ($target -le $now) {
    $target = $target.AddDays(1)
  }
  return $target
}

$parsedSchedule = @($Schedule | ForEach-Object { Parse-ScheduleTime $_ })
$usersCount = $parsedSchedule.Count

$seed = Get-Date -Format "yyyyMMdd_HHmmss"
$pass = "123456"
$owner = "qa_exp_owner_$seed"
$ownerToken = Register-And-Login -Name $owner -Perfil "PROGRAMADOR" -Password $pass
$ownerHeaders = New-AuthHeaders -token $ownerToken

$idInterno = "EPI-EXP-$seed"
$emenda = Invoke-Json -Method "POST" -Url "$BaseUrl/emendas" -Headers $ownerHeaders -Body @{
  id_interno = $idInterno
  ano = $Ano
  identificacao = $Identificacao
  status_oficial = "Recebido"
}
$emendaId = $emenda.id
if (-not $emendaId) { throw "nao foi possivel criar emenda de teste de expediente." }

$participants = @()
for ($i = 1; $i -le $usersCount; $i++) {
  $name = "qa_exp_${seed}_$i"
  $token = Register-And-Login -Name $name -Perfil "APG" -Password $pass
  $participants += [pscustomobject]@{
    index = $i
    name = $name
    token = $token
  }
}

Write-Host ""
Write-Host "=== Simulacao de expediente ===" -ForegroundColor Cyan
Write-Host "Emenda: $idInterno (id=$emendaId)"
Write-Host "Horarios: $($Schedule -join ', ')"
Write-Host "Usuarios: $usersCount"
Write-Host "Modo: " -NoNewline
if ($NoteOnly) { Write-Host "NOTE_ONLY" -ForegroundColor Yellow } else { Write-Host "STATUS_AND_NOTE" -ForegroundColor Green }
if ($FastForward) { Write-Host "FastForward: ON ($FastForwardSeconds s entre passos)" -ForegroundColor Yellow }
if ($DryRun) { Write-Host "DryRun: ON (nao grava eventos)" -ForegroundColor Yellow }
Write-Host ""

for ($i = 0; $i -lt $usersCount; $i++) {
  $slot = $parsedSchedule[$i]
  $user = $participants[$i]
  $status = $StatusSequence[$i % $StatusSequence.Count]

  if ($FastForward) {
    if ($i -gt 0) {
      Write-Host "Aguardando $FastForwardSeconds segundo(s) para o proximo horario (fast-forward)..." -ForegroundColor DarkYellow
      Start-Sleep -Seconds $FastForwardSeconds
    }
    $targetAtText = "[fast-forward] $($slot.Raw)"
  } else {
    $targetAt = Get-NextOccurrence -hour $slot.Hour -minute $slot.Minute
    $waitSec = [int][Math]::Ceiling(($targetAt - (Get-Date)).TotalSeconds)
    if ($waitSec -gt 0) {
      Write-Host ("Aguardando ate {0} ({1} seg)..." -f $targetAt.ToString("yyyy-MM-dd HH:mm:ss"), $waitSec) -ForegroundColor DarkYellow
      Start-Sleep -Seconds $waitSec
    }
    $targetAtText = $targetAt.ToString("yyyy-MM-dd HH:mm")
  }

  $headers = New-AuthHeaders -token $user.token
  Write-Host ("[{0}] usuario={1} horario={2} status={3}" -f (Get-Date).ToString("yyyy-MM-dd HH:mm:ss"), $user.name, $targetAtText, $status) -ForegroundColor Gray

  if (-not $DryRun) {
    if (-not $NoteOnly) {
      $statusResp = Invoke-Json -Method "POST" -Url "$BaseUrl/emendas/$emendaId/status" -Headers $headers -Body @{
        novo_status = $status
        motivo = "simulacao expediente: usuario $($user.name) horario $($slot.Raw)"
      }
      if (-not $statusResp.ok) { throw "falha ao alterar status para $($user.name)" }
    }

    $eventResp = Invoke-Json -Method "POST" -Url "$BaseUrl/emendas/$emendaId/eventos" -Headers $headers -Body @{
      tipo_evento = "NOTE"
      origem_evento = "API"
      motivo = "simulacao expediente: alteracao por $($user.name) no horario $($slot.Raw)"
    }
    if (-not $eventResp.ok) { throw "falha ao registrar NOTE para $($user.name)" }
  }
}

if (-not $DryRun) {
  $audit = Invoke-Json -Method "GET" -Url "$BaseUrl/audit" -Headers $ownerHeaders -Body $null
  $hits = @($audit | Where-Object {
    $_.emenda_id -eq $emendaId -and $_.tipo_evento -eq "NOTE" -and [string]$_.motivo -like "simulacao expediente:*"
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

Write-Host "Simulacao de expediente concluida." -ForegroundColor Green
