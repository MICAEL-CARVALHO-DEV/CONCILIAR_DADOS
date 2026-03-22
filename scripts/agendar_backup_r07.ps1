param(
  [string]$TaskName = "SEC-R07-Backup-Diario",
  [int]$Hour = 20,
  [int]$Minute = 0,
  [string]$Workdir = "C:\Users\micae\OneDrive\Área de Trabalho\conciliardados",
  [string]$PowerShellExe = "powershell.exe"
)

$ErrorActionPreference = "Stop"

$scriptPath = Join-Path $Workdir "scripts\run_r07_backup.ps1"
if (-not (Test-Path $scriptPath)) {
  throw "Script de backup nao encontrado em $scriptPath"
}

$action = New-ScheduledTaskAction `
  -Execute $PowerShellExe `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""

$trigger = New-ScheduledTaskTrigger -Daily -At ([datetime]::Today.AddHours($Hour).AddMinutes($Minute))
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Backup diario R07 do banco operacional SEC Emendas" `
  -Force | Out-Null

Write-Host "Task registrada: $TaskName"
Write-Host "Horario: {0:D2}:{1:D2}" -f $Hour, $Minute
Write-Host "Pre-requisitos:"
Write-Host "- BACKUP_DATABASE_URL configurada"
Write-Host "- BACKUP_OUTPUT_ROOT configurada"
Write-Host "- BACKUP_MIRROR_OUTPUT_ROOT configurada se houver espelho no Google Drive"
