param(
  [string]$BaseUrl = "http://127.0.0.1:8000",
  [string]$UserName = "",
  [string]$Password = ""
)

$ErrorActionPreference = "Stop"
$base = $BaseUrl.TrimEnd('/')

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

function New-AuthHeaders([string]$token, [bool]$usesBearer) {
  if ($usesBearer) {
    return @{
      Authorization = "Bearer $token"
      "X-Session-Token" = $token
      "Content-Type" = "application/json"
    }
  }

  return @{
    "X-Session-Token" = $token
    "Content-Type" = "application/json"
  }
}

function Assert-HasKeys {
  param(
    [object]$Payload,
    [string[]]$Keys,
    [string]$Label
  )

  foreach ($key in $Keys) {
    if (-not ($Payload.PSObject.Properties.Name -contains $key)) {
      throw "$Label sem campo obrigatorio: $key"
    }
  }
}

if (-not $UserName) { $UserName = $env:SEC_OWNER_USER }
if (-not $Password) { $Password = $env:SEC_OWNER_PASS }
if (-not $UserName -or -not $Password) {
  throw "Informe -UserName e -Password ou configure SEC_OWNER_USER/SEC_OWNER_PASS."
}

Write-Host "[smoke-resumo] lendo openapi..."
$openapi = Invoke-RestMethod "$base/openapi.json"
$paths = $openapi.paths.PSObject.Properties.Name
$usesBearer = ($paths -contains "/emendas/{emenda_id}/versionar")

Write-Host "[smoke-resumo] login $UserName"
$login = Invoke-Json -Method "POST" -Url "$base/auth/login" -Headers @{} -Body @{
  nome = $UserName
  senha = $Password
}
$token = [string]$login.token
if (-not $token) { throw "token nao retornou no login" }
$headers = New-AuthHeaders -token $token -usesBearer $usesBearer

$stamp = Get-Date -Format "yyyyMMddHHmmss"

Write-Host "[smoke-resumo] criando lote de import de apoio"
$importLot = Invoke-Json -Method "POST" -Url "$base/imports/lotes" -Headers $headers -Body @{
  arquivo_nome = "smoke-resumo-$stamp.xlsx"
  arquivo_hash = "smoke-$stamp"
  linhas_lidas = 2
  linhas_validas = 1
  linhas_ignoradas = 1
  registros_criados = 1
  registros_atualizados = 0
  sem_alteracao = 0
  duplicidade_id = 0
  duplicidade_ref = 0
  duplicidade_arquivo = 0
  conflito_id_ref = 0
  abas_lidas = @("Planilha1")
  observacao = "smoke resumo"
  origem_evento = "IMPORT"
}
if (-not $importLot.id) { throw "lote de import nao retornou id" }

$null = Invoke-Json -Method "POST" -Url "$base/imports/linhas/bulk" -Headers $headers -Body @{
  lote_id = $importLot.id
  linhas = @(
    @{
      ordem = 1
      sheet_name = "Planilha1"
      row_number = 2
      status_linha = "CREATED"
      id_interno = "SMOKE-RESUMO-$stamp"
      ref_key = "smoke|$stamp"
      mensagem = "linha criada no smoke"
    },
    @{
      ordem = 2
      sheet_name = "Planilha1"
      row_number = 3
      status_linha = "IGNORED"
      id_interno = ""
      ref_key = "ignorado|$stamp"
      mensagem = "linha ignorada no smoke"
    }
  )
}

Write-Host "[smoke-resumo] criando log de export"
$null = Invoke-Json -Method "POST" -Url "$base/exports/logs" -Headers $headers -Body @{
  formato = "XLSX"
  arquivo_nome = "smoke-resumo-$stamp.xlsx"
  quantidade_registros = 2
  quantidade_eventos = 1
  filtros_json = "{}"
  modo_headers = "normalizados"
  escopo_exportacao = "ATUAIS"
  round_trip_ok = $true
  round_trip_issues = @()
  origem_evento = "EXPORT"
}

Write-Host "[smoke-resumo] criando chamado de suporte"
$null = Invoke-Json -Method "POST" -Url "$base/support/threads" -Headers $headers -Body @{
  subject = "Smoke resumo $stamp"
  categoria = "OUTRO"
  mensagem = "Validacao automatica dos endpoints de resumo."
}

