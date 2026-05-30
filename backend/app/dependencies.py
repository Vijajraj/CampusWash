import os
from dataclasses import dataclass
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.db import supabase

bearer_scheme = HTTPBearer()

@dataclass
class CurrentUser:
    id: str
    email: str
    role: str
    profile_complete: bool

async def get_unverified_user(creds: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> CurrentUser:
    try:
        payload = jwt.decode(
            creds.credentials,
            os.getenv("JWT_SECRET", ""),
            algorithms=["HS256"]
        )
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError()
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=401,
            detail={"error": "UNAUTHORIZED", "message": "Invalid or expired token"}
        )
        
    result = supabase.table("users").select("id, email, role, profile_complete").eq("id", user_id).maybe_single().execute()
    if not result.data:
        raise HTTPException(
            status_code=401,
            detail={"error": "UNAUTHORIZED", "message": "User not found"}
        )
        
    user = result.data
    return CurrentUser(
        id=user["id"],
        email=user["email"],
        role=user["role"],
        profile_complete=user["profile_complete"]
    )

async def get_current_user(user: CurrentUser = Depends(get_unverified_user)) -> CurrentUser:
    if not user.profile_complete:
        raise HTTPException(
            status_code=403,
            detail={"error": "INCOMPLETE_PROFILE", "message": "Please complete your profile first"}
        )
    return user

async def require_moderator(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if user.role not in ("moderator", "admin"):
        raise HTTPException(
            status_code=403,
            detail={"error": "FORBIDDEN", "message": "Moderator access required"}
        )
    return user
