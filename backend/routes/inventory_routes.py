# Description: Inventory routes for the FastAPI application
from datetime import datetime, timezone
from fastapi import Depends, HTTPException, status, APIRouter
from sqlalchemy.orm import Session
from pydantic import BaseModel

# Local imports
from db_env import Account, InventoryItem
from settings.db_settings import get_db
from auth import get_current_user
import env

router = APIRouter()

# Inventory model
class InventoryCreate(BaseModel):
    name: str
    quantity: float
    price: float

# Inventory Routes
@router.post("/inventory")
async def create_inventory_item(item: InventoryCreate, current_user: Account = Depends(get_current_user), db: Session = Depends(get_db)):
    new_item = InventoryItem(
        username=current_user.username,
        name=item.name,
        quantity=item.quantity,
        price=item.price,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(new_item)
    try:
        db.commit()
        db.refresh(new_item)
        return new_item
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create inventory item"
        )

@router.get("/inventory")
async def get_inventory(current_user: Account = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(InventoryItem).filter_by(username=current_user.username).all()
    return items

@router.put("/inventory/{item_id}")
async def update_inventory_item(item_id: int, item: InventoryCreate, current_user: Account = Depends(get_current_user), db: Session = Depends(get_db)):
    db_item = db.query(InventoryItem).filter_by(
        id=item_id,
        username=current_user.username
    ).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db_item.name = item.name
    db_item.quantity = item.quantity
    db_item.price = item.price
    
    try:
        db.commit()
        db.refresh(db_item)
        return db_item
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update inventory item"
        )

@router.delete("/inventory/{item_id}")
async def delete_inventory_item(item_id: int, current_user: Account = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter_by(
        id=item_id,
        username=current_user.username
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    try:
        db.delete(item)
        db.commit()
        return {"message": "Item deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete inventory item"
        )