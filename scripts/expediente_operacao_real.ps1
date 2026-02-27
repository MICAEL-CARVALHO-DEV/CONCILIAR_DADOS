param(
  [string]$BaseUrl = "https://sec-emendas-api.onrender.com",
  [string]$UserA = "",
  [string]$PassA = "",
  [string]$UserB = "",
  [string]$PassB = "",
  [int]$RecordId = 0,
  [switch]$CreateTestRecord = $false,
  [int]$Ano = 2026,
  [string]$Identificacao = "Operacao real por expediente",
  [string[]]$Schedule = @("09:00", "11:00", "14:00", "16:00"),
  [string]$SingleSlot = "",
  [string[]]$StatusSequence = @("Em analise", "Pendente", "Aguardando execucao", "Em execucao"),
  [string]$ForcedStatus = "",
  [int]$ForcedStatusIndex = -1,
  [switch]$FastForward = $false,
  [int]$FastForwardSeconds = 5,
  [switch]$NoteOnly = $false,
  [string]$EvidenceDir = "..\\anotacoes\\evidencias"
)

$ErrorActionPreference = "Stop"
$BaseUrl = $BaseUrl.TrimEnd("/")
$FastForwardSeconds = [Math]::Max(1, $FastForwardSeconds)

if ([string]::IsNullOrWhiteSpace($UserA)) { $UserA = $env:SEC_USER_A }
if ([string]::IsNullOrWhiteSpace($PassA)) { $PassA = $env:SEC_PASS_A }
if ([string]::IsNullOrWhiteSpace($UserB)) { $UserB = $env:SEC_USER_B }
if ([string]::IsNullOrWhiteSpace($PassB)) { $PassB = $env:SEC_PASS_B }

if ([string]::IsNullOrWhiteSpace($UserA) -or [string]::IsNullOrWhiteSpace($PassA)) {
  throw "Informe UserA/PassA ou defina SEC_USER_A e SEC_PASS_A."
}
if ([string]::IsNullOrWhiteSpace($UserB) -or [string]::IsNullOrWhiteSpace($PassB)) {
  throw "Informe UserB/PassB ou defina SEC_USER_B e SEC_PASS_B."
}
if (-not $Schedule -or $Schedule.Count -eq 0) {
  throw "Schedule nao pode ser vazio."
}
if (-not $StatusSequence -or $StatusSequence.Count -eq 0) {
  throw "StatusSequence nao pode ser vazia."
}
if ($RecordId -le 0 -and -not $CreateTestRecord) {
  throw "Para operacao real, informe -RecordId. Use -CreateTestRecord somente para homologacao."
}

$results = New-Object System.Collections.Generic.List[object]
$actions = New-Object System.Collections.Generic.List[object]
$hasFail = $false

$tokenA = ""
$tokenB = ""
$headersA = @{}
$headersB = @{}
$eid = 0
$idInterno = ""
$marker = "OPR-EXP-" + (Get-Date -Format "yyyyMMddHHmmss")
$finalStatus = ""
$auditUsers = @()
$auditHits = @()
$startedAt = Get-Date
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$reportName = "EXPEDIENTE_OPERACAO_REAL_{0}.md" -f $stamp

function Add-Result {
  param(
    [string]$Step,
    [bool]$Ok,
    [string]$Detail
  )

  $script:results.Add([pscustomobject]@{
      step = $Step
      ok = $Ok
      detail = $Detail
    }) | Out-Null

  if (-not $Ok) { $script:hasFail = $true }
}

function Step {
  param(
    [string]$Name,
    [scriptblock]$Action
  )

  try {
    & $Action
    Add-Result -Step $Name -Ok $true -Detail "ok"
  } catch {
    Add-Result -Step $Name -Ok $false -Detail $_.Exception.Message
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
    $json = $Body | ConvertTo-Json -Depth 10
    return Invoke-RestMethod -Method $Method -Uri $Url -Headers $Headers -ContentType "application/json" -Body $json
  }

  return Invoke-RestMethod -Method $Method -Uri $Url -Headers $Headers
}

function New-AuthHeaders([string]$Token) {
  return @{
    Authorization = "Bearer $Token"
    "X-Session-Token" = $Token
    "Content-Type" = "application/json"
  }
}

