# BASE_CONTINUIDADE_CODEX

Atualizado em: 2026-03-06 (America/Bahia)

## Objetivo

Trocar a conta do Codex (pessoal -> trabalho) sem perder continuidade do agent no projeto.

## Snapshot tecnico

- Repo: `conciliardados`
- Branch: `main`
- HEAD: `b1ae69c`
- Workspace com alteracoes locais (nao commitadas)

Arquivos modificados:
- `README.md`
- `app.js`
- `backend/.env.example`
- `backend/README.md`
- `backend/app/main.py`
- `backend/app/models.py`
- `backend/app/schemas.py`
- `backend/app/settings.py`
- `index.html`
- `scripts/item8_teste_real_4_usuarios.ps1`
- `style.css`

Arquivos novos (untracked):
- `GUIA_ORQUESTRADOR_MULTI_IA.md`
- `backend/alembic/versions/20260306_0013_create_emenda_locks.py`
- `backend/app/ai_schemas.py`
- `backend/app/services/__init__.py`
- `backend/app/services/ai_orchestrator.py`

## O que ja foi feito

- Estrutura do orquestrador multi-IA no backend criada.
- Endpoints adicionados:
  - `GET /ai/providers/status`
  - `POST /ai/workflows/review-loop`
- Configs adicionadas em `backend/app/settings.py` e `backend/.env.example`.
- Guia operacional criado em `GUIA_ORQUESTRADOR_MULTI_IA.md`.
- `backend/.env` preparado para trocar chave OpenAI e Gemini para conta de trabalho.
- Backup local do `.env` criado:
  - `backend/.env.bak_20260306_171245`
- Patch local de seguranca do worktree:
  - `privado/handoff_worktree_20260306_171515.patch`

## Checklist de troca de conta (operacional)

- [ ] Garantir que o projeto local esta salvo (arquivos ja estao no disco).
- [ ] Fazer logout da conta Codex atual.
- [ ] Fazer login na conta de trabalho.
- [ ] Abrir a mesma pasta local do projeto.
- [ ] Rodar `git status --short` e validar que os mesmos arquivos aparecem alterados.
- [ ] Conferir `backend/.env` e preencher:
  - `OPENAI_API_KEY`
  - `GEMINI_API_KEY`
- [ ] Subir API:
  - `cd backend`
  - `uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`
- [ ] Validar status:
  - `GET /ai/providers/status`
- [ ] Continuar tarefa pendente no agent.

## Prompt de retomada (cole na conta nova)

Use este prompt no primeiro comando da conta nova:

```text
Continuar de onde paramos no projeto conciliardados.
Leia BASE_CONTINUIDADE_CODEX.md e GUIA_ORQUESTRADOR_MULTI_IA.md.
Contexto: ja existe implementacao do orquestrador multi-IA no backend com endpoints /ai/providers/status e /ai/workflows/review-loop.
Primeiro passo: rode git status --short, confirme o snapshot e valide a API local.
Depois me diga o que falta para concluir e seguir com o proximo item.
```

## Regras de seguranca para troca

- Nao copiar chave API no chat.
- Manter chave apenas em `backend/.env`.
- Revogar a chave pessoal antiga no painel OpenAI apos confirmar a chave da conta de trabalho funcionando.
