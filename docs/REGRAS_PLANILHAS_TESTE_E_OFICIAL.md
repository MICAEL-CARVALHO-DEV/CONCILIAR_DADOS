# REGRAS PLANILHAS TESTE E OFICIAL

Goal: Definir a logica oficial para coexistencia de `Planilha TESTE` e `Planilha OFICIAL` no `SEC Emendas`, sem misturar homologacao com operacao real.
Success: A equipe consegue implementar os dois tipos de planilha sem contaminar a base oficial, sem perder rastreabilidade e sem gerar retrabalho conceitual.

## Escopo
- Este documento define a regra de negocio.
- Nao e implementacao de codigo.
- O foco e separar:
  - treino e homologacao
  - operacao oficial
  - governanca da base

## Principio central
- `Planilha TESTE` existe para simular, treinar, homologar e experimentar.
- `Planilha OFICIAL` existe para operar, salvar dados reais, manter historico e sustentar exportacao oficial.

## Regra mestra
- A `Planilha TESTE` nunca contamina a `Planilha OFICIAL`.
- A `Planilha OFICIAL` tem uma `base raiz` tratada como referencia oficial.
- O trabalho operacional acontece sobre a planilha oficial, mas sem permitir destruicao da origem estrutural.

## Definicao dos tipos
### 1. Planilha TESTE
Uso:
- treinamento
- homologacao
- simulacao
- validacao de importacao
- teste de usuarios

Caracteristicas:
- pode ser criada para experimento
- pode ser descartada
- pode ser resetada
- pode ter importacao de teste
- historico existe, mas o contexto e de teste

### 2. Planilha OFICIAL
Uso:
- operacao real
- salvamento oficial
- historico oficial
- exportacao oficial
- leitura executiva

Caracteristicas:
- representa a base de trabalho da empresa
- mantem trilha de auditoria oficial
- recebe importacoes oficiais
- nao deve ser alterada de forma livre em campos estruturais

## Como isso funciona no sistema
### Entrada do usuario
O sistema deve deixar claro em qual contexto o usuario esta:
- `Planilha TESTE`
- `Planilha OFICIAL`

### Indicacao visual obrigatoria
Quando isso for implementado, o layout deve mostrar:
- nome da planilha ativa
- tipo da planilha
- cor ou badge clara de contexto

Exemplo:
- `Voce esta na planilha TESTE`
- `Voce esta na planilha OFICIAL`

## Regra da base raiz
### Na planilha OFICIAL
- a base raiz e a referencia oficial
- campos estruturais nao sao editados livremente pela operacao
- alteracoes operacionais acontecem nos campos permitidos
- correcoes estruturais seguem governanca propria

### Na planilha TESTE
- pode haver maior liberdade
- a alteracao continua auditada
- o contexto precisa ficar marcado como nao oficial

## Relacao com importacao
### Importacao na planilha TESTE
- serve para ensaio
- nao substitui base oficial
- pode ser descartada
- pode ter cadeia de teste sem efeito oficial

### Importacao na planilha OFICIAL
- segue lote oficial
- deve ter responsavel
- deve ter data/hora
- deve ter hash ou identificador de lote
- deve alimentar a cadeia oficial de import

## Regra de salvamento
### Planilha TESTE
- pode salvar normalmente
- o salvamento e valido apenas naquele contexto de teste
- exportacao gerada nela deve sair marcada como teste, se a funcionalidade existir

### Planilha OFICIAL
- salva dados reais
- gera historico oficial
- alimenta dashboard, exportacao e auditoria oficial

## Regra de permissao
### Quem pode usar planilha TESTE
Recomendado:
- `PROGRAMADOR`
- `SUPERVISAO`
- usuarios homologadores autorizados

### Quem pode operar planilha OFICIAL
Conforme perfil ja existente:
- `APG`
- `CONTABIL`
- `SUPERVISAO`
- `POWERBI` em leitura
- `PROGRAMADOR`

