param(
  [string]$BaseUrl = "https://sec-emendas-api.onrender.com",
  [string]$UserA = "MICAEL_DEV",
  [string]$PassA = "",
  [string]$UserB = "VITOR_DEV",
  [string]$PassB = "",
  [int]$RecordId = 0,
  [int]$PauseSeconds = 3,
  [string]$EvidenceDir = "..\\anotacoes\\evidencias"
)

$ErrorActionPreference = "Stop"
$BaseUrl = $BaseUrl.TrimEnd("/")
$PauseSeconds = [Math]::Max(0, $PauseSeconds)

if ([string]::IsNullOrWhiteSpace($PassA)) {
  $PassA = $env:SEC_PASS_A
}
if ([string]::IsNullOrWhiteSpace($PassB)) {
  $PassB = $env:SEC_PASS_B
}
if ([string]::IsNullOrWhiteSpace($PassA) -or [string]::IsNullOrWhiteSpace($PassB)) {
  throw "Informe -PassA/-PassB ou defina SEC_PASS_A e SEC_PASS_B no ambiente."
}

$results = New-Object System.Collections.Generic.List[object]
$hasFail = $false

$tokenA = ""
$tokenB = ""
$headersA = @{}
$headersB = @{}
$eid = 0
$idInterno = ""
$marker = "RT2P-" + (Get-Date -Format "yyyyMMddHHmmss")
$auditHits = @()
$auditUsers = @()
$finalStatus = ""
$startedAt = Get-Date
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$reportName = "DUPLA_OPERACAO_{0}.md" -f $stamp
$reportPath = ""

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

function New-AuthHeaders {
  param([string]$Token)
  return @{
    Authorization = "Bearer $Token"
    "X-Session-Token" = $Token
    "Content-Type" = "application/json"
  }
}

function Resolve-EvidencePath {
  param([string]$Dir, [string]$Name)

  $baseDir = if ([System.IO.Path]::IsPathRooted($Dir)) {
    $Dir
  } else {
    Join-Path $PSScriptRoot $Dir
  }

  if (-not (Test-Path $baseDir)) {
    New-Item -ItemType Directory -Path $baseDir -Force | Out-Null
  }

  return (Join-Path $baseDir $Name)
}

