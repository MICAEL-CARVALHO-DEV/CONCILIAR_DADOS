from fastapi import APIRouter, Depends, HTTPException, Response, status

from ..ai_schemas import AIProviderStatusResponse, AIWorkflowRequest, AIWorkflowResponse
from ..core.dependencies import _require_owner
from ..services.ai_orchestrator import OrchestrationError
from ..services import platform_service


def create_platform_router(settings, ai_orchestrator, roles: list[str]) -> APIRouter:
    router = APIRouter()

    @router.get("/health")
    def health() -> dict:
        return platform_service.build_health_payload(settings, roles, ai_orchestrator)

    @router.get("/", include_in_schema=False)
    def root() -> dict:
        return platform_service.build_root_payload()

    @router.get("/favicon.ico", include_in_schema=False)
    def favicon() -> Response:
        return Response(status_code=204)

    @router.get("/roles")
    def get_roles() -> dict:
        return platform_service.build_roles_payload(roles)

    @router.get("/ai/providers/status", response_model=AIProviderStatusResponse)
    def ai_provider_status(_actor: dict = Depends(_require_owner)) -> AIProviderStatusResponse:
        return AIProviderStatusResponse(
            orchestrator_enabled=settings.AI_ORCHESTRATOR_ENABLED,
            providers=ai_orchestrator.provider_status(),
        )

    @router.post("/ai/workflows/review-loop", response_model=AIWorkflowResponse)
    def ai_workflow_review_loop(
        payload: AIWorkflowRequest,
        actor: dict = Depends(_require_owner),
    ) -> AIWorkflowResponse:
        try:
            return ai_orchestrator.run_review_loop(payload=payload, actor=actor)
        except OrchestrationError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return router

