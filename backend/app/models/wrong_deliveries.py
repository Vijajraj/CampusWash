from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime

class WrongDeliveryCreate(BaseModel):
    title: str
    description: str
    item_type: str
    color: Optional[str] = None
    any_marks: Optional[str] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if len(v.strip()) < 3:
            raise ValueError("Title must be at least 3 characters")
        return v.strip()

    @field_validator("description")
    @classmethod
    def description_not_empty(cls, v: str) -> str:
        if len(v.strip()) < 10:
            raise ValueError("Description must be at least 10 characters")
        return v.strip()

class WrongDeliveryResponse(BaseModel):
    id: str
    poster_id: str
    title: str
    description: str
    item_type: str
    color: Optional[str]
    any_marks: Optional[str]
    image_url: Optional[str]
    status: str
    claimed_by: Optional[str]
    created_at: datetime
