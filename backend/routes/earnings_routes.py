# Description: Earnings routes for the FastAPI application
from datetime import datetime, timezone
from fastapi import Depends, HTTPException, APIRouter
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

# Local imports
from db_env import Account, DailyEarning
from settings.db_settings import get_db
from auth import get_current_user

router = APIRouter()

# Earnings model
class EarningsCreate(BaseModel):
    cash_tips: float
    salary: float
    hours: float
    hourly_rate: float

# Earnings Routes
@router.post("/earnings")
async def create_earnings(earnings: EarningsCreate, current_user: Account = Depends(get_current_user), db: Session = Depends(get_db)):
    new_earning = DailyEarning(
        username=current_user.username,
        cash_tips=earnings.cash_tips,
        salary=earnings.salary,
        hours=earnings.hours,
        hourly_rate=earnings.hourly_rate,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(new_earning)
    db.commit()
    db.refresh(new_earning)
    return new_earning

@router.get("/earnings")
async def get_earnings(
    current_user: Account = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10,
    source: Optional[str] = None
):
    query = db.query(DailyEarning).filter(DailyEarning.username == current_user.username)
    if source:
        query = query.filter(DailyEarning.source == source)
    earnings = query.offset(skip).limit(limit).all()
    return earnings

@router.get("/earnings/{earning_id}")
async def get_earning(earning_id: int, current_user: Account = Depends(get_current_user), db: Session = Depends(get_db)):
    earning = db.query(DailyEarning).filter(
        DailyEarning.id == earning_id,
        DailyEarning.username == current_user.username
    ).first()
    
    if not earning:
        raise HTTPException(status_code=404, detail="Earning not found")
    
    return {
        "id": earning.id,
        "timestamp": earning.timestamp,
        "salary": earning.salary,
        "hourly_rate": earning.hourly_rate,
        "hours": earning.hours,
        "cash_tips": earning.cash_tips
    }

@router.put("/earnings/{earning_id}")
async def update_earning(
    earning_id: int,
    earning_data: dict,
    current_user: Account = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    earning = db.query(DailyEarning).filter(
        DailyEarning.id == earning_id, DailyEarning.username == current_user.username
    ).first()
    if not earning:
        raise HTTPException(status_code=404, detail="Earning not found")
    for key, value in earning_data.items():
        if hasattr(earning, key):
            setattr(earning, key, value)
    db.commit()
    db.refresh(earning)
    return earning

@router.delete("/earnings/{earning_id}")
async def delete_earning(
    earning_id: int,
    current_user: Account = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    earning = db.query(DailyEarning).filter(
        DailyEarning.id == earning_id, DailyEarning.username == current_user.username
    ).first()
    if not earning:
        raise HTTPException(status_code=404, detail="Earning not found")
    db.delete(earning)
    db.commit()
    return {"detail": "Earning deleted successfully"}