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
- `README.md`
- `CHECK62.md`
- `CHECKUSER.md`
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
- `checks/CHECK_PENDENCIAS_BETA_SEC.md`
- `checks/auxiliares/CHECKTEST.md`

### `docs/`
Usar para:
- documentacao estruturada e curada
- indices
- padroes
- refatoracao
- organizacao tecnica

Exemplo:
- `docs/INDICE_DOCUMENTACAO.md`
- `docs/CATALOGO_DOCUMENTOS_MD.md`
- `docs/PADRAO_ORGANIZACAO_MD.md`
- `docs/REFATORACAO_EXECUTION_CHECKLIST.md`

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
- `backend/README.md`
- `backend/MAPA_MAIN.md`
- `frontend/js/MAPA_APP.md`
- `assets/README_LOGIN_ASSETS.md`

## Politica de promocao de documento
- Se um arquivo em `anotacoes/` virou regra oficial, promover para `docs/` ou citar no `CHECK62.md`.
- Se um arquivo e so evidencia, manter em `anotacoes/evidencias/`.
- Se um arquivo parou de ser ativo mas precisa ficar guardado, mover para snapshot/arquivo historico.
- Se um check saiu da trilha diaria, mover para `checks/auxiliares/`.

## Politica de duplicidade
- Um documento deve ter uma fonte canonica.
- Se existir copia por compatibilidade, registrar a relacao em `CATALOGO_DOCUMENTOS_MD.md`.
- Nao editar duas copias divergentes sem decidir antes qual delas e a oficial.

## Politica de nome
- checks: `CHECK_*.md` ou `CHECK*.md`
- indices: `INDICE_*.md`
- padroes: `PADRAO_*.md`
- guias: `GUIA_*.md`
- relatorios: `RELATORIO_*.md`
- mapas: `MAPA_*.md`

## Regra de ouro
- Status oficial da beta SEC: `CHECK62.md`
- Sprint ativa: `CHECKUSER.md`
- Pendencias de decisao: `checks/CHECK_PENDENCIAS_BETA_SEC.md`

## Resume from
- Antes de criar ou mover um `.md`, abrir `INDICE_DOCUMENTACAO.md` e `CATALOGO_DOCUMENTOS_MD.md`.
