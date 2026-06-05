from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class FirebaseLoginRequest(BaseModel):
    firebase_token: str

class LoginResponse(BaseModel):
    access_token: str
    user_id: str
    profile_complete: bool
    parsed: Dict[str, Any]

class CompleteProfileRequest(BaseModel):
    name: str
    register_number: str = Field(min_length=6, pattern=r'^\S+$')
    department: str
    batch_year: str
    phone: Optional[str] = None

class CompleteProfileResponse(BaseModel):
    message: str
    access_token: str

class UserResponse(BaseModel):
    id: str
    firebase_uid: str
    email: str
    name: Optional[str] = None
    register_number: Optional[str] = None
    department: Optional[str] = None
    batch_year: Optional[str] = None
    phone: Optional[str] = None
    profile_complete: bool
    role: str
    created_at: str
