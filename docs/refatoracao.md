# Quadro de execucao da refatoracao

## Meta
Sair de um projeto "funciona, mas esta pesado" para um projeto:

- organizado
- modular
- facil de manter
- mais seguro
- mais simples de evoluir

## Execucao atual
- [DONE] Criar branch `refactor/estrutura-geral`
- [DONE] Registrar commit de checkpoint antes da refatoracao
- [DONE] Criar `REFATORACAO_CHECKLIST.md`
- [DONE] Criar este quadro de execucao
- [DONE] Mapear `app.js` em `frontend/js/MAPA_APP.md`
- [DONE] Mapear backend em `backend/MAPA_MAIN.md`
- [DONE] Criar base de `utils`, `auth` e `api client` no frontend
- [DONE] [ID-FE-04] Extrair utilitarios base para `frontend/js/utils/format.js`
- [DONE] [ID-FE-05] Extrair utilitarios de normalizacao e clones para `frontend/js/utils/normalize.js`
- [TODO] Continuar migracao do `app.js` para os modulos novos

Active: ID-FE-06 — continuidade da migracao do frontend por blocos pequenos
Risks: arquivo `app.js` grande, backend ainda concentrado, regressao em auth/import/export e lock

## Fase 0 - Preparacao
### Dia 1 - Criar base segura
Tarefas:

- criar branch `refactor/estrutura-geral`
- fazer commit de seguranca do estado atual
- criar `REFATORACAO_CHECKLIST.md`

Objetivo do dia:

- ter um ponto de retorno caso algo quebre

## Fase 1 - Mapear antes de quebrar
### Dia 2 - Mapear o `app.js`
Tarefas:

- abrir o `app.js` e separar em blocos em arquivo `.md`
- criar `frontend/js/MAPA_APP.md`
- mapear configuracao, autenticacao, API, UI, eventos e utilitarios

Objetivo do dia:

- entender o arquivo antes de sair puxando codigo

### Dia 3 - Mapear o backend
Tarefas:

- criar `backend/MAPA_MAIN.md`
- mapear auth, usuarios, dados principais, auditoria, importacao/exportacao e websocket

Objetivo do dia:

- separar mentalmente o backend por areas

## Fase 2 - Refatoracao do frontend
### Dia 4 - Criar nova estrutura de pastas
Estrutura alvo:

```text
frontend/js/
  main.js
  config.js
  api/
  auth/
  ui/
  services/
  utils/
  pages/
```

Arquivos base:

- `frontend/js/api/client.js`
- `frontend/js/auth/authStore.js`
- `frontend/js/auth/authGuard.js`
- `frontend/js/utils/storage.js`
- `frontend/js/utils/dom.js`
- `frontend/js/utils/escape.js`
- `frontend/js/ui/toast.js`
- `frontend/js/ui/loading.js`

Objetivo:

- preparar o terreno sem mexer forte na logica

### Dia 5 - Extrair utilitarios
Mover do `app.js` para `utils/`:

- `escapeHtml`
- formatadores
- validadores
- funcoes genericas de DOM
- funcoes de storage

Commit sugerido:

```bash
git commit -m "refactor(front): extrai utilitarios do app.js"
```

### Dia 6 - Criar cliente central de API
Responsabilidades de `frontend/js/api/client.js`:

- base URL
- headers padrao
- token
- parse de resposta
- tratamento de erro

Regra:

- o restante do sistema nao deve usar `fetch()` direto

Commit sugerido:

```bash
git commit -m "refactor(front): centraliza chamadas http em client.js"
```

### Dia 7 - Extrair autenticacao
Criar:

- `authStore.js`
- `loginFlow.js` se necessario
- `authGuard.js`

Responsabilidades:

- salvar token
- ler token
- limpar sessao
- salvar usuario logado

Regra:

- nenhum outro arquivo deve mexer direto em `sessionStorage` ou `localStorage`

### Dia 8 - Revisar token e storage
Tarefas:

