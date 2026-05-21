from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

class LostItemResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    item_type: str
    color: Optional[str] = None
    location_lost: Optional[str] = None
    date_lost: Optional[date] = None
    image_url: Optional[str] = None
    status: str
    created_at: datetime

class FoundItemResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    item_type: str
    color: Optional[str] = None
    location_found: Optional[str] = None
    date_found: Optional[date] = None
    image_url: Optional[str] = None
    status: str
    created_at: datetime

class PaginatedLostItems(BaseModel):
    items: List[LostItemResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class PaginatedFoundItems(BaseModel):
    items: List[FoundItemResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class ReportCreate(BaseModel):
    target_type: str = Field(..., pattern="^(lost_item|found_item|lend_listing|item_request|user)$")
    target_id: str
    reason: str

class ReportResponse(BaseModel):
    id: str
    reporter_id: str
    target_type: str
    target_id: str
    reason: str
    status: str
    resolved_by: Optional[str] = None
    created_at: datetime