function Parse-ScheduleTime([string]$hhmm) {
  if ($hhmm -notmatch "^\d{2}:\d{2}$") { throw "Horario invalido: $hhmm (use HH:mm)." }
  $parts = $hhmm.Split(":")
  $hour = [int]$parts[0]
  $minute = [int]$parts[1]
  if ($hour -lt 0 -or $hour -gt 23 -or $minute -lt 0 -or $minute -gt 59) { throw "Horario invalido: $hhmm" }
  return [pscustomobject]@{ Hour = $hour; Minute = $minute; Raw = $hhmm }
}

function Get-NextOccurrence([int]$Hour, [int]$Minute) {
  $now = Get-Date
  $target = Get-Date -Hour $Hour -Minute $Minute -Second 0
  if ($target -le $now) {
    $target = $target.AddDays(1)
  }
  return $target
}

function Resolve-EvidencePath {
  param([string]$Dir, [string]$Name)

  $baseDir = if ([System.IO.Path]::IsPathRooted($Dir)) { $Dir } else { Join-Path $PSScriptRoot $Dir }
  if (-not (Test-Path $baseDir)) {
    New-Item -ItemType Directory -Path $baseDir -Force | Out-Null
  }
  return (Join-Path $baseDir $Name)
}

function New-ReportMarkdown {
  param(
    [System.Collections.IEnumerable]$StepResults,
    [System.Collections.IEnumerable]$ActionRows,
    [bool]$Failed,
    [datetime]$Started,
    [datetime]$Ended,
    [string]$BaseUrlValue,
    [string]$RecordLabel,
    [string]$MarkerValue,
    [string]$UserAValue,
    [string]$UserBValue,
    [string]$FinalStatusValue,
    [int]$AuditCount,
    [string[]]$AuditUsersValue,
    [string]$ModeLabel
  )

  $statusText = if ($Failed) { "FALHOU" } else { "SUCESSO" }
  $auditUsersText = if ($AuditUsersValue -and $AuditUsersValue.Count -gt 0) { ($AuditUsersValue -join ", ") } else { "-" }

  $lines = @()
  $lines += "# Evidencia - Expediente em Operacao Real"
  $lines += ""
  $lines += "- Inicio: $($Started.ToString("yyyy-MM-dd HH:mm:ss"))"
  $lines += "- Fim: $($Ended.ToString("yyyy-MM-dd HH:mm:ss"))"
  $lines += "- Base URL: $BaseUrlValue"
  $lines += "- Registro: $RecordLabel"
  $lines += "- Marcador: $MarkerValue"
  $lines += "- Usuario A: $UserAValue"
  $lines += "- Usuario B: $UserBValue"
  $lines += "- Modo: $ModeLabel"
  $lines += "- Status final: $FinalStatusValue"
  $lines += "- Eventos no audit (marcador): $AuditCount"
  $lines += "- Usuarios no audit: $auditUsersText"
  $lines += "- Resultado final: **$statusText**"
  $lines += ""
  $lines += "## Acoes por horario"
  $lines += ""
  $lines += "| Slot | Planejado | Executado | Usuario | Status enviado | Resultado |"
  $lines += "|---|---|---|---|---|---|"

  foreach ($row in $ActionRows) {
    $slotTxt = [string]$row.slot
    $plannedTxt = [string]$row.planned
    $executedTxt = [string]$row.executed
    $userTxt = [string]$row.user
    $statusTxt = [string]$row.status
    $resultTxt = [string]$row.result
    $lines += "| $slotTxt | $plannedTxt | $executedTxt | $userTxt | $statusTxt | $resultTxt |"
  }

  $lines += ""
  $lines += "## Resultado por passo"
  $lines += ""
  $lines += "| Passo | Resultado | Detalhe |"
  $lines += "|---|---|---|"
  foreach ($row in $StepResults) {
    $okText = if ($row.ok) { "OK" } else { "ERRO" }
    $stepTxt = [string]$row.step
    $detailTxt = [string]$row.detail
    $detailTxt = $detailTxt.Replace("|", "\|").Replace("`r", " ").Replace("`n", " ")
    $lines += "| $stepTxt | $okText | $detailTxt |"
  }

  $lines += ""
  return ($lines -join [Environment]::NewLine)
}

Step "health" {
  $health = Invoke-RestMethod "$BaseUrl/health"
  if (-not $health.ok) { throw "health sem ok=true" }
}

