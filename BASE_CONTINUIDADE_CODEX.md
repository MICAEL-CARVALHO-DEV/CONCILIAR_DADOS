# BASE CONTINUIDADE CODEX (HANDOFF)

Data de referencia: 2026-02-24
Projeto: CONCILIAR_DADOS
Branch padrao: main

## Objetivo deste arquivo
Permitir que qualquer nova conta do Codex continue o projeto sem perder contexto, historico de decisoes e prioridade de execucao.

## Estado atual (snapshot)
- Stack: Front (HTML/CSS/JS), Backend (FastAPI), DB local (SQLite) ou corporativo (PostgreSQL)
- Fluxo operacional atual: importar `.xlsx` -> processar -> registrar eventos -> exportar `.xlsx`
- Script 1-clique: `scripts/start_tudo.ps1`
- Checklist 62 itens: consolidado e priorizado em `CHECKLIST_PROXIMA_FASE_ATUALIZADO.md`

## Ordem de leitura obrigatoria para novo Codex
1. `README.md`
2. `DECISOES_IMPORT_EXPORT_XLSX.md`
3. `CHECKLIST_PROXIMA_FASE_ATUALIZADO.md`
4. `PLANO_ETAPAS_62_ITENS.md`
5. `README_MANUTENCAO.md`
6. `TERMO_DE_OPERACAO_E_RESPONSABILIDADES.md`
7. `ESCOPO_FLUXO_COMPARATIVO_SEC_EMENDAS.md`
8. `LOG_ALTERACOES.md`

## Verdades do projeto (nao quebrar)
- Nao misturar dados demo com dados oficiais.
- Operacao principal com `.xlsx`.
- Historico deve ser auditavel (usuario, data/hora, acao, motivo).
- Banco e a fonte oficial; planilha e formato de troca.

## Comandos padrao (ambiente local)
Subir tudo:
```powershell
cd "C:\Users\micae\OneDrive\Area de Trabalho\conciliardados"
powershell -ExecutionPolicy Bypass -File .\scripts\start_tudo.ps1
```

Subir separado:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start_api.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\start_front.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\smoke_e2e.ps1
```

## Como trabalhar sem perder linha do tempo
1. Toda mudanca relevante: atualizar `LOG_ALTERACOES.md`.
2. Toda decisao de regra: atualizar `DECISOES_IMPORT_EXPORT_XLSX.md`.
3. Toda prioridade: atualizar `CHECKLIST_PROXIMA_FASE_ATUALIZADO.md`.
4. Commit com mensagem objetiva e push na `main` (ou branch de feature).

## Proximo alvo recomendado
Fechar P0 pendente no checklist:
- C03, C04, C09, C18, C25, C27, C30, C31, C33, C34.

## Publicacao e continuidade entre contas
- Repositorio remoto (origin) guarda o historico completo.
- Qualquer conta nova do Codex deve clonar o repo e seguir este arquivo.
- Em reuniao com TI, usar tambem:
  - `TERMO_DE_OPERACAO_E_RESPONSABILIDADES.md`
  - `ESCOPO_FLUXO_COMPARATIVO_SEC_EMENDAS.md`

## Pasta isolada de estudos IA (fora do projeto)
- Caminho padrao: `C:\Users\micae\OneDrive\Area de Trabalho\ESTUDOS_IA_ISOLADO`
- Esta pasta e separada do repo `conciliardados` para evitar publicacao acidental.
- Conteudo de estudo nao entra no Git do sistema.

## Observacao de seguranca
- Nao versionar senha/token/chaves no Git.
- Variaveis sensiveis devem ficar em `.env` local e segredo de plataforma.