function New-ReportMarkdown {
  param(
    [string]$BaseUrlValue,
    [string]$UserAValue,
    [string]$UserBValue,
    [int]$RecordIdValue,
    [string]$IdInternoValue,
    [string]$MarkerValue,
    [int]$EventsCount,
    [string[]]$UsersInAudit,
    [string]$FinalStatusValue,
    [System.Collections.IEnumerable]$StepResults,
    [bool]$Failed,
    [datetime]$Started,
    [datetime]$Ended
  )

  $statusText = if ($Failed) { "FALHOU" } else { "SUCESSO" }
  $auditUsersText = if ($UsersInAudit -and $UsersInAudit.Count -gt 0) { ($UsersInAudit -join ", ") } else { "-" }
  $recLabel = if ($RecordIdValue -gt 0) { "$IdInternoValue (id=$RecordIdValue)" } else { "-" }

  $lines = @()
  $lines += "# Evidencia - Dupla Operacao em Tempo Real"
  $lines += ""
  $lines += "- Data inicio: $($Started.ToString("yyyy-MM-dd HH:mm:ss"))"
  $lines += "- Data fim: $($Ended.ToString("yyyy-MM-dd HH:mm:ss"))"
  $lines += "- Base URL: $BaseUrlValue"
  $lines += "- Usuario A: $UserAValue"
  $lines += "- Usuario B: $UserBValue"
  $lines += "- Registro: $recLabel"
  $lines += "- Marcador: $MarkerValue"
  $lines += "- Eventos validados: $EventsCount"
  $lines += "- Usuarios no audit: $auditUsersText"
  $lines += "- Status final da emenda: $FinalStatusValue"
  $lines += "- Resultado final: **$statusText**"
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

Step "selecionar ou criar registro" {
  if ($RecordId -gt 0) {
    $em = Invoke-Json -Method "GET" -Url "$BaseUrl/emendas/$RecordId" -Headers $script:headersA -Body $null
    $script:eid = [int]$em.id
    $script:idInterno = [string]$em.id_interno
  } else {
    $newId = "EPI-RT-" + (Get-Date -Format "HHmmss")
    $em = Invoke-Json -Method "POST" -Url "$BaseUrl/emendas" -Headers $script:headersA -Body @{
      id_interno = $newId
      ano = (Get-Date).Year
      identificacao = "Teste dupla operacao em tempo real"
      status_oficial = "Recebido"
    }
    $script:eid = [int]$em.id
    $script:idInterno = [string]$em.id_interno
  }

  if ($script:eid -le 0) { throw "registro invalido" }
}

Step "usuario A registra alteracao" {
  $noteA = Invoke-Json -Method "POST" -Url "$BaseUrl/emendas/$script:eid/eventos" -Headers $script:headersA -Body @{
    tipo_evento = "NOTE"
    origem_evento = "API"
    motivo = "$marker NOTE A $UserA"
  }
  if (-not $noteA.ok) { throw "note A sem ok" }

  $statusA = Invoke-Json -Method "POST" -Url "$BaseUrl/emendas/$script:eid/status" -Headers $script:headersA -Body @{
    novo_status = "Em analise"
    motivo = "$marker STATUS A $UserA"
  }
  if (-not $statusA.ok) { throw "status A sem ok" }
}

Step "pausa controlada" {
  Start-Sleep -Seconds $PauseSeconds
}

Step "usuario B registra alteracao" {
  $noteB = Invoke-Json -Method "POST" -Url "$BaseUrl/emendas/$script:eid/eventos" -Headers $script:headersB -Body @{
    tipo_evento = "NOTE"
    origem_evento = "API"
    motivo = "$marker NOTE B $UserB"
  }
  if (-not $noteB.ok) { throw "note B sem ok" }

  $statusB = Invoke-Json -Method "POST" -Url "$BaseUrl/emendas/$script:eid/status" -Headers $script:headersB -Body @{
    novo_status = "Pendente"
    motivo = "$marker STATUS B $UserB"
  }
  if (-not $statusB.ok) { throw "status B sem ok" }
}

Step "validar audit log" {
  $audit = Invoke-Json -Method "GET" -Url "$BaseUrl/audit" -Headers $script:headersA -Body $null
  $script:auditHits = @($audit | Where-Object {
      [int]$_.emenda_id -eq $script:eid -and [string]$_.motivo -like "$marker*"
    })

  if ($script:auditHits.Count -lt 4) {
    throw "audit registrou $($script:auditHits.Count) eventos; esperado >= 4"
  }

  $script:auditUsers = @($script:auditHits | ForEach-Object { [string]$_.usuario_nome } | Sort-Object -Unique)
  if ($script:auditUsers -notcontains $UserA) { throw "audit sem usuario A" }
  if ($script:auditUsers -notcontains $UserB) { throw "audit sem usuario B" }
}

Step "validar status final" {
  $emFinal = Invoke-Json -Method "GET" -Url "$BaseUrl/emendas/$script:eid" -Headers $script:headersA -Body $null
  $script:finalStatus = [string]$emFinal.status_oficial
  if ($script:finalStatus -ne "Pendente") {
    throw "status final inesperado: '$script:finalStatus' (esperado: 'Pendente')"
  }
}

Write-Host "`n=== Resultado dupla operacao tempo real ===" -ForegroundColor Cyan
$results | ForEach-Object {
  $color = if ($_.ok) { "Green" } else { "Red" }
  $tag = if ($_.ok) { "OK" } else { "ERRO" }
  Write-Host ("[{0}] {1} - {2}" -f $tag, $_.step, $_.detail) -ForegroundColor $color
}

Write-Host "`nResumo" -ForegroundColor Cyan
Write-Host ("Base URL            : {0}" -f $BaseUrl)
Write-Host ("Registro            : {0} (id={1})" -f $idInterno, $eid)
Write-Host ("Marcador teste      : {0}" -f $marker)
Write-Host ("Usuarios no audit   : {0}" -f ($auditUsers -join ", "))
Write-Host ("Eventos validados   : {0}" -f $auditHits.Count)
Write-Host ("Status final        : {0}" -f $finalStatus)

try {
  $reportPath = Resolve-EvidencePath -Dir $EvidenceDir -Name $reportName
  $endedAt = Get-Date
  $content = New-ReportMarkdown `
    -BaseUrlValue $BaseUrl `
    -UserAValue $UserA `
    -UserBValue $UserB `
    -RecordIdValue $eid `
    -IdInternoValue $idInterno `
    -MarkerValue $marker `
    -EventsCount $auditHits.Count `
    -UsersInAudit $auditUsers `
    -FinalStatusValue $finalStatus `
    -StepResults $results `
    -Failed $hasFail `
    -Started $startedAt `
    -Ended $endedAt

  Set-Content -Path $reportPath -Value $content -Encoding UTF8
  Write-Host ("Evidencia gerada    : {0}" -f $reportPath) -ForegroundColor Cyan
} catch {
  Write-Host ("Falha ao gerar evidencia .md: {0}" -f $_.Exception.Message) -ForegroundColor Yellow
  Write-Host ($_.Exception.ToString()) -ForegroundColor DarkYellow
}

if ($hasFail) {
  Write-Host "`nDupla operacao: FALHOU" -ForegroundColor Red
  exit 1
}

Write-Host "`nDupla operacao: SUCESSO" -ForegroundColor Green
exit 0
