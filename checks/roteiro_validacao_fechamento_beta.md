# ROTEIRO VALIDACAO - FECHAMENTO DA BETA

CHECKLIST
Goal: validar manualmente a beta em ordem segura, sem perder contexto entre decisao funcional, teste de navegador, exportacao e validacao publicada.
Success: todas as validacoes bloqueadoras ficam com veredito claro (`PASSOU` ou `FALHOU`) e sobra apenas o que for pos-beta.

## Regras
- usar este roteiro na base oficial
- validar primeiro localmente
- validar no ambiente publicado so depois do local passar
- registrar qualquer falha com:
  - tela
  - usuario/perfil
  - passo
  - resultado esperado
  - resultado atual
- nao misturar ajuste visual com decisao funcional aberta

## Pre-flight
- [TODO] confirmar que a base testada e `C:/Users/micae/OneDrive/Area de Trabalho/conciliardados`
- [TODO] confirmar que o backend local sobe sem erro
- [TODO] confirmar que o front abre sem erro critico no console
- [TODO] confirmar usuario de teste comum
- [TODO] confirmar usuario `PROGRAMADOR`

## Bloco 1 - Decisao final antes do carimbo
- [DONE] `C49-A` regra final da contagem de deputado fechada
  Regra oficial aprovada:
  - origem = `BASE_ATUAL` consolidada
  - ajuste = global com auditoria
  - permissao de ajuste = `PROGRAMADOR`
  - usuarios operacionais = visualizacao liberada

## Bloco 2 - Validacao manual local

### 1. Login, sessao e perfil
- [TODO] entrar com usuario comum
- [TODO] entrar com `PROGRAMADOR`
- [TODO] confirmar que perfil, nome e sessao aparecem sem erro
Veredito:
- `PASSOU / FALHOU`

### 2. Operacao principal
- [TODO] abrir `index.html`
- [TODO] testar `statusFilter`
- [TODO] testar `yearFilter`
- [TODO] testar `searchInput`
- [TODO] confirmar que a tabela abre, filtra e nao quebra
- [TODO] confirmar que `Objetivo EPI` aparece como eixo principal no fluxo operacional
- [TODO] confirmar que `Planilha1` aparece como reflexo operacional no resumo/importacao
Veredito:
- `PASSOU / FALHOU`

### 3. Modal da emenda
- [TODO] abrir um registro
- [TODO] editar um campo permitido
- [TODO] salvar
- [TODO] fechar
- [TODO] reabrir e confirmar persistencia
- [TODO] verificar no console se existe warning real relevante de acessibilidade
Regra:
- warning tecnico de devtools nao precisa ser mantido de proposito
- o que importa e nao haver regressao funcional nem alerta de acessibilidade relevante
Veredito:
- `PASSOU / FALHOU`

### 4. Historico operacional (`C48`)
- [TODO] abrir `Historico operacional`
- [TODO] testar filtro por `Ano`
- [TODO] testar filtro por `Mes`
- [TODO] testar filtro por `Usuario`
- [TODO] testar filtro por `Perfil`
- [TODO] testar filtro por `Tipo de evento`
- [TODO] testar filtro por `Origem`
- [TODO] testar filtro por `Objetivo EPI`
- [TODO] testar busca textual livre
- [TODO] confirmar que a lista nao quebra visualmente
Veredito:
- `PASSOU / FALHOU`

### 5. Importacao XLSX
- [TODO] importar um `.xlsx`
- [TODO] confirmar que o resumo de importacao aparece
- [TODO] confirmar que `Planilha1 (Reflexo)` aparece
- [TODO] confirmar que a importacao gera reflexo sem quebrar a planilha principal
Veredito:
- `PASSOU / FALHOU`

### 6. Exportacao (`C27` e `C49`)
- [TODO] exportar `Atuais`
- [TODO] exportar `Com historico`
- [TODO] se houver template importado, confirmar que o export entrou em `template mode`
- [TODO] abrir o arquivo no Excel
- [TODO] confirmar abas
- [TODO] confirmar cabecalho azul forte com fonte branca
- [TODO] confirmar conteudo centralizado
- [TODO] confirmar quebra de texto
- [TODO] confirmar largura de colunas melhorada
- [TODO] confirmar leitura util do arquivo final
Veredito:
- `PASSOU / FALHOU`

### 7. Ajuda e suporte (`C50-A`)
- [TODO] com usuario comum, abrir `Ajuda e suporte`
- [TODO] confirmar que so existe fluxo de solicitar
- [TODO] abrir um chamado
- [TODO] confirmar que usuario comum nao ve historico completo
- [TODO] com `PROGRAMADOR`, abrir `Ajuda e suporte`
- [TODO] confirmar historico completo
- [TODO] responder chamado
- [TODO] alterar status
Veredito:
- `PASSOU / FALHOU`

### 8. Power BI (`C45-A`)
- [TODO] abrir `Visao Power BI`
- [TODO] confirmar modo leitura
- [TODO] confirmar que nao ha acao de edicao
- [TODO] confirmar que a leitura conversa com dados do sistema
- [TODO] confirmar que `Objetivo EPI` participa da leitura operacional/analitica
Veredito:
- `PASSOU / FALHOU`

## Bloco 3 - Smoke tecnico local
- [DONE] rodar `node --check app.js`
- [DONE] rodar `powershell -ExecutionPolicy Bypass -File .\\scripts\\smoke_summary_local.ps1`
- [DONE] confirmar sem regressao estrutural
Veredito:
- `PASSOU`

## Bloco 4 - Validacao no ambiente publicado
- [TODO] login
- [TODO] operacao principal
- [TODO] modal
- [TODO] historico
- [TODO] suporte
- [TODO] exportacao
- [TODO] power bi
- [TODO] confirmar sem erro critico no console
Veredito:
- `PASSOU / FALHOU`

## Criterio de fechamento
Beta pode receber carimbo quando:
- `C49-A` estiver decidido
- `Historico` estiver `PASSOU`
- `Exportacao` estiver `PASSOU`
- `Suporte` estiver `PASSOU`
- `Power BI` estiver `PASSOU`
- `Smoke tecnico local` estiver `PASSOU`
- `Ambiente publicado` estiver `PASSOU`

## Resultado final
- `C49-A`: `FECHADO`
- `Operacao principal`: `PASSOU`
- `Modal`: `PASSOU` (`aria-hidden` sem regressao no hardening de foco)
- `Historico`: `PASSOU` (`C48`)
- `Importacao`: `PASSOU`
- `Exportacao`: `PASSOU` (`C49`)
- `Suporte`: `PASSOU` (`C50-A`)
- `Power BI`: `PASSOU` (`C45-A`)
- `Smoke local`: `PASSOU`
- `Publicado`: `PASSOU / FALHOU`

CHECKPOINT
Completed:
- roteiro de validacao montado
- smoke tecnico local executado com veredito `PASSOU`

Pending:
- executar validacao manual

Blocked:
- beta nao fecha sem veredito `PASSOU` nos blocos manuais e no ambiente publicado

Resume from:
- comecar por `Historico operacional`, `Exportacao`, `Suporte`, warning `aria-hidden` e `Power BI`
