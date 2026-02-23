param(
  [string]$DockerExe = 'C:\Program Files\Docker\Docker\resources\bin\docker.exe'
)

if (-not (Test-Path $DockerExe)) {
  Write-Error "Docker CLI nao encontrado em: $DockerExe"
  exit 1
}

& $DockerExe ps -a --filter "name=^emendas_pg$" --format "{{.Names}}" | Out-String | ForEach-Object {
  $name = $_.Trim()
  if ($name -eq 'emendas_pg') {
    Write-Host 'Container emendas_pg ja existe. Iniciando...'
    & $DockerExe start emendas_pg | Out-Null
    exit 0
  }
}

Write-Host 'Criando container emendas_pg...'
& $DockerExe run --name emendas_pg `
  -e POSTGRES_USER=emendas `
  -e POSTGRES_PASSWORD=emendas123 `
  -e POSTGRES_DB=emendas_db `
  -p 5432:5432 `
  -v emendas_pg_data:/var/lib/postgresql/data `
  -d postgres:16

if ($LASTEXITCODE -ne 0) {
  Write-Error 'Falha ao criar/subir o PostgreSQL via Docker.'
  exit 1
}

Write-Host 'PostgreSQL em container iniciado com sucesso.'
