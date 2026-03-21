# POLITICA OPERACIONAL DA BETA

Goal: fechar de forma objetiva as regras operacionais que ainda apareciam ambiguas no mapa da beta.
Success: `C03`, `C04`, `C18` e `C27` passam a ter leitura unica, sem conflito entre checklist, mapa e operacao real.

## Escopo

Esta politica vale para a beta oficial atual do `CONCILIAR_DADOS` com:
- backend publico em producao
- base oficial consolidada unica
- importacao `backend-first`
- exportacao operacional via front com trilha em `export_logs`

## C03 - Regra oficial de versao de arquivo importado

Regra oficial:
- a versao oficial de uma importacao e identificada pelo conjunto `arquivo_hash + created_at + usuario responsavel + lote_id`
- `arquivo_nome` continua visivel para operacao, mas nao e a chave canonica de versao
- se o hash do arquivo recebido for igual ao hash do ultimo lote ativo, o sistema nao cria nova versao aplicada
- se o hash mudar, nasce um novo lote de importacao com sua propria trilha

Leitura pratica:
- renomear o arquivo sem mudar o conteudo nao cria nova versao oficial
- mudar o conteudo e gerar hash novo cria nova versao oficial
- a trilha por aba/linha continua no detalhe do lote e das `import_linhas`

## C04 - Politica de retencao publicada

Regra oficial da beta:
- durante a beta nao existe purga manual de `historico`, `lotes_importacao`, `import_linhas`, `import_governanca_logs` ou `export_logs`
- a retencao minima operacional da trilha oficial e de `5 anos`
- a mesma janela minima de `5 anos` vale para a pasta oficial de export gerida pela operacao
- revisao da politica: anual

Responsaveis:
- dono funcional da regra: `PROGRAMADOR`
- dono operacional da guarda da pasta oficial: operacao responsavel pela exportacao
- dono de infraestrutura/backup definitivo: `TI`, quando o bloco `R07` entrar

## C18 - Politica append-only homologada

Regra oficial:
- `historico` e append-only: nao se apaga nem se reescreve passado para "corrigir" trilha
- correcao operacional gera novo evento, nao edicao retroativa do evento antigo
- lote de importacao nao e apagado fisicamente para esconder passado; governanca muda o estado logico (`APLICADO`, `CORRIGIDO`, `REMOVIDO`) e registra log proprio
- `import_governanca_logs` e append-only
- `export_logs` e append-only

Leitura pratica:
- "remover" lote na beta significa remocao logica/governada, com motivo e trilha
- a historizacao do que aconteceu continua acessivel para auditoria

## C27 - Regra oficial de export em pasta oficial

Regra oficial:
- o export oficial parte sempre do estado consolidado atual da base
- quando existir `template` oficial importado, `template mode` e o padrao
- sem `template`, o export segue pelo layout atual com headers originais/reforcados
- o arquivo binario do export nao fica persistido no backend da API nesta beta
- a persistencia oficial do arquivo acontece na pasta oficial controlada pela operacao apos o download
- o backend registra a trilha do export em `export_logs` com `arquivo_nome`, usuario, escopo, formato, filtros e horario

Leitura pratica:
- o backend guarda a prova do export
- a operacao guarda o arquivo oficial baixado
- a persistencia server-side do binario fica fora da beta e entra so se reabrir em `R07/R08`

## Relacao com o comportamento real do sistema

Base atual observada:
- `lotes_importacao` guarda `arquivo_nome`, `arquivo_hash`, autor, setor e `created_at`
- hash repetido do ultimo lote ativo bloqueia nova aplicacao redundante
- governanca de import usa status logico e log dedicado
- `export_logs` guarda a trilha do export, nao o binario

## Fonte canonica

Depois deste corte:
- politica viva: `docs/politica_operacional_beta.md`
- prioridade unica: `PLANO_MESTRE_UNIFICADO.md`
- pendencias canonicas da beta: `checks/@deve_de_casa_beta.md`
- mapa historico: `anotacoes/documentacao_raiz/check62.md`
