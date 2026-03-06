from __future__ import annotations

import json
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from urllib.request import Request, urlopen

from ..ai_schemas import (
    AIProviderStatusOut,
    AIWorkflowRequest,
    AIWorkflowResponse,
    AIWorkflowStepOut,
)
from ..settings import Settings


PROMPT_PREVIEW_LIMIT = 320


class ProviderCallError(RuntimeError):
    pass


class OrchestrationError(RuntimeError):
    pass


@dataclass
class _ProviderConfig:
    provider_id: str
    role_hint: str
    family: str
    model: str
    enabled: bool
    configured: bool
    detail: str
    api_key: str = ""
    endpoint: str = ""
    account_id: str = ""


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _clean_text(value: str) -> str:
    return (value or "").strip()


def _truncate(value: str, limit: int = 700) -> str:
    raw = _clean_text(value)
    if len(raw) <= limit:
        return raw
    return f"{raw[:limit]}..."


def _preview_prompt(value: str) -> str:
    collapsed = " ".join((value or "").split())
    return _truncate(collapsed, PROMPT_PREVIEW_LIMIT)


def _sanitize_url(value: str) -> str:
    raw = _clean_text(value)
    if not raw:
        return raw

    try:
        parts = urlsplit(raw)
    except Exception:  # noqa: BLE001
        return raw

    if not parts.query:
        return raw

    masked_items: list[tuple[str, str]] = []
    for key, current in parse_qsl(parts.query, keep_blank_values=True):
        key_l = (key or "").strip().lower()
        if key_l in {"key", "api_key", "token", "access_token"}:
            masked_items.append((key, "***"))
        else:
            masked_items.append((key, current))

    safe_query = urlencode(masked_items, doseq=True)
    return urlunsplit((parts.scheme, parts.netloc, parts.path, safe_query, parts.fragment))


def _criteria_block(criteria: list[str]) -> str:
    if not criteria:
        return "- Entregar resposta objetiva\n- Mostrar riscos e validacoes"
    return "\n".join(f"- {item}" for item in criteria)


