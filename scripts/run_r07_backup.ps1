param(
  [string]$PythonExe = ".\backend\.venv\Scripts\python.exe",
  [string]$EnvFile = "backend/.env",
  [string]$OutputRoot = "tmp/r07_backups",
  [string]$MirrorOutputRoot = "",
  [string]$Label = "sec_emendas_backup",
  [string]$DatabaseUrl = "",
  [string]$DatabaseUrlEnv = "BACKUP_DATABASE_URL",
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
  "--output-root", $OutputRoot,
  "--label", $Label,
  "--database-url-env", $DatabaseUrlEnv,
  "--mirror-output-root-env", $MirrorOutputRootEnv
)

if ($DatabaseUrl) {
  $cmd += @("--database-url", $DatabaseUrl)
}

if ($MirrorOutputRoot) {
  $cmd += @("--mirror-output-root", $MirrorOutputRoot)
}

& $cmd[0] $cmd[1..($cmd.Length - 1)]
