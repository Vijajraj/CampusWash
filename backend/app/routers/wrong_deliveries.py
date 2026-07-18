from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Optional
from app.dependencies import get_current_user, CurrentUser
from app.db import supabase
from app.models.wrong_deliveries import WrongDeliveryCreate
from PIL import Image
import io, os

router = APIRouter(prefix="/wrong-deliveries", tags=["wrong-deliveries"])

def compress(b: bytes, w: int = 800) -> bytes:
    img = Image.open(io.BytesIO(b))
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    if img.width > w:
        img = img.resize((w, int(img.height * w / img.width)), Image.LANCZOS)
    out = io.BytesIO()
    img.save(out, format="JPEG", quality=75)
    return out.getvalue()

@router.get("")
async def get_wrong_deliveries(
    type: Optional[str] = None,
    color: Optional[str] = None,
    page: int = 1,
    page_size: int = 20
):
    query = supabase.table("wrong_deliveries") \
        .select("*", count="exact") \
        .eq("status", "unclaimed") \
        .order("created_at", desc=True)
    if type:
        query = query.eq("item_type", type)
    if color:
        query = query.ilike("color", f"%{color}%")
    offset = (page - 1) * page_size
    result = query.range(offset, offset + page_size - 1).execute()
    total = result.count or 0
    return {
        "items": result.data,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": -(-total // page_size)
    }

@router.get("/{id}")
async def get_wrong_delivery(id: str):
    result = supabase.table("wrong_deliveries") \
        .select("*") \
        .eq("id", id) \
        .single() \
        .execute()
    if not result.data:
        raise HTTPException(404, detail={
            "error": "NOT_FOUND",
            "message": "Post not found"
        })
    return result.data

@router.post("")
async def post_wrong_delivery(
    title: str = Form(...),
    description: str = Form(...),
    item_type: str = Form(...),
    color: Optional[str] = Form(None),
    any_marks: Optional[str] = Form(None),
    image: UploadFile = File(...),
    current_user: CurrentUser = Depends(get_current_user)
):
    if image.content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(400, detail={
            "error": "INVALID_FILE",
            "message": "Only JPEG and PNG images allowed"
        })
    file_bytes = await image.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(400, detail={
            "error": "FILE_TOO_LARGE",
            "message": "Image must be under 5MB"
        })
    compressed = compress(file_bytes)
    path = f"wrong-delivery/{current_user.id}/{image.filename}"
    supabase.storage.from_("item-images").upload(
        path, compressed,
        {"content-type": "image/jpeg", "upsert": "true"}
    )
    url = supabase.storage.from_("item-images").get_public_url(path)
    result = supabase.table("wrong_deliveries").insert({
        "poster_id": current_user.id,
        "title": title.strip(),
        "description": description.strip(),
        "item_type": item_type,
        "color": color,
        "any_marks": any_marks,
        "image_url": url,
    }).execute()
    return {"id": result.data[0]["id"]}

@router.patch("/{id}/claim")
async def claim_wrong_delivery(
    id: str,
    current_user: CurrentUser = Depends(get_current_user)
):
    existing = supabase.table("wrong_deliveries") \
        .select("poster_id, status") \
        .eq("id", id) \
        .single() \
        .execute()
    if not existing.data:
        raise HTTPException(404, detail={
            "error": "NOT_FOUND", "message": "Post not found"
        })
    if existing.data["poster_id"] == current_user.id:
        raise HTTPException(403, detail={
            "error": "FORBIDDEN",
            "message": "You cannot claim your own post"
        })
    if existing.data["status"] == "claimed":
        raise HTTPException(409, detail={
            "error": "ALREADY_CLAIMED",
            "message": "This item has already been claimed"
        })
    supabase.table("wrong_deliveries").update({
        "status": "claimed",
        "claimed_by": current_user.id
    }).eq("id", id).execute()
    return {"message": "Claimed successfully"}

@router.delete("/{id}")
async def delete_wrong_delivery(
    id: str,
    current_user: CurrentUser = Depends(get_current_user)
):
    existing = supabase.table("wrong_deliveries") \
        .select("poster_id, status") \
        .eq("id", id) \
        .single() \
        .execute()
    if not existing.data:
        raise HTTPException(404, detail={
            "error": "NOT_FOUND", "message": "Post not found"
        })
    if existing.data["poster_id"] != current_user.id:
        raise HTTPException(403, detail={
            "error": "FORBIDDEN",
            "message": "You can only delete your own posts"
        })
    if existing.data["status"] == "claimed":
        raise HTTPException(409, detail={
            "error": "ALREADY_CLAIMED",
            "message": "Cannot delete a claimed post"
        })
    supabase.table("wrong_deliveries") \
        .delete().eq("id", id).execute()
    return {"message": "Post removed"}

@router.post("/{id}/report")
async def report_wrong_delivery(
    id: str,
    reason: str = Form(...),
    current_user: CurrentUser = Depends(get_current_user)
):
    supabase.table("reports").insert({
        "reporter_id": current_user.id,
        "target_type": "wrong_delivery",
        "target_id": id,
        "reason": reason
    }).execute()
    return {"message": "Report submitted"}
