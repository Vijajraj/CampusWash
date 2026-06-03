import os
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Response
from jose import jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import httpx

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
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

def create_jwt(user_id: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(days=30)
    to_encode = {"sub": user_id, "exp": expires}
    return jwt.encode(to_encode, os.getenv("JWT_SECRET", ""), algorithm="HS256")

@router.post("/supabase-login", response_model=SupabaseLoginResponse)
async def supabase_login(req: SupabaseLoginRequest, response: Response) -> SupabaseLoginResponse:
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
    
    # Set HTTPOnly Cookie
    response.set_cookie(
        key="token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        path="/",
        max_age=30 * 24 * 3600  # 30 days
    )
    
    return SupabaseLoginResponse(
        access_token=access_token,
        user_id=user["id"],
        profile_complete=user["profile_complete"],
        parsed=parsed
    )

@router.post("/google-login", response_model=SupabaseLoginResponse)
async def google_login(req: GoogleLoginRequest, response: Response) -> SupabaseLoginResponse:
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail={"error": "CONFIG_ERROR", "message": "Google Client configuration missing on server"}
        )
    
    # Exchange auth code for tokens
    async with httpx.AsyncClient() as client:
        try:
            token_res = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": req.code,
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "redirect_uri": "postmessage",
                    "grant_type": "authorization_code",
                }
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail={"error": "NETWORK_ERROR", "message": f"Failed to connect to Google OAuth: {str(e)}"}
            )

    if token_res.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail={"error": "OAUTH_EXCHANGE_FAILED", "message": f"Google auth code exchange failed: {token_res.text}"}
        )

    token_data = token_res.json()
    id_token_val = token_data.get("id_token")
    if not id_token_val:
        raise HTTPException(
            status_code=400,
            detail={"error": "NO_ID_TOKEN", "message": "Google response did not contain an ID token"}
        )

    try:
        idinfo = id_token.verify_oauth2_token(
            id_token_val,
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
    
    # Set HTTPOnly Cookie
    response.set_cookie(
        key="token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        path="/",
        max_age=30 * 24 * 3600  # 30 days
    )
    
    return SupabaseLoginResponse(
        access_token=access_token,
        user_id=user["id"],
        profile_complete=user["profile_complete"],
        parsed=parsed
    )

@router.post("/logout")
async def logout(response: Response):
    # Clear HTTPOnly Cookie
    response.delete_cookie(
        key="token",
        path="/",
        httponly=True,
        secure=True,
        samesite="lax"
    )
    return {"message": "Logged out successfully"}

@router.post("/complete-profile", response_model=CompleteProfileResponse)
async def complete_profile(req: CompleteProfileRequest, response: Response, current_user: CurrentUser = Depends(get_unverified_user)) -> CompleteProfileResponse:
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
    
    # Update HTTPOnly Cookie with new token containing updated claims
    response.set_cookie(
        key="token",
        value=new_token,
        httponly=True,
        secure=True,
        samesite="lax",
        path="/",
        max_age=30 * 24 * 3600  # 30 days
    )
    
    return CompleteProfileResponse(
        message="Profile completed successfully",
        access_token=new_token
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: CurrentUser = Depends(get_current_user)) -> UserResponse:
    res = supabase.table("users").select("*").eq("id", current_user.id).single().execute()
    return UserResponse(**res.data)
