param(
  [string]$Tag = ""
)

$ErrorActionPreference = "Stop"

$notesRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $notesRoot
$snapshotsRoot = Join-Path $notesRoot "snapshots"

if (-not (Test-Path $snapshotsRoot)) {
  New-Item -ItemType Directory -Path $snapshotsRoot | Out-Null
}

function Safe-Tag([string]$Raw) {
  if (-not $Raw) { return "" }
  $clean = ($Raw -replace "[^a-zA-Z0-9_-]", "-").Trim("-")
  if (-not $clean) { return "" }
  return "_" + $clean
}

function Copy-RelativeFile {
  param(
    [string]$FromRoot,
    [string]$ToRoot,
    [string]$RelativePath
  )

  $src = Join-Path $FromRoot $RelativePath
  if (-not (Test-Path $src)) { return }

  $dst = Join-Path $ToRoot $RelativePath
  $dstDir = Split-Path -Parent $dst
  if (-not (Test-Path $dstDir)) {
    New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
  }

  Copy-Item $src -Destination $dst -Force
}

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$tagSuffix = Safe-Tag $Tag
$snapshotId = "handoff_${stamp}${tagSuffix}"
$snapshotDir = Join-Path $snapshotsRoot $snapshotId

New-Item -ItemType Directory -Path $snapshotDir | Out-Null
New-Item -ItemType Directory -Path (Join-Path $snapshotDir "docs") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $snapshotDir "project_refs") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $snapshotDir "git") | Out-Null

# Copy all notes docs (except existing snapshots folder files)
Get-ChildItem -Path $notesRoot -File | Where-Object {
  $_.Extension -in @(".md", ".ps1")
} | ForEach-Object {
  Copy-Item $_.FullName -Destination (Join-Path (Join-Path $snapshotDir "docs") $_.Name) -Force
}

# Copy key project references
$refFiles = @(
  "README.md",
  "scripts/start_tudo.ps1",
  "scripts/start_api.ps1",
  "scripts/start_front.ps1",
  "scripts/smoke_e2e.ps1",
  "backend/run_api.ps1",
  "config.js",
  "config.production.js",
  "index.html",
  "app.js"
)

foreach ($rel in $refFiles) {
  Copy-RelativeFile -FromRoot $projectRoot -ToRoot (Join-Path $snapshotDir "project_refs") -RelativePath $rel
}

# Git metadata
$branch = "unknown"
$commit = "unknown"
$gitAvailable = $false

Push-Location $projectRoot
try {
  if (Get-Command git -ErrorAction SilentlyContinue) {
    $gitAvailable = $true
    $branch = (git rev-parse --abbrev-ref HEAD 2>$null)
    if (-not $branch) { $branch = "unknown" }
    $commit = (git rev-parse HEAD 2>$null)
    if (-not $commit) { $commit = "unknown" }

    git status --short > (Join-Path $snapshotDir "git\status_short.txt")
    git status > (Join-Path $snapshotDir "git\status_full.txt")
    git log --oneline --decorate -n 30 > (Join-Path $snapshotDir "git\log_last30.txt")
    git remote -v > (Join-Path $snapshotDir "git\remotes.txt")
    git branch -vv > (Join-Path $snapshotDir "git\branches.txt")
  }
}
finally {
  Pop-Location
}

$generatedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$machine = $env:COMPUTERNAME
$user = $env:USERNAME

$summary = @"
# Context Snapshot

ID: $snapshotId
Generated at: $generatedAt
Machine: $machine
User: $user
Project root: $projectRoot
Notes root: $notesRoot

## Git
Available: $gitAvailable
Branch: $branch
Commit: $commit

## Included
- docs/: all notes (.md/.ps1) from anotacoes
- project_refs/: key runtime files (front/api/scripts/config)
- git/: status, log, remotes, branches

## How to use (next Codex/account)
1. Open docs/BASE_CONTINUIDADE_CODEX.md
2. Follow docs/README_ANOTACOES.md
3. Read docs/CHECKLIST_PROXIMA_FASE_ATUALIZADO.md
4. Continue from P0 pending items first
"@

Set-Content -Path (Join-Path $snapshotDir "SNAPSHOT_SUMMARY.md") -Value $summary -Encoding UTF8

$zipPath = Join-Path $snapshotsRoot ($snapshotId + ".zip")
if (Test-Path $zipPath) {
  Remove-Item $zipPath -Force
}
Compress-Archive -Path (Join-Path $snapshotDir "*") -DestinationPath $zipPath -Force

Write-Host "Snapshot generated:" -ForegroundColor Green
Write-Host "- Folder: $snapshotDir"
Write-Host "- Zip:    $zipPath"

