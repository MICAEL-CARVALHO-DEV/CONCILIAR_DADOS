param(
  [string]$DistDir = ".cf-pages-dist"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root $DistDir

function Copy-RequiredFile([string]$source, [string]$destination) {
  if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
    throw "[cf-build] arquivo obrigatorio ausente: $source"
  }
  $destDir = Split-Path -Parent $destination
  if ($destDir -and -not (Test-Path -LiteralPath $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
  }
  Copy-Item -LiteralPath $source -Destination $destination -Force
}

function Copy-OptionalFile([string]$source, [string]$destination) {
  if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
    Write-Host "[cf-build] aviso: opcional ausente: $source" -ForegroundColor Yellow
    return
  }
  $destDir = Split-Path -Parent $destination
  if ($destDir -and -not (Test-Path -LiteralPath $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
  }
  Copy-Item -LiteralPath $source -Destination $destination -Force
}

function Copy-RequiredDir([string]$source, [string]$destination) {
  if (-not (Test-Path -LiteralPath $source -PathType Container)) {
    throw "[cf-build] pasta obrigatoria ausente: $source"
  }
  if (-not (Test-Path -LiteralPath (Split-Path -Parent $destination))) {
    New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
  }
  Copy-Item -LiteralPath $source -Destination $destination -Recurse -Force
}

if (Test-Path -LiteralPath $dist) {
  Remove-Item -LiteralPath $dist -Recurse -Force
}
New-Item -ItemType Directory -Path $dist -Force | Out-Null

Copy-RequiredFile (Join-Path $root "index.html") (Join-Path $dist "index.html")
Copy-RequiredFile (Join-Path $root "style.css") (Join-Path $dist "style.css")
Copy-RequiredFile (Join-Path $root "app.js") (Join-Path $dist "app.js")

# Front completo (pages + config + js), para evitar regressao de modulos dinamicos.
Copy-RequiredDir (Join-Path $root "frontend") (Join-Path $dist "frontend")
Copy-RequiredDir (Join-Path $root "vendor") (Join-Path $dist "vendor")

New-Item -ItemType Directory -Path (Join-Path $dist "assets") -Force | Out-Null
Copy-OptionalFile (Join-Path $root "assets/sec-logo.png") (Join-Path $dist "assets/sec-logo.png")
Copy-OptionalFile (Join-Path $root "assets/login-bg.jpg") (Join-Path $dist "assets/login-bg.jpg")

$licenseSource = Join-Path $root "anotacoes/legal/license"
$licenseDest = Join-Path $dist "license"
if (Test-Path -LiteralPath $licenseSource -PathType Leaf) {
  Copy-Item -LiteralPath $licenseSource -Destination $licenseDest -Force
} else {
  Set-Content -LiteralPath $licenseDest -Value "SEC Emendas - pacote estatico de homologacao Cloudflare Pages." -NoNewline
}

Write-Host "[cf-build] pronto: $dist" -ForegroundColor Green
