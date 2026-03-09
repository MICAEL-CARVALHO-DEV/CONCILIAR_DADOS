# FLUXO CORRECAO ESTRUTURAL

Goal: Definir como o sistema deve tratar erros em campos estruturais sem liberar edicao comum para toda a operacao.
Success: A beta protege os campos-base da emenda no fluxo operacional e tem uma trilha clara para correcao oficial agora e no futuro.

## Escopo
Campos estruturais atuais:
- `identificacao`
- `deputado`
- `cod_acao`
- `descricao_acao`

Campo pendente de decisao:
- `objetivo_epi`

## Regra oficial da beta
No fluxo operacional da beta, campos estruturais:
- ficam travados no modal
- nao sao alterados por `APG`, `CONTABIL`, `SUPERVISAO` ou `POWERBI`
- so podem ser corrigidos por trilha oficial

Mensagem recomendada ao usuario:
- `Campo estrutural controlado pela base oficial.`

## Fluxo atual da beta
### 1. Operacao comum
Perfis:
- `APG`
- `CONTABIL`
- `SUPERVISAO`
- `POWERBI`

Comportamento:
- o usuario abre a emenda
- visualiza o campo estrutural
- nao consegue editar no modal operacional

Se encontrar erro:
- registra a necessidade de correcao
- a correcao segue por trilha oficial, nao pelo modal operacional

### 2. Correcao oficial na beta
Responsavel atual:
- `PROGRAMADOR`

Forma de correcao:
- ajuste controlado por rotina tecnica ou administrativa
- preferencialmente por:
  - reimport oficial, quando o erro vier da base/arquivo
  - correcao administrativa controlada, quando o erro for isolado

### 3. Auditoria esperada
Sempre que houver correcao estrutural oficial, a trilha deve registrar:
- quem corrigiu
- campo alterado
- valor anterior
- valor novo
- motivo da correcao

Tipo recomendado de evento futuro:
- `STRUCTURAL_FIX`

## Fluxo futuro recomendado
### Etapa 1. Solicitacao
Perfis operacionais podem abrir uma solicitacao de correcao estrutural com:
- emenda
- campo
- valor atual
- valor sugerido
- motivo

### Etapa 2. Fila de analise
Painel futuro:
- `Correcoes estruturais`

Status sugeridos:
- `Aberta`
- `Em analise`
- `Aprovada`
- `Rejeitada`
- `Aplicada`

### Etapa 3. Aplicacao
Responsavel:
- `PROGRAMADOR`
- no futuro, possivel `ADMIN_DADOS`

Formas de aplicacao:
- correcao manual controlada, quando o caso for isolado
- reimport oficial, quando o erro vier em lote

## Exemplo no sistema atual
Caso:
- `deputado` veio incorreto em uma emenda

Hoje:
- usuario identifica o erro
- nao corrige no modal
- comunica para correcao oficial
- a correcao e aplicada por voce ou por reimport oficial

## Exemplo no sistema futuro
Caso:
- `cod_acao` errado em um registro

Futuro:
- usuario abre solicitacao
- admin analisa
- corrige o valor oficialmente
- sistema grava evento `STRUCTURAL_FIX`

## Beneficios
- protege o dado-base da emenda
- evita edicao acidental ou conflitante
- separa operacao de governanca de dados
- reduz retrabalho no historico operacional
- prepara o sistema para escalar com mais usuarios

## Contras controlados
### Contra 1. Correcao fica mais lenta
Mitigacao:
- manter trilha oficial simples na beta
- usar reimport quando o erro vier em lote

### Contra 2. Usuario pode sentir que nao consegue corrigir nada
Mitigacao:
- mensagem clara no modal
- explicar que o campo e controlado pela base oficial

### Contra 3. Sem painel admin, a correcao ainda depende de voce
Mitigacao:
- aceitar isso na beta
- promover painel de correcoes estruturais depois

## Decisao atual registrada
- campos estruturais permanecem travados no fluxo operacional
- correcao estrutural nao entra no modal operacional
- trilha futura aprovada: `solicitacao -> analise -> correcao oficial`
- `objetivo_epi` continua pendente ate formalizacao funcional

## Relacao com os checks
- `CHECK62.md` -> `C25-B`
- `CHECKUSER.md` -> `C25-B`
- `checks/CHECK_PENDENCIAS_BETA_SEC.md` -> `P-R05`

## Resume from
- Proxima decisao funcional: definir se `objetivo_epi` entra no schema e qual natureza ele tera (`estrutural` ou `operacional`).
