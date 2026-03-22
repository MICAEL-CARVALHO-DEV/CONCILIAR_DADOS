# Evidencia R07 - Backup e Restore

- Data: 2026-03-22 14:02:09 UTC
- Commit validado: `59f9caf`
- Source: `postgresql://postgres:***@127.0.0.1:5432/r07_source`
- Restore target: `postgresql://postgres:***@127.0.0.1:5432/r07_restore`
- Resultado: `PASSOU`

## Assertivas

- Usuarios restaurados: `MICAEL_DEV, SEC_APG_TESTE`
- Emendas restauradas: `EPI-R07-001`
- Chamados restaurados: `Chamado seed R07`

## Contagem do backup

| Tabela | Linhas | Arquivo |
| --- | ---: | --- |
| usuarios | 2 | `usuarios.csv` |
| emendas | 1 | `emendas.csv` |
| usuario_sessoes | 1 | `usuario_sessoes.csv` |
| auth_audit_logs | 1 | `auth_audit_logs.csv` |
| deputado_count_adjustments | 1 | `deputado_count_adjustments.csv` |
| lotes_importacao | 1 | `lotes_importacao.csv` |
| import_linhas | 1 | `import_linhas.csv` |
| import_governanca_logs | 1 | `import_governanca_logs.csv` |
| export_logs | 1 | `export_logs.csv` |
| historico | 1 | `historico.csv` |
| emenda_locks | 1 | `emenda_locks.csv` |
| support_threads | 1 | `support_threads.csv` |
| support_messages | 1 | `support_messages.csv` |
