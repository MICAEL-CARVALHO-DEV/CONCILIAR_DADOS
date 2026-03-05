$envPath = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) ".env"
$lines = @(
  "APP_ENV=development",
  "DATABASE_URL=postgresql+psycopg://emendas:emendas123@localhost:5432/emendas_db",
  "CORS_ORIGINS=https://micael-carvalho-dev.github.io,http://127.0.0.1:5500,http://localhost:5500,http://127.0.0.1:5501,http://localhost:5501",
  "API_AUTH_ENABLED=true",
  "ALLOW_SHARED_KEY_AUTH=false",
  "API_SHARED_KEY=",
  "JWT_SECRET_KEY=dev-local-jwt-secret-change-me"
)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllLines($envPath, $lines, $utf8NoBom)
Write-Host "ENV ajustado para PostgreSQL local (Docker) com auth segura."