## Regra de visualizacao
### Todos devem entender o contexto
Nao basta trocar o nome internamente.

O sistema deve deixar claro:
- onde o usuario esta
- se os dados sao oficiais
- se o que esta vendo e teste ou real

## PrÃ³s dessa separacao
- evita contaminar a base oficial
- permite homologar com seguranca
- permite operar antes de fechar todos os refinamentos
- melhora rollout gradual
- facilita treinamento

## Contras dessa separacao
- aumenta complexidade de navegacao
- pode confundir usuario se a indicacao visual for ruim
- exige regra clara de importacao e permissao
- aumenta a responsabilidade de governanca

## Como reduzir os contras
### Contra: usuario se confundir
Solucao:
- banner/label forte no topo
- cores e nomenclatura diferentes
- confirmacao ao entrar na planilha oficial

### Contra: salvar na planilha errada
Solucao:
- contexto sempre visivel
- nome do tipo de planilha no cabecalho
- logs e export com identificacao do contexto

### Contra: base oficial ser alterada demais
Solucao:
- raiz oficial protegida
- governanca estrutural separada
- import oficial com trilha de lote

## Exemplo 1 - uso correto
Cenario:
- usuario quer treinar importacao e mexer em dados sem risco

Fluxo:
1. entra na `Planilha TESTE`
2. importa arquivo de ensaio
3. altera campos
4. gera historico de teste
5. descarta ou arquiva depois

Resultado:
- nada disso afeta a operacao oficial

## Exemplo 2 - uso oficial
Cenario:
- equipe vai operar em producao controlada

Fluxo:
1. entra na `Planilha OFICIAL`
2. trabalha nas emendas reais
3. salva alteracoes oficiais
4. historico e dashboard passam a refletir esse contexto

Resultado:
- dados ficam oficiais
- exportacoes e auditoria continuam coerentes

## Decisoes minimas antes da implementacao
Estas decisoes precisam ser fechadas antes de codar:

1. o usuario escolhe a planilha ao entrar ou dentro do sistema?
2. existira apenas `1` planilha oficial ativa ou mais de uma?
3. a planilha teste pode nascer como copia da oficial?
4. a importacao oficial cria nova versao/lote ou substitui o lote ativo?
5. quem pode criar e arquivar planilha teste?

## Recomendacao pratica de implementacao
### Fase 1
- criar separacao logica entre `TESTE` e `OFICIAL`
- exibir contexto no layout
- isolar historico e dados por planilha

### Fase 2
- ligar import/export por planilha
- ligar filtros e dashboard por planilha

### Fase 3
- consolidar cadeia oficial de import
- consolidar governanca estrutural
- consolidar exportacao oficial em pasta oficial

### Fase 4 - pos-beta
- implementar separacao real por `workspace_id` no backend
- migrar `LOA atual` para workspace oficial persistente
- transformar `TESTE` em workspace real de homologacao
- ligar `FEDERAL` quando a regra operacional estiver pronta
- referencia oficial: `docs/plano_pos_beta_workspace_backend.md`

## Relacao com itens do mapa mestre
- `C19-A`: cadeia oficial de import
- `C25-B`: governanca de campos estruturais
- `C27`: persistencia oficial de export
- `C49-A`: contagem de deputado por planilha/import, se a regra assim exigir

## Veredito oficial
- E viavel criar `Planilha TESTE` e `Planilha OFICIAL` antes de fechar todas as pendencias.
- Isso nao deve ser feito sem regra minima.
- O caminho correto e:
  - separar contexto
  - proteger a oficial
  - permitir teste isolado
  - manter rastreabilidade por planilha
- A separacao completa de dados por `workspace_id` no backend fica adiada para a fase pos-beta.

## Resume from
- Antes de implementar essa logica, abrir este documento junto com `check62.md` e fechar as 5 decisoes minimas listadas aqui.


