# ORQ Refatoracao Frontend Queue

Atualizado em: 2026-03-07

## Objetivo

Usar a IA ORQ para acelerar a reta final da refatoracao do frontend sem criar conflito de arquivo, sem quebrar contrato com backend e sem perder o controle do `app.js`.

## Estado atual

- Branch ativa: `refactor/estrutura-geral`
- Checklist principal: `docs/REFATORACAO_EXECUTION_CHECKLIST.md`
- Etapa atual: `ID-FE-58`
- Situacao: frontend ja esta modular o suficiente para iniciar backend, mas ainda vale fechar os ultimos blocos grandes do `app.js`

## Dono da arquitetura

- ORQ: decide ordem, integra entregas, trava contratos
- Codex: executor principal e integrador final
- Gemini Pro: revisor tecnico e proposta alternativa de estrutura
- QA/Doc: atualiza checklist, mapas e riscos

## Arquivos travados pela ORQ nesta fase

Nao delegar em paralelo sem liberacao explicita:

- `app.js`
- `frontend/js/ui/renderers.js`
- `frontend/js/utils/export*.js`
- `frontend/js/utils/import*.js`
- `index.html`
- `docs/REFATORACAO_EXECUTION_CHECKLIST.md`

Motivo: sao os arquivos centrais da refatoracao atual e qualquer conflito aqui custa mais do que ajuda.

## Como a ORQ deve ajudar de verdade

ORQ nao deve mandar varias IAs alterarem o mesmo arquivo.

ORQ deve fazer isto:

1. escolher um bloco fechado
2. definir arquivos permitidos
3. definir arquivos proibidos
4. exigir criterio de pronto verificavel
5. devolver resposta em formato de entrega curta

## Formato oficial de tarefa

```md
Tarefa:
Objetivo: <resultado esperado>
Arquivos permitidos: <lista objetiva>
Arquivos proibidos: <lista objetiva>
Contrato afetado: <nenhum ou qual>
Criterio de pronto: <como validar>
```

## Formato oficial de entrega

```md
Entrega:
- objetivo atendido
- arquivos tocados
- contrato afetado ou nao
- risco de regressao
- testes executados
- pendencia para integracao
```

## Fila pronta para delegacao

### ORQ-FE-01

- Objetivo: propor a melhor divisao final do restante do `app.js`
- Arquivos permitidos: apenas leitura de `app.js`, `frontend/js/ui/renderers.js`, `frontend/js/utils/*`, `docs/REFATORACAO_EXECUTION_CHECKLIST.md`
- Arquivos proibidos: qualquer escrita
- Contrato afetado: nenhum
- Criterio de pronto: devolver mapa dos proximos 5 blocos com ordem de execucao, risco e arquivos alvo

### ORQ-FE-02

- Objetivo: revisar os blocos restantes do modal e sugerir quebra final segura
- Arquivos permitidos: apenas leitura de `app.js`, `frontend/js/ui/renderers.js`
- Arquivos proibidos: backend, `index.html`, `style.css`
- Contrato afetado: lock de edicao e fluxo de salvamento, somente leitura
- Criterio de pronto: listar o que pode sair para modulo sem tocar regra de negocio

### ORQ-FE-03

- Objetivo: revisar auth/bootstrap do frontend e sugerir modularizacao final
- Arquivos permitidos: apenas leitura de `app.js`, `frontend/js/auth/*`, `frontend/js/api/*`, `login.html`, `cadastro.html`, `index.html`
- Arquivos proibidos: backend
- Contrato afetado: autenticacao frontend
- Criterio de pronto: devolver proposta de extracao com ordem segura

### ORQ-FE-04

- Objetivo: revisar realtime/presenca/websocket e sugerir separacao final
- Arquivos permitidos: apenas leitura de `app.js`, `frontend/js/realtime/*`
- Arquivos proibidos: backend
- Contrato afetado: lock e presenca
- Criterio de pronto: devolver proposta de extracao sem alterar contrato da API

### ORQ-BACK-START-01

- Objetivo: preparar mapa de entrada do backend para a proxima fase
- Arquivos permitidos: apenas leitura de `backend/app/main.py`, `backend/app/services/*`, `backend/app/models.py`, `backend/app/schemas.py`, `backend/MAPA_MAIN.md`
- Arquivos proibidos: frontend
- Contrato afetado: nenhum
- Criterio de pronto: devolver 3 primeiros cortes modulares do backend com ordem recomendada

## Fila bloqueada

Nao delegar ainda:

- qualquer tarefa que mude contrato de auth
- qualquer tarefa que mude payload de import/export
- qualquer tarefa que mexa em `app.js` e `frontend/js/ui/renderers.js` ao mesmo tempo por duas IAs

## Fluxo operacional recomendado

### Passo 1

Rodar ORQ em modo `planejar` ou `revisar` para um bloco especifico.

### Passo 2

Codex revisa a resposta e escolhe:

- aproveitar integralmente
- aproveitar parcial
- descartar

### Passo 3

So depois disso a mudanca real entra no codigo.

## Comandos prontos

### Planejar restante do frontend

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run_ai_workflow.ps1 `
  -UserName "MICAEL_DEV" `
  -Mode "planejar" `
  -Objective "Mapear os proximos blocos fechados para concluir a refatoracao do frontend do projeto conciliardados" `
  -Contexto "Ler docs/ORQ_REFATORACAO_FRONTEND_QUEUE.md, docs/REFATORACAO_EXECUTION_CHECKLIST.md e analisar app.js sem alterar contratos"
```

### Revisar bloco do modal

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run_ai_workflow.ps1 `
  -UserName "MICAEL_DEV" `
  -Mode "revisar" `
  -Objective "Revisar o restante do fluxo de modal em app.js e propor a proxima extracao segura para modulo de UI" `
  -Contexto "Nao alterar backend. Priorizar divisao de UI pura e manter regra de lock/salvamento no app.js"
```

### Preparar entrada do backend

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run_ai_workflow.ps1 `
  -UserName "MICAEL_DEV" `
  -Mode "planejar" `
  -Objective "Definir os tres primeiros cortes modulares do backend para iniciar a refatoracao apos a fase atual do frontend" `
  -Contexto "Ler backend/app/main.py, backend/MAPA_MAIN.md e nao propor quebra de contrato com frontend"
```

## Regra de decisao

Se a ORQ devolver algo generico ou que toque arquivo travado sem criterio de pronto, nao usar.

Se a ORQ devolver:

- bloco fechado
- arquivos claros
- risco claro
- validacao clara

entao vale usar.

## Veredito

A ORQ pode ajudar agora, mas no formato certo:

- planejamento e revisao por bloco
- nunca mudanca paralela no mesmo arquivo central
- Codex continua como integrador final
