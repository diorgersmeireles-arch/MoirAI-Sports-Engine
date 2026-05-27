# MADev Core Security - Verificador de privilégios estrito com base na system_role
# Garante que scouts de campo não acessem o faturamento e que viewers não modifiquem eventos
from typing import List
from fastapi import HTTPException, status, Depends
from src.middleware.tenant_boundary import get_tenant_context


class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, token_data: dict = Depends(get_tenant_context)):
        user_role = token_data.get("user_role")

        if user_role == "super_admin":
            return True

        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Ação não autorizada. O papel institucional ({user_role}) não possui privilégios para esta operação.",
            )
