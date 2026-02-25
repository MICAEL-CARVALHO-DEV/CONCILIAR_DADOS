# PLANO 14 DIAS INTENSIVO - SEC EMENDAS

## Objetivo
Acelerar seu crescimento tecnico usando o sistema real: front, API, banco, testes e release.

## Regras do intensivo
- Tempo por dia: 60 a 90 min.
- Sempre fechar o dia com evidencia:
  - comando rodado
  - resultado
  - o que voce entendeu
- Registrar no `anotacoes/LOG_ALTERACOES.md` (modo estudo).

## Dia 1 - Mapa do sistema
- Ler: `index.html`, `app.js` (visao geral), `backend/app/main.py`.
- Fazer: desenhar fluxo "botao -> API -> banco -> tela".
- Validar: abrir sistema com `scripts/start_tudo.ps1`.

## Dia 2 - Front: filtros e render
- Ler: `render()`, `getFiltered()`, `openModal()` em `app.js`.
- Fazer: explicar cada coluna da tabela principal.
- Validar: mudar filtros e conferir comportamento.

## Dia 3 - Front: exportacao 3 modos
- Ler: `runExportByScope()`, `filterRecordsForExport()`.
- Fazer: testar `ATUAIS`, `HISTORICO`, `PERSONALIZADO`.
- Validar: checar nome de arquivo `_atual`, `_historico`, `_custom`.

## Dia 4 - Front: importacao XLSX
- Ler: fluxo de `parseInputFile` e `processImportedRows`.
- Fazer: importar um XLSX real e revisar relatorio.
- Validar: conferir painel e timeline apos importacao.

## Dia 5 - API: autenticacao
- Ler: `/auth/register`, `/auth/login`, `/auth/me` em `backend/app/main.py`.
- Fazer: testar com PowerShell (`Invoke-RestMethod`).
- Validar: login + token + `/auth/me`.

## Dia 6 - API: emendas e eventos
- Ler: `/emendas`, `/emendas/{id}/eventos`, `/emendas/{id}/status`.
- Fazer: criar emenda e registrar evento NOTE via API.
- Validar: evento aparecendo no front.

## Dia 7 - Banco/modelos
- Ler: `backend/app/models.py`.
- Fazer: mapear tabelas e relacoes (usuarios, emendas, historico, export_logs).
- Validar: explicar onde cada dado fica persistido.

## Dia 8 - Schemas/validacao
- Ler: `backend/app/schemas.py`.
- Fazer: identificar validacoes criticas (`status`, `escopo_exportacao`, `origem_evento`).
- Validar: enviar payload invalido e observar erro 422.

## Dia 9 - Migration Alembic
- Ler: `backend/alembic/versions/`.
- Fazer: entender a migration de `escopo_exportacao`.
- Validar: `alembic upgrade head` sem erro.

## Dia 10 - Testes operacionais
- Rodar:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\regressao_p0.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\concorrencia_c34.ps1 -Users 4
```
- Fazer: explicar cada bloco de validacao dos scripts.
- Validar: ambos com `SUCESSO`.

## Dia 11 - Observabilidade
- Ler logs da API em tempo real.
- Fazer: provocar 1 erro controlado (ex.: login invalido).
- Validar: identificar causa pelo log e corrigir.

## Dia 12 - Git e release
- Fazer fluxo completo:
```powershell
git status
git add .
git commit -m "chore: estudo dia 12"
git push origin HEAD
```
- Validar: `git log -1 --oneline`.

## Dia 13 - Mini feature ponta a ponta
- Implementar melhoria pequena (UI + API + log).
- Validar com `regressao_p0.ps1`.
- Registrar no log tecnico.

## Dia 14 - Demo tecnica final
- Roteiro de 3 min:
  1. Login
  2. Importar XLSX
  3. Alterar registro
  4. Mostrar timeline/audit
  5. Exportar 3 modos
- Validar com supervisor/TI.

## Checklist de conclusao
- [ ] Sei subir ambiente do zero.
- [ ] Sei explicar fluxo completo do dado.
- [ ] Sei testar antes de publicar.
- [ ] Sei diagnosticar erro por log.
- [ ] Sei entregar melhoria pequena sem quebrar o sistema.

## Comandos uteis (atalho)
Subir sistema:
```powershell
cd "C:\Users\micae\OneDrive\Area de Trabalho\conciliar Copia"
powershell -ExecutionPolicy Bypass -File .\scripts\start_tudo.ps1
```

Testes de confianca:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\regressao_p0.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\concorrencia_c34.ps1 -Users 4
```

## Resultado esperado do intensivo
Ao final, voce nao apenas "usa IA". Voce domina o fluxo tecnico do seu sistema e consegue manter, evoluir e defender decisao em reuniao.
