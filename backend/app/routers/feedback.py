from fastapi import APIRouter, Depends, HTTPException
from app.db import supabase
from app.dependencies import get_current_user, CurrentUser
from app.models.feedback import FeedbackCreate, FeedbackResponse

router = APIRouter()

@router.post("", response_model=FeedbackResponse)
async def create_feedback(
    req: FeedbackCreate,
    current_user: CurrentUser = Depends(get_current_user)
) -> FeedbackResponse:
    new_feedback = {
        "user_id": current_user.id,
        "message": req.message,
        "rating": req.rating
    }
    
    res = supabase.table("feedbacks").insert(new_feedback).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail={"error": "SUBMIT_FAILED", "message": "Failed to save feedback"})
    return FeedbackResponse(**res.data[0])
