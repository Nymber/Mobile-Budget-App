# Description: Expense routes for the FastAPI application
from datetime import datetime, timezone
from fastapi import Depends, HTTPException, status, APIRouter
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

# Local imports
from db_env import Account, Expense
from settings.db_settings import get_db
from auth import get_current_user

router = APIRouter()

# Expense model
class ExpenseCreate(BaseModel):
    name: str
    price: float
    repeating: bool = False

class ExpenseUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    repeating: Optional[bool] = None

class ExpenseResponse(BaseModel):
    id: int
    username: str
    name: str
    price: float
    repeating: bool
    timestamp: datetime
    
    class Config:
        orm_mode = True

# Expense Routes
@router.post("/expenses", response_model=ExpenseResponse)
async def create_expense(expense: ExpenseCreate, current_user: Account = Depends(get_current_user), db: Session = Depends(get_db)):
    new_expense = Expense(
        username=current_user.username,
        name=expense.name,
        price=expense.price,
        repeating=expense.repeating,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense

@router.get("/expenses", response_model=List[ExpenseResponse])
async def get_expenses(
    current_user: Account = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    expenses = db.query(Expense).filter(
        Expense.username == current_user.username
    ).offset(skip).limit(limit).all()
    return expenses

@router.get("/expenses/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    expense_id: int, 
    current_user: Account = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.username == current_user.username
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    return expense

@router.put("/expenses/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: int,
    expense_data: ExpenseUpdate,
    current_user: Account = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id, 
        Expense.username == current_user.username
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Update only provided fields
    update_data = expense_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(expense, key, value)
    
    db.commit()
    db.refresh(expense)
    return expense

@router.delete("/expenses/{expense_id}")
async def delete_expense(
    expense_id: int,
    current_user: Account = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id, 
        Expense.username == current_user.username
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    db.delete(expense)
    db.commit()
    return {"detail": "Expense deleted successfully"}