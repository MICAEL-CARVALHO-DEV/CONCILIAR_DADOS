# PLANO POS-BETA - WORKSPACE BACKEND

Goal: Registrar a fase futura de separacao real por `workspace_id` no backend, a ser iniciada somente depois que todos os checks da beta estiverem encerrados e a beta estiver oficialmente ativa.
Success: A equipe sabe exatamente por que essa etapa foi adiada, quando ela deve comecar e o que precisa mudar no banco, na API e nos scripts.

## Estado atual
- `LOA atual`: protegida no frontend como base oficial em preparacao.
- `Pagina de teste`: isolada no frontend/local apenas para `MICAEL_DEV`.
- `Federal`: placeholder futuro no frontend.
- A separacao atual esta resolvida no uso e na interface, mas ainda nao e uma separacao persistente no backend.

## Decisao oficial
- A separacao completa por `workspace_id` no backend foi adiada de proposito.
- Essa fase so deve comecar depois de:
  1. todos os checks da beta estarem encerrados
  2. a beta estar oficialmente ativa para os usuarios
  3. a necessidade de `TESTE` e `FEDERAL` como bases reais no backend estar confirmada

## Por que adiar agora
- O problema da beta atual ja foi resolvido no frontend:
  - `TESTE` isolada
  - `LOA` protegida
  - `FEDERAL` preparada como futuro
- Fazer `workspace_id` agora abriria uma mudanca grande no dominio principal:
  - `emendas`
  - `audit`
  - `imports`
  - `support`
  - `exports`
  - scripts de smoke/regressao
- O custo e o risco agora seriam altos para um ganho imediato baixo.

## Quando essa fase deve comecar
Iniciar quando pelo menos um destes cenarios acontecer:
- `TESTE` precisar usar backend real e nao so isolamento no frontend
- `FEDERAL` entrar como base operacional de verdade
- varios usuarios precisarem operar em bases diferentes no mesmo ambiente
- surgir necessidade de apagar/arquivar uma base inteira sem tocar na outra

## Escopo da fase futura
### Banco
Criar entidade real de workspace, por exemplo:
- `workspace.id`
- `workspace.nome`
- `workspace.tipo`
- `workspace.ativo`

Adicionar `workspace_id` nas entidades principais:
- `emendas`
- `audit`
- `import_lote`
- `import_linha`
- `support_thread`
- `support_message` se fizer sentido
- `export_logs` se fizer sentido

### API
As rotas devem passar a respeitar o contexto da base:
- carregar dados por `workspace_id`
- importar por `workspace_id`
- exportar por `workspace_id`
- auditar por `workspace_id`
- governar imports por `workspace_id`

### Frontend
O frontend ja esta preparado conceitualmente para:
- escolher base
- mostrar base ativa
- separar `LOA`, `TESTE` e `FEDERAL`

Quando a fase comecar, o front so precisa deixar de ser isolamento local e passar a consumir `workspace_id` real do backend.

### Scripts
Os scripts de smoke/regressao/import precisam ser atualizados para:
- escolher workspace de destino
- gravar em `TESTE` sem contaminar `LOA`
- no futuro, suportar `FEDERAL`

## Regra de rollout recomendada
### Fase 1
- criar tabela de workspace
- migrar `LOA atual` como workspace oficial

### Fase 2
- criar `TESTE` como workspace real
- ajustar scripts de smoke/regressao para `TESTE`

### Fase 3
- ligar imports, audit e suporte ao `workspace_id`

### Fase 4
- habilitar `FEDERAL` quando a regra estiver pronta

## Veredito oficial
- Nao implementar `workspace_id` no backend durante a fase atual da beta.
- Implementar isso como fase futura pos-beta.
- Ate la, manter:
  - `LOA` protegida
  - `TESTE` isolada no frontend
  - `FEDERAL` apenas como placeholder futuro

## Resume from
- Quando todos os checks da beta estiverem encerrados, abrir este documento junto com `CHECK62.md` e `docs/REGRAS_PLANILHAS_TESTE_E_OFICIAL.md` para iniciar a modelagem real de workspaces no backend.
