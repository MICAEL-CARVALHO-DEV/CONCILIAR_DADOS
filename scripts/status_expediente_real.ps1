param(
  [string]$TaskPrefix = "SEC_Expediente_Real",
  [string]$EvidenceDir = "..\\anotacoes\\evidencias",
  [string]$BaseUrl = "http://127.0.0.1:8000",
  [datetime]$Day = (Get-Date),
  [int]$HealthRetries = 3,
  [int]$HealthRetrySeconds = 8,
  [switch]$SkipHealth = $false,
  [switch]$AllowRemote = $false
)

$ErrorActionPreference = "Stop"
$BaseUrl = $BaseUrl.TrimEnd("/")

if (-not $AllowRemote -and $BaseUrl -notmatch "^https?://(localhost|127\.0\.0\.1)(:\d+)?$") {
  throw "BaseUrl remota bloqueada por seguranca. Use -AllowRemote para confirmar execucao fora de localhost."
}

function Resolve-EvidenceDir([string]$Dir) {
  $path = if ([System.IO.Path]::IsPathRooted($Dir)) { $Dir } else { Join-Path $PSScriptRoot $Dir }
  if (-not (Test-Path $path)) {
    New-Item -ItemType Directory -Path $path -Force | Out-Null
  }
  return $path
}

function Get-HealthStatus([string]$Url, [int]$Retries, [int]$RetrySeconds) {
  $attempt = 1
  $lastError = ""
  while ($attempt -le $Retries) {
    try {
      $h = Invoke-RestMethod -Method GET -Uri "$Url/health" -TimeoutSec 25
      if ($h.ok -eq $true) { return "OK" }
      $lastError = "INCONSISTENTE"
    } catch {
      $lastError = $_.Exception.Message
    }
    if ($attempt -lt $Retries) {
      Start-Sleep -Seconds $RetrySeconds
    }
    $attempt++
  }
  return "ERRO: $lastError"
}

function Get-ExpedienteTasks([string]$Prefix) {
  $rows = @()
  try {
    $tasks = Get-ScheduledTask -ErrorAction Stop | Where-Object { $_.TaskName -like "$Prefix*" } | Sort-Object TaskName
  } catch {
    throw "Falha ao ler tarefas agendadas. Execute no Windows com modulo ScheduledTasks habilitado."
  }

  foreach ($task in $tasks) {
    $info = Get-ScheduledTaskInfo -TaskName $task.TaskName -TaskPath $task.TaskPath
    $lastResult = [int]$info.LastTaskResult
    $lastResultText = if ($lastResult -eq 0) { "0 (SUCESSO)" } else { "{0} (ERRO)" -f $lastResult }

    $nextRun = if ($info.NextRunTime.Year -lt 2000) { "-" } else { $info.NextRunTime.ToString("yyyy-MM-dd HH:mm:ss") }
    $lastRun = if ($info.LastRunTime.Year -lt 2000) { "-" } else { $info.LastRunTime.ToString("yyyy-MM-dd HH:mm:ss") }

    $rows += [pscustomobject]@{
      task_name = [string]$task.TaskName
      state = [string]$task.State
      next_run = $nextRun
      last_run = $lastRun
      last_result = $lastResultText
      missed_runs = [int]$info.NumberOfMissedRuns
    }
  }

  return $rows
}

function Get-DayEvidence([string]$Dir, [datetime]$TargetDay) {
  $tag = $TargetDay.ToString("yyyyMMdd")
  $files = @(
    Get-ChildItem -Path $Dir -Filter "EXPEDIENTE_OPERACAO_REAL_${tag}_*.md" -ErrorAction SilentlyContinue
    Get-ChildItem -Path $Dir -Filter "DUPLA_OPERACAO_${tag}_*.md" -ErrorAction SilentlyContinue
  ) | Sort-Object LastWriteTime -Descending

  $rows = @()
  foreach ($f in $files) {
    $result = "-"
    $record = "-"
    $mode = "-"
    $base = "-"
    $users = "-"
    $content = Get-Content $f.FullName -ErrorAction SilentlyContinue

    foreach ($line in $content) {
      if ($line -like "- Resultado final:*") { $result = ($line -replace "^- Resultado final:\s*", "") }
      elseif ($line -like "- Registro:*") { $record = ($line -replace "^- Registro:\s*", "") }
      elseif ($line -like "- Modo:*") { $mode = ($line -replace "^- Modo:\s*", "") }
      elseif ($line -like "- Base URL:*") { $base = ($line -replace "^- Base URL:\s*", "") }
      elseif ($line -like "- Usuarios no audit:*") { $users = ($line -replace "^- Usuarios no audit:\s*", "") }
    }

    $rows += [pscustomobject]@{
      file_name = $f.Name
      updated_at = $f.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
      result = $result
      record = $record
      mode = $mode
      users = $users
      base_url = $base
    }
  }

  return $rows
}