class AIOrchestrator:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.timeout_seconds = max(int(settings.AI_ORCHESTRATOR_TIMEOUT_SECONDS or 45), 10)
        self.providers = self._build_provider_map()

    def refresh(self) -> None:
        self.providers = self._build_provider_map()

    def provider_status(self) -> list[AIProviderStatusOut]:
        self.refresh()
        result: list[AIProviderStatusOut] = []
        for provider in self.providers.values():
            result.append(
                AIProviderStatusOut(
                    provider_id=provider.provider_id,
                    role_hint=provider.role_hint,
                    configured=provider.configured,
                    enabled=provider.enabled,
                    model=provider.model,
                    detail=provider.detail,
                )
            )
        return result

    def configured_count(self) -> int:
        self.refresh()
        return sum(1 for provider in self.providers.values() if provider.enabled and provider.configured)

    def run_review_loop(self, payload: AIWorkflowRequest, actor: dict[str, Any]) -> AIWorkflowResponse:
        if not self.settings.AI_ORCHESTRATOR_ENABLED:
            raise OrchestrationError("orquestrador desabilitado por configuracao")

        self.refresh()
        started_at = _utcnow()
        workflow_id = str(uuid.uuid4())
        warnings: list[str] = []
        steps: list[AIWorkflowStepOut] = []
        reviews: list[str] = []

        criteria = _criteria_block(payload.criterios)
        mode = payload.mode
        objective = _clean_text(payload.objective)
        contexto = _clean_text(payload.contexto)

        plan_prompt_user = (
            "Objetivo da tarefa:\n"
            f"{objective}\n\n"
            "Contexto do projeto:\n"
            f"{(contexto or 'Sem contexto adicional informado.')}\n\n"
            "Criterios de qualidade:\n"
            f"{criteria}\n\n"
            "Monte um plano tecnico curto com fases, riscos e validacao."
        )
        plan_prompt_system = (
            "Voce e o arquiteto principal. "
            "Responda em portugues, com foco em engenharia pragmatica, sem floreio."
        )
        plan_text = self._run_step(
            step="planejamento",
            role="planner",
            candidates=["gemini_pro", "codex", "ollama_local"],
            required=True,
            warnings=warnings,
            steps=steps,
            system_prompt=plan_prompt_system,
            user_prompt=plan_prompt_user,
            temperature=payload.temperature,
            max_tokens=payload.max_tokens,
        )

        implementation_text = ""
        if mode in {"implementar", "revisar", "completo"}:
            implementation_prompt_user = (
                "Objetivo:\n"
                f"{objective}\n\n"
                "Plano aprovado:\n"
                f"{plan_text}\n\n"
                "Contexto do projeto:\n"
                f"{(contexto or 'Sem contexto adicional informado.')}\n\n"
                "Entregue um rascunho de implementacao com passos concretos, pseudocodigo ou comandos."
            )
            implementation_prompt_system = (
                "Voce e o engenheiro principal do projeto. "
                "Priorize clareza, risco de regressao e validacao."
            )
            implementation_text = self._run_step(
                step="implementacao",
                role="builder",
                candidates=["codex", "gemini_pro", "ollama_local"],
                required=True,
                warnings=warnings,
                steps=steps,
                system_prompt=implementation_prompt_system,
                user_prompt=implementation_prompt_user,
                temperature=payload.temperature,
                max_tokens=payload.max_tokens,
            )

        if mode in {"revisar", "completo"}:
            helper_candidates: list[str] = []
            if payload.include_helpers:
                helper_candidates.extend(
                    [
                        "claude_free",
                        "groq_free",
                        "cloudflare_free",
                        "ollama_local",
                    ]
                )
            else:
                helper_candidates.extend(["gemini_pro", "codex"])

            for provider_id in helper_candidates:
                review_prompt_user = (
                    "Objetivo:\n"
                    f"{objective}\n\n"
                    "Plano:\n"
                    f"{plan_text}\n\n"
                    "Implementacao proposta:\n"
                    f"{implementation_text}\n\n"
                    "Revise como auditor independente: aponte falhas, riscos, testes faltantes e melhorias."
                )
                review_prompt_system = (
                    "Voce e um revisor tecnico rigoroso. "
                    "Foque em erros, regressao, seguranca e testes."
                )
                review_output = self._run_step(
                    step=f"revisao_{provider_id}",
                    role="reviewer",
                    candidates=[provider_id],
                    required=False,
                    warnings=warnings,
                    steps=steps,
                    system_prompt=review_prompt_system,
                    user_prompt=review_prompt_user,
                    temperature=payload.temperature,
                    max_tokens=payload.max_tokens,
                )
                if review_output:
                    reviews.append(review_output)

        final_output = plan_text
        if mode == "implementar":
            final_output = implementation_text or plan_text
        elif mode in {"revisar", "completo"}:
            review_block = "\n\n".join(
                f"[Revisao {idx + 1}]\n{content}" for idx, content in enumerate(reviews)
            )
            consolidate_prompt_user = (
                "Objetivo:\n"
                f"{objective}\n\n"
                "Plano inicial:\n"
                f"{plan_text}\n\n"
                "Implementacao inicial:\n"
                f"{implementation_text}\n\n"
                "Revisoes independentes:\n"
                f"{(review_block or 'Sem revisoes extras disponiveis.')}\n\n"
                "Consolide uma versao final com: plano final, checklist de execucao e riscos."
            )
            consolidate_prompt_system = (
                "Voce e arbitro tecnico final. "
                "Consolide conflitos e entregue a melhor versao possivel."
            )
            final_output = self._run_step(
                step="consolidacao_final",
                role="arbiter",
                candidates=["gemini_pro", "codex", "ollama_local"],
                required=True,
                warnings=warnings,
                steps=steps,
                system_prompt=consolidate_prompt_system,
                user_prompt=consolidate_prompt_user,
                temperature=payload.temperature,
                max_tokens=payload.max_tokens,
            )

        finished_at = _utcnow()
        return AIWorkflowResponse(
            ok=True,
            workflow_id=workflow_id,
            objective=objective,
            mode=mode,
            actor_name=str(actor.get("name") or "sistema"),
            started_at=started_at,
            finished_at=finished_at,
            final_output=_truncate(final_output, 24000),
            consolidated_plan=_truncate(plan_text, 20000),
            implementation_draft=_truncate(implementation_text, 20000),
            reviews=[_truncate(review, 15000) for review in reviews],
            warnings=warnings,
            steps=steps,
        )

    def _run_step(
        self,
        *,
        step: str,
        role: str,
        candidates: list[str],
        required: bool,
        warnings: list[str],
        steps: list[AIWorkflowStepOut],
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        max_tokens: int,
    ) -> str:
        errors: list[str] = []
        for provider_id in candidates:
            provider = self.providers.get(provider_id)
            if provider is None:
                continue
            if not provider.enabled:
                errors.append(f"{provider_id}: desabilitado")
                continue
            if not provider.configured:
                errors.append(f"{provider_id}: {provider.detail}")
                continue

            started_at = _utcnow()
            t0 = time.perf_counter()
            try:
                output = self._call_provider(
                    provider=provider,
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                latency = int((time.perf_counter() - t0) * 1000)
                text = _truncate(output, 24000)
                if not text:
                    raise ProviderCallError("resposta vazia")

                steps.append(
                    AIWorkflowStepOut(
                        step=step,
                        role=role,
                        provider=provider.provider_id,
                        model=provider.model,
                        status="ok",
                        started_at=started_at,
                        latency_ms=latency,
                        prompt_preview=_preview_prompt(user_prompt),
                        output=text,
                    )
                )
                return text
            except Exception as exc:  # noqa: BLE001
                latency = int((time.perf_counter() - t0) * 1000)
                error_text = _truncate(str(exc), 900) or "falha desconhecida"
                steps.append(
                    AIWorkflowStepOut(
                        step=step,
                        role=role,
                        provider=provider.provider_id,
                        model=provider.model,
                        status="error",
                        started_at=started_at,
                        latency_ms=latency,
                        prompt_preview=_preview_prompt(user_prompt),
                        output="",
                        error=error_text,
                    )
                )
                errors.append(f"{provider.provider_id}: {error_text}")

        reason = "; ".join(errors) if errors else "nenhum provedor disponivel"
        if required:
            raise OrchestrationError(f"falha no passo '{step}': {reason}")

        warnings.append(f"passo opcional '{step}' ignorado: {reason}")
        steps.append(
            AIWorkflowStepOut(
                step=step,
                role=role,
                provider="none",
                model="-",
                status="skipped",
                started_at=_utcnow(),
                latency_ms=0,
                prompt_preview=_preview_prompt(user_prompt),
                output="",
                error=reason,
            )
        )
        return ""

    def _call_provider(
        self,
        *,
        provider: _ProviderConfig,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        max_tokens: int,
    ) -> str:
        if provider.family == "openai":
            return self._call_openai(provider, system_prompt, user_prompt, temperature, max_tokens)
        if provider.family == "gemini":
            return self._call_gemini(provider, system_prompt, user_prompt, temperature, max_tokens)
        if provider.family == "anthropic":
            return self._call_anthropic(provider, system_prompt, user_prompt, temperature, max_tokens)
        if provider.family == "groq":
            return self._call_groq(provider, system_prompt, user_prompt, temperature, max_tokens)
        if provider.family == "cloudflare":
            return self._call_cloudflare(provider, system_prompt, user_prompt, temperature, max_tokens)
        if provider.family == "ollama":
            return self._call_ollama(provider, system_prompt, user_prompt, temperature, max_tokens)
        raise ProviderCallError(f"familia de provider nao suportada: {provider.family}")

    def _call_openai(
        self,
        provider: _ProviderConfig,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        max_tokens: int,
    ) -> str:
        payload = {
            "model": provider.model,
            "max_output_tokens": max_tokens,
            "input": [
                {
                    "role": "system",
                    "content": [{"type": "input_text", "text": system_prompt}],
                },
                {
                    "role": "user",
                    "content": [{"type": "input_text", "text": user_prompt}],
                },
            ],
        }
        response = self._post_json(
            url=provider.endpoint,
            headers={
                "Authorization": f"Bearer {provider.api_key}",
                "Content-Type": "application/json",
            },
            payload=payload,
        )

        output_text = response.get("output_text")
        if isinstance(output_text, str) and _clean_text(output_text):
            return output_text

        chunks: list[str] = []
        for item in response.get("output", []):
            if not isinstance(item, dict):
                continue
            content = item.get("content", [])
            if not isinstance(content, list):
                continue
            for chunk in content:
                if not isinstance(chunk, dict):
                    continue
                text = chunk.get("text") or chunk.get("output_text")
                if isinstance(text, str) and _clean_text(text):
                    chunks.append(_clean_text(text))
        if chunks:
            return "\n".join(chunks)

        raise ProviderCallError("OpenAI retornou sem texto")

    def _call_gemini(
        self,
        provider: _ProviderConfig,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        max_tokens: int,
    ) -> str:
        payload = {
            "systemInstruction": {
                "parts": [{"text": system_prompt}],
            },
            "contents": [
                {
                    "parts": [{"text": user_prompt}],
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }
        response = self._post_json(
            url=f"{provider.endpoint}?key={provider.api_key}",
            headers={"Content-Type": "application/json"},
            payload=payload,
        )

        candidates = response.get("candidates", [])
        for candidate in candidates:
            if not isinstance(candidate, dict):
                continue
            content = candidate.get("content", {})
            if not isinstance(content, dict):
                continue
            parts = content.get("parts", [])
            texts: list[str] = []
            for part in parts:
                if isinstance(part, dict):
                    text = part.get("text")
                    if isinstance(text, str) and _clean_text(text):
                        texts.append(_clean_text(text))
            if texts:
                return "\n".join(texts)

        raise ProviderCallError("Gemini retornou sem texto")

    def _call_anthropic(
        self,
        provider: _ProviderConfig,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        max_tokens: int,
    ) -> str:
        payload = {
            "model": provider.model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_prompt}],
        }
        response = self._post_json(
            url=provider.endpoint,
            headers={
                "x-api-key": provider.api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            payload=payload,
        )

        content = response.get("content", [])
        parts: list[str] = []
        for item in content:
            if not isinstance(item, dict):
                continue
            if item.get("type") != "text":
                continue
            text = item.get("text")
            if isinstance(text, str) and _clean_text(text):
                parts.append(_clean_text(text))
        if parts:
            return "\n".join(parts)

        raise ProviderCallError("Anthropic retornou sem texto")

    def _call_groq(
        self,
        provider: _ProviderConfig,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        max_tokens: int,
    ) -> str:
        payload = {
            "model": provider.model,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }
        response = self._post_json(
            url=provider.endpoint,
            headers={
                "Authorization": f"Bearer {provider.api_key}",
                "Content-Type": "application/json",
            },
            payload=payload,
        )

        choices = response.get("choices", [])
        if isinstance(choices, list) and choices:
            first = choices[0]
            if isinstance(first, dict):
                message = first.get("message", {})
                if isinstance(message, dict):
                    text = message.get("content")
                    if isinstance(text, str) and _clean_text(text):
                        return text

        raise ProviderCallError("Groq retornou sem texto")

    def _call_cloudflare(
        self,
        provider: _ProviderConfig,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        max_tokens: int,
    ) -> str:
        prompt = f"{system_prompt}\n\n{user_prompt}"
        payload = {
            "prompt": prompt,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        response = self._post_json(
            url=provider.endpoint,
            headers={
                "Authorization": f"Bearer {provider.api_key}",
                "Content-Type": "application/json",
            },
            payload=payload,
        )

        result = response.get("result")
        if isinstance(result, str) and _clean_text(result):
            return result
        if isinstance(result, dict):
            for key in ("response", "text", "answer"):
                value = result.get(key)
                if isinstance(value, str) and _clean_text(value):
                    return value

        raise ProviderCallError("Cloudflare retornou sem texto")

    def _call_ollama(
        self,
        provider: _ProviderConfig,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        max_tokens: int,
    ) -> str:
        payload = {
            "model": provider.model,
            "prompt": f"{system_prompt}\n\n{user_prompt}",
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }
        response = self._post_json(
            url=provider.endpoint,
            headers={"Content-Type": "application/json"},
            payload=payload,
        )

        text = response.get("response")
        if isinstance(text, str) and _clean_text(text):
            return text

        raise ProviderCallError("Ollama retornou sem texto")

    def _post_json(self, *, url: str, headers: dict[str, str], payload: dict[str, Any]) -> dict[str, Any]:
        request_data = json.dumps(payload).encode("utf-8")
        req = Request(url=url, data=request_data, headers=headers, method="POST")
        safe_url = _sanitize_url(url)
        try:
            with urlopen(req, timeout=self.timeout_seconds) as response:
                body = response.read().decode("utf-8", errors="replace")
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise ProviderCallError(
                f"HTTP {exc.code} em {safe_url}: {_truncate(detail, 600)}"
            ) from exc
        except URLError as exc:
            raise ProviderCallError(f"falha de rede em {safe_url}: {exc.reason}") from exc
        except TimeoutError as exc:
            raise ProviderCallError(f"timeout em {safe_url}") from exc

        if not _clean_text(body):
            return {}
        try:
            parsed = json.loads(body)
        except json.JSONDecodeError as exc:
            raise ProviderCallError(f"resposta nao-JSON em {safe_url}: {_truncate(body, 300)}") from exc

        if isinstance(parsed, dict):
            success = parsed.get("success")
            if success is False and "errors" in parsed:
                raise ProviderCallError(f"erro do provider: {_truncate(str(parsed.get('errors')), 400)}")
            return parsed

        raise ProviderCallError(f"resposta inesperada em {safe_url}")

    def _build_provider_map(self) -> dict[str, _ProviderConfig]:
        return {
            "codex": self._provider_openai_codex(),
            "gemini_pro": self._provider_gemini(),
            "claude_free": self._provider_anthropic(),
            "groq_free": self._provider_groq(),
            "cloudflare_free": self._provider_cloudflare(),
            "ollama_local": self._provider_ollama(),
        }

    def _provider_openai_codex(self) -> _ProviderConfig:
        api_key = _clean_text(self.settings.OPENAI_API_KEY)
        model = _clean_text(self.settings.OPENAI_MODEL_CODEX) or "gpt-5.1-codex"
        detail = "ok" if api_key else "missing OPENAI_API_KEY"
        return _ProviderConfig(
            provider_id="codex",
            role_hint="rei",
            family="openai",
            model=model,
            enabled=True,
            configured=bool(api_key),
            detail=detail,
            api_key=api_key,
            endpoint="https://api.openai.com/v1/responses",
        )

    def _provider_gemini(self) -> _ProviderConfig:
        api_key = _clean_text(self.settings.GEMINI_API_KEY)
        model = _clean_text(self.settings.GEMINI_MODEL_PRO) or "gemini-2.5-pro"
        detail = "ok" if api_key else "missing GEMINI_API_KEY"
        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        return _ProviderConfig(
            provider_id="gemini_pro",
            role_hint="rei",
            family="gemini",
            model=model,
            enabled=True,
            configured=bool(api_key),
            detail=detail,
            api_key=api_key,
            endpoint=endpoint,
        )

    def _provider_anthropic(self) -> _ProviderConfig:
        api_key = _clean_text(self.settings.ANTHROPIC_API_KEY)
        model = _clean_text(self.settings.ANTHROPIC_MODEL_CLAUDE) or "claude-3-5-sonnet-latest"
        detail = "ok" if api_key else "missing ANTHROPIC_API_KEY"
        return _ProviderConfig(
            provider_id="claude_free",
            role_hint="revisor",
            family="anthropic",
            model=model,
            enabled=True,
            configured=bool(api_key),
            detail=detail,
            api_key=api_key,
            endpoint="https://api.anthropic.com/v1/messages",
        )

    def _provider_groq(self) -> _ProviderConfig:
        api_key = _clean_text(self.settings.GROQ_API_KEY)
        model = _clean_text(self.settings.GROQ_MODEL_FREE) or "llama-3.3-70b-versatile"
        detail = "ok" if api_key else "missing GROQ_API_KEY"
        return _ProviderConfig(
            provider_id="groq_free",
            role_hint="revisor",
            family="groq",
            model=model,
            enabled=True,
            configured=bool(api_key),
            detail=detail,
            api_key=api_key,
            endpoint="https://api.groq.com/openai/v1/chat/completions",
        )

    def _provider_cloudflare(self) -> _ProviderConfig:
        api_key = _clean_text(self.settings.CLOUDFLARE_API_TOKEN)
        account_id = _clean_text(self.settings.CLOUDFLARE_ACCOUNT_ID)
        model = _clean_text(self.settings.CLOUDFLARE_MODEL_FREE) or "@cf/meta/llama-3.1-8b-instruct"
        configured = bool(api_key and account_id)
        detail = "ok" if configured else "missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID"
        endpoint = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model}"
        return _ProviderConfig(
            provider_id="cloudflare_free",
            role_hint="revisor",
            family="cloudflare",
            model=model,
            enabled=True,
            configured=configured,
            detail=detail,
            api_key=api_key,
            account_id=account_id,
            endpoint=endpoint,
        )

    def _provider_ollama(self) -> _ProviderConfig:
        base_url = _clean_text(self.settings.OLLAMA_BASE_URL) or "http://127.0.0.1:11434"
        model = _clean_text(self.settings.OLLAMA_MODEL_FREE) or "llama3.2:3b"
        configured = bool(base_url and model)
        detail = "ok" if configured else "missing OLLAMA_BASE_URL or OLLAMA_MODEL_FREE"
        return _ProviderConfig(
            provider_id="ollama_local",
            role_hint="fallback",
            family="ollama",
            model=model,
            enabled=True,
            configured=configured,
            detail=detail,
            endpoint=f"{base_url.rstrip('/')}/api/generate",
        )
