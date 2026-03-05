# GUIA TRELLO + NOTION (OPERACAO SEM RETRABALHO)

Data de atualizacao: 2026-03-04
Objetivo: usar Trello e Notion juntos com papeis claros, sem duplicacao inutil.

## 1. Regra de ouro
- Trello = execucao (status das tarefas)
- Notion = conhecimento (decisoes, contexto, evidencia)

Se os dois fizerem a mesma coisa, voce perde tempo.

## 2. Estrutura recomendada no Trello
Listas:
1. Backlog
2. Prioridade da semana
3. Em execucao
4. Em validacao
5. Concluido
6. Bloqueado

Template de cartao:
- Titulo objetivo
- Contexto curto
- Criterio de aceite
- Risco (seguranca/LGPD/operacional)
- Evidencia esperada (print, log, link)
- Link Notion da tarefa

Labels:
- P0 Critico
- P1 Alto
- P2 Medio
- Front
- Back
- Infra
- Dados
- Seguranca

## 3. Estrutura recomendada no Notion
Crie 3 bases:

### Base A - Arquitetura e decisoes
Campos:
- Data
- Decisao
- Impacto
- Risco
- Alternativas
- Status

### Base B - Diario tecnico
Campos:
- Data
- O que foi feito
- O que quebrou
- Causa raiz
- Correcao
- Proximo passo

### Base C - Manual para chefia
Campos:
- Tema
- Problema
- Solucao
- Resultado
- Indicador
- Evidencia

## 4. Fluxo diario (Trello x Notion)
1. Planejar dia no Trello (max 3 cards em execucao)
2. Executar card
3. Registrar decisao e evidencia no Notion
4. Voltar no Trello e mover card para validacao/concluido
5. Fechar dia com 1 resumo tecnico no Notion

## 5. Fluxo semanal
Segunda:
- Revisar backlog
- Escolher prioridades da semana (P0/P1)

Sexta:
- Revisao de resultados
- Atualizar indicadores
- Preparar pauta para chefia

## 6. Indicadores que voce deve acompanhar
- Cards concluidos por semana
- Bugs reabertos
- Tempo medio de resolucao
- Itens P0 pendentes
- Mudancas com evidencia completa

## 7. Integracao pratica entre os dois
No card do Trello:
- campo `Notion URL`

Na pagina do Notion:
- campo `Trello Card URL`

Assim voce navega em 1 clique entre execucao e contexto.

## 8. Quando usar cada ferramenta
Use Trello quando:
- precisa ver andamento rapido
- precisa priorizar e delegar

Use Notion quando:
- precisa explicar decisao
- precisa manter historico tecnico
- precisa preparar material para gestao

## 9. Anti-caos (nao fazer)
- Nao manter checklist duplicado em 2 lugares
- Nao abrir card sem criterio de aceite
- Nao fechar card sem evidencia
- Nao misturar estudo pessoal com tarefa critica de producao

## 10. Modelo de rotina profissional (simples)
- 20 min: planejar Trello
- 90 min: bloco tecnico 1
- 20 min: atualizar Notion
- 90 min: bloco tecnico 2
- 20 min: validacao + fechamento
