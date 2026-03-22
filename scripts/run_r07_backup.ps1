param(
  [string]$PythonExe = ".\backend\.venv\Scripts\python.exe",
  [string]$EnvFile = "backend/.env",
  [string]$OutputRoot = "",
  [string]$MirrorOutputRoot = "",
  [string]$Label = "sec_emendas_backup",
  [string]$DatabaseUrl = "",
  [string]$DatabaseUrlEnv = "BACKUP_DATABASE_URL",
  [string]$OutputRootEnv = "BACKUP_OUTPUT_ROOT",
  [string]$MirrorOutputRootEnv = "BACKUP_MIRROR_OUTPUT_ROOT"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $PythonExe)) {
  throw "Python nao encontrado em $PythonExe"
}

$cmd = @(
  $PythonExe,
  ".\scripts\r07_backup_database.py",
  "--env-file", $EnvFile,
  "--label", $Label,
  "--database-url-env", $DatabaseUrlEnv,
  "--output-root-env", $OutputRootEnv,
  "--mirror-output-root-env", $MirrorOutputRootEnv
)

if ($DatabaseUrl) {
  $cmd += @("--database-url", $DatabaseUrl)
}

if ($OutputRoot) {
  $cmd += @("--output-root", $OutputRoot)
}

if ($MirrorOutputRoot) {
  $cmd += @("--mirror-output-root", $MirrorOutputRoot)
}

& $cmd[0] $cmd[1..($cmd.Length - 1)]
