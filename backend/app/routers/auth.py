import os
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Response
from jose import jwt

from app.db import supabase
from app.models.auth import (
    ClerkLoginRequest, LoginResponse,
    CompleteProfileRequest, CompleteProfileResponse,
    UserResponse
)
from app.dependencies import get_current_user, get_unverified_user, CurrentUser
from app.utils.email_parser import validate_college_email, parse_college_email

router = APIRouter()

def create_jwt(user_id: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(days=30)
    to_encode = {"sub": user_id, "exp": expires}
    return jwt.encode(to_encode, os.getenv("JWT_SECRET", ""), algorithm="HS256")

@router.post("/clerk-login", response_model=LoginResponse)
async def clerk_login(req: ClerkLoginRequest) -> LoginResponse:
    email = None
    clerk_uid = None
    
    clerk_pub_key = os.getenv("CLERK_PEM_PUBLIC_KEY")
    clerk_secret_key = os.getenv("CLERK_SECRET_KEY")
    
    # 1. Attempt offline JWT signature verification (if public key is provided)
    if clerk_pub_key:
        try:
            decoded_token = jwt.decode(
                req.clerk_token,
                clerk_pub_key,
                algorithms=["RS256"],
                options={"verify_aud": False}
            )
            clerk_uid = decoded_token.get("sub")
            email = decoded_token.get("email")  # Email is in claims if custom session template is configured
        except Exception as e:
            raise HTTPException(
                status_code=401,
                detail={"error": "INVALID_CLERK_TOKEN", "message": f"Failed to verify Clerk token offline: {str(e)}"}
            )
            
    # 2. Fetch via Clerk API (if email isn't in claims or public key isn't provided, and secret key exists)
    if (not email or not clerk_uid) and clerk_secret_key:
        import httpx
        try:
            if not clerk_uid:
                unverified = jwt.get_unverified_claims(req.clerk_token)
                clerk_uid = unverified.get("sub")
                
            if not clerk_uid:
                raise ValueError("No user ID (sub) found in token")
                
            headers = {"Authorization": f"Bearer {clerk_secret_key}"}
            async with httpx.AsyncClient() as client:
                response = await client.get(f"https://api.clerk.com/v1/users/{clerk_uid}", headers=headers)
                
            if response.status_code != 200:
                raise HTTPException(
                    status_code=401,
                    detail={"error": "CLERK_API_ERROR", "message": f"Clerk API returned status {response.status_code}: {response.text}"}
                )
                
            clerk_user = response.json()
            email_addresses = clerk_user.get("email_addresses", [])
            primary_email_id = clerk_user.get("primary_email_address_id")
            for email_obj in email_addresses:
                if email_obj.get("id") == primary_email_id:
                    email = email_obj.get("email_address")
                    break
            if not email and email_addresses:
                email = email_addresses[0].get("email_address")
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(
                status_code=401,
                detail={"error": "INVALID_CLERK_TOKEN", "message": f"Failed to verify Clerk token via API: {str(e)}"}
            )
            
    if not clerk_uid:
        raise HTTPException(
            status_code=401,
            detail={"error": "INVALID_CLERK_TOKEN", "message": "Clerk user ID could not be determined. Check CLERK_PEM_PUBLIC_KEY or CLERK_SECRET_KEY."}
        )
        
    if not email:
        raise HTTPException(
            status_code=400,
            detail={"error": "NO_EMAIL", "message": "Clerk user account does not contain an email address"}
        )
        

    parsed = parse_college_email(email)
    
    # Check if user exists in database (we map clerk_uid to the existing firebase_uid column)
    result = supabase.table("users").select("*").eq("firebase_uid", clerk_uid).maybe_single().execute()
    user = result.data
    
    if not user:
        # Check if the user exists by email (created during Firebase era)
        result_by_email = supabase.table("users").select("*").eq("email", email).maybe_single().execute()
        existing_user_by_email = result_by_email.data
        
        if existing_user_by_email:
            # Update their external UID to Clerk User ID (clerk_uid)
            res = supabase.table("users").update({"firebase_uid": clerk_uid}).eq("id", existing_user_by_email["id"]).execute()
            user = res.data[0]
            print(f"ℹ️ Migrated existing user {email} from Firebase UID to Clerk UID: {clerk_uid}")
        else:
            # Completely new user, insert a new record
            new_user = {
                "firebase_uid": clerk_uid,
                "email": email,
                "department": parsed.get("department"),
                "batch_year": parsed.get("batch_year"),
                "profile_complete": False,
                "role": "student"
            }
            res = supabase.table("users").insert(new_user).execute()
            user = res.data[0]
        
    access_token = create_jwt(user["id"])
    
    return LoginResponse(
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
