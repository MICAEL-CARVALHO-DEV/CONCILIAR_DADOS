# MAPA LOGICO CONCILIAR_DADOS

Data de atualizacao: 2026-03-04
Objetivo: dar visao rapida de arquitetura, fluxo e responsabilidade de cada arquivo-chave.

## 1. Visao geral da stack
- Frontend: `login.html`, `cadastro.html`, `index.html`, `app.js`, `style.css`, `config.js`, `config.production.js`
- Backend: FastAPI em `backend/app/main.py` + modulos de suporte
- Banco: SQLite (local) e PostgreSQL (producao)
- Infra atual: front estatico + API separada

## 2. Fluxo principal do sistema
1. Usuario autentica em `login.html` (local ou Google).
2. Front recebe token e salva em `sessionStorage`.
3. `index.html` carrega `app.js`.
4. `initializeAuthFlow()` valida sessao no backend (`/auth/me`).
5. `bootstrapApiIntegration()` sincroniza estado com API (`/health`, `/emendas`).
6. Usuario opera importacao/edicao/exportacao.
7. Eventos e historico sao enviados para API (auditoria).

## 3. Arquivos front e responsabilidade
### `login.html`
- Resolve API base por host.
- Faz login por usuario/senha.
- Faz login por Google (quando client ID ativo).
- Faz solicitacao de recuperacao de acesso.

Funcoes-chave:
- `getBaseUrl()`: define URL da API por ambiente.
- `validateExistingSession()`: reaproveita token valido.
- `apiRequest()`: chamada padrao de auth.
- `initializeGoogleAuth()`: injeta e inicia Google Identity.
- `onGoogleCredential()`: troca credencial Google por sessao backend.

### `cadastro.html`
- Cadastro publico ou cadastro assistido por Google.
- Restricao de papeis permitidos para auto-cadastro.
- Modo criador (PROGRAMADOR) com permissao ampliada.

Funcoes-chave:
- `detectCreatorMode()`: identifica se criador autenticado e owner.
- `loadRoles()`: busca roles e aplica filtro seguro.
- `prefillGoogleRegistration()`: preenche nome/email via Google.
- `setGoogleRegisterMode()`: senha local opcional no fluxo Google.

### `app.js`
- Core da operacao do produto.
- Estado local + sincronizacao API.
- Importacao XLSX, merge de registros, auditoria de eventos.
- Exportacao atual/historico/custom + logs de exportacao.
- Controle de perfil (APG, SUPERVISAO, CONTABIL, POWERBI, PROGRAMADOR).

Blocos-chave:
- Render e filtros: `initSelects()`, `render()`, `getFiltered()`
- Auth gate e sessao: `setupAuthUi()`, `initializeAuthFlow()`, `onAuthSuccess()`
- API: `apiRequest()`, `apiRequestPublic()`, `buildApiHeaders()`
- WebSocket: `connectApiSocket()`, `queueApiRefreshFromSocket()`
- Estado: `loadState()`, `saveState()`, `setupCrossTabSync()`
- Importacao: `parseInputFile()`, `processImportedRows()`, `mergeImportIntoRecord()`
- Exportacao: `runExportByScope()`, `exportRecordsToXlsx()`, `exportRecordsToTemplateXlsx()`

## 4. Backend (visao funcional)
Arquivo principal: `backend/app/main.py`

Responsabilidades:
- Endpoints de autenticacao (`/auth/login`, `/auth/register`, `/auth/me`, `/auth/logout`)
- Endpoints de emendas, status, eventos, importacoes e logs
- Regras por perfil
- Persistencia em banco

Risco atual observado no historico local:
- Quando schema local esta desatualizado, login quebra com erro de coluna inexistente (`usuarios.email`).

Acao obrigatoria:
- rodar migracoes Alembic no ambiente local antes de testar auth

## 5. Diagnostico tecnico atual
### Pontos fortes
- Arquitetura separada front/back
- Trilha de auditoria
- Fluxo de importacao/exportacao robusto
- Controle de perfil implementado

### Pontos de atencao
- Ambiente local com banco desatualizado causa erro 500 no login
- Google OAuth exige origem exata por host/porta no Console Google
- Scripts e docs estao grandes; sem mapa rapido fica dificil para junior

## 6. Como validar rapido (sem quebrar ambiente)
1. API health:
- `http://127.0.0.1:8000/health`
2. Login local:
- `http://127.0.0.1:5500/login.html`
3. Cadastro:
- `http://127.0.0.1:5500/cadastro.html?next=index.html`
4. Console:
- sem `ERR_CONNECTION_REFUSED`
- sem `no such column`

## 7. Checklist de leitura para continuidade
1. `README.md`
2. `MAPA_LOGICO_CONCILIAR_DADOS.md` (este arquivo)
3. `RELATORIO_PLANO_EVOLUCAO.md`
4. `PLANO_ETAPAS_62_ITENS.md`
5. `LOG_ALTERACOES.md`

## 8. Regra de trabalho para evitar retrabalho
- Primeiro diagnosticar (console + logs + health)
- Depois corrigir causa raiz
- So depois ajustar visual/UX
- Sempre registrar decisao em documento