- parar de espalhar token pelo projeto
- usar preferencialmente `sessionStorage`
- remover duplicacao desnecessaria com `localStorage`
- testar login/logout a cada mudanca

Checklist do dia:

- login funciona
- reload da pagina funciona
- logout limpa sessao
- tela protegida redireciona corretamente

### Dia 9 - Extrair UI reutilizavel
Criar modulos:

- `ui/toast.js`
- `ui/loading.js`
- `ui/modal.js` se necessario
- `ui/tabela.js`

Mover:

- mensagens de sucesso/erro
- loading global
- funcoes repetidas de tabela

### Dia 10 - Extrair renderizacao principal
Separar renderizacao de:

- tabela principal
- filtros
- blocos de resultados
- cartoes e resumos

Objetivo:

- deixar `app.js` ou `main.js` como orquestrador

### Dia 11 - Reduzir `innerHTML`
Prioridades:

- conteudo vindo do usuario
- tabelas dinamicas
- modais dinamicos
- mensagens renderizadas

Trocar por:

- `createElement`
- `textContent`
- `appendChild`

Regra:

- `innerHTML` so em HTML fixo e controlado

### Dia 12 - Revisao do frontend
Tarefas:

- testar navegacao principal
- remover funcoes orfas
- apagar codigo duplicado
- renomear funcoes confusas

Resultado esperado:

- frontend muito mais leve de manter

## Fase 3 - Refatoracao do backend
### Dia 13 - Criar estrutura modular
Estrutura alvo:

```text
backend/app/
  routers/
  services/
  core/
  repositories/
  schemas/
```

### Dia 14 - Criar router `auth`
Criar:

- `backend/app/routers/auth.py`
- `backend/app/services/auth_service.py`

Mover:

- login
- logout
- validacao de sessao
- Google auth se estiver junto

Regra:

- router recebe requisicao
- service executa regra de negocio

Commit sugerido:

```bash
git commit -m "refactor(back): extrai rotas e servicos de autenticacao"
```

### Dia 15 - Criar router de usuarios
Criar:

- `backend/app/routers/usuarios.py`
- `backend/app/services/usuario_service.py`

Mover:

- listar usuarios
- criar usuario
- editar usuario
- permissoes

### Dia 16 - Criar router do dominio principal
Criar:

- `backend/app/routers/dados.py`
- `backend/app/services/dado_service.py`

Mover:

- listagem
- criacao
- edicao
- exclusao

### Dia 17 - Criar router de auditoria
Criar:

- `backend/app/routers/auditoria.py`
- `backend/app/services/auditoria_service.py`

Mover:

- registro de eventos
- listagem de logs
- consulta de historico

### Dia 18 - Criar router de importacao/exportacao
Criar:

- `backend/app/routers/importacao.py`
- `backend/app/routers/exportacao.py`
- `backend/app/services/import_service.py`
- `backend/app/services/export_service.py`

### Dia 19 - Criar `core/`
Criar:

- `backend/app/core/security.py`
- `backend/app/core/dependencies.py`
- `backend/app/core/permissions.py`
- `backend/app/core/exceptions.py`

Mover:

- funcoes de seguranca
- dependencias comuns
- checagem de permissao
- excecoes padronizadas

### Dia 20 - Limpar `main.py`
Deixar `main.py` quase so com:

- criacao da app
- middlewares
- `include_router`
- startup/shutdown
- config principal

Meta:

- `main.py` virar arquivo de inicializacao

## Fase 4 - Seguranca e padronizacao
### Dia 21 - Revisao de seguranca
Revisar:

- segredo JWT
- variaveis de ambiente
- CORS
- logs com dados sensiveis
- sanitizacao de entrada
- expiracao de token

Checklist:

- producao nao usa segredo default
- CORS nao esta aberto demais
- logs nao expoem senha ou token
- validacao de entrada esta centralizada

### Dia 22 - Padronizar erros
Frontend:

