import os
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from jose import jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.db import supabase
from app.models.auth import (
    SupabaseLoginRequest, SupabaseLoginResponse,
    GoogleLoginRequest,
    CompleteProfileRequest, CompleteProfileResponse,
    UserResponse
)
from app.dependencies import get_current_user, get_unverified_user, CurrentUser
from app.utils.email_parser import validate_college_email, parse_college_email

router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

def create_jwt(user_id: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(days=30)
    to_encode = {"sub": user_id, "exp": expires}
    return jwt.encode(to_encode, os.getenv("JWT_SECRET", ""), algorithm="HS256")

@router.post("/supabase-login", response_model=SupabaseLoginResponse)
async def supabase_login(req: SupabaseLoginRequest) -> SupabaseLoginResponse:
    try:
        user_resp = supabase.auth.get_user(req.supabase_token)
        supabase_user = user_resp.user
        if not supabase_user:
            raise ValueError("No user found in session")
    except Exception as e:
        raise HTTPException(
            status_code=401, 
            detail={"error": "INVALID_SUPABASE_TOKEN", "message": f"Invalid Supabase token: {str(e)}"}
        )
    
    email = supabase_user.email
    supabase_uid = supabase_user.id
    
    if not validate_college_email(email):
        raise HTTPException(
            status_code=403, 
            detail={"error": "INVALID_COLLEGE_EMAIL", "message": "Only @citchennai.net emails are allowed"}
        )
    
    parsed = parse_college_email(email)
    
    result = supabase.table("users").select("*").eq("firebase_uid", supabase_uid).maybe_single().execute()
    user = result.data
    
    if not user:
        new_user = {
            "firebase_uid": supabase_uid,
            "email": email,
            "department": parsed.get("department"),
            "batch_year": parsed.get("batch_year"),
            "profile_complete": False,
            "role": "student"
        }
        res = supabase.table("users").insert(new_user).execute()
        user = res.data[0]
        
    access_token = create_jwt(user["id"])
    return SupabaseLoginResponse(
        access_token=access_token,
        user_id=user["id"],
        profile_complete=user["profile_complete"],
        parsed=parsed
    )

@router.post("/google-login", response_model=SupabaseLoginResponse)
async def google_login(req: GoogleLoginRequest) -> SupabaseLoginResponse:
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail={"error": "CONFIG_ERROR", "message": "Google Client ID not configured on server"}
        )
    try:
        idinfo = id_token.verify_oauth2_token(
            req.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )
    except ValueError as e:
        raise HTTPException(
            status_code=401,
            detail={"error": "INVALID_GOOGLE_TOKEN", "message": f"Invalid Google token: {str(e)}"}
        )

    email = idinfo.get("email", "")
    google_uid = idinfo.get("sub", "")

    if not validate_college_email(email):
        raise HTTPException(
            status_code=403,
            detail={"error": "INVALID_COLLEGE_EMAIL", "message": "Only @citchennai.net emails are allowed"}
        )

    parsed = parse_college_email(email)

    # Look up user by email first, fall back to Google UID
    result = supabase.table("users").select("*").eq("email", email).maybe_single().execute()
    user = result.data

    if not user:
        new_user = {
            "firebase_uid": google_uid,
            "email": email,
            "department": parsed.get("department"),
            "batch_year": parsed.get("batch_year"),
            "profile_complete": False,
            "role": "student"
        }
        res = supabase.table("users").insert(new_user).execute()
        user = res.data[0]

    access_token = create_jwt(user["id"])
    return SupabaseLoginResponse(
        access_token=access_token,
        user_id=user["id"],
        profile_complete=user["profile_complete"],
        parsed=parsed
    )

@router.post("/complete-profile", response_model=CompleteProfileResponse)
async def complete_profile(req: CompleteProfileRequest, current_user: CurrentUser = Depends(get_unverified_user)) -> CompleteProfileResponse:
    res = supabase.table("users").select("id").eq("register_number", req.register_number).neq("id", current_user.id).execute()
    if res.data:
        raise HTTPException(
            status_code=400, 
            detail={"error": "REGISTER_NUMBER_TAKEN", "message": "Register number already in use"}
        )
    
    update_data = req.model_dump(exclude_none=True)
    update_data["profile_complete"] = True
    
    supabase.table("users").update(update_data).eq("id", current_user.id).execute()
    
    new_token = create_jwt(current_user.id)
    return CompleteProfileResponse(
        message="Profile completed successfully",
        access_token=new_token
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: CurrentUser = Depends(get_current_user)) -> UserResponse:
    res = supabase.table("users").select("*").eq("id", current_user.id).single().execute()
    return UserResponse(**res.data)
