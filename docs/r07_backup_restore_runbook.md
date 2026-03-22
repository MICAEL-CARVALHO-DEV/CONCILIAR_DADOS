# R07 - RUNBOOK DE BACKUP E RESTORE

Goal: garantir backup diario real, restore validado e execucao sem improviso para o banco operacional do sistema.
Success: existe um caminho seguro para gerar backup, restaurar em banco alvo preparado e provar recuperacao com evidencia.

## Escopo

O `R07` cobre:
- backup logico das tabelas operacionais PostgreSQL
- restore controlado em banco alvo preparado
- validacao automatizada em PostgreSQL local de teste
- agendamento diario no Windows sem depender de GitHub Actions

## Pre-requisitos

- `BACKUP_DATABASE_URL` apontando para o PostgreSQL oficial da operacao
- Python do backend disponivel em `backend/.venv`
- PostgreSQL local instalado para a validacao automatizada
- `R07_VALIDATION_ADMIN_DATABASE_URL` apontando para o PostgreSQL local de teste
- schema do banco alvo de restore preparado antes da restauracao

Exemplo seguro para validacao local:

```env
R07_VALIDATION_ADMIN_DATABASE_URL=postgresql://postgres:SENHA_LOCAL@127.0.0.1:5432/postgres
```

Regra:
- a validacao do `R07` sem Docker so aceita `localhost` ou `127.0.0.1`
- nao usar URL de producao para a prova de restore

## Gerar backup manual

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\run_r07_backup.ps1
```

Saida esperada:
- pasta nova em `tmp/r07_backups/...`
- `manifest.json`
- um `.csv` por tabela operacional

## Restaurar backup

```powershell
.\backend\.venv\Scripts\python.exe .\scripts\r07_restore_database.py `
  --backup-dir .\tmp\r07_backups\<PASTA_DO_BACKUP> `
  --target-database-url "postgresql://USUARIO:SENHA@HOST:PORTA/BANCO" `
  --i-understand-this-wipes-target
```

Regra:
- restore nunca aponta para producao sem janela formal e motivo registrado
- banco alvo precisa estar com schema pronto

## Validar backup + restore

```powershell
.\backend\.venv\Scripts\python.exe .\scripts\validar_r07_backup_restore.py
```

Saida esperada:
- backup gerado em `tmp/r07_backups_validation/...`
- restore concluido em bancos locais `r07_source` e `r07_restore`
- evidencia atualizada em `docs/r07_backup_restore_evidencia.md`

## Agendar backup diario no Windows

1. Configurar `BACKUP_DATABASE_URL` no ambiente do usuario ou da maquina.
2. Registrar a task:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\agendar_backup_r07.ps1
```

Padrao:
- task: `SEC-R07-Backup-Diario`
- horario: `20:00`

## Regras operacionais

- backup diario nao substitui `R08`
- restore deve ser testado antes de ser tratado como contingencia valida
- falha de backup ou restore gera evidencia e ajuste de rota, nao silencio operacional

## Fonte canonica

- prioridade e ordem: `PLANO_MESTRE_UNIFICADO.md`
- central da beta: `checks/@deve_de_casa_beta.md`
- evidencia atual: `docs/r07_backup_restore_evidencia.md`
