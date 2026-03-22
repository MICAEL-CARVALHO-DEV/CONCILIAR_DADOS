param(
  [string]$Workdir = "C:\Users\micae\OneDrive\Área de Trabalho\conciliardados",
  [string]$LocalOutputRoot = "",
  [string]$GoogleDriveRoot = "",
  [string]$MirrorFolderName = "SEC_EMENDAS_BACKUP",
  [switch]$PersistUserEnv
)

$ErrorActionPreference = "Stop"

function Resolve-DefaultGoogleDriveRoot {
  param([string]$UserProfile)

  $candidates = @(
    (Join-Path $UserProfile "Google Drive"),
    (Join-Path $UserProfile "Meu Drive"),
    (Join-Path $UserProfile "My Drive")
  )

  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) {
      return $candidate
    }
  }

  return ""
}

$repoLocalRoot = Join-Path $Workdir "tmp\r07_backups"
$resolvedLocalRoot = if ($LocalOutputRoot) { $LocalOutputRoot } else { $repoLocalRoot }

$detectedGoogleDriveRoot = if ($GoogleDriveRoot) {
  $GoogleDriveRoot
} else {
  Resolve-DefaultGoogleDriveRoot -UserProfile $env:USERPROFILE
}

if (-not $detectedGoogleDriveRoot) {
  throw "Google Drive local nao encontrado. Informe -GoogleDriveRoot manualmente."
}

$resolvedMirrorRoot = Join-Path $detectedGoogleDriveRoot $MirrorFolderName

New-Item -ItemType Directory -Force -Path $resolvedLocalRoot | Out-Null
New-Item -ItemType Directory -Force -Path $resolvedMirrorRoot | Out-Null

if ($PersistUserEnv) {
  setx BACKUP_OUTPUT_ROOT $resolvedLocalRoot | Out-Null
  setx BACKUP_MIRROR_OUTPUT_ROOT $resolvedMirrorRoot | Out-Null
}

Write-Host "R07 armazenamento preparado."
Write-Host "Local output root: $resolvedLocalRoot"
Write-Host "Mirror output root: $resolvedMirrorRoot"

if ($PersistUserEnv) {
  Write-Host "Variaveis persistidas no usuario:"
  Write-Host "- BACKUP_OUTPUT_ROOT=$resolvedLocalRoot"
  Write-Host "- BACKUP_MIRROR_OUTPUT_ROOT=$resolvedMirrorRoot"
  Write-Host "Abra um novo terminal para herdar as variaveis."
} else {
  Write-Host "Para esta sessao atual, use:"
  Write-Host "`$env:BACKUP_OUTPUT_ROOT='$resolvedLocalRoot'"
  Write-Host "`$env:BACKUP_MIRROR_OUTPUT_ROOT='$resolvedMirrorRoot'"
}
