# README MANUTENCAO - SEC Emendas

Data base: 2026-02-24

## Objetivo
Padronizar manutencao para nao perder controle do sistema.

## Rotina diaria (10-20 min)
1. Subir sistema (`scripts/start_tudo.ps1`).
2. Validar API (`/health`).
3. Fazer login com usuario proprio.
4. Conferir se importacao/exportacao `.xlsx` esta operando.
5. Registrar alteracoes no `LOG_ALTERACOES.md`.

## Rotina semanal (30-60 min)
1. Rodar smoke test (`scripts/smoke_e2e.ps1`).
2. Revisar erros de importacao e ajustes pendentes.
3. Conferir checklist de fase (`CHECKLIST_PROXIMA_FASE.md`).
4. Atualizar plano de etapas (`PLANO_ETAPAS_62_ITENS.md`).

## Rotina mensal (1-2h)
1. Revisar permissoes e usuarios ativos.
2. Validar restauracao de backup (quando banco central estiver em uso).
3. Revisar riscos no `TERMO_DE_OPERACAO_E_RESPONSABILIDADES.md`.
4. Fechar relatorio de evolucao (`RELATORIO_PLANO_EVOLUCAO.md`).

## Regras de manutencao
- Nao codar direto em producao.
- Toda mudanca deve ter teste rapido e rollback.
- Nao misturar dados demo com dados oficiais.
- Padrao operacional atual: somente `.xlsx`.

## Checklist de release rapido
1. `git status` limpo.
2. Teste login/cadastro.
3. Teste importar `.xlsx` real.
4. Teste alterar 1 campo e gravar evento.
5. Teste exportar `.xlsx`.
6. Atualizar `LOG_ALTERACOES.md`.

## Quando escalar para TI
- Falha recorrente de autenticacao.
- Erro de banco/migracao.
- Indicio de perda de historico.
- Queda de disponibilidade em horario operacional.