Step "login usuario A" {
  $loginA = Invoke-Json -Method "POST" -Url "$BaseUrl/auth/login" -Headers @{} -Body @{
    nome = $UserA
    senha = $PassA
  }
  $script:tokenA = [string]$loginA.token
  if (-not $script:tokenA) { throw "token A vazio" }
  $script:headersA = New-AuthHeaders -Token $script:tokenA
}

Step "login usuario B" {
  $loginB = Invoke-Json -Method "POST" -Url "$BaseUrl/auth/login" -Headers @{} -Body @{
    nome = $UserB
    senha = $PassB
  }
  $script:tokenB = [string]$loginB.token
  if (-not $script:tokenB) { throw "token B vazio" }
  $script:headersB = New-AuthHeaders -Token $script:tokenB
}

Step "selecionar registro" {
  if ($RecordId -gt 0) {
    $em = Invoke-Json -Method "GET" -Url "$BaseUrl/emendas/$RecordId" -Headers $script:headersA -Body $null
    $script:eid = [int]$em.id
    $script:idInterno = [string]$em.id_interno
  } else {
    $newId = "EPI-OPR-" + (Get-Date -Format "HHmmss")
    $em = Invoke-Json -Method "POST" -Url "$BaseUrl/emendas" -Headers $script:headersA -Body @{
      id_interno = $newId
      ano = $Ano
      identificacao = $Identificacao
      status_oficial = "Recebido"
    }
    $script:eid = [int]$em.id
    $script:idInterno = [string]$em.id_interno
  }

  if ($script:eid -le 0) { throw "registro invalido" }
}

$effectiveSchedule = if ([string]::IsNullOrWhiteSpace($SingleSlot)) { $Schedule } else { @($SingleSlot) }
$parsedSchedule = @($effectiveSchedule | ForEach-Object { Parse-ScheduleTime $_ })
$actors = @(
  [pscustomobject]@{ name = $UserA; headers = $headersA },
  [pscustomobject]@{ name = $UserB; headers = $headersB }
)

for ($i = 0; $i -lt $parsedSchedule.Count; $i++) {
  $slot = $parsedSchedule[$i]
  $actor = $actors[$i % $actors.Count]
  if ($NoteOnly) {
    $statusTarget = "-"
  } elseif (-not [string]::IsNullOrWhiteSpace($ForcedStatus)) {
    $statusTarget = $ForcedStatus
  } elseif ($ForcedStatusIndex -ge 0) {
    $statusTarget = $StatusSequence[$ForcedStatusIndex % $StatusSequence.Count]
  } else {
    $statusTarget = $StatusSequence[$i % $StatusSequence.Count]
  }
  $plannedText = ""

  if (-not [string]::IsNullOrWhiteSpace($SingleSlot)) {
    $plannedText = "single-slot imediato"
  } elseif ($FastForward) {
    if ($i -gt 0) { Start-Sleep -Seconds $FastForwardSeconds }
    $plannedText = "fast-forward ($FastForwardSeconds s)"
  } else {
    $targetAt = Get-NextOccurrence -Hour $slot.Hour -Minute $slot.Minute
    $waitSeconds = [int][Math]::Ceiling(($targetAt - (Get-Date)).TotalSeconds)
    if ($waitSeconds -gt 0) {
      Write-Host ("Aguardando ate {0} ({1}s)..." -f $targetAt.ToString("yyyy-MM-dd HH:mm:ss"), $waitSeconds) -ForegroundColor DarkYellow
      Start-Sleep -Seconds $waitSeconds
    }
    $plannedText = $targetAt.ToString("yyyy-MM-dd HH:mm")
  }

  $resultText = "ok"
  try {
    if (-not $NoteOnly) {
      try {
        $statusResp = Invoke-Json -Method "POST" -Url "$BaseUrl/emendas/$eid/status" -Headers $actor.headers -Body @{
          novo_status = $statusTarget
          motivo = "$marker STATUS slot=$($slot.Raw) user=$($actor.name)"
        }
        if (-not $statusResp.ok) { throw "falha status para $($actor.name)" }
      } catch {
        if ($_.Exception.Message -match "409|Conflito") {
          $resultText = "status ja estava no valor alvo (409); NOTE registrada"
        } else {
          throw
        }
      }
    }

    $noteResp = Invoke-Json -Method "POST" -Url "$BaseUrl/emendas/$eid/eventos" -Headers $actor.headers -Body @{
      tipo_evento = "NOTE"
      origem_evento = "API"
      motivo = "$marker NOTE slot=$($slot.Raw) user=$($actor.name)"
    }
    if (-not $noteResp.ok) { throw "falha NOTE para $($actor.name)" }
  } catch {
    $resultText = $_.Exception.Message
    $hasFail = $true
  }

  $actions.Add([pscustomobject]@{
      slot = $slot.Raw
      planned = $plannedText
      executed = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
      user = $actor.name
      status = $statusTarget
      result = $resultText
    }) | Out-Null
}

