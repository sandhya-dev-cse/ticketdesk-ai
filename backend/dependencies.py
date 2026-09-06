import os
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt


security = HTTPBearer()

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET")

if not JWT_SECRET:
    raise ValueError("JWT_SECRET is not set in .env")
ALGORITHM = "HS256"


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("user_id")
        org_id = payload.get("org_id")
        role = payload.get("role")

        if not user_id or not org_id or not role:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token."
            )

        return {
            "user_id": user_id,
            "org_id": org_id,
            "role": role
        }

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token."
        )


def require_roles(*allowed_roles):

    async def role_checker(
        current_user: dict = Depends(get_current_user)
    ):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to perform this action."
            )

        return current_user

    return role_checker