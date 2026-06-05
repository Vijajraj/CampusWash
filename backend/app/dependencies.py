import os
import json
import firebase_admin
from firebase_admin import credentials
from dataclasses import dataclass
from typing import Optional
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.db import supabase

# Initialize Firebase Admin SDK
if not firebase_admin._apps:
    service_account_env = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    if service_account_env:
        try:
            if service_account_env.strip().startswith("{"):
                service_account_info = json.loads(service_account_env)
                cred = credentials.Certificate(service_account_info)
            else:
                cred = credentials.Certificate(service_account_env)
            firebase_admin.initialize_app(cred)
        except Exception as e:
            print(f"⚠️ Failed to initialize Firebase Admin SDK: {e}")
    else:
        print("⚠️ FIREBASE_SERVICE_ACCOUNT_JSON is not configured in env")

bearer_scheme = HTTPBearer(auto_error=False)

@dataclass
class CurrentUser:
    id: str
    email: str
    role: str
    profile_complete: bool

async def get_unverified_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)
) -> CurrentUser:
    if not creds:
        raise HTTPException(
            status_code=401,
            detail={"error": "UNAUTHORIZED", "message": "Missing credentials. Bearer token required."}
        )
        
    jwt_token = creds.credentials
    try:
        payload = jwt.decode(
            jwt_token,
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
            detail={
                "error": "INCOMPLETE_PROFILE",
                "message": "Please complete your profile first",
                "user_id": user.id,
                "email": user.email
            }
        )
    return user

async def require_moderator(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if user.role not in ("moderator", "admin"):
        raise HTTPException(
            status_code=403,
            detail={"error": "FORBIDDEN", "message": "Moderator access required"}
        )
    return user

