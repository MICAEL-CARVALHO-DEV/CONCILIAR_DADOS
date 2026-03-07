# CHECKLIST
Goal: reduzir o tamanho do `backend/app/main.py` extraindo blocos por dominio sem mudar contrato da API.
Success: `main.py` vira arquivo de composicao e os helpers de auth/seguranca ficam em modulos dedicados.

- [DONE] Extrair helpers de autenticacao/seguranca para `backend/app/core/security.py` e religar `main.py` sem alterar rotas.
- [DONE] Validar o corte inicial com `python -m py_compile` e `scripts/smoke_e2e.ps1` contra a API local.
- [TODO] Extrair dependencias de autenticacao/permissao para um modulo `core/dependencies.py`.
- [TODO] Extrair dominio de usuarios/auth para `services/auth_service.py` ou `routers/auth.py`.
- [TODO] Extrair dominio de emendas/locks para modulo proprio sem mudar os endpoints.
- [TODO] Validar smoke do backend apos cada corte maior.

Active: ID-BE-03
Risks: manter compatibilidade total com JWT, fallback legado e auditoria de auth.
