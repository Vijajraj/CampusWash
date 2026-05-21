from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class ItemRequestCreate(BaseModel):
    title: str
    description: Optional[str] = None
    item_type: str
    size: Optional[str] = None
    color: Optional[str] = None
    needed_by: Optional[date] = None

class ItemRequestResponse(BaseModel):
    id: str
    requester_id: str
    title: str
    description: Optional[str] = None
    item_type: str
    size: Optional[str] = None
    color: Optional[str] = None
    needed_by: Optional[date] = None
    status: str
    expires_at: datetime
    created_at: datetime

class PaginatedItemRequests(BaseModel):
    items: List[ItemRequestResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class RequestResponseCreate(BaseModel):
    message: str

class RequestResponseItem(BaseModel):
    id: str
    request_id: str
    responder_id: str
    message: str
    created_at: datetime
