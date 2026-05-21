from pydantic import BaseModel
from typing import Optional, List
from datetime import date

class ListingBase(BaseModel):
    title: str
    description: Optional[str] = None
    item_type: str
    size: Optional[str] = None
    color: Optional[str] = None
    max_borrow_days: int = 3

class ListingResponse(ListingBase):
    id: str
    owner_id: str
    image_url: Optional[str] = None
    status: str
    created_at: str

class PaginatedListings(BaseModel):
    items: List[ListingResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class BorrowRequestCreate(BaseModel):
    reason: Optional[str] = None
    borrow_from: date
    borrow_until: date

class BorrowRequestResponse(BaseModel):
    id: str
    listing_id: str
    borrower_id: str
    reason: Optional[str] = None
    borrow_from: date
    borrow_until: date
    status: str
    created_at: str
    lend_listings: Optional[ListingResponse] = None

class PaginatedRequests(BaseModel):
    items: List[BorrowRequestResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
