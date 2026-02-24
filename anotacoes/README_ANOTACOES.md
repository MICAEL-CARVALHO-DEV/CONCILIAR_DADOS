# Anotacoes do Projeto SEC Emendas

Esta pasta centraliza as anotacoes de processo, escopo, checklist e manutencao.

## Arquivos principais
- `BASE_CONTINUIDADE_CODEX.md`
- `CHECKLIST_PROXIMA_FASE_ATUALIZADO.md`
- `PLANO_ETAPAS_62_ITENS.md`
- `DECISOES_IMPORT_EXPORT_XLSX.md`
- `README_MANUTENCAO.md`
- `LOG_ALTERACOES.md`
- `TERMO_DE_OPERACAO_E_RESPONSABILIDADES.md`
- `ESCOPO_FLUXO_COMPARATIVO_SEC_EMENDAS.md`
- `ETAPA_01_PONTA_PE_INICIAL.md`

## Snapshot automatico de handoff
Use o script abaixo para gerar pacote de continuidade por release:

```powershell
cd "C:\Users\micae\OneDrive\Area de Trabalho\conciliar Copia"
powershell -ExecutionPolicy Bypass -File .\anotacoes\context_snapshot.ps1 -Tag "release_nome"
```

Saida gerada:
- Pasta: `anotacoes/snapshots/handoff_YYYYMMDD_HHMMSS_<tag>/`
- Zip: `anotacoes/snapshots/handoff_YYYYMMDD_HHMMSS_<tag>.zip`

Cada snapshot inclui:
- docs de anotacoes
- refs principais do projeto
- metadados git (status/log/remotes)
- `SNAPSHOT_SUMMARY.md`

## Observacao
Os arquivos originais continuam na raiz para nao quebrar referencias antigas.
A pasta `anotacoes/` funciona como central de consulta.


