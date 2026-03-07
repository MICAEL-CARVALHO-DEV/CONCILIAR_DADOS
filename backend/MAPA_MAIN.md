# Mapa do backend atual

## Objetivo
Mapear o backend atual para modularizar sem quebrar auth, dominio principal, auditoria, importacao/exportacao e websocket.

## Arquivo principal hoje

- `backend/app/main.py`

## Arquivos de apoio ja existentes

- `backend/app/settings.py`
- `backend/app/db.py`
- `backend/app/models.py`
- `backend/app/schemas.py`
- `backend/app/ai_schemas.py`
- `backend/app/services/ai_orchestrator.py`

## Panorama geral
O backend atual ja tem base de projeto em `backend/app/`, mas a logica principal continua concentrada em `backend/app/main.py`.

Hoje o `main.py` concentra:

- criacao da app
- middlewares
- brokers de websocket e presenca
- auth
- usuarios
- dominio de emendas
- lock de edicao
- importacao
- exportacao
- auditoria
- endpoints de IA

## Blocos principais do `main.py`

## 1. Bootstrap e configuracao da app
Faixa principal:

- `backend/app/main.py:54`
- `backend/app/main.py:1182`

Conteudo:

- criacao do `FastAPI`
- startup
- rotas basicas de raiz, health e favicon

Destino futuro:

- `backend/app/main.py` deve ficar so com bootstrap e `include_router`

## 2. WebSocket broker e presence broker
Faixa principal:

- `backend/app/main.py:184`
- `backend/app/main.py:282`

Conteudo:

- gerenciamento de conexoes websocket
- presenca por emenda
- snapshot de usuarios ativos

Destino futuro:

- `backend/app/services/ws_broker.py`
- `backend/app/services/presence_service.py`

## 3. Concorrencia e row version
Faixa principal:

- `backend/app/main.py:316`
- `backend/app/main.py:343`

Conteudo:

- leitura de `row_version`
- conflito por versao antiga
- incremento de versao

Destino futuro:

- `backend/app/core/concurrency.py`

## 4. Lock de edicao da emenda
Faixa principal:

- `backend/app/main.py:357`
- `backend/app/main.py:485`

Conteudo:

- consulta do lock valido
- upsert do lock
- acquire
- renew
- release
- validacao obrigatoria antes de editar

Destino futuro:

- `backend/app/services/emenda_lock_service.py`

## 5. Helpers de evento e edicao de campos
Faixa principal:

- `backend/app/main.py:517`
- `backend/app/main.py:625`

Conteudo:

- payload de presenca
- resolucao de campo editavel
- aplicacao da edicao no modelo de emenda

Destino futuro:

- `backend/app/services/emenda_event_service.py`

## 6. Auth, senha, sessao e auditoria de auth
Faixa principal:

- `backend/app/main.py:676`
- `backend/app/main.py:851`
- `backend/app/main.py:953`

Conteudo:

- verificacao de senha
- nome publico unico
- criacao de sessao JWT
- leitura de user agent
- auditoria de autenticacao
- busca de usuario por login e email
- normalizacao de nome

Destino futuro:

- `backend/app/services/auth_service.py`
- `backend/app/core/security.py`
- `backend/app/services/auth_audit_service.py`

## 7. Endpoints institucionais e IA
Faixa principal:

- `backend/app/main.py:1218`
- `backend/app/main.py:1231`

Rotas:

- `/roles`
- `/ai/providers/status`
- `/ai/workflows/review-loop`

Destino futuro:

- `backend/app/routers/system.py`
- `backend/app/routers/ai.py`

## 8. Endpoints de autenticacao
Faixa principal:

- `backend/app/main.py:1242`
- `backend/app/main.py:1708`

Rotas:

- `/auth/google-intake`
- `/auth/register`
- `/auth/google`
- `/auth/login`
- `/auth/recovery-request`
- `/auth/me`
- `/auth/logout`
- `/auth/audit`

Destino futuro:

- `backend/app/routers/auth.py`
- `backend/app/services/auth_service.py`

## 9. Endpoints de usuarios
Faixa principal:

- `backend/app/main.py:1721`
- `backend/app/main.py:1733`

Rotas:

- `/users`
- `/users/{user_id}/status`

Destino futuro:

- `backend/app/routers/usuarios.py`
- `backend/app/services/usuario_service.py`

## 10. Dominio principal de emendas
Faixa principal:

- `backend/app/main.py:1785`
- `backend/app/main.py:2066`

Rotas:

- `/emendas`
- `/emendas/{emenda_id}`
- `/emendas/{emenda_id}/lock`
- `/emendas/{emenda_id}/lock/acquire`
- `/emendas/{emenda_id}/lock/renew`
- `/emendas/{emenda_id}/lock/release`
- `/emendas/{emenda_id}/status`
- `/emendas/{emenda_id}/eventos`
- `/emendas/{emenda_id}/versionar`

Destino futuro:

- `backend/app/routers/emendas.py`
- `backend/app/services/emenda_service.py`
- `backend/app/services/emenda_lock_service.py`
- `backend/app/services/emenda_version_service.py`

## 11. Importacao e exportacao
Faixa principal:

- `backend/app/main.py:2144`
- `backend/app/main.py:2270`

Rotas:

- `/imports/lotes`
- `/imports/linhas/bulk`
- `/imports/lotes`
- `/imports/linhas`
- `/exports/logs`
- `/exports/logs`

Destino futuro:

- `backend/app/routers/importacao.py`
- `backend/app/routers/exportacao.py`
- `backend/app/services/import_service.py`
- `backend/app/services/export_service.py`

## 12. Auditoria operacional
Faixa principal:

- `backend/app/main.py:2278`
- `backend/app/main.py:2279`

Rota:

- `/audit`

Destino futuro:

- `backend/app/routers/auditoria.py`
- `backend/app/services/auditoria_service.py`

## 13. WebSocket em tempo real
Faixa principal:

- `backend/app/main.py:2301`
- `backend/app/main.py:2378`

Rota:

- `/ws`

Responsabilidade:

- autenticar conexao
- receber `join` e `leave`
- responder `ping`
- publicar presenca por emenda

Destino futuro:

- `backend/app/routers/ws.py`
- `backend/app/services/ws_broker.py`
- `backend/app/services/presence_service.py`

## Ordem recomendada de modularizacao
Extrair nesta ordem:

1. `auth`
2. `usuarios`
3. `emendas`
4. `lock + concorrencia`
5. `auditoria`
6. `importacao/exportacao`
7. `websocket`
8. limpar `main.py`

## Estrutura alvo

```text
backend/app/
  routers/
  services/
  core/
  repositories/
  schemas/
```

## Primeiros arquivos a criar

- `backend/app/routers/auth.py`
- `backend/app/routers/usuarios.py`
- `backend/app/routers/emendas.py`
- `backend/app/services/auth_service.py`
- `backend/app/services/usuario_service.py`
- `backend/app/services/emenda_service.py`
- `backend/app/core/security.py`
- `backend/app/core/dependencies.py`
- `backend/app/core/permissions.py`

## Riscos principais da refatoracao do backend

- quebrar login e sessao JWT
- quebrar contratos usados pelo frontend
- quebrar lock de edicao e conflito `409`
- quebrar importacao e exportacao
- deixar websocket inconsistente

## Criterio de sucesso da Fase 1 no backend

- mapa validado
- fronteiras de router e service claras
- ordem de extracao definida
- `main.py` com destino de simplificacao bem definido
