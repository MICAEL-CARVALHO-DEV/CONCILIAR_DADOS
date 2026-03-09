# CHECKLIST
Goal: reduzir o tamanho do `backend/app/main.py` extraindo blocos por dominio sem mudar contrato da API.
Success: `main.py` vira arquivo de composicao e os helpers de auth/seguranca ficam em modulos dedicados.

- [DONE] Extrair helpers de autenticacao/seguranca para `backend/app/core/security.py` e religar `main.py` sem alterar rotas.
- [DONE] Validar o corte inicial com `python -m py_compile` e `scripts/smoke_e2e.ps1` contra a API local.
- [DONE] Extrair dependencias de autenticacao/permissao para `backend/app/core/dependencies.py` e religar os `Depends(...)` do `main.py`.
- [DONE] Revalidar smoke local apos extrair `core/dependencies.py`.
- [DONE] Extrair dominio de usuarios/auth para `backend/app/services/auth_service.py` e deixar `main.py` como wrapper fino.
- [DONE] Extrair dominio de emendas/locks para `backend/app/services/emenda_service.py` sem mudar os endpoints.
- [DONE] Revalidar backend com `py_compile`, `smoke_e2e.ps1` e `concorrencia_c34.ps1` no modelo hibrido de lock.
- [DONE] Extrair dominio de importacao/exportacao para `backend/app/services/import_export_service.py` e religar os endpoints sem mudar contrato.
- [DONE] Extrair auditoria e suporte para `backend/app/services/audit_service.py` e `backend/app/services/support_service.py`, reduzindo o bloco operacional do `main.py`.
- [DONE] Separar websocket/presenca em `backend/app/services/realtime_service.py` e manter a rota `/ws` como wrapper fino.
- [DONE] Revalidar localmente com `py_compile`, `smoke_e2e.ps1` e chamada real das rotas de suporte apos extrair operacao/auditoria/realtime.
- [DONE] Extrair utilitarios de plataforma e rotas sistemicas/AI para `backend/app/services/platform_service.py` e `backend/app/api/platform.py`, deixando `main.py` mais composicional.
- [DONE] Extrair rotas de `auth/users`, `emendas/locks` e `imports/exports/audit/support` para `backend/app/api/*.py`, deixando o `main.py` como composicao + websocket.
- [DONE] Extrair o bootstrap final para `backend/app/app_factory.py` e a rota `/ws` para `backend/app/api/realtime.py`, reduzindo `main.py` a `app = create_app()`.

Active: ID-BE-13
Risks: revalidar `smoke_e2e.ps1` com a API local efetivamente ligada para fechar o veredito estrutural do backend.
