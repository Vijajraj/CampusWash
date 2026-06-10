from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class FeedbackCreate(BaseModel):
    message: str = Field(..., min_length=5)
    rating: Optional[int] = Field(None, ge=1, le=5)

class FeedbackResponse(BaseModel):
    id: str
    user_id: str
    message: str
    rating: Optional[int] = None
    created_at: datetime
