# GUIA_ORQUESTRADOR_MULTI_IA

Objetivo: usar `Codex` e `Gemini Pro` como lideres ("reis") e acoplar revisores gratuitos para melhorar qualidade final.

## 1) Arquitetura implementada

- Reis:
  - `codex` (OpenAI API)
  - `gemini_pro` (Gemini API)
- Revisores/Fallback:
  - `claude_free` (Anthropic API, quando houver credito/chave)
  - `groq_free` (Groq API)
  - `cloudflare_free` (Workers AI)
  - `ollama_local` (modelo local sem custo por token)
- Fluxo oficial:
  - `planejamento` -> `implementacao` -> `revisoes` -> `consolidacao_final`

## 2) Configuracao de ambiente

No arquivo `backend/.env`, definir no minimo:

```env
AI_ORCHESTRATOR_ENABLED=true
OPENAI_API_KEY=...
GEMINI_API_KEY=...
```

Opcional para ampliar revisao:

```env
ANTHROPIC_API_KEY=...
GROQ_API_KEY=...
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL_FREE=llama3.2:3b
```

## 3) Subir API

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## 4) Verificar providers ativos

`GET /ai/providers/status` (autenticado como `PROGRAMADOR`).

Saida esperada: lista de providers com `configured=true/false`.

## 5) Rodar workflow colaborativo

`POST /ai/workflows/review-loop`

Payload base:

```json
{
  "objective": "Descrever claramente a tarefa tecnica",
  "contexto": "Arquivos e restricoes relevantes",
  "criterios": [
    "Nao quebrar endpoints existentes",
    "Incluir teste de regressao",
    "Explicar risco residual"
  ],
  "mode": "completo",
  "include_helpers": true,
  "max_tokens": 1400,
  "temperature": 0.2
}
```

Atalho por script (login + execucao em 1 comando):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run_ai_workflow.ps1 -UserName "MICAEL_DEV"
```

Com saida em arquivo JSON:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run_ai_workflow.ps1 -UserName "MICAEL_DEV" -OutFile ".\anotacoes\workflow_result.json"
```

## 6) Modos de execucao

- `planejar`: gera apenas plano tecnico inicial.
- `implementar`: gera plano + rascunho de implementacao.
- `revisar`: gera plano + implementacao + revisoes + consolidacao.
- `completo`: igual ao revisar (modo recomendado).

## 7) Como usar no dia a dia do projeto

1. Crie ticket/escopo da tarefa.
2. Rode `review-loop` com `mode=completo`.
3. Use `final_output` como base de execucao.
4. Execute alteracoes reais de codigo.
5. Rode testes e smoke.
6. Reenvie contexto atualizado para nova rodada se houver conflito.

## 8) Regra de governanca

- Apenas `PROGRAMADOR` pode chamar rotas de orquestracao.
- Sempre revisar `warnings` e `steps` retornados.
- Se um provider cair, o orquestrador tenta fallback dentro do papel da etapa.
