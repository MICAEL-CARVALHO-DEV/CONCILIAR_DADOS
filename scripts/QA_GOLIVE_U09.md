# CHECKLIST DE GO-LIVE: PRODUÇÃO CONTROLADA (U09)

**Objetivo:** Este checklist garante a transição segura para produção baseando-se estritamente na rota de integridade `/health` do Swagger. Nenhum bypass de segurança é permitido.

## 1. Verificações do Endpoint `/health`

> **Passo Mestre:** Acesse `https://seu-backend.render.com/health` ou faça um `curl GET /health` na nuvem. Verifique o payload JSON de retorno e preencha o checklist abaixo antes de ligar o frontend de produção.

- [ ] **Ambiente Travado:** O campo `environment` deve ser `"production"`.
- [ ] **Modo Demonstração Desligado:** O campo `demo_mode_enabled` deve ser explicitamente `false`.
- [ ] **Hardening de Auth:** O campo `auth_hardening` deve estar `true` ou retornando as configs ativas (indicando senhas fortes e lockout de 5 tentativas).
- [ ] **Sync Legado Desativado:** O campo `legacy_import_sync_enabled` deve ser `false`. Isso força a governança `Preview -> Apply` do _U02_.
- [ ] **Runtime Clean:** A lista de avisos operacionais `runtime_warnings` deve estar **completamente vazia** `[]`.
- [ ] **Production Ready Flag:** A variável `production_ready` deve ser obrigatoriamente `true`.

## 2. Bloqueadores Incondicionais (No-Go)

Se o `/health` exibir qualquer um dos seguintes erros na array de `runtime_warnings`, o Go-Live deve ser abortado e o commit não pode ir pro domínio público:

1. `SECRET_KEY is running on default insecure value!` (Risco crítico de invasão JWT).
2. `Supabase credentials missing! Running on SQLite in Production Mode.` (Forçando o disco efervescente do Render ao invés do Postgres Oficial).
3. `CORS origins are dangerously wide` (Possibilidade de injeção externa).
4. `Admin/Demo Backdoor credentials found.` (Conta `user@example.com` ou `admin` pré-popularizada exposta para o mundo).

## 3. Validação do CORS Web / Cloudflare
- [ ] Após verificar o JSON perfeito no Backend, tentar acessar de um origin não listado nas variáveis do Render. O bloqueio `CORS Missing Allow Origin` deve ocorrer para barrar scripts externos.
- [ ] Teste real pelo Domínio Final (`.net`, `.com`, Cloudflare). Requisições normais devem fluir e retornar 200 OK via Preflight OPTIONS correto.

## 4. Declaração do Go-Live U09
Assinatura Mestre do Release:
```
Status: [ AGUARDANDO VERIFICAÇÃO ]
Ambiente Alvo: Cloudflare / Render-Postgres
Responsável QA: Antigravity IA
```
