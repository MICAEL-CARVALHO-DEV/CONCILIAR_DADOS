# @DEVE DE CASA - FORMULARIOS BETA SEC

Goal: Dar ao usuario um roteiro pronto para a reuniao da empresa, com perguntas objetivas, prós, contras, mitigacao e campo de resposta para fechar as decisoes funcionais da beta.
Success: Ao final da reuniao, as respostas saem registradas de forma clara e podem ser convertidas diretamente em decisao de sistema.

## Como usar este arquivo
- Levar este arquivo para a reuniao.
- Ler cada bloco em ordem.
- Marcar a opcao escolhida.
- Preencher a decisao final.
- Depois refletir a resposta em:
  - `@DEVE_DE_CASA_BETA.md`
  - `CHECK_PENDENCIAS_BETA_SEC.md`
  - item correspondente no `CHECK62.md`

## Ordem recomendada da reuniao
1. `P-R02` cadeia oficial de import
2. `TESTE x OFICIAL`
3. `P-R03` contagem de deputado
4. `P-R01` `Status_2`
5. `P-R05` `objetivo_epi`
6. `P-R06` servidor interno + Power BI externo

---

## FORM 01 - `P-R02` cadeia oficial de import
### Pergunta central
Como a empresa quer que a cadeia oficial de import funcione?

### Melhor caminho recomendado
- manter `base atual consolidada`
- cada import vira `lote rastreavel`
- o usuario opera na base atual, nao em camadas soltas
- o historico tecnico guarda a trilha `raiz -> import2 -> import3`

### Pros
- evita confusao operacional
- mantem rastreabilidade
- simplifica a tela para APG e CONTABIL
- facilita auditoria

### Contras
- menos liberdade para navegar em importacoes antigas como se fossem bases separadas
- exige consolidacao correta no backend

### Solucao para os contras
- mostrar no sistema:
  - `base atual`
  - `lote/origem`
  - `historico de import`
- manter as camadas antigas para auditoria, sem expor toda a complexidade na operacao

### Exemplo A
- `Import 1` cria a base
- `Import 2` atualiza dados
- usuario continua trabalhando na base atual
- a emenda mostra: `Origem atual: Import 2`

### Exemplo B
- tela mostra:
  - `Base atual consolidada`
  - `Historico: Import 1 > Import 2 > Import 3`
- sem deixar o usuario escolher camada errada para editar

### Formulario de resposta
- Decisao escolhida:
- O usuario opera na base atual consolidada? `SIM / NAO`
- Cada import vira lote rastreavel? `SIM / NAO`
- Historico oficial fica por: `LOTE / EMENDA / AMBOS`
- Observacao final:

---

## FORM 02 - `TESTE x OFICIAL`
### Pergunta central
Como a empresa quer separar homologacao de operacao real?

### Melhor caminho recomendado
- `1` planilha `OFICIAL` ativa
- `N` planilhas `TESTE`
- planilha `TESTE` pode nascer como copia da `OFICIAL`
- somente perfis autorizados criam/arquivam `TESTE`

### Pros
- protege a operacao real
- facilita treinamento
- permite homologar sem contaminar a base oficial
- ajuda rollout controlado

### Contras
- aumenta complexidade de navegacao
- usuario pode confundir teste com oficial

### Solucao para os contras
- banner forte no topo
- badge clara:
  - `PLANILHA TESTE`
  - `PLANILHA OFICIAL`
- cor visual diferente
- confirmacao ao entrar na oficial

### Exemplo A
- `APG_BETA_01` entra na `Planilha TESTE`
- importa arquivo de ensaio
- treina sem risco

### Exemplo B
- equipe entra na `Planilha OFICIAL`
- salva dados reais
- historico, dashboard e export usam esse contexto

### Formulario de resposta
- Existira apenas `1` planilha oficial ativa? `SIM / NAO`
- Planilha teste pode nascer como copia da oficial? `SIM / NAO`
- Quem pode criar planilha teste?
- Quem pode arquivar planilha teste?
- Observacao final:

---

## FORM 03 - `P-R03` contagem de deputado
### Pergunta central
De onde nasce a contagem oficial de deputado e como o ajuste manual funciona?

### Melhor caminho recomendado
- contagem nasce da `base atual consolidada`
- ajuste manual vale por `planilha/import`
- ajuste manual com auditoria
- `SUPERVISAO` monitora
- `PROGRAMADOR` ajusta

### Pros
- numero fica coerente com a operacao atual
- evita inflar com historico antigo
- permite corrigir inconsistencias sem baguncar a base toda

### Contras
- override manual pode gerar divergencia se nao tiver trilha
- a discussao pode travar se misturar historico com base atual

### Solucao para os contras
- separar:
  - `valor calculado`
  - `valor ajustado`
- registrar:
  - usuario
  - motivo
  - data/hora
  - escopo do ajuste

### Exemplo A
- sistema calculou `13`
- validacao oficial diz `14`
- admin ajusta no `Import 5`
- trilha salva: `13 -> 14`

