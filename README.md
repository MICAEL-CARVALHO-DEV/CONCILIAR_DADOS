# CONCILIAR_DADOS

Sistema de governanca de emendas com trilha de auditoria por usuario.

## Navegacao rapida
### Entrada diaria
- Mapa mestre da beta SEC: `CHECK62.md`
- Sprint ativa: `CHECKUSER.md`
- Pendencias de decisao: `checks/CHECK_PENDENCIAS_BETA_SEC.md`
- Indice central da documentacao: `docs/INDICE_DOCUMENTACAO.md`
- Catalogo canonico dos `.md`: `docs/CATALOGO_DOCUMENTOS_MD.md`
- Padrao de organizacao dos `.md`: `docs/PADRAO_ORGANIZACAO_MD.md`

### Operacao e manutencao
- Operacao/manutencao: `README_MANUTENCAO.md`
- Checklist final de deploy/operacao: `CHECKLIST_DEPLOY_FINAL_OPERACAO.md`
- Anotacoes operacionais: `anotacoes/README_ANOTACOES.md`
- Checks auxiliares: `checks/auxiliares/README.md`

### Deploy
- Guia de deploy geral: `DEPLOY.md`
- Guia de deploy Render/Supabase: `DEPLOY_GRATIS_RENDER_SUPABASE.md`
- Guia de deploy Front Cloudflare Pages: `DEPLOY_CLOUDFLARE_PAGES.md`

### Arquitetura e regras
- Mapa logico do sistema: `MAPA_LOGICO_CONCILIAR_DADOS.md`
- Base de continuidade Codex: `BASE_CONTINUIDADE_CODEX.md`
- Decisoes de import/export XLSX: `anotacoes/DECISOES_IMPORT_EXPORT_XLSX.md`
- Escopo e comparativo (Sheets/Excel): `anotacoes/ESCOPO_FLUXO_COMPARATIVO_SEC_EMENDAS.md`
- Termo com papeis/responsabilidades: `anotacoes/TERMO_DE_OPERACAO_E_RESPONSABILIDADES.md`

### Guias
- Guia Trello + Notion: `GUIA_TRELLO_NOTION_OPERACAO.md`
- Guia de skills e habilidades: `GUIA_SKILLS_E_HABILIDADES.md`
- Guia do orquestrador multi-IA: `GUIA_ORQUESTRADOR_MULTI_IA.md`

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

### Terminal 4 - Checagem de segredo antes de commit
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\security_check_git.ps1
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
