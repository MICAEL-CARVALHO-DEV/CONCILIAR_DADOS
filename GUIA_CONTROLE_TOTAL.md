# GUIA CONTROLE TOTAL - Fluxo Operacional

## Objetivo
Garantir que nada passe sem rastreio: anotacao, observacao, alteracao e exportacao.

## Fluxo padrao
1. Usuario faz login individual.
2. Usuario escolhe cenario de trabalho:
   - `LOA ANO/MES`, ou
   - `IMPORT_RAIZ`.
3. Importar arquivo `.xlsx` oficial (somente perfil autorizado).
4. Sistema registra lote/importacao por competencia.
5. Usuario analisa e altera dados necessarios.
6. Cada alteracao gera evento (quem, quando, o que, motivo).
7. Supervisao revisa andamento e pendencias.
8. Exportar `.xlsx` para compartilhamento quando necessario.
9. Registrar entrega no `LOG_ALTERACOES.md`.

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
- Importacao restrita a `PROGRAMADOR` e `SUPERVISAO`.
- Registro de competencia (`ANO/MES`) em toda entrada oficial.
- `IMPORT_RAIZ` preservado como referencia oficial.

## Diretriz de dependencia de Excel/rede
- Excel e formato de troca (entrada/saida), nao base de operacao diaria.
- Operacao da equipe acontece dentro do sistema.
- Rede corporativa guarda arquivo oficial e exportacoes finais.

## Padrao de observacao
Use texto curto e objetivo:
- `contexto`: o que estava pendente
- `acao`: o que foi feito
- `resultado`: como ficou

Exemplo:
- `contexto`: valor divergente na emenda EPI-2026-000321
- `acao`: ajuste de valor_atual de 120000 para 150000
- `resultado`: evento registrado e exportacao concluida
