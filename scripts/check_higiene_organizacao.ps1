param(
  [string]$RepoRoot = ".",
  [switch]$WarnOnly
)

$ErrorActionPreference = "Stop"
Set-Location $RepoRoot

function To-RelPath([string]$fullPath) {
  $rel = Resolve-Path -LiteralPath $fullPath -Relative
  $rel = $rel -replace "^[.][\\/]", ""
  return ($rel -replace "\\", "/")
}

$issues = New-Object System.Collections.Generic.List[string]

function Add-Issue([string]$message) {
  $issues.Add($message) | Out-Null
}

Write-Host "[higiene] iniciando check de organizacao..." -ForegroundColor Cyan

$allowedRootFiles = @(
  ".gitignore",
  "app.js",
  "index.html",
  "style.css"
)

$rootFiles = @()
$gitCmd = Get-Command git -ErrorAction SilentlyContinue
if ($null -ne $gitCmd) {
  try {
    # Usa a visao do Git (tracked + untracked nao ignorados) para nao acusar
    # arquivo temporario/ignorado como falha de higiene.
    $gitRootFiles = @(
      & git ls-files --cached --others --exclude-standard 2>$null |
        Where-Object { $_ -and ($_ -notmatch "[/\\]") } |
        ForEach-Object { $_.Trim() } |
        Sort-Object -Unique
    )
    if ($LASTEXITCODE -eq 0) {
      $rootFiles = $gitRootFiles
    }
  } catch {
    # Fallback local sem git.
  }
}

if ($rootFiles.Count -eq 0) {
  $rootFiles = @(Get-ChildItem -Path . -File -Force | Select-Object -ExpandProperty Name)
}

$unexpectedRootFiles = @($rootFiles | Where-Object { $allowedRootFiles -notcontains $_ } | Sort-Object)
$missingRootFiles = @($allowedRootFiles | Where-Object { $rootFiles -notcontains $_ } | Sort-Object)

if ($unexpectedRootFiles.Count -gt 0) {
  Add-Issue ("arquivos inesperados na raiz: " + ($unexpectedRootFiles -join ", "))
}

if ($missingRootFiles.Count -gt 0) {
  Add-Issue ("arquivos obrigatorios ausentes na raiz: " + ($missingRootFiles -join ", "))
}

$requiredPaths = @(
  "frontend/pages/login.html",
  "frontend/pages/cadastro.html",
  "frontend/config/config.js",
  "frontend/config/config.production.js"
)

foreach ($path in $requiredPaths) {
  if (-not (Test-Path $path)) {
    Add-Issue "caminho obrigatorio ausente: $path"
  }
}

$mustBeLowercaseDirs = @(
  "docs",
  "checks",
  "checks/auxiliares",
  "assets"
)

foreach ($dir in $mustBeLowercaseDirs) {
  if (-not (Test-Path $dir)) {
    Add-Issue "pasta obrigatoria ausente: $dir"
    continue
  }

  $invalidCaseFiles = @(Get-ChildItem -Path $dir -Recurse -File | Where-Object {
    $_.Name -cne $_.Name.ToLowerInvariant()
  } | Sort-Object FullName)

  foreach ($file in $invalidCaseFiles) {
    Add-Issue ("nome de arquivo com maiuscula: " + (To-RelPath $file.FullName))
  }
}

$legacyReferencePatterns = @(
  "../README.md",
  "../CHECK62.md",
  "../CHECKUSER.md",
  "../CHECKLIST_DEPLOY_FINAL_OPERACAO.md",
  "../DEPLOY.md",
  "../DEPLOY_CLOUDFLARE_PAGES.md",
  "../DEPLOY_GRATIS_RENDER_SUPABASE.md",
  "../GUIA_ORQUESTRADOR_MULTI_IA.md",
  "../GUIA_SKILLS_E_HABILIDADES.md",
  "../GUIA_TRELLO_NOTION_OPERACAO.md",
  "../MAPA_LOGICO_CONCILIAR_DADOS.md",
  "../PLANO_ETAPAS_62_ITENS.md",
  "../README_MANUTENCAO.md",
  "../REFATORACAO_CHECKLIST.md",
  "../RELATORIO_PLANO_EVOLUCAO.md"
)

$scanDirs = @(
  "docs",
  "checks",
  "assets"
)

$markdownFiles = @()
foreach ($dir in $scanDirs) {
  if (Test-Path $dir) {
    $markdownFiles += Get-ChildItem -Path $dir -Recurse -File -Filter "*.md"
  }
}

foreach ($pattern in $legacyReferencePatterns) {
  if ($markdownFiles.Count -eq 0) { break }
  $hits = @(Select-String -Path $markdownFiles.FullName -SimpleMatch -CaseSensitive -Pattern $pattern)
  foreach ($hit in $hits) {
    $rel = To-RelPath $hit.Path
    Add-Issue ("referencia legada '" + $pattern + "' em " + $rel + ":" + $hit.LineNumber)
  }
}

if ($issues.Count -eq 0) {
  Write-Host "[higiene] OK - estrutura padronizada." -ForegroundColor Green
  exit 0
}

if ($WarnOnly) {
  Write-Host "[higiene] AVISO - ajustes recomendados:" -ForegroundColor Yellow
} else {
  Write-Host "[higiene] FALHA - ajustes necessarios:" -ForegroundColor Red
}
for ($i = 0; $i -lt $issues.Count; $i++) {
  Write-Host ("  {0}. {1}" -f ($i + 1), $issues[$i]) -ForegroundColor Yellow
}

if ($WarnOnly) {
  Write-Host "[higiene] modo warn-only ativo; commit local nao sera bloqueado." -ForegroundColor Yellow
  exit 0
}

exit 1
