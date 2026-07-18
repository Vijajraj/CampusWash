import os
import math
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from pydantic import BaseModel, Field

from app.db import supabase
from app.dependencies import require_moderator, CurrentUser


router = APIRouter()

class ReportResolveRequest(BaseModel):
    action: str = Field(..., pattern="^(resolved|dismissed)$")

class UserRoleUpdate(BaseModel):
    role: str = Field(..., pattern="^(student|moderator|admin)$")

class PaginatedResponse(BaseModel):
    items: List[Dict[str, Any]]
    total: int
    page: int
    page_size: int
    total_pages: int

@router.get("/reports", response_model=PaginatedResponse)
async def get_reports(
    status: Optional[str] = Query(None, pattern="^(pending|resolved|dismissed)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: CurrentUser = Depends(require_moderator)
) -> PaginatedResponse:
    query = supabase.table("reports").select("*", count="exact")
    if status:
        query = query.eq("status", status)
        
    start = (page - 1) * page_size
    end = start + page_size - 1
    
    res = query.order("created_at", desc=True).range(start, end).execute()
    total = res.count or 0
    
    reporter_ids = list({row["reporter_id"] for row in res.data})
    email_map = {}
    if reporter_ids:
        users_res = supabase.table("users").select("id, email").in_("id", reporter_ids).execute()
        email_map = {u["id"]: u["email"] for u in users_res.data}
        
    items = []
    for row in res.data:
        target_preview = None
        target_type = row["target_type"]
        target_id = row["target_id"]
        
        table_map = {
            "lost_item": "lost_items",
            "found_item": "found_items",
            "lend_listing": "lend_listings",
            "wrong_delivery": "wrong_deliveries",
            "user": "users"
        }
        
        target_table = table_map.get(target_type)
        if target_table:
            fields = "name, email" if target_type == "user" else "title, description"
            target_res = supabase.table(target_table).select(fields).eq("id", target_id).maybe_single().execute()
            if target_res.data:
                target_preview = target_res.data
        
        row["target_preview"] = target_preview
        row["reporter_email"] = email_map.get(row["reporter_id"])
        items.append(row)
        
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total else 1
    )

@router.post("/reports/{id}/resolve")
async def resolve_report(
    id: str,
    req: ReportResolveRequest,
    current_user: CurrentUser = Depends(require_moderator)
) -> dict[str, str]:
    res = supabase.table("reports").select("id").eq("id", id).maybe_single().execute()
    if not res.data:
        raise HTTPException(404, detail={"error": "NOT_FOUND", "message": "Report not found"})
        
    update_data = {
        "status": req.action,
        "resolved_by": current_user.id
    }
    supabase.table("reports").update(update_data).eq("id", id).execute()
    return {"message": f"Report {req.action}"}

@router.get("/users", response_model=PaginatedResponse)
async def get_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: CurrentUser = Depends(require_moderator)
) -> PaginatedResponse:
    start = (page - 1) * page_size
    end = start + page_size - 1
    
    res = supabase.table("users").select("id, email, register_number, role, profile_complete, created_at", count="exact").order("created_at", desc=True).range(start, end).execute()
    total = res.count or 0
    
    return PaginatedResponse(
        items=res.data,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total else 1
    )

@router.patch("/users/{id}/role")
async def update_user_role(
    id: str,
    req: UserRoleUpdate,
    current_user: CurrentUser = Depends(require_moderator)
) -> dict[str, str]:
    if current_user.role != "admin":
        raise HTTPException(403, detail={"error": "FORBIDDEN", "message": "Admin access required"})
        
    res = supabase.table("users").select("id").eq("id", id).maybe_single().execute()
    if not res.data:
        raise HTTPException(404, detail={"error": "NOT_FOUND", "message": "User not found"})
        
    supabase.table("users").update({"role": req.role}).eq("id", id).execute()
    return {"message": f"User role updated to {req.role}"}
