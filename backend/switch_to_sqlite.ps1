$envPath = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) ".env"
$localDataDir = Join-Path $env:LOCALAPPDATA "SECEmendas"
$dbPath = Join-Path $localDataDir "sec-emendas-local.db"
$dbUrl = "sqlite+pysqlite:///" + ($dbPath -replace "\\", "/")

New-Item -ItemType Directory -Path $localDataDir -Force | Out-Null

$lines = @(
  "APP_ENV=development",
  "DATABASE_URL=$dbUrl",
  "DB_AUTO_BOOTSTRAP=true",
  "ENABLE_DEMO_MODE=true",
  "CORS_ORIGINS=https://micael-carvalho-dev.github.io,https://conciliar-dados.pages.dev,https://homolog-cloudflare.conciliar-dados.pages.dev,http://127.0.0.1:5500,http://localhost:5500,http://127.0.0.1:5501,http://localhost:5501",
  "CORS_ALLOW_ORIGIN_REGEX=^https://([a-z0-9-]+\.)?conciliar-dados\.pages\.dev$|^https://micael-carvalho-dev\.github\.io$|^http://(localhost|127\.0\.0\.1)(:\d+)?$",
  "API_AUTH_ENABLED=true",
  "ALLOW_SHARED_KEY_AUTH=false",
  "API_SHARED_KEY=",
  "JWT_SECRET_KEY=dev-local-jwt-secret-change-me"
)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllLines($envPath, $lines, $utf8NoBom)
Write-Host ("ENV ajustado para SQLite local fora do OneDrive com auth segura: " + $dbPath)
