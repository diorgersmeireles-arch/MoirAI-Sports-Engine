# MADev Core Security - Middleware interceptador que valida o cabeçalho X-Tenant-ID
# Verifica o isolamento de dados relacional e vetorial no Redis.
# Se houver tentativa de bypass, aciona o Security Audit Center (MOI-ADM).
import time
from fastapi import Request, HTTPException, status
from src.services.redis_cache import redis_client
from src.services.audit_logger import log_security_violation


async def verify_tenant_boundary_middleware(request: Request):
    tenant_id = request.headers.get("X-Tenant-ID")
    auth_header = request.headers.get("Authorization")

    if not tenant_id:
        raise HTTPException(
            status_code=400,
            detail="Header X-Tenant-ID ausente no envelope HTTP.",
        )

    is_valid_tenant = await redis_client.sismember(
        "global:registered_tenants", tenant_id
    )
    if not is_valid_tenant:
        await log_security_violation(
            actor_user_id="ANONYMOUS_OR_MALICIOUS",
            tenant_id=tenant_id,
            action="rbac.boundary_violation",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", "unknown"),
            metadata={"path": request.url.path, "severity": "CRITICAL"},
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Violação de fronteira lógica detectada e reportada ao SOC.",
        )
