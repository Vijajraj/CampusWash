import uuid
import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from datetime import date
from PIL import Image
import io

from app.db import supabase
from app.dependencies import get_current_user, CurrentUser
from app.models.items import (
    LostItemResponse, PaginatedLostItems,
    FoundItemResponse, PaginatedFoundItems,
    ReportCreate, ReportResponse
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


@router.get("/lost", response_model=PaginatedLostItems)
async def get_lost_items(
    type: Optional[str] = None,
    color: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
) -> PaginatedLostItems:
    query = supabase.table("lost_items").select("*", count="exact")
    if type:
        query = query.eq("item_type", type)
    if color:
        query = query.eq("color", color)
        
    start = (page - 1) * page_size
    end = start + page_size - 1
    
    res = query.order("created_at", desc=True).range(start, end).execute()
    total = res.count or 0
    
    return PaginatedLostItems(
        items=res.data,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total else 1
    )

@router.get("/found", response_model=PaginatedFoundItems)
async def get_found_items(
    type: Optional[str] = None,
    color: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
) -> PaginatedFoundItems:
    query = supabase.table("found_items").select("*", count="exact")
    if type:
        query = query.eq("item_type", type)
    if color:
        query = query.eq("color", color)
        
    start = (page - 1) * page_size
    end = start + page_size - 1
    
    res = query.order("created_at", desc=True).range(start, end).execute()
    total = res.count or 0
    
    return PaginatedFoundItems(
        items=res.data,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total else 1
    )

@router.post("/lost", response_model=LostItemResponse)
async def create_lost_item(
    title: str = Form(...),
    item_type: str = Form(...),
    description: Optional[str] = Form(None),
    color: Optional[str] = Form(None),
    location_lost: Optional[str] = Form(None),
    date_lost: Optional[date] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: CurrentUser = Depends(get_current_user)
) -> LostItemResponse:
    image_url = None
    if image:
        if image.content_type not in ["image/jpeg", "image/png"]:
            raise HTTPException(400, detail={"error": "INVALID_IMAGE", "message": "Only jpeg and png are allowed"})
        try:
            file_bytes = await image.read()
            compressed = compress(file_bytes)
            filename = f"{current_user.id}/{uuid.uuid4()}.jpg"
            supabase.storage.from_("item-images").upload(filename, compressed, {"content-type": "image/jpeg"})
            image_url = supabase.storage.from_("item-images").get_public_url(filename)
        except Exception:
            raise HTTPException(400, detail={"error": "UPLOAD_FAILED", "message": "Failed to upload image"})
            
    new_item = {
        "user_id": current_user.id,
        "title": title,
        "description": description,
        "item_type": item_type,
        "color": color,
        "location_lost": location_lost,
        "date_lost": date_lost.isoformat() if date_lost else None,
        "image_url": image_url,
        "status": "open"
    }
    
    res = supabase.table("lost_items").insert(new_item).execute()
    return LostItemResponse(**res.data[0])

@router.post("/found", response_model=FoundItemResponse)
async def create_found_item(
    title: str = Form(...),
    item_type: str = Form(...),
    description: Optional[str] = Form(None),
    color: Optional[str] = Form(None),
    location_found: Optional[str] = Form(None),
    date_found: Optional[date] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: CurrentUser = Depends(get_current_user)
) -> FoundItemResponse:
    image_url = None
    if image:
        if image.content_type not in ["image/jpeg", "image/png"]:
            raise HTTPException(400, detail={"error": "INVALID_IMAGE", "message": "Only jpeg and png are allowed"})
        try:
            file_bytes = await image.read()
            compressed = compress(file_bytes)
            filename = f"{current_user.id}/{uuid.uuid4()}.jpg"
            supabase.storage.from_("item-images").upload(filename, compressed, {"content-type": "image/jpeg"})
            image_url = supabase.storage.from_("item-images").get_public_url(filename)
        except Exception:
            raise HTTPException(400, detail={"error": "UPLOAD_FAILED", "message": "Failed to upload image"})
            
    new_item = {
        "user_id": current_user.id,
        "title": title,
        "description": description,
        "item_type": item_type,
        "color": color,
        "location_found": location_found,
        "date_found": date_found.isoformat() if date_found else None,
        "image_url": image_url,
        "status": "unclaimed"
    }
    
    res = supabase.table("found_items").insert(new_item).execute()
    return FoundItemResponse(**res.data[0])

@router.patch("/lost/{id}/close")
async def close_lost_item(id: str, current_user: CurrentUser = Depends(get_current_user)) -> dict[str, str]:
    res = supabase.table("lost_items").select("user_id").eq("id", id).maybe_single().execute()
    if not res.data:
        raise HTTPException(404, detail={"error": "NOT_FOUND", "message": "Lost item not found"})
        
    if res.data["user_id"] != current_user.id:
        raise HTTPException(403, detail={"error": "FORBIDDEN", "message": "Not the owner"})
        
    supabase.table("lost_items").update({"status": "closed"}).eq("id", id).execute()
    return {"message": "Lost item closed successfully"}

@router.patch("/found/{id}/claim")
async def claim_found_item(id: str, current_user: CurrentUser = Depends(get_current_user)) -> dict[str, str]:
    res = supabase.table("found_items").select("id, description").eq("id", id).maybe_single().execute()
    if not res.data:
        raise HTTPException(404, detail={"error": "NOT_FOUND", "message": "Found item not found"})
        
    desc = res.data.get("description") or ""
    new_desc = f"{desc}\n[Claimed By: {current_user.id}]" if desc else f"[Claimed By: {current_user.id}]"
    
    supabase.table("found_items").update({
        "status": "claimed",
        "description": new_desc
    }).eq("id", id).execute()
    return {"message": "Found item claimed successfully"}

@router.post("/report", response_model=ReportResponse)
async def report_item(
    req: ReportCreate,
    current_user: CurrentUser = Depends(get_current_user)
) -> ReportResponse:
    new_report = {
        "reporter_id": current_user.id,
        "target_type": req.target_type,
        "target_id": req.target_id,
        "reason": req.reason,
        "status": "pending"
    }
    
    res = supabase.table("reports").insert(new_report).execute()
    return ReportResponse(**res.data[0])