Step "validar audit" {
  $audit = Invoke-Json -Method "GET" -Url "$BaseUrl/audit" -Headers $script:headersA -Body $null
  $script:auditHits = @($audit | Where-Object {
      [int]$_.emenda_id -eq $script:eid -and [string]$_.motivo -like "$marker*"
    })

  $expectedMin = $parsedSchedule.Count
  if ($script:auditHits.Count -lt $expectedMin) {
    throw "audit com $($script:auditHits.Count) eventos; esperado >= $expectedMin"
  }

  $script:auditUsers = @($script:auditHits | ForEach-Object { [string]$_.usuario_nome } | Sort-Object -Unique)
  $requiredUsers = @($actions | ForEach-Object { [string]$_.user } | Sort-Object -Unique)
  foreach ($u in $requiredUsers) {
    if ($script:auditUsers -notcontains $u) {
      throw "audit sem usuario esperado: $u"
    }
  }
}

Step "status final" {
  $emFinal = Invoke-Json -Method "GET" -Url "$BaseUrl/emendas/$script:eid" -Headers $script:headersA -Body $null
  $script:finalStatus = [string]$emFinal.status_oficial
}

Write-Host ""
Write-Host "=== Resultado expediente operacao real ===" -ForegroundColor Cyan
$results | ForEach-Object {
  $tag = if ($_.ok) { "OK" } else { "ERRO" }
  $color = if ($_.ok) { "Green" } else { "Red" }
  Write-Host ("[{0}] {1} - {2}" -f $tag, $_.step, $_.detail) -ForegroundColor $color
}

Write-Host ""
Write-Host "Resumo" -ForegroundColor Cyan
Write-Host ("Base URL          : {0}" -f $BaseUrl)
Write-Host ("Registro          : {0} (id={1})" -f $idInterno, $eid)
Write-Host ("Marcador          : {0}" -f $marker)
Write-Host ("Usuarios no audit : {0}" -f ($auditUsers -join ", "))
Write-Host ("Eventos audit     : {0}" -f $auditHits.Count)
Write-Host ("Status final      : {0}" -f $finalStatus)

try {
  $reportPath = Resolve-EvidencePath -Dir $EvidenceDir -Name $reportName
  if ([string]::IsNullOrWhiteSpace($SingleSlot)) {
    $modeLabel = if ($NoteOnly) { "NOTE_ONLY" } else { "STATUS_AND_NOTE" }
  } else {
    $modeLabel = if ($NoteOnly) { "SINGLE_SLOT_NOTE_ONLY" } else { "SINGLE_SLOT_STATUS_AND_NOTE" }
  }
  $content = New-ReportMarkdown `
    -StepResults $results `
    -ActionRows $actions `
    -Failed $hasFail `
    -Started $startedAt `
    -Ended (Get-Date) `
    -BaseUrlValue $BaseUrl `
    -RecordLabel ("{0} (id={1})" -f $idInterno, $eid) `
    -MarkerValue $marker `
    -UserAValue $UserA `
    -UserBValue $UserB `
    -FinalStatusValue $finalStatus `
    -AuditCount $auditHits.Count `
    -AuditUsersValue $auditUsers `
    -ModeLabel $modeLabel

  Set-Content -Path $reportPath -Value $content -Encoding UTF8
  Write-Host ("Evidencia gerada  : {0}" -f $reportPath) -ForegroundColor Cyan
} catch {
  Write-Host ("Falha ao gerar evidencia .md: {0}" -f $_.Exception.Message) -ForegroundColor Yellow
}

if ($hasFail) {
  Write-Host ""
  Write-Host "Expediente operacao real: FALHOU" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Expediente operacao real: SUCESSO" -ForegroundColor Green
exit 0
