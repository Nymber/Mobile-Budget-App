from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

# Local imports
from db_env import Account, Feedback
from settings.db_settings import get_db
from auth import get_current_user

router = APIRouter()

class FeedbackCreate(BaseModel):
    message: str
    type: str
    rating: int

class FeedbackResponse(BaseModel):
    id: int
    username: str
    message: str
    type: str
    rating: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

@router.post("/api/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    feedback: FeedbackCreate, 
    current_user: Account = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Submit user feedback"""
    try:
        # Validate the rating is between 0-5
        if feedback.rating < 0 or feedback.rating > 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rating must be between 0 and 5"
            )
            
        # Create new feedback record
        new_feedback = Feedback(
            username=current_user.username,
            message=feedback.message,
            type=feedback.type,
            rating=feedback.rating,
            timestamp=datetime.now(timezone.utc)
        )
        
        db.add(new_feedback)
        db.commit()
        db.refresh(new_feedback)
        
        return new_feedback
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit feedback: {str(e)}"
        )

@router.get("/api/feedback")
async def get_feedback(
    current_user: Account = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user feedback (only for administrators)"""
    # Check if user has admin privileges
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view feedback"
        )
        
    feedback_items = db.query(Feedback).order_by(Feedback.timestamp.desc()).all()
    
    return [
        {
            "id": feedback.id,
            "username": feedback.username,
            "message": feedback.message,
            "type": feedback.type,
            "rating": feedback.rating,
            "timestamp": feedback.timestamp
        }
        for feedback in feedback_items
    ]
