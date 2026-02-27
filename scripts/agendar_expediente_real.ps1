param(
  [string]$TaskPrefix = "SEC_Expediente_Real",
  [string]$BaseUrl = "https://sec-emendas-api.onrender.com",
  [int]$RecordId = 0,
  [string]$ScriptPath = "",
  [string[]]$Slots = @("09:00", "11:00", "14:00", "16:00"),
  [string[]]$StatusSequence = @("Em analise", "Pendente", "Aguardando execucao", "Em execucao"),
  [switch]$NoteOnly = $false,
  [switch]$RemoveOnly = $false
)

$ErrorActionPreference = "Stop"
$BaseUrl = $BaseUrl.TrimEnd("/")

if ($RecordId -le 0) {
  throw "Informe -RecordId com id valido da emenda."
}

if (-not $Slots -or $Slots.Count -eq 0) {
  throw "Slots nao pode ser vazio."
}

if (-not $StatusSequence -or $StatusSequence.Count -eq 0) {
  throw "StatusSequence nao pode ser vazia."
}

if ([string]::IsNullOrWhiteSpace($ScriptPath)) {
  $ScriptPath = Join-Path $PSScriptRoot "expediente_operacao_real.ps1"
}
$ScriptPath = (Resolve-Path $ScriptPath).Path

function Get-TaskFriendlyPath([string]$Path) {
  $escaped = $Path.Replace('"', '""')
  $short = (& cmd.exe /c "for %I in (""$escaped"") do @echo %~sI" 2>$null).Trim()
  if (-not [string]::IsNullOrWhiteSpace($short)) {
    return $short
  }
  return $Path
}

$TaskScriptPath = Get-TaskFriendlyPath -Path $ScriptPath

function Assert-HhMm([string]$value) {
  if ($value -notmatch "^\d{2}:\d{2}$") {
    throw "Horario invalido: $value (use HH:mm)"
  }
}

function Invoke-Schtasks([string[]]$Arguments) {
  $output = & schtasks.exe @Arguments 2>&1
  $code = $LASTEXITCODE
  if ($code -ne 0) {
    throw ("schtasks falhou (code={0}): {1}" -f $code, ($output -join " "))
  }
}

foreach ($slot in $Slots) { Assert-HhMm $slot }

$tasks = @()
for ($i = 0; $i -lt $Slots.Count; $i++) {
  $slot = $Slots[$i]
  $status = $StatusSequence[$i % $StatusSequence.Count]
  $slotTag = $slot.Replace(":", "")
  $taskName = "$TaskPrefix`_$slotTag"

  $cmd = "powershell.exe -NoP -ExecutionPolicy Bypass -File `"$TaskScriptPath`" -RecordId $RecordId -SingleSlot $slot"
  if ($BaseUrl -ne "https://sec-emendas-api.onrender.com") {
    $cmd += " -BaseUrl `"$BaseUrl`""
  }
  if ($NoteOnly) {
    $cmd += " -NoteOnly"
  } else {
    $cmd += " -ForcedStatusIndex $i"
  }

  $tasks += [pscustomobject]@{
    Name = $taskName
    Slot = $slot
    Status = $status
    Command = $cmd
  }
}

if ($RemoveOnly) {
  foreach ($t in $tasks) {
    try {
      Invoke-Schtasks @("/Delete", "/TN", $t.Name, "/F")
      Write-Host ("Removida tarefa: {0}" -f $t.Name) -ForegroundColor Yellow
    } catch {
      Write-Host ("Nao removida (pode nao existir): {0}" -f $t.Name) -ForegroundColor DarkYellow
    }
  }
  Write-Host "Concluido: remocao de tarefas." -ForegroundColor Green
  exit 0
}

foreach ($t in $tasks) {
  Invoke-Schtasks @("/Create", "/SC", "DAILY", "/TN", $t.Name, "/TR", $t.Command, "/ST", $t.Slot, "/F")
  Write-Host ("Agendada: {0} as {1}" -f $t.Name, $t.Slot) -ForegroundColor Green
}

Write-Host ""
Write-Host "Cron diario configurado." -ForegroundColor Cyan
Write-Host "Antes de rodar automatico, defina variaveis de ambiente no Windows:" -ForegroundColor Cyan
Write-Host "  SEC_USER_A, SEC_PASS_A, SEC_USER_B, SEC_PASS_B" -ForegroundColor Gray
Write-Host ""
Write-Host "Resumo:" -ForegroundColor Cyan
$tasks | ForEach-Object {
  if ($NoteOnly) {
    Write-Host ("- {0} | {1} | NOTE_ONLY" -f $_.Name, $_.Slot)
  } else {
    Write-Host ("- {0} | {1} | {2}" -f $_.Name, $_.Slot, $_.Status)
  }
}

exit 0
