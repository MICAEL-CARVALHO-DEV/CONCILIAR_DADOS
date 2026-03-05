# RELATORIO GO-LIVE

- Data: 2026-03-05 07:30:44
- Commit local: 24c6fc3385a58d025e70d8a8dfd3073ce92d81ea

## Front (GitHub Pages)
- https://micael-carvalho-dev.github.io/CONCILIAR_DADOS/ -> 200
- https://micael-carvalho-dev.github.io/CONCILIAR_DADOS/login.html -> 200
- https://micael-carvalho-dev.github.io/CONCILIAR_DADOS/cadastro.html -> 200

## API Health
```json
{"ok":true,"auth_enabled":true,"auth_mode":"jwt_bearer_with_legacy_fallback","shared_key_enabled":false,"app_env":"development","roles":["APG","SUPERVISAO","CONTABIL","POWERBI","PROGRAMADOR"]}
```

## Smoke deploy stack
```text
[smoke-deploy] API base: https://sec-emendas-api.onrender.com
[smoke-deploy] Front origin: https://micael-carvalho-dev.github.io
[smoke-deploy] GET /health
  ok=True auth_enabled=True env=development
[smoke-deploy] GET /openapi.json
  rotas criticas presentes
[smoke-deploy] GET /roles
  roles=APG,SUPERVISAO,CONTABIL,POWERBI,PROGRAMADOR
[smoke-deploy] OPTIONS /auth/login (preflight CORS)
  preflight=200 allow-origin=https://micael-carvalho-dev.github.io
[smoke-deploy] Login foi pulado (use -LoginUser e -LoginPass para validar autenticacao real).

[smoke-deploy] OK - stack validada.
```

## Workflows (amostra recente)
```json
[
    {
        "name":  "Deploy GitHub Pages",
        "status":  "completed",
        "conclusion":  "failure",
        "head_sha":  "24c6fc3385a58d025e70d8a8dfd3073ce92d81ea",
        "updated_at":  "2026-03-05T09:56:40Z",
        "html_url":  "https://github.com/MICAEL-CARVALHO-DEV/CONCILIAR_DADOS/actions/runs/22712393612"
    },
    {
        "name":  "pages build and deployment",
        "status":  "completed",
        "conclusion":  "success",
        "head_sha":  "24c6fc3385a58d025e70d8a8dfd3073ce92d81ea",
        "updated_at":  "2026-03-05T09:57:30Z",
        "html_url":  "https://github.com/MICAEL-CARVALHO-DEV/CONCILIAR_DADOS/actions/runs/22712392897"
    },
    {
        "name":  "Deploy GitHub Pages",
        "status":  "completed",
        "conclusion":  "failure",
        "head_sha":  "a539c21b1b8f85b42b701fa567d5cdfff1c022f7",
        "updated_at":  "2026-03-05T02:16:10Z",
        "html_url":  "https://github.com/MICAEL-CARVALHO-DEV/CONCILIAR_DADOS/actions/runs/22699124434"
    },
    {
        "name":  "pages build and deployment",
        "status":  "completed",
        "conclusion":  "success",
        "head_sha":  "a539c21b1b8f85b42b701fa567d5cdfff1c022f7",
        "updated_at":  "2026-03-05T02:16:51Z",
        "html_url":  "https://github.com/MICAEL-CARVALHO-DEV/CONCILIAR_DADOS/actions/runs/22699124219"
    }
]
```

## Status
- Item 1 (workflow custom): AJUSTADO localmente para validacao de artefato (sem deploy duplicado).
- Item 2 (smoke producao): OK para health/openapi/roles/cors; login real ficou sem credencial (step pulado).
- Item 3 (relatorio go-live): CONCLUIDO.
