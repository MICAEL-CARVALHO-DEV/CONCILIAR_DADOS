# PADRAO ORGANIZACAO MD

Goal: Definir onde cada tipo de documento Markdown deve ficar no projeto.
Success: Novos `.md` entram no lugar certo, sem baguncar a raiz do repositorio.

## Regra geral
- Nao criar `.md` novo na raiz sem motivo forte.
- Sempre tentar encaixar o documento em uma categoria existente antes de abrir mais um arquivo solto.

## Onde cada tipo de `.md` deve ficar

### Raiz do projeto
Usar apenas para documentos de entrada principal ou alto impacto operacional.

Permitidos:
- `readme.md`
- `check62.md`
- `checkuser.md`
- `CHECKLIST_DEPLOY_FINAL_OPERACAO.md`
- `DEPLOY*.md`
- mapas ou guias principais ja consolidados

### `checks/`
Usar para:
- backlog de pendencias
- quadros auxiliares de acompanhamento
- checks derivados do mapa mestre
- checks auxiliares que nao sao mais entrada diaria

Exemplo:
- `checks/check_pendencias_beta_sec.md`
- `checks/auxiliares/checktest.md`

### `docs/`
Usar para:
- documentacao estruturada e curada
- indices
- padroes
- refatoracao
- organizacao tecnica

Exemplo:
- `docs/indice_documentacao.md`
- `docs/catalogo_documentos_md.md`
- `docs/padrao_organizacao_md.md`
- `docs/refatoracao_execution_checklist.md`

### `anotacoes/`
Usar para:
- estudo
- rascunho
- plano de trabalho
- orcamento
- comparativos
- material de apoio ainda nao promovido a documento oficial

### `anotacoes/evidencias/`
Usar para:
- evidencias datadas
- validacoes
- homologacoes
- saidas de roteiro operacional

### `anotacoes/snapshots/`
Usar para:
- snapshot congelado
- handoff
- material historico

### Pastas de modulo
Usar apenas para documento local do proprio modulo.

Exemplos:
- `backend/readme.md`
- `backend/MAPA_MAIN.md`
- `frontend/js/MAPA_APP.md`
- `assets/readme_login_assets.md`

## Politica de promocao de documento
- Se um arquivo em `anotacoes/` virou regra oficial, promover para `docs/` ou citar no `check62.md`.
- Se um arquivo e so evidencia, manter em `anotacoes/evidencias/`.
- Se um arquivo parou de ser ativo mas precisa ficar guardado, mover para snapshot/arquivo historico.
- Se um check saiu da trilha diaria, mover para `checks/auxiliares/`.

## Politica de duplicidade
- Um documento deve ter uma fonte canonica.
- Se existir copia por compatibilidade, registrar a relacao em `catalogo_documentos_md.md`.
- Nao editar duas copias divergentes sem decidir antes qual delas e a oficial.

## Politica de nome
- checks: `CHECK_*.md` ou `CHECK*.md`
- indices: `INDICE_*.md`
- padroes: `PADRAO_*.md`
- guias: `GUIA_*.md`
- relatorios: `RELATORIO_*.md`
- mapas: `MAPA_*.md`

## Regra de ouro
- Status oficial da beta SEC: `check62.md`
- Sprint ativa: `checkuser.md`
- Pendencias de decisao: `checks/check_pendencias_beta_sec.md`

## Resume from
- Antes de criar ou mover um `.md`, abrir `indice_documentacao.md` e `catalogo_documentos_md.md`.


