param(
  [string]$BaseUrl = "http://127.0.0.1:8000"
)

$ErrorActionPreference = "Stop"
$BaseUrl = ($BaseUrl.TrimEnd('/'))

$results = New-Object System.Collections.Generic.List[object]
$hasFail = $false

function Add-Result {
  param([string]$Step,[bool]$Ok,[string]$Detail)
  $script:results.Add([pscustomobject]@{ step = $Step; ok = $Ok; detail = $Detail }) | Out-Null
  if (-not $Ok) { $script:hasFail = $true }
}

function Step {
  param([string]$Name,[scriptblock]$Action)
  try {
    & $Action
    Add-Result -Step $Name -Ok $true -Detail "ok"
  } catch {
    Add-Result -Step $Name -Ok $false -Detail ($_.Exception.Message)
  }
}

function Invoke-Json {
  param(
    [string]$Method,
    [string]$Url,
    [hashtable]$Headers,
    [object]$Body
  )

  if ($null -ne $Body) {
    $json = $Body | ConvertTo-Json -Depth 10
    return Invoke-RestMethod -Method $Method -Uri $Url -Headers $Headers -ContentType "application/json" -Body $json
  }

  return Invoke-RestMethod -Method $Method -Uri $Url -Headers $Headers
}

$token = ""
$script:headers = @{}
$user = "qa_reg_" + (Get-Date -Format "HHmmss")
$pass = "123456"
$eid = $null
$loteId = $null
$exportId = $null

Step "health" {
  $health = Invoke-RestMethod "$BaseUrl/health"
  if (-not $health.ok) { throw "health sem ok=true" }
}

Step "openapi rotas minimas" {
  $openapi = Invoke-RestMethod "$BaseUrl/openapi.json"
  $paths = @($openapi.paths.PSObject.Properties.Name)
  $required = @(
    "/auth/register",
    "/auth/login",
    "/auth/me",
    "/emendas",
    "/emendas/{emenda_id}/status",
    "/emendas/{emenda_id}/eventos",
    "/imports/lotes",
    "/exports/logs",
    "/audit"
  )

  $missing = @($required | Where-Object { $paths -notcontains $_ })
  if ($missing.Count -gt 0) {
    throw ("rotas faltando: " + ($missing -join ", "))
  }
}

Step "register e login" {
  try {
    $null = Invoke-Json -Method "POST" -Url "$BaseUrl/auth/register" -Headers @{} -Body @{
      nome = $user
      perfil = "PROGRAMADOR"
      senha = $pass
    }
  } catch {
    if ($_.Exception.Message -notmatch "409|ja existe") { throw }
  }

  $login = Invoke-Json -Method "POST" -Url "$BaseUrl/auth/login" -Headers @{} -Body @{
    nome = $user
    senha = $pass
  }

  $script:token = [string]($login.token)
  if (-not $script:token) { throw "token vazio" }

  $script:headers = @{
    Authorization = "Bearer $script:token"
    "X-Session-Token" = $script:token
    "Content-Type" = "application/json"
  }
}

Step "auth me" {
  $me = Invoke-Json -Method "GET" -Url "$BaseUrl/auth/me" -Headers $script:headers -Body $null
  if ([string]$me.nome -ne $user) { throw "auth/me retornou usuario inesperado: $($me.nome)" }
}

Step "criar emenda" {
  $idInterno = "EPI-2026-" + (Get-Date -Format "HHmmss")
  $em = Invoke-Json -Method "POST" -Url "$BaseUrl/emendas" -Headers $script:headers -Body @{
    id_interno = $idInterno
    ano = 2026
    identificacao = "Regressao P0"
    status_oficial = "Recebido"
  }

  $script:eid = $em.id
  if (-not $script:eid) { throw "id da emenda nao retornou" }
}

Step "mudar status oficial" {
  $resp = Invoke-Json -Method "POST" -Url "$BaseUrl/emendas/$script:eid/status" -Headers $script:headers -Body @{
    novo_status = "Em analise"
    motivo = "regressao p0"
  }
  if (-not $resp.ok) { throw "status nao retornou ok" }
}

