import math
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query

from app.db import supabase
from app.dependencies import get_current_user, CurrentUser
from app.models.requests import (
    ItemRequestCreate, ItemRequestResponse, PaginatedItemRequests,
    RequestResponseCreate, RequestResponseItem
)

router = APIRouter()

@router.get("", response_model=PaginatedItemRequests)
async def get_requests(
    type: Optional[str] = None,
    size: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
) -> PaginatedItemRequests:
    now_iso = datetime.now(timezone.utc).isoformat()
    
    query = supabase.table("item_requests").select("*", count="exact")
    query = query.eq("status", "open").gt("expires_at", now_iso)
    
    if type:
        query = query.eq("item_type", type)
    if size:
        query = query.eq("size", size)
        
    start = (page - 1) * page_size
    end = start + page_size - 1
    
    res = query.order("created_at", desc=True).range(start, end).execute()
    total = res.count or 0
    
    return PaginatedItemRequests(
        items=res.data,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total else 1
    )

@router.post("", response_model=ItemRequestResponse)
async def create_request(
    req: ItemRequestCreate,
    current_user: CurrentUser = Depends(get_current_user)
) -> ItemRequestResponse:
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    new_request = {
        "requester_id": current_user.id,
        "title": req.title,
        "description": req.description,
        "item_type": req.item_type,
        "size": req.size,
        "color": req.color,
        "needed_by": req.needed_by.isoformat() if req.needed_by else None,
        "status": "open",
        "expires_at": expires_at.isoformat()
    }
    
    res = supabase.table("item_requests").insert(new_request).execute()
    return ItemRequestResponse(**res.data[0])

@router.delete("/{id}")
async def delete_request(id: str, current_user: CurrentUser = Depends(get_current_user)) -> dict[str, str]:
    res = supabase.table("item_requests").select("requester_id").eq("id", id).maybe_single().execute()
    if not res.data:
        raise HTTPException(404, detail={"error": "NOT_FOUND", "message": "Request not found"})
        
    if res.data["requester_id"] != current_user.id:
        raise HTTPException(403, detail={"error": "FORBIDDEN", "message": "Not the owner"})
        
    supabase.table("item_requests").delete().eq("id", id).execute()
    return {"message": "Request deleted successfully"}

@router.post("/{id}/respond", response_model=RequestResponseItem)
async def respond_to_request(
    id: str,
    req: RequestResponseCreate,
    current_user: CurrentUser = Depends(get_current_user)
) -> RequestResponseItem:
    res = supabase.table("item_requests").select("requester_id").eq("id", id).maybe_single().execute()
    if not res.data:
        raise HTTPException(404, detail={"error": "NOT_FOUND", "message": "Request not found"})
        
    if res.data["requester_id"] == current_user.id:
        raise HTTPException(403, detail={"error": "FORBIDDEN", "message": "Cannot respond to own request"})
        
    check = supabase.table("request_responses").select("id").eq("request_id", id).eq("responder_id", current_user.id).execute()
    if check.data:
        raise HTTPException(409, detail={"error": "ALREADY_RESPONDED", "message": "You already responded to this request"})
        
    new_response = {
        "request_id": id,
        "responder_id": current_user.id,
        "message": req.message
    }
    
    try:
        ins_res = supabase.table("request_responses").insert(new_response).execute()
        return RequestResponseItem(**ins_res.data[0])
    except Exception:
        raise HTTPException(409, detail={"error": "ALREADY_RESPONDED", "message": "You already responded to this request"})

@router.get("/{id}/responses", response_model=List[RequestResponseItem])
async def get_responses(id: str, current_user: CurrentUser = Depends(get_current_user)) -> List[RequestResponseItem]:
    res = supabase.table("item_requests").select("requester_id").eq("id", id).maybe_single().execute()
    if not res.data:
        raise HTTPException(404, detail={"error": "NOT_FOUND", "message": "Request not found"})
        
    if res.data["requester_id"] != current_user.id:
        raise HTTPException(403, detail={"error": "FORBIDDEN", "message": "Not the owner"})
        
    resp_res = supabase.table("request_responses").select("*").eq("request_id", id).order("created_at", desc=False).execute()
    return [RequestResponseItem(**x) for x in resp_res.data]

@router.patch("/{id}/fulfill")
async def fulfill_request(id: str, current_user: CurrentUser = Depends(get_current_user)) -> dict[str, str]:
    res = supabase.table("item_requests").select("requester_id").eq("id", id).maybe_single().execute()
    if not res.data:
        raise HTTPException(404, detail={"error": "NOT_FOUND", "message": "Request not found"})
        
    if res.data["requester_id"] != current_user.id:
        raise HTTPException(403, detail={"error": "FORBIDDEN", "message": "Not the owner"})
        
    supabase.table("item_requests").update({"status": "fulfilled"}).eq("id", id).execute()
    return {"message": "Request fulfilled"}
