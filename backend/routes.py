from datetime import datetime, timezone, timedelta
from fastapi import Depends, HTTPException, status, Request, APIRouter
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func  # Add this import
from pydantic import BaseModel, EmailStr
import pandas as pd
import io
from io import BytesIO

# Local imports
import calculations
from db_env import Account, DailyEarning, Expense, InventoryItem, FinancialOverview, Task
from settings.db_settings import get_db
from auth import get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, pwd_context
import env


router = APIRouter()

class UserCreate(BaseModel):
    username: str
    password: str
    email: EmailStr

@router.post("/register")
async def register(user: UserCreate, db: Session = Depends(get_db)):
    if existing_user := db.query(Account).filter_by(username=user.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    if (existing_email := db.query(Account).filter_by(email=user.email).first()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    # Use bcrypt directly for password hashing
    hashed_password = pwd_context.hash(user.password)
    new_user = Account(
        username=user.username,
        password=hashed_password,  # Store the bcrypt hash
        email=user.email
    )
    db.add(new_user)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating user"
        )
    return {"message": "User created successfully"}

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(Account).filter_by(username=form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        is_valid = pwd_context.verify(form_data.password, user.password)
    except Exception:
        is_valid = False
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/download-excel")
async def download_excel_earnings(current_user: Account = Depends(get_current_user), db: Session = Depends(get_db)):
    earnings = db.query(DailyEarning).filter_by(username=current_user.username).all()
    
    # Create DataFrame with formatted data
    data = [{
        'Date': earning.timestamp.strftime('%Y-%m-%d'),
        'Hourly Rate': earning.hourly_rate,
        'Hours Worked': earning.hours,
        'Cash Tips': earning.cash_tips,
        'Salary': earning.salary,
        'Total': (earning.hourly_rate * earning.hours) + earning.cash_tips + earning.salary
    } for earning in earnings]
    
    df = pd.DataFrame(data)
    
    # Create Excel file in memory
    excel_buffer = BytesIO()
    with pd.ExcelWriter(excel_buffer, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False)
        workbook = writer.book
        worksheet = writer.sheets['Sheet1']
        
        # Format currency columns
        money_format = workbook.add_format({'num_format': '$#,##0.00'})
        for col in ['Hourly Rate', 'Cash Tips', 'Salary', 'Total']:
            col_idx = df.columns.get_loc(col)
            worksheet.set_column(col_idx, col_idx, None, money_format)
        
        # Auto-fit columns
        for i, col in enumerate(df.columns):
            max_length = max(df[col].astype(str).apply(len).max(), len(col)) + 2
            worksheet.set_column(i, i, max_length)
    
    excel_buffer.seek(0)
    
    return StreamingResponse(
        excel_buffer,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': 'attachment; filename=earnings_report.xlsx'}
    )

# Add more endpoints following similar patterns...
@router.get("/dashboard")
async def get_financial_overview(current_user: Account = Depends(get_current_user), db: Session = Depends(get_db)):
    today = datetime.now(timezone.utc)
    
    # Calculate all required financial metrics
    monthly_earnings = calculations.calculate_monthly_earnings(current_user.username)
    monthly_expenses = (
        calculations.calculate_monthly_expenses_repeating(current_user.username) + 
        calculations.calculate_non_repeating_monthly_expenses(current_user.username, today)
    )
    monthly_savings_goal = current_user.monthly_savings_goal
    
    # Calculate savings before savings goal
    available_for_savings = monthly_earnings - monthly_expenses
    
    # Calculate savings rate based on available money for savings
    savings_rate = env.round_env((available_for_savings / monthly_earnings * 100) if monthly_earnings > 0 else 0, 2)
    
    # Calculate savings forecast (what will be left after meeting savings goal)
    savings_forecast = env.round_env(available_for_savings - monthly_savings_goal, 2)
    
    # Calculate remaining metrics
    daily_limit = calculations.calculate_daily_limit(current_user.username, today)
    daily_earnings = calculations.calculate_daily_earnings(current_user.username, today)
    total_money_spent_today = calculations.calculate_total_money_spent_today(current_user.username)
    
    # Calculate unused amount from previous day
    unused_limit = calculations.calculate_unused_daily_limit(
        current_user.username, 
        today,
        daily_limit
    )
    
    # First check if there's an existing overview for today
    existing_overview = db.query(FinancialOverview).filter(
        FinancialOverview.username == current_user.username,
        FinancialOverview.timestamp >= today.replace(hour=0, minute=0, second=0),
        FinancialOverview.timestamp < today.replace(hour=23, minute=59, second=59)
    ).first()

    # Create new overview data
    new_overview_data = {
        'username': current_user.username,
        'daily_limit': env.round_env(daily_limit, 2),
        'daily_earnings': env.round_env(daily_earnings, 2),
        'total_money_spent_today': env.round_env(total_money_spent_today, 2),
        'monthly_earnings': env.round_env(monthly_earnings, 2),
        'monthly_expenses': env.round_env(monthly_expenses, 2),
        'savings_rate': savings_rate,
        'savings_forecast': savings_forecast,
        'daily_expenses_total': 0.0,
        'average_daily_expenses': 0.0,
        'total_expenses': 0.0,
        'start_of_month': today.replace(day=1),
        'end_of_month': today.replace(day=1) + timedelta(days=32),
        'start_of_week': today - timedelta(days=today.weekday()),
        'end_of_week': today - timedelta(days=today.weekday()) + timedelta(days=6),
        'timestamp': today,
        'unused_daily_limit': unused_limit
    }

    if existing_overview:
        # Check if any values have changed
        has_changes = any(
            getattr(existing_overview, key) != value
            for key, value in new_overview_data.items()
            if key != 'timestamp'  # Ignore timestamp in comparison
        )
        
        if has_changes:
            # Update existing overview with new values
            for key, value in new_overview_data.items():
                setattr(existing_overview, key, value)
    else:
        # Create new overview if none exists for today
        financial_overview = FinancialOverview(**new_overview_data)
        db.add(financial_overview)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error saving financial overview: {e}")
    
    # Get today's non-repeating expenses
    start_of_day = today.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(days=1)
    daily_non_repeating = db.query(Expense).filter(
        Expense.username == current_user.username,
        Expense.timestamp >= start_of_day,
        Expense.timestamp < end_of_day,
        Expense.repeating == False
    ).with_entities(func.sum(Expense.price)).scalar() or 0

    return {
        "daily_limit": env.round_env(daily_limit, 2),
        "todays_non_repeating": env.round_env(daily_non_repeating, 2),
        "daily_earnings": env.round_env(daily_earnings, 2),
        "total_money_spent_today": env.round_env(total_money_spent_today, 2),
        "monthly_earnings": env.round_env(monthly_earnings, 2),
        "monthly_expenses": env.round_env(monthly_expenses, 2),
        "savings_rate": savings_rate,
        "monthly_savings_goal": env.round_env(current_user.monthly_savings_goal, 2),
        "savings_forecast": savings_forecast,
        "available_for_savings": env.round_env(available_for_savings, 2),
        "unused_daily_limit": env.round_env(unused_limit, 2)
    }

class ExpenseCreate(BaseModel):
    name: str
    price: float
    repeating: bool
    
@router.post("/expenses")
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
    return new_expense

@router.get("/expenses")
async def get_expenses(current_user: Account = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Expense).filter_by(username=current_user.username).all()

@router.get("/expenses/{expense_id}")
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

@router.put("/expenses/{expense_id}")
async def update_expense(
    expense_id: int,
    expense_data: ExpenseCreate,
    current_user: Account = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.username == current_user.username
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    expense.name = expense_data.name
    expense.price = expense_data.price
    expense.repeating = expense_data.repeating
    
    try:
        db.commit()
        return expense
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update expense"
        )

@router.post("/daily_earnings")
async def create_daily_earning(
    cash_tips: float,
    salary: float,
    hours: float,
    hourly_rate: float,
    current_user: Account = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_earning = DailyEarning(
        username=current_user.username,
        cash_tips=cash_tips,
        salary=salary,
        hours=hours,
        hourly_rate=hourly_rate,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(new_earning)
    db.commit()
    return new_earning

@router.get("/daily_earnings")
async def get_daily_earnings(current_user: Account = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(DailyEarning).filter_by(username=current_user.username).all()

class InventoryCreate(BaseModel):
    name: str
    quantity: float
    price: float

@router.post("/inventory")
async def create_inventory_item(
    item: InventoryCreate,
    current_user: Account = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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
async def get_inventory(
    current_user: Account = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = db.query(InventoryItem).filter_by(username=current_user.username).all()
    return items

@router.put("/inventory/{item_id}")
async def update_inventory_item(
    item_id: int,
    item: InventoryCreate,
    current_user: Account = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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
async def delete_inventory_item(
    item_id: int,
    current_user: Account = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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

class TaskCreate(BaseModel):
    title: str
    is_complete: bool = False
    repeat_daily: bool = False

@router.get("/tasks")
async def get_tasks(current_user: Account = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Task).filter_by(username=current_user.username).all()

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
    return new_task

@router.post("/complete_task/{task_id}")
async def complete_task(task_id: int, current_user: Account = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter_by(id=task_id, username=current_user.username).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.is_complete = not task.is_complete
    db.commit()
    return task

@router.delete("/delete_task/{task_id}")
async def delete_task(task_id: int, current_user: Account = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter_by(id=task_id, username=current_user.username).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"message": "Task deleted"}

@router.get("/username")
async def get_username(current_user: Account = Depends(get_current_user)):
    return {"username": current_user.username}

@router.post("/add-expense")
async def add_expense(request: Request, current_user: Account = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")
    data = await request.json()
    new_expense = Expense(
        username=current_user.username,
        name=data['name'],
        price=data['price'],
        repeating=data['repeating'],
        timestamp=datetime.now(timezone.utc)
    )
    db.add(new_expense)
    db.commit()
    return {"message": "Expense added successfully"}

@router.get("/earnings")
async def get_earnings(current_user: Account = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        earnings = db.query(DailyEarning).filter(
            DailyEarning.username == current_user.username
        ).order_by(DailyEarning.timestamp.desc()).all()
        
        return [
            {
                "id": earning.id,
                "timestamp": earning.timestamp,
                "salary": earning.salary,
                "hourly_rate": earning.hourly_rate,
                "hours": earning.hours,
                "cash_tips": earning.cash_tips
            }
            for earning in earnings
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class EarningsCreate(BaseModel):
    cash_tips: float
    salary: float
    hours: float
    hourly_rate: float

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
    return new_earning

@router.get("/chart-data")
async def get_chart_data(current_user: Account = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        # Get current date
        current_date = datetime.now(timezone.utc)
        
        # Calculate all the required data
        total_money_spent = calculations.calculate_total_money_spent_today(current_user.username, current_date)
        daily_earnings = calculations.calculate_daily_earnings(current_user.username, current_date)
        monthly_earnings = calculations.calculate_monthly_earnings(current_user.username, current_date)
        monthly_expenses_repeating = calculations.calculate_monthly_expenses_repeating(current_user.username)
        monthly_expenses_non_repeating = calculations.calculate_non_repeating_monthly_expenses(current_user.username, current_date)
        
        # Create labels (last 7 days)
        labels = [(current_date - timedelta(days=x)).strftime('%Y-%m-%d') for x in range(6, -1, -1)]
        
        return {
            "labels": labels,
            "datasets": {
                "total_money_spent_today": [total_money_spent for _ in range(7)],
                "daily_earnings": [daily_earnings for _ in range(7)],
                "monthly_earnings": [monthly_earnings/30 for _ in range(7)],
                "monthly_expenses_repeating": [monthly_expenses_repeating/30 for _ in range(7)],
                "monthly_expenses_non_repeating": [monthly_expenses_non_repeating/30 for _ in range(7)]
            }
        }
    except Exception as e:
        print(f"Error getting chart data: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching chart data")

class SavingsGoalUpdate(BaseModel):
    monthly_savings_goal: float

@router.post("/update-savings-goal")
async def update_savings_goal(
    goal_data: SavingsGoalUpdate,
    current_user: Account = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if goal_data.monthly_savings_goal < 0:
            raise HTTPException(status_code=400, detail="Savings goal cannot be negative")

        # Update the user's savings goal in the database
        current_user.monthly_savings_goal = goal_data.monthly_savings_goal
        db.commit()
        
        # Calculate all updated values
        monthly_earnings = calculations.calculate_monthly_earnings(current_user.username)
        monthly_expenses = (
            calculations.calculate_monthly_expenses_repeating(current_user.username) + 
            calculations.calculate_non_repeating_monthly_expenses(current_user.username, datetime.now(timezone.utc))
        )
        
        # Calculate savings and rates
        savings = monthly_earnings - monthly_expenses - current_user.monthly_savings_goal
        savings_rate = env.round_env((savings / monthly_earnings * 100) if monthly_earnings > 0 else 0, 2)
        savings_forecast = env.round_env(savings, 2)
        
        # Calculate updated daily limit
        daily_limit = calculations.calculate_daily_limit(current_user.username, datetime.now(timezone.utc))
        
        # Return comprehensive update
        return {
            "monthly_savings_goal": env.round_env(current_user.monthly_savings_goal, 2),
            "savings_forecast": savings_forecast,
            "savings_rate": savings_rate,
            "daily_limit": env.round_env(daily_limit, 2),
            "monthly_expenses": env.round_env(monthly_expenses, 2),
            "monthly_earnings": env.round_env(monthly_earnings, 2)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update savings goal: {str(e)}"
        )

@router.put("/earnings/{earning_id}")
async def update_earning(
    earning_id: int,
    earning_data: dict,
    current_user: Account = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    earning = db.query(DailyEarning).filter(
        DailyEarning.id == earning_id,
        DailyEarning.username == current_user.username
    ).first()
    
    if not earning:
        raise HTTPException(status_code=404, detail="Earning not found")
    
    for key, value in earning_data.items():
        setattr(earning, key, value)
    
    db.commit()
    return earning

@router.delete("/earnings/{earning_id}")
async def delete_earning(
    earning_id: int,
    current_user: Account = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    earning = db.query(DailyEarning).filter(
        DailyEarning.id == earning_id,
        DailyEarning.username == current_user.username
    ).first()
    
    if not earning:
        raise HTTPException(status_code=404, detail="Earning not found")
    
    db.delete(earning)
    db.commit()
    return {"message": "Earning deleted successfully"}

@router.get("/download-inventory-excel")
async def download_inventory_excel(db: Session = Depends(get_db)):
    items = db.query(InventoryItem).all()
    data = [
        {
            "Name": item.name,
            "Quantity": item.quantity,
            "Price": item.price,
            "Timestamp": item.timestamp
        }
        for item in items
    ]
    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name='Inventory')
    output.seek(0)
    return StreamingResponse(output, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', headers={"Content-Disposition": "attachment; filename=inventory.xlsx"})