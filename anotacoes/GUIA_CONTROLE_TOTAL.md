# GUIA CONTROLE TOTAL - Fluxo Operacional

## Objetivo
Garantir que nada passe sem rastreio: anotacao, observacao, alteracao e exportacao.

## Fluxo padrao
1. Importar arquivo `.xlsx` oficial.
2. Sistema registra lote/importacao.
3. Usuario analisa e altera dados necessarios.
4. Cada alteracao gera evento (quem, quando, o que, motivo).
5. Supervisao revisa andamento e pendencias.
6. Exportar `.xlsx` para compartilhamento.
7. Registrar entrega no `LOG_ALTERACOES.md`.

## O que sempre registrar
- Arquivo de origem.
- Usuario responsavel.
- Data/hora.
- Motivo da mudanca.
- Resultado (ok/erro).

## Controles obrigatorios
- Login individual (sem conta compartilhada).
- Historico append-only (sem apagar passado).
- Revisao por perfil quando necessario.
- Validacao antes de exportar.

## Padrao de observacao
Use texto curto e objetivo:
- `contexto`: o que estava pendente
- `acao`: o que foi feito
- `resultado`: como ficou

Exemplo:
- `contexto`: valor divergente na emenda EPI-2026-000321
- `acao`: ajuste de valor_atual de 120000 para 150000
- `resultado`: evento registrado e exportacao concluida
