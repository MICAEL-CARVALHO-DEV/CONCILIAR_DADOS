# Tipos de Refatoracao no Projeto

## Objetivo
Separar o que e:

- refatoracao pura
- refatoracao com correcao
- refatoracao com evolucao de funcionalidade

Isso evita misturar organizacao de codigo com mudanca de comportamento sem controle.

## Tipo 1 - Refatoracao pura
Definicao:

- organiza o codigo
- separa responsabilidades
- melhora nomes, estrutura e manutencao
- nao deveria mudar a regra de negocio principal

Exemplos:

- quebrar `app.js` em modulos
- centralizar `auth`
- centralizar cliente de API
- mover rotas do backend para `routers/`
- padronizar utilitarios

Regra:

- pode entrar dentro da sprint de refatoracao normalmente

## Tipo 2 - Refatoracao com correcao
Definicao:

- reorganiza o codigo e tambem corrige um bug existente
- a prioridade continua sendo estrutural, mas a correcao entra porque o ponto ja esta sendo tocado

Exemplos:

- modularizar auth e corrigir logout quebrado
- reorganizar lock de emenda e corrigir saida indevida da sessao
- extrair importacao e corrigir leitura errada de coluna
- separar validacao de API e corrigir tratamento incorreto de `401`, `403` ou `409`

Quando fazer agora:

- o bug esta no mesmo fluxo ja aberto pela refatoracao
- a correcao e pequena ou media
- a mudanca e bem entendida
- o impacto e facil de testar

Quando nao fazer agora:

- o bug exige redesenho grande
- a causa ainda nao esta clara
- depende de outra parte ainda nao refatorada
- o risco de quebrar o sistema e alto

Regra operacional:

- se a correcao for pequena, pode entrar junto
- se a correcao for grande, registrar anotacao e tratar depois

Modelo de anotacao para depois:

```md
PENDENCIA DE CORRECAO
Tipo: refatoracao com correcao
Area: <frontend|backend|auth|import|export|auditoria>
Problema: <descricao objetiva>
Impacto: <baixo|medio|alto>
Motivo para adiar: <razao objetiva>
Ponto de retomada: <arquivo, fluxo ou endpoint>
```

## Tipo 3 - Refatoracao com evolucao de funcionalidade
Definicao:

- reorganiza o codigo e aproveita para adicionar ou melhorar funcionalidade
- aqui ja existe mudanca real de comportamento, nao e so limpeza

Exemplos:

- modularizar tabela e adicionar novo filtro
- reorganizar emendas e criar modo leitura mais claro para usuario
- separar backend de auditoria e adicionar relatorio novo
- refatorar import/export e incluir nova logica de validacao funcional

Quando fazer agora:

- a evolucao e pequena
- a funcionalidade nova ja esta muito bem definida
- o custo adicional e baixo
- a entrega nao vai atrasar o bloco principal da refatoracao

Quando nao fazer agora:

- a funcionalidade ainda esta em ideia
- exige regra de negocio nova
- depende de alinhamento com usuario ou area
- aumenta muito o risco da sprint

Regra operacional:

- evolucao funcional nao entra automaticamente na sprint de refatoracao
- se for pequena e muito clara, pode entrar
- se for media ou grande, registrar anotacao e tratar depois

Modelo de anotacao para depois:

```md
PENDENCIA DE EVOLUCAO
Tipo: refatoracao com evolucao
Area: <frontend|backend|auth|import|export|auditoria>
Ideia: <descricao objetiva>
Valor esperado: <ganho operacional>
Motivo para adiar: <razao objetiva>
Dependencias: <nenhuma ou listar>
Ponto de retomada: <arquivo, fluxo ou endpoint>
```

## Regra de decisao rapida
Antes de incluir algo dentro da refatoracao, perguntar:

1. Isso so organiza o codigo?
2. Isso corrige bug junto do fluxo que ja estou abrindo?
3. Isso adiciona comportamento novo?

Decisao:

- se for `1`, entra como refatoracao pura
- se for `2`, entra se for pequeno; se for pesado, anota
- se for `3`, entra so se for pequeno e muito claro; senao, anota

## Regra para este projeto
Durante a refatoracao estrutural atual:

- prioridade maxima: organizacao, modularizacao e centralizacao
- correcoes pequenas no mesmo fluxo podem entrar
- evolucoes pequenas e muito claras podem entrar
- tudo que for medio ou grande vira anotacao para backlog tecnico ou funcional

## Resultado esperado
Essa divisao evita:

- misturar limpeza com escopo novo
- atrasar a refatoracao principal
- perder bug importante no meio da reorganizacao
- esquecer ideia boa que ainda nao e hora de implementar