Write-Host "[smoke-resumo] consultando /dashboard/resumo"
$dashboard = Invoke-Json -Method "GET" -Url "$base/dashboard/resumo" -Headers $headers -Body $null
Assert-HasKeys -Payload $dashboard -Keys @(
  "ano_filtro",
  "total_registros",
  "total_valor_inicial",
  "total_valor_atual",
  "ultima_atualizacao",
  "status_counts",
  "top_deputados",
  "latest_event",
  "contagem_deputado_policy"
) -Label "dashboard/resumo"
Assert-HasKeys -Payload $dashboard.contagem_deputado_policy -Keys @(
  "origem_oficial",
  "escopo_ajuste",
  "perfil_ajuste",
  "observacao"
) -Label "dashboard/resumo.contagem_deputado_policy"
if ([string]$dashboard.contagem_deputado_policy.origem_oficial -ne "BASE_ATUAL") {
  throw "dashboard/resumo.contagem_deputado_policy.origem_oficial deveria ser BASE_ATUAL"
}

Write-Host "[smoke-resumo] consultando /dashboard/deputados/politica"
$dashboardPolicy = Invoke-Json -Method "GET" -Url "$base/dashboard/deputados/politica" -Headers $headers -Body $null
Assert-HasKeys -Payload $dashboardPolicy -Keys @(
  "origem_oficial",
  "escopo_ajuste",
  "perfil_ajuste",
  "observacao"
) -Label "dashboard/deputados/politica"
if ([string]$dashboardPolicy.origem_oficial -ne "BASE_ATUAL") {
  throw "dashboard/deputados/politica.origem_oficial deveria ser BASE_ATUAL"
}

Write-Host "[smoke-resumo] consultando /imports/resumo"
$imports = Invoke-Json -Method "GET" -Url "$base/imports/resumo" -Headers $headers -Body $null
Assert-HasKeys -Payload $imports -Keys @(
  "total_lotes",
  "total_linhas_lidas",
  "total_linhas_ignoradas",
  "total_registros_criados",
  "total_registros_atualizados",
  "total_registros_removidos",
  "governance_status_counts",
  "line_status_counts",
  "latest_lot",
  "latest_governance",
  "latest_export_log"
) -Label "imports/resumo"

Write-Host "[smoke-resumo] consultando /exports/resumo"
$exports = Invoke-Json -Method "GET" -Url "$base/exports/resumo" -Headers $headers -Body $null
Assert-HasKeys -Payload $exports -Keys @(
  "total_exports",
  "total_registros",
  "total_eventos",
  "formato_counts",
  "escopo_counts",
  "round_trip_counts",
  "latest_export"
) -Label "exports/resumo"

Write-Host "[smoke-resumo] consultando /audit/resumo"
$audit = Invoke-Json -Method "GET" -Url "$base/audit/resumo" -Headers $headers -Body $null
Assert-HasKeys -Payload $audit -Keys @(
  "ano_filtro",
  "mes_filtro",
  "total_eventos",
  "total_emendas_unicas",
  "tipo_evento_counts",
  "origem_evento_counts",
  "setor_counts",
  "top_usuarios",
  "latest_event"
) -Label "audit/resumo"

Write-Host "[smoke-resumo] consultando /support/resumo"
$support = Invoke-Json -Method "GET" -Url "$base/support/resumo" -Headers $headers -Body $null
Assert-HasKeys -Payload $support -Keys @(
  "escopo",
  "total_threads",
  "status_counts",
  "categoria_counts",
  "latest_thread"
) -Label "support/resumo"

Write-Host "[smoke-resumo] dashboard total_registros:" $dashboard.total_registros
Write-Host "[smoke-resumo] imports total_lotes:" $imports.total_lotes
Write-Host "[smoke-resumo] exports total_exports:" $exports.total_exports
Write-Host "[smoke-resumo] audit total_eventos:" $audit.total_eventos
Write-Host "[smoke-resumo] support total_threads:" $support.total_threads
Write-Host "[smoke-resumo] OK"