### Exemplo B
- dashboard mostra:
  - `automatico: 71`
  - `ajustado: 72`
  - `motivo: 1 emenda validada fora do lote anterior`

### Formulario de resposta
- A contagem oficial nasce da: `BASE ATUAL / HISTORICO / OUTRO`
- O ajuste manual vale por: `PLANILHA / IMPORT / GLOBAL`
- Quem pode ajustar?
- Quem pode somente monitorar?
- Observacao final:

---

## FORM 04 - `P-R01` `Status_2`
### Pergunta central
`Status_2` vai existir no sistema beta ou sera removido da operacao?

### Decisao tomada
- `Status_2` nao entra no sistema beta
- a coluna foi tratada como erro/duplicidade de uso no Excel
- o import deve tolerar colunas extras sem perder os dados validos
- `status_oficial` continua sendo o unico status oficial da operacao

### Melhor caminho recomendado
- se nao houver funcao clara e diferente do `status_oficial`, remover da beta

### Pros
- simplifica a operacao
- reduz duplicidade
- evita conflito entre dois status
- limpa import/export e dashboard

### Contras
- se a empresa realmente precisar de um detalhe extra, o modelo fica curto

### Solucao para os contras
- usar `motivo/observacao` como complemento no curto prazo
- so criar `Status_2` se houver papel claro:
  - `status principal = andamento oficial`
  - `status_2 = detalhe complementar`

### Exemplo A
- decisao: `nao usar`
- sistema fica com:
  - `status_oficial`
  - `motivo`

### Exemplo B
- decisao: `usar`
- `Status = Em analise`
- `Status_2 = Aguardando documento`

### Formulario de resposta
- `Status_2` vai existir? `NAO`
- Motivo aprovado: `coluna indevida/duplicada criada no Excel`
- Regra de import: `tolerar coluna extra sem perder dados validos`
- Substitui `status_oficial`? `NAO`
- Observacao final:

---

## FORM 05 - `P-R05` `objetivo_epi`
### Pergunta central
O campo `objetivo_epi` vai entrar no sistema e, se entrar, qual o papel dele?

### Melhor caminho recomendado
- so criar se a origem estiver clara
- se vier da base/import, tratar como `estrutural`
- se for texto de trabalho da equipe, criar campo operacional separado

### Pros
- melhora leitura da emenda
- pode enriquecer dashboard e historico
- ajuda supervisao e power bi

### Contras
- sem origem clara, vira retrabalho
- se misturar estrutural com operacional, bagunca governanca

### Solucao para os contras
- decidir primeiro a origem
- nao liberar edicao operacional se ele for estrutural
- separar `objetivo_epi` de `observacao da equipe`

### Exemplo A
- vem da planilha base
- entra como estrutural
- aparece travado no modal

### Exemplo B
- empresa quer texto livre de interpretacao
- nao usa `objetivo_epi`
- cria campo operacional de observacao

### Formulario de resposta
- `objetivo_epi` vai entrar? `SIM / NAO`
- Origem: `IMPORT / MANUAL / AMBOS`
- Tipo: `ESTRUTURAL / OPERACIONAL`
- Se nao entrar, qual campo cobre essa necessidade?
- Observacao final:

---

## FORM 06 - `P-R06` servidor interno e Power BI externo
### Pergunta central
Quando a empresa quer discutir migracao de infraestrutura e leitura externa do Power BI?

### Melhor caminho recomendado
- manter nuvem como baseline da beta
- tratar migracao interna depois
- separar:
  - `fase da migracao`
  - `fase da leitura do Power BI`

### Pros
- evita desviar foco da beta
- reduz retrabalho de arquitetura
- permite conversar com TI e BI com clareza

### Contras
- adiar essa decisao pode deixar expectativa aberta
- BI pode querer leitura direta cedo demais

### Solucao para os contras
- responder com fase planejada
- definir se o BI vai:
  - ler da nuvem primeiro
  - ou esperar servidor interno
- manter regra: migracao de infra nao muda regra de negocio

### Exemplo A
- beta segue em nuvem
- Power BI le do banco em nuvem com usuario de leitura controlado
- servidor interno fica para fase 2

### Exemplo B
- beta segue em nuvem
- Power BI externo ainda nao le direto
- so depois da TI homologar o ambiente interno

### Formulario de resposta
- Servidor interno entra em qual fase?
- Power BI externo vai ler da nuvem? `SIM / NAO`
- Se nao, em qual fase vai ler?
- Havera convivencia entre nuvem e interno? `SIM / NAO`
- Observacao final:

---

## Fechamento da reuniao
### Se sairem respondidos
- `P-R02`
- `TESTE x OFICIAL`
- `P-R03`
- `P-R01`
- `P-R05`
- `P-R06`

### O beta fica muito mais perto de fechar
Depois disso, sobra principalmente:
- validar `C48`
- validar `C49`
- validar `C50-A`
- executar o que for decidido nos formularios

## Resume from
- Levar este arquivo para a reuniao e preencher na ordem proposta.