- erro de autenticacao
- erro de validacao
- erro de rede
- erro interno

Backend:

- handlers para `400`, `401`, `403`, `404`, `500`

Resultado:

- mensagens mais limpas para usuario e debug melhor

### Dia 23 - Padronizar nomes
Revisar:

- nomes de funcoes
- nomes de arquivos
- nomes de variaveis
- nomes de rotas

Regra:

- nome deve dizer exatamente o que faz

## Fase 5 - Testes
### Dia 24 - Base de testes backend
Criar:

- `backend/tests/`
- `test_auth.py`
- `test_usuarios.py`

Primeiro foco:

- login valido
- login invalido
- acesso sem token
- acesso com permissao correta
- acesso com permissao incorreta

### Dia 25 - Testes das rotas principais
Adicionar testes para:

- criar registro
- editar registro
- excluir registro
- importar
- exportar

### Dia 26 - Smoke test manual
Executar o `REFATORACAO_CHECKLIST.md` inteiro e ir marcando:

- login
- logout
- listagem
- filtros
- importacao
- exportacao
- auditoria

## Fase 6 - Limpeza final
### Dia 27 - Organizar scripts e arquivos antigos
Separar:

```text
scripts/dev/
scripts/deploy/
scripts/smoke/
scripts/operacao/
legacy/
backup/
```

### Dia 28 - Documentacao final
Criar ou atualizar:

- `README.md`
- `docs/estrutura.md`
- `docs/fluxo-auth.md`
- `docs/refatoracao.md`

Documentar:

- estrutura de pastas
- fluxo de autenticacao
- como rodar projeto
- como rodar testes
- como publicar e deployar

### Dia 29 - Revisao geral
Tarefas:

- procurar codigo morto
- procurar imports nao usados
- procurar funcoes duplicadas
- revisar `console.log` de debug
- revisar comentarios antigos

### Dia 30 - Fechamento
Tarefas:

- rodar checklist final inteiro

Depois:

```bash
git add .
git commit -m "refactor: finaliza reorganizacao estrutural do projeto"
```

## Rotina diaria
Todo dia, antes de encerrar:

1. Rodar teste rapido
2. Fazer commit pequeno
3. Atualizar checklist

Teste rapido minimo:

- login
- tela principal
- salvar algo
- logout

## Kanban simples
### A fazer
- extrair utilitarios
- criar `client.js`
- criar `authStore`
- criar router `auth`
- criar testes `auth`

### Fazendo
- item do dia atual

### Feito
- tudo concluido com commit

## Ordem mais importante se quiser acelerar
- checkpoint do projeto
- mapear `app.js`
- extrair utilitarios
- criar `api/client.js`
- criar `authStore.js`
- reduzir `innerHTML` mais critico
- criar `routers/auth.py`
- criar `routers/usuarios.py`
- limpar `main.py`
- criar testes de login e permissao

## Resultado esperado no fim
Voce vai sair de:

- arquivo gigante
- logica espalhada
- manutencao dificil

Para:

- frontend modular
- backend por dominio
- autenticacao centralizada
- testes basicos
- projeto profissional e mais seguro

## Checkpoint
Completed:

- branch de refatoracao criada
- checkpoint inicial registrado
- checklist de regressao criado
- quadro de execucao documentado
- mapa do frontend criado
- mapa do backend criado
- base modular inicial do frontend criada

Pending:

- continuar extracao modular do frontend
- criar estrutura de pastas do frontend
- aprofundar centralizacao de auth e API

Blocked:

- nenhum bloqueio tecnico neste ponto

Resume from:

- migrar o proximo bloco do `app.js` para os modulos novos sem alterar comportamento
Concluido neste ciclo:

- [ID-FE-04] utilitarios base de texto, numero e formatacao no arquivo `frontend/js/utils/format.js`
- [ID-FE-05] utilitarios de normalizacao e clones no arquivo `frontend/js/utils/normalize.js`
