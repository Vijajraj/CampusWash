import uuid
import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from PIL import Image
import io

from app.db import supabase
from app.dependencies import get_current_user, CurrentUser
from app.models.borrow import (
    ListingResponse, PaginatedListings,
    BorrowRequestCreate, BorrowRequestResponse, PaginatedRequests
)

router = APIRouter()

def compress(b: bytes, w: int = 600) -> bytes:
    img = Image.open(io.BytesIO(b))
    if img.width > w:
        img = img.resize((w, int(img.height*w/img.width)), Image.LANCZOS)
    out = io.BytesIO()
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    img.save(out, format="JPEG", quality=50, optimize=True)
    return out.getvalue()

@router.get("/listings", response_model=PaginatedListings)
async def get_listings(
    type: Optional[str] = None,
    size: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
) -> PaginatedListings:
    query = supabase.table("lend_listings").select("*", count="exact")
    if type:
        query = query.eq("item_type", type)
    if size:
        query = query.eq("size", size)
        
    start = (page - 1) * page_size
    end = start + page_size - 1
    
    res = query.order("created_at", desc=True).range(start, end).execute()
    total = res.count or 0
    return PaginatedListings(
        items=res.data,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total else 1
    )

@router.post("/listings", response_model=ListingResponse)
async def create_listing(
    title: str = Form(...),
    item_type: str = Form(...),
    description: Optional[str] = Form(None),
    size: Optional[str] = Form(None),
    color: Optional[str] = Form(None),
    max_borrow_days: int = Form(3),
    image: Optional[UploadFile] = File(None),
    current_user: CurrentUser = Depends(get_current_user)
) -> ListingResponse:
    image_url = None
    if image:
        try:
            file_bytes = await image.read()
            compressed = compress(file_bytes)
            filename = f"{current_user.id}/{uuid.uuid4()}.jpg"
            supabase.storage.from_("lend-images").upload(filename, compressed, {"content-type": "image/jpeg"})
            image_url = supabase.storage.from_("lend-images").get_public_url(filename)
        except Exception:
            raise HTTPException(400, detail={"error": "UPLOAD_FAILED", "message": "Failed to upload image"})
            
    new_listing = {
        "owner_id": current_user.id,
        "title": title,
        "description": description,
        "item_type": item_type,
        "size": size,
        "color": color,
        "max_borrow_days": max_borrow_days,
        "image_url": image_url,
        "status": "available"
    }
    
    res = supabase.table("lend_listings").insert(new_listing).execute()
    return ListingResponse(**res.data[0])

@router.delete("/listings/{id}")
async def delete_listing(id: str, current_user: CurrentUser = Depends(get_current_user)) -> dict[str, str]:
    res = supabase.table("lend_listings").select("owner_id, status").eq("id", id).maybe_single().execute()
    if not res.data:
        raise HTTPException(404, detail={"error": "NOT_FOUND", "message": "Listing not found"})
        
    listing = res.data
    if listing["owner_id"] != current_user.id:
        raise HTTPException(403, detail={"error": "FORBIDDEN", "message": "Not the owner"})
        
    if listing["status"] == "borrowed":
        raise HTTPException(403, detail={"error": "FORBIDDEN", "message": "Cannot delete borrowed listing"})
        
    supabase.table("lend_listings").delete().eq("id", id).execute()
    return {"message": "Listing deleted successfully"}

@router.get("/listings/{id}", response_model=ListingResponse)
async def get_listing(id: str) -> ListingResponse:
    res = supabase.table("lend_listings").select("*").eq("id", id).maybe_single().execute()
    if not res.data:
        raise HTTPException(404, detail={"error": "NOT_FOUND", "message": "Listing not found"})
    return ListingResponse(**res.data)