function New-MarkdownReport {
  param(
    [string]$OutPath,
    [datetime]$When,
    [string]$BaseUrlValue,
    [string]$HealthValue,
    [string]$TaskPrefixValue,
    [object[]]$TaskRows,
    [object[]]$EvidenceRows
  )

  $okTasks = @($TaskRows | Where-Object { $_.last_result -like "0*" }).Count
  $errTasks = @($TaskRows | Where-Object { $_.last_result -notlike "0*" }).Count
  $okEvidence = @($EvidenceRows | Where-Object { $_.result -match "SUCESSO" }).Count
  $failEvidence = @($EvidenceRows | Where-Object { $_.result -match "FALHOU" }).Count

  $lines = @()
  $lines += "# Monitoramento Diario - Expediente Real"
  $lines += ""
  $lines += "- Gerado em: $($When.ToString("yyyy-MM-dd HH:mm:ss"))"
  $lines += "- API: $BaseUrlValue"
  $lines += "- Health: $HealthValue"
  $lines += "- Prefixo das tarefas: $TaskPrefixValue"
  $lines += "- Tarefas encontradas: $($TaskRows.Count)"
  $lines += "- Evidencias do dia: $($EvidenceRows.Count)"
  $lines += "- Tarefas com ultimo resultado OK: $okTasks"
  $lines += "- Tarefas com ultimo resultado ERRO: $errTasks"
  $lines += "- Evidencias SUCESSO: $okEvidence"
  $lines += "- Evidencias FALHOU: $failEvidence"
  $lines += ""
  $lines += "## Tarefas agendadas"
  $lines += ""
  $lines += "| Tarefa | Estado | Proxima execucao | Ultima execucao | Ultimo resultado | Falhas por ausencia |"
  $lines += "|---|---|---|---|---|---|"

  if ($TaskRows.Count -eq 0) {
    $lines += "| - | - | - | - | - | - |"
  } else {
    foreach ($t in $TaskRows) {
      $lines += "| $($t.task_name) | $($t.state) | $($t.next_run) | $($t.last_run) | $($t.last_result) | $($t.missed_runs) |"
    }
  }

  $lines += ""
  $lines += "## Evidencias do dia"
  $lines += ""
  $lines += "| Arquivo | Atualizado em | Resultado | Registro | Modo | Usuarios |"
  $lines += "|---|---|---|---|---|---|"

  if ($EvidenceRows.Count -eq 0) {
    $lines += "| - | - | - | - | - | - |"
  } else {
    foreach ($e in $EvidenceRows) {
      $lines += "| $($e.file_name) | $($e.updated_at) | $($e.result) | $($e.record) | $($e.mode) | $($e.users) |"
    }
  }

  Set-Content -Path $OutPath -Value ($lines -join [Environment]::NewLine) -Encoding UTF8
}

$evidencePath = Resolve-EvidenceDir -Dir $EvidenceDir
$health = if ($SkipHealth) { "IGNORADO" } else { Get-HealthStatus -Url $BaseUrl -Retries $HealthRetries -RetrySeconds $HealthRetrySeconds }
$taskRows = @(Get-ExpedienteTasks -Prefix $TaskPrefix)
$evidenceRows = @(Get-DayEvidence -Dir $evidencePath -TargetDay $Day)

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$reportFile = "MONITOR_EXPEDIENTE_REAL_{0}.md" -f $stamp
$reportPath = Join-Path $evidencePath $reportFile

New-MarkdownReport `
  -OutPath $reportPath `
  -When (Get-Date) `
  -BaseUrlValue $BaseUrl `
  -HealthValue $health `
  -TaskPrefixValue $TaskPrefix `
  -TaskRows $taskRows `
  -EvidenceRows $evidenceRows

Write-Host "=== Monitor expediente real ===" -ForegroundColor Cyan
Write-Host ("API health          : {0}" -f $health)
Write-Host ("Tarefas encontradas : {0}" -f $taskRows.Count)
Write-Host ("Evidencias do dia   : {0}" -f $evidenceRows.Count)
Write-Host ("Relatorio gerado    : {0}" -f $reportPath) -ForegroundColor Green
exit 0