Step "adicionar evento NOTE" {
  $resp = Invoke-Json -Method "POST" -Url "$BaseUrl/emendas/$script:eid/eventos" -Headers $script:headers -Body @{
    tipo_evento = "NOTE"
    origem_evento = "API"
    motivo = "nota regressao p0"
  }
  if (-not $resp.ok) { throw "evento nao retornou ok" }
}

Step "registrar lote de importacao" {
  $resp = Invoke-Json -Method "POST" -Url "$BaseUrl/imports/lotes" -Headers $script:headers -Body @{
    arquivo_nome = "regressao_p0.xlsx"
    arquivo_hash = (Get-Random -Minimum 100000 -Maximum 999999).ToString()
    linhas_lidas = 10
    linhas_validas = 9
    linhas_ignoradas = 1
    registros_criados = 1
    registros_atualizados = 1
    sem_alteracao = 7
    duplicidade_id = 0
    duplicidade_ref = 0
    duplicidade_arquivo = 0
    conflito_id_ref = 0
    abas_lidas = @("Controle de EPI")
    observacao = "regressao p0"
    origem_evento = "IMPORT"
  }

  $script:loteId = $resp.id
  if (-not $script:loteId) { throw "lote id nao retornou" }
}

Step "registrar linhas de importacao" {
  $resp = Invoke-Json -Method "POST" -Url "$BaseUrl/imports/linhas/bulk" -Headers $script:headers -Body @{
    lote_id = [int]$script:loteId
    linhas = @(
      @{
        ordem = 1
        sheet_name = "Controle de EPI"
        row_number = 10
        status_linha = "UPDATED"
        id_interno = "EPI-TESTE"
        ref_key = "REF-TESTE"
        mensagem = "linha de regressao"
      }
    )
  }
  if (-not $resp.ok) { throw "bulk import linhas sem ok" }
}

Step "registrar log de exportacao" {
  $resp = Invoke-Json -Method "POST" -Url "$BaseUrl/exports/logs" -Headers $script:headers -Body @{
    formato = "XLSX"
    arquivo_nome = "regressao_p0_export.xlsx"
    quantidade_registros = 1
    quantidade_eventos = 2
    filtros_json = "{}"
    modo_headers = "originais"
    round_trip_ok = $true
    round_trip_issues = @()
    origem_evento = "EXPORT"
  }

  $script:exportId = $resp.id
  if (-not $script:exportId) { throw "export id nao retornou" }
}

Step "consultas finais" {
  $emendas = Invoke-Json -Method "GET" -Url "$BaseUrl/emendas" -Headers $script:headers -Body $null
  $audit = Invoke-Json -Method "GET" -Url "$BaseUrl/audit" -Headers $script:headers -Body $null
  $lotes = Invoke-Json -Method "GET" -Url "$BaseUrl/imports/lotes" -Headers $script:headers -Body $null
  $linhas = Invoke-Json -Method "GET" -Url "$BaseUrl/imports/linhas?lote_id=$script:loteId" -Headers $script:headers -Body $null
  $exports = Invoke-Json -Method "GET" -Url "$BaseUrl/exports/logs" -Headers $script:headers -Body $null

  if ((@($emendas | Where-Object { $_.id -eq $script:eid }).Count) -lt 1) { throw "emenda de teste nao encontrada na listagem" }
  if ((@($audit | Where-Object { $_.emenda_id -eq $script:eid }).Count) -lt 1) { throw "audit sem registros da emenda teste" }
  if ((@($lotes | Where-Object { $_.id -eq $script:loteId }).Count) -lt 1) { throw "lote de importacao nao encontrado" }
  if ((@($linhas).Count) -lt 1) { throw "linhas de importacao nao encontradas" }
  if ((@($exports | Where-Object { $_.id -eq $script:exportId }).Count) -lt 1) { throw "log de exportacao nao encontrado" }
}

Write-Host "\n=== Resultado regressao P0 ===" -ForegroundColor Cyan
$results | ForEach-Object {
  $color = if ($_.ok) { "Green" } else { "Red" }
  Write-Host ("[{0}] {1} - {2}" -f ($(if ($_.ok) {"OK"} else {"ERRO"}), $_.step, $_.detail)) -ForegroundColor $color
}

if ($hasFail) {
  Write-Host "\nRegressao P0: FALHOU" -ForegroundColor Red
  exit 1
}

Write-Host "\nRegressao P0: SUCESSO" -ForegroundColor Green
exit 0


