# CONCILIAR_DADOS

Sistema de governanca de emendas com trilha de auditoria por usuario.

## Navegacao rapida
- Operacao/manutencao: `README_MANUTENCAO.md`
- Controle total do processo: `GUIA_CONTROLE_TOTAL.md`
- Catalogo de codigos/regras: `CATALOGO_CODIGOS_PREDEFINIDOS.md`
- Log de mudancas: `LOG_ALTERACOES.md`
- Termo com papeis/responsabilidades: `TERMO_DE_OPERACAO_E_RESPONSABILIDADES.md`
- Decisoes de import/export XLSX: `DECISOES_IMPORT_EXPORT_XLSX.md`
- Escopo e comparativo (Sheets/Excel): `ESCOPO_FLUXO_COMPARATIVO_SEC_EMENDAS.md`
- Base de continuidade Codex: `BASE_CONTINUIDADE_CODEX.md`

## Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Python + FastAPI
- Banco: SQLite (local) ou PostgreSQL (rede/producao)

## Execucao padrao (Etapa 0)
Use sempre estes 3 comandos para evitar oscilacao de ambiente.

### Terminal 1 - API
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start_api.ps1
```

### Terminal 2 - Front
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start_front.ps1
```

### Terminal 3 - Smoke test E2E
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke_e2e.ps1
```

## Execucao em 1 comando
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start_tudo.ps1
```

## URLs
- Front: http://127.0.0.1:5500/login.html
- API: http://127.0.0.1:8000
- Health: http://127.0.0.1:8000/health

## Perfis
- APG
- SUPERVISAO
- CONTABIL
- POWERBI
- PROGRAMADOR

## Observacao
- O script de smoke detecta automaticamente se a API esta usando `Bearer` ou `X-Session-Token`.
- Se houver banco legado sem historico Alembic, use: `alembic stamp head`.

## Configuracao de ambiente (API)
- `config.js`: base local/desenvolvimento.
- `config.production.js`: override para producao (Render + Pages).

Ajuste `API_BASE_URL` e `API_BASE_URL_BY_HOST` em `config.production.js` para nao depender de comando no console do navegador.




