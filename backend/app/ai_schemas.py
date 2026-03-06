from datetime import datetime

from pydantic import BaseModel, Field, field_validator


WORKFLOW_MODES = {"planejar", "implementar", "revisar", "completo"}


class AIWorkflowRequest(BaseModel):
    objective: str = Field(min_length=10, max_length=12000)
    contexto: str = Field(default="", max_length=30000)
    criterios: list[str] = Field(default_factory=list)
    mode: str = "completo"
    include_helpers: bool = True
    max_tokens: int = Field(default=1400, ge=128, le=4096)
    temperature: float = Field(default=0.2, ge=0.0, le=1.5)

    @field_validator("mode")
    @classmethod
    def validate_mode(cls, value: str) -> str:
        normalized = (value or "").strip().lower()
        if normalized not in WORKFLOW_MODES:
            raise ValueError("mode invalido")
        return normalized

    @field_validator("criterios")
    @classmethod
    def normalize_criteria(cls, value: list[str]) -> list[str]:
        normalized: list[str] = []
        for item in value:
            text = (item or "").strip()
            if text:
                normalized.append(text)
        return normalized


class AIProviderStatusOut(BaseModel):
    provider_id: str
    role_hint: str
    configured: bool
    enabled: bool
    model: str
    detail: str = ""


class AIProviderStatusResponse(BaseModel):
    orchestrator_enabled: bool
    providers: list[AIProviderStatusOut]


class AIWorkflowStepOut(BaseModel):
    step: str
    role: str
    provider: str
    model: str
    status: str
    started_at: datetime
    latency_ms: int
    prompt_preview: str
    output: str
    error: str | None = None


class AIWorkflowResponse(BaseModel):
    ok: bool
    workflow_id: str
    objective: str
    mode: str
    actor_name: str
    started_at: datetime
    finished_at: datetime
    final_output: str
    consolidated_plan: str = ""
    implementation_draft: str = ""
    reviews: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    steps: list[AIWorkflowStepOut] = Field(default_factory=list)
