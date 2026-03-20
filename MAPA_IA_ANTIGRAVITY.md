# Mapa IA Antigravity

Owner:
- `Antigravity`

Missao:
- dar suporte ao beta com QA, scripts, BI em modo especificacao e consolidacao das ideias

Status:
- `ATIVO`

## Arquivos permitidos

- `C:\Users\micae\OneDrive\Documentos\conciliardados\MAPA_CODAR_ALTERACOES.md`
- `C:\Users\micae\OneDrive\Documentos\conciliardados\PLANO_ETAPAS_62_ITENS.md`
- `C:\Users\micae\OneDrive\Documentos\conciliardados\assets\`
- `C:\Users\micae\OneDrive\Documentos\conciliardados\scripts\`
- `C:\Users\micae\OneDrive\Documentos\conciliardados\scripts\powerbi\`
- `C:\Users\micae\OneDrive\Documentos\conciliardados\README.md`
- `C:\Users\micae\OneDrive\Documentos\conciliardados\README_MANUTENCAO.md`
- `C:\Users\micae\OneDrive\Documentos\conciliardados\DECISOES_IMPORT_EXPORT_XLSX.md`
- `C:\Users\micae\OneDrive\Documentos\conciliardados\LOG_ALTERACOES.md`

## Arquivos proibidos

- `c:\Users\micae\OneDrive\Área de Trabalho\conciliardados\app.js`
- `c:\Users\micae\OneDrive\Área de Trabalho\conciliardados\index.html`
- `c:\Users\micae\OneDrive\Área de Trabalho\conciliardados\style.css`
- `c:\Users\micae\OneDrive\Área de Trabalho\conciliardados\backend\app\main.py`
- `c:\Users\micae\OneDrive\Área de Trabalho\conciliardados\backend\app\schemas.py`
- `c:\Users\micae\OneDrive\Área de Trabalho\conciliardados\backend\app\settings.py`

## Cortes sob responsabilidade

### Suporte ao Corte 1
- criar roteiro de teste para sync multiusuario
- registrar resultado e falhas repetiveis

### Suporte ao Corte 2
- consolidar criterio de aceite da governanca de import
- escrever fluxo de preview, corrigido e aprovado

### Corte 6
- BI beta em modo de especificacao e apoio
- estruturar backlog:
  - numero da emenda
  - filtro cascata deputado -> municipio
  - mapa da Bahia

### Corte 7
- consolidar o que e ideia duplicada, o que e atual e o que aponta para UI antiga

## Ativo agora

- Aguardando Feedback
- Nova sessao finalizada

## Checklist

- [x] Criar roteiro de teste multiusuario
- [x] Criar criterios de aceite da governanca de import
- [x] Consolidar backlog do BI beta em fases 6A, 6B e 6C
- [x] Limpar ideias duplicadas dos documentos de revisao
- [x] Manter documentacao e checkpoints claros
- [x] Consolidar matriz de validacao manual do `U01` com execucao em duas sessoes reais
- [x] Expandir o QA do `U02` para cobrir `preview_hash`, bloqueio por perfil e rejeicao do `sync` legado
- [x] Detalhar o desenho `Power BI Desktop + PostgreSQL read-only`
- [x] Traduzir o backlog do BI beta em contratos executaveis para a frente visual (`BACKLOG_BI_BETA_FASES.md`)
- [x] Criar checklist de go-live do `U09` baseado no `/health` com `production_ready` e `runtime_warnings` (`QA_GOLIVE_U09.md`)

## Criterios de aceite

- o time consegue validar sync e import sem depender de memoria oral
- BI deixa de ser ideia solta e vira backlog por fase
- nenhuma edicao entra nos arquivos-core compartilhados

## Handoff esperado da IA Codex

- pontos exatos da API e do comportamento que precisam ser testados

## Handoff esperado da IA Codex VS Code

- nomes finais das novas telas, blocos e controles para registrar no QA

## Bloqueado

- implementacao direta do BI dentro de `app.js` e `index.html`

## Proximo passo

- AGUARDAR REVISAO do usuario na frente de QA.
