# Description: Task routes for the FastAPI application
from datetime import datetime, timezone
from fastapi import Depends, HTTPException, status, APIRouter
from sqlalchemy.orm import Session
from pydantic import BaseModel

# Local imports
from db_env import Account, Task
from settings.db_settings import get_db
from auth import get_current_user

router = APIRouter()

# Task model
class TaskCreate(BaseModel):
    title: str
    is_complete: bool = False
    repeat_daily: bool = False

class TaskUpdate(BaseModel):
    title: str
    is_complete: bool = False
    repeat_daily: bool = False

# Task Routes
@router.post("/tasks")
async def create_task(task: TaskCreate, current_user: Account = Depends(get_current_user), db: Session = Depends(get_db)):
    new_task = Task(
        username=current_user.username,
        title=task.title,
        is_complete=task.is_complete,
        repeat_daily=task.repeat_daily,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@router.get("/tasks")
async def get_tasks(current_user: Account = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Task).filter_by(username=current_user.username).all()

@router.post("/complete_task/{task_id}")
async def complete_task(task_id: int, current_user: Account = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter_by(id=task_id, username=current_user.username).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.is_complete = not task.is_complete
    db.commit()
    return task

@router.put("/tasks/{task_id}")
async def update_task(task_id: int, task_data: TaskUpdate, current_user: Account = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter_by(id=task_id, username=current_user.username).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.title = task_data.title
    task.is_complete = task_data.is_complete
    task.repeat_daily = task_data.repeat_daily
    
    try:
        db.commit()
        db.refresh(task)
        return task
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update task"
        )

@router.delete("/tasks/{task_id}")
async def delete_task(task_id: int, current_user: Account = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter_by(id=task_id, username=current_user.username).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"message": "Task deleted"}

# Add a new route to edit a task's title and completion status in one request
@router.patch("/tasks/{task_id}")
async def edit_task(task_id: int, task_data: TaskUpdate, current_user: Account = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter_by(id=task_id, username=current_user.username).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Update task fields if provided
    if task_data.title is not None:
        task.title = task_data.title
    if task_data.is_complete is not None:
        task.is_complete = task_data.is_complete

    try:
        db.commit()
        db.refresh(task)
        return task
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to edit task"
        )