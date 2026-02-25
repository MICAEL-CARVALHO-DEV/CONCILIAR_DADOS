param(
  [string]$BaseUrl = "http://127.0.0.1:8000",
  [int[]]$UsersMatrix = @(2,3,4,5),
  [string]$EvidencesDir = "anotacoes\evidencias"
)

$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$regScript = Join-Path $root "scripts\regressao_p0.ps1"
$conScript = Join-Path $root "scripts\concorrencia_c34.ps1"

if (-not (Test-Path $regScript)) { throw "Script nao encontrado: $regScript" }
if (-not (Test-Path $conScript)) { throw "Script nao encontrado: $conScript" }

$evDirPath = Join-Path $root $EvidencesDir
New-Item -ItemType Directory -Path $evDirPath -Force | Out-Null

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$reportPath = Join-Path $evDirPath "VALIDACAO_RELEASE_C33_C34_$stamp.md"

$results = New-Object System.Collections.Generic.List[object]

function Add-Result {
  param(
    [string]$Name,
    [bool]$Ok,
    [int]$ExitCode,
    [double]$Duration,
    [string]$Output
  )

  $results.Add([pscustomobject]@{
    step = $Name
    ok = $Ok
    exit_code = $ExitCode
    duration_seconds = $Duration
    output = ($Output.Trim())
  }) | Out-Null

  $color = if ($Ok) { "Green" } else { "Red" }
  $tag = if ($Ok) { "OK" } else { "ERRO" }
  Write-Host "[$tag] $Name (exit=$ExitCode, $Duration s)" -ForegroundColor $color
}

function Invoke-StepExternal {
  param(
    [string]$Name,
    [string]$ScriptPath,
    [string[]]$Args
  )

  $started = Get-Date
  $output = ""
  $ok = $false
  $exitCode = 1

  try {
    $output = (& powershell -NoProfile -ExecutionPolicy Bypass -File $ScriptPath @Args 2>&1 | Out-String)
    $exitCode = $LASTEXITCODE
    if ($exitCode -eq 0) { $ok = $true }
  } catch {
    $output = $_ | Out-String
    $exitCode = 1
    $ok = $false
  }

  $duration = [math]::Round(((Get-Date) - $started).TotalSeconds, 2)
  Add-Result -Name $Name -Ok $ok -ExitCode $exitCode -Duration $duration -Output $output
}

function Invoke-StepInternal {
  param(
    [string]$Name,
    [scriptblock]$Action
  )

  $started = Get-Date
  $output = ""
  $ok = $false
  $exitCode = 1

  try {
    $output = (& $Action 2>&1 | Out-String)
    $ok = $true
    $exitCode = 0
  } catch {
    $output = $_ | Out-String
    $ok = $false
    $exitCode = 1
  }

  $duration = [math]::Round(((Get-Date) - $started).TotalSeconds, 2)
  Add-Result -Name $Name -Ok $ok -ExitCode $exitCode -Duration $duration -Output $output
}

Invoke-StepExternal -Name "C33 regressao P0" -ScriptPath $regScript -Args @("-BaseUrl", $BaseUrl)

foreach ($u in $UsersMatrix) {
  if ($u -lt 2 -or $u -gt 5) {
    Add-Result -Name "C34 concorrencia users=$u" -Ok $false -ExitCode 1 -Duration 0 -Output "Valor fora do escopo C34 (2 a 5 usuarios)."
    continue
  }

  Invoke-StepInternal -Name "C34 concorrencia users=$u" -Action {
    & $conScript -BaseUrl $BaseUrl -Users $u
  }
}

$allOk = (@($results | Where-Object { -not $_.ok }).Count -eq 0)
$nowIso = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Evidencia de Validacao Release (C33/C34)") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("- Data/Hora: $nowIso") | Out-Null
$lines.Add("- BaseUrl: $BaseUrl") | Out-Null
$lines.Add("- Resultado geral: " + ($(if ($allOk) { "SUCESSO" } else { "FALHA" }))) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Resumo") | Out-Null
foreach ($r in $results) {
  $tag = if ($r.ok) { "OK" } else { "ERRO" }
  $lines.Add("- [$tag] $($r.step) | exit=$($r.exit_code) | duracao=$($r.duration_seconds)s") | Out-Null
}

$lines.Add("") | Out-Null
$lines.Add("## Saidas") | Out-Null
foreach ($r in $results) {
  $lines.Add("") | Out-Null
  $lines.Add("### $($r.step)") | Out-Null
  $lines.Add('```text') | Out-Null
  $out = [string]$r.output
  $lines.Add($out.Trim()) | Out-Null
  $lines.Add('```') | Out-Null
}

Set-Content -Path $reportPath -Value $lines -Encoding utf8

Write-Host ""
Write-Host "Evidencia gerada: $reportPath" -ForegroundColor Cyan

if (-not $allOk) {
  Write-Error "Validacao C33/C34 falhou. Veja o relatorio: $reportPath"
  exit 1
}

Write-Host "Validacao C33/C34: SUCESSO" -ForegroundColor Green
exit 0
