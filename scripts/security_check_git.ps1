param(
  [string]$RepoRoot = "."
)

$ErrorActionPreference = "Stop"

Set-Location $RepoRoot

Write-Host "[security-check] varrendo arquivos rastreados no git..." -ForegroundColor Cyan

$tracked = git ls-files
if (-not $tracked) {
  Write-Host "[security-check] nenhum arquivo rastreado encontrado." -ForegroundColor Yellow
  exit 0
}

$ignoreRegex = @(
  '\.env\.example$',
  '\.md$',
  '\.bak$',
  '\.bak_',
  '^vendor/',
  '^backend/alembic/',
  '^\.(gitignore|gitattributes)$'
)

$placeholderRegex = '(?i)(troque-esta-chave|dev-local-jwt-secret-change-me|changeme|change-me|example|dummy|placeholder|postgresql\+psycopg://emendas:emendas123@localhost|api_shared_key\s*=\s*["'']?\s*["'']?\s*,?\s*$|database_url\s*=\s*["'']?sqlite\+pysqlite://)'

$sensitiveRegex = @(
  '(?i)BEGIN\s+PRIVATE\s+KEY',
  '(?i)\bAKIA[0-9A-Z]{16}\b',
  '(?i)\bAIza[0-9A-Za-z\-_]{35}\b',
  '(?i)\bghp_[0-9A-Za-z]{30,}\b',
  '(?i)\bxox[baprs]-[0-9A-Za-z-]{10,}\b',
  '(?i)client_secret"\s*:\s*"[^\"]{8,}"',
  '(?i)refresh_token"\s*:\s*"[^\"]{12,}"',
  '(?i)access_token"\s*:\s*"[^\"]{12,}"',
  '(?i)jwt_secret_key\s*=\s*.+',
  '(?i)api_shared_key\s*=\s*.+',
  '(?i)database_url\s*=\s*.+',
  '(?i)postgres(ql)?\+psycopg://[^\\s:@]+:[^\\s@]+@[^\\s]+'
)

$hits = @()
foreach ($file in $tracked) {
  $skip = $false
  foreach ($rx in $ignoreRegex) {
    if ($file -match $rx) {
      $skip = $true
      break
    }
  }
  if ($skip -or -not (Test-Path $file)) { continue }

  foreach ($rx in $sensitiveRegex) {
    $found = Select-String -Path $file -Pattern $rx -SimpleMatch:$false
    if ($found) {
      foreach ($f in $found) {
        $line = ($f.Line.Trim())
        if ($line -match $placeholderRegex) {
          continue
        }
        $hits += [PSCustomObject]@{
          File = $file
          Line = $f.LineNumber
          Match = $line
        }
      }
    }
  }
}

if ($hits.Count -eq 0) {
  Write-Host "[security-check] OK: nenhum padrão sensível encontrado em arquivos rastreados." -ForegroundColor Green
  exit 0
}

Write-Host "[security-check] ALERTA: padrões sensíveis detectados." -ForegroundColor Red
$hits | Format-Table -AutoSize
exit 1