@router.post("/listings/{id}/request", response_model=BorrowRequestResponse)
async def request_borrow(
    id: str,
    req: BorrowRequestCreate,
    current_user: CurrentUser = Depends(get_current_user)
) -> BorrowRequestResponse:
    res = supabase.table("lend_listings").select("owner_id, max_borrow_days").eq("id", id).maybe_single().execute()
    if not res.data:
        raise HTTPException(404, detail={"error": "NOT_FOUND", "message": "Listing not found"})
        
    listing = res.data
    if listing["owner_id"] == current_user.id:
        raise HTTPException(403, detail={"error": "FORBIDDEN", "message": "Owner cannot request own listing"})
        
    delta = req.borrow_until - req.borrow_from
    if delta.days > listing["max_borrow_days"] or delta.days < 0:
        raise HTTPException(400, detail={"error": "INVALID_DATES", "message": "Exceeds max borrow days"})
        
    overlaps = supabase.table("borrow_requests").select("id").eq("listing_id", id).eq("status", "approved").lte("borrow_from", req.borrow_until.isoformat()).gte("borrow_until", req.borrow_from.isoformat()).execute()
    if overlaps.data:
        raise HTTPException(409, detail={"error": "BORROW_CONFLICT", "message": "Dates overlap with existing approved request"})
        
    new_req = {
        "listing_id": id,
        "borrower_id": current_user.id,
        "reason": req.reason,
        "borrow_from": req.borrow_from.isoformat(),
        "borrow_until": req.borrow_until.isoformat(),
        "status": "pending"
    }
    
    ins_res = supabase.table("borrow_requests").insert(new_req).execute()
    return BorrowRequestResponse(**ins_res.data[0])

@router.get("/my-requests", response_model=PaginatedRequests)
async def get_my_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: CurrentUser = Depends(get_current_user)
) -> PaginatedRequests:
    start = (page - 1) * page_size
    end = start + page_size - 1
    
    res = supabase.table("borrow_requests").select("*, lend_listings(*)", count="exact").eq("borrower_id", current_user.id).order("created_at", desc=True).range(start, end).execute()
    
    total = res.count or 0
    return PaginatedRequests(
        items=res.data,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total else 1
    )

@router.get("/my-listings-requests", response_model=PaginatedRequests)
async def get_my_listings_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: CurrentUser = Depends(get_current_user)
) -> PaginatedRequests:
    start = (page - 1) * page_size
    end = start + page_size - 1
    
    res = supabase.table("borrow_requests").select("*, lend_listings!inner(*)", count="exact").eq("lend_listings.owner_id", current_user.id).order("created_at", desc=True).range(start, end).execute()
    
    total = res.count or 0
    return PaginatedRequests(
        items=res.data,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total else 1
    )

@router.patch("/requests/{id}/approve")
async def approve_request(id: str, current_user: CurrentUser = Depends(get_current_user)) -> dict[str, str]:
    res = supabase.table("borrow_requests").select("*, lend_listings!inner(owner_id)").eq("id", id).maybe_single().execute()
    if not res.data:
        raise HTTPException(404, detail={"error": "NOT_FOUND", "message": "Request not found"})
        
    req = res.data
    if req["lend_listings"]["owner_id"] != current_user.id:
        raise HTTPException(403, detail={"error": "FORBIDDEN", "message": "Not the owner"})
        
    supabase.table("borrow_requests").update({"status": "approved"}).eq("id", id).execute()
    supabase.table("lend_listings").update({"status": "borrowed"}).eq("id", req["listing_id"]).execute()
    return {"message": "Approved"}

@router.patch("/requests/{id}/reject")
async def reject_request(id: str, current_user: CurrentUser = Depends(get_current_user)) -> dict[str, str]:
    res = supabase.table("borrow_requests").select("*, lend_listings!inner(owner_id)").eq("id", id).maybe_single().execute()
    if not res.data:
        raise HTTPException(404, detail={"error": "NOT_FOUND", "message": "Request not found"})
        
    req = res.data
    if req["lend_listings"]["owner_id"] != current_user.id:
        raise HTTPException(403, detail={"error": "FORBIDDEN", "message": "Not the owner"})
        
    supabase.table("borrow_requests").update({"status": "rejected"}).eq("id", id).execute()
    return {"message": "Rejected"}

@router.patch("/requests/{id}/return")
async def return_request(id: str, current_user: CurrentUser = Depends(get_current_user)) -> dict[str, str]:
    res = supabase.table("borrow_requests").select("*, lend_listings!inner(owner_id)").eq("id", id).maybe_single().execute()
    if not res.data:
        raise HTTPException(404, detail={"error": "NOT_FOUND", "message": "Request not found"})
        
    req = res.data
    if req["lend_listings"]["owner_id"] != current_user.id:
        raise HTTPException(403, detail={"error": "FORBIDDEN", "message": "Not the owner"})
        
    supabase.table("borrow_requests").update({"status": "returned"}).eq("id", id).execute()
    supabase.table("lend_listings").update({"status": "available"}).eq("id", req["listing_id"]).execute()
    return {"message": "Returned"}
