from datetime import datetime, timezone, timedelta
from fastapi import Depends, HTTPException, status, APIRouter
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

# Local imports
import calculations
from db_env import Account, DailyEarning, Expense, InventoryItem, FinancialOverview, Task
from settings.db_settings import get_db
from auth import get_current_user
import env

router = APIRouter()

class SavingsGoalUpdate(BaseModel):
    monthly_savings_goal: float

@router.get("/financial-dashboard")
async def get_financial_dashboard(
    current_user: Account = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Get daily score
        today = datetime.now().date()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())
        
        # Calculate today's income
        today_income = 0  # Replace with actual income calculation
        
        # Calculate today's expenses
        today_expenses_query = db.query(Expense).filter(
            Expense.username == current_user.username,
            Expense.timestamp >= today_start,
            Expense.timestamp <= today_end
        )
        today_expenses = sum(expense.price for expense in today_expenses_query)
        
        daily_score = today_income - today_expenses
        
        # Generate financial data for the past 30 days and projected next 30 days
        financial_data = []
        for i in range(-30, 31):
            date = (today + timedelta(days=i)).strftime("%Y-%m-%d")
            
            # For past days, use actual data
            if i <= 0:
                day = today + timedelta(days=i)
                day_start = datetime.combine(day, datetime.min.time())
                day_end = datetime.combine(day, datetime.max.time())
                
                expenses_query = db.query(Expense).filter(
                    Expense.username == current_user.username,
                    Expense.timestamp >= day_start,
                    Expense.timestamp <= day_end
                )
                day_expenses = sum(expense.price for expense in expenses_query)
                day_income = 0  # Replace with actual income calculation
                balance = day_income - day_expenses
                projected = balance
            else:
                # For future days, use projections
                # This is a simple projection - enhance based on your algorithms
                day_expenses = 0  # Projected expenses
                day_income = 0  # Projected income
                balance = 0  # Projected balance
                projected = balance
            
            financial_data.append({
                "date": date,
                "income": day_income,
                "expenses": day_expenses,
                "balance": balance,
                "projected": projected
            })
        
        # Get budget categories and spending
        categories = ["Groceries", "Dining", "Entertainment", "Transportation", "Utilities", "Healthcare"]
        budget_categories = []
        
        for category in categories:
            # Get expenses in this category for the current month
            month_start = datetime(today.year, today.month, 1)
            month_end = (datetime(today.year, today.month + 1, 1) - timedelta(days=1)) if today.month < 12 else datetime(today.year + 1, 1, 1) - timedelta(days=1)
            
            category_expenses_query = db.query(Expense).filter(
                Expense.username == current_user.username,
                Expense.category == category if hasattr(Expense, 'category') else True,
                Expense.timestamp >= month_start,
                Expense.timestamp <= month_end
            )
            spent = sum(expense.price for expense in category_expenses_query)
            
            # Get budgeted amount (replace with actual budgeted amount if available)
            budgeted = 500.0  # Example budget amount
            
            budget_categories.append({
                "category": category,
                "budgeted": budgeted,
                "spent": spent,
                "remaining": max(0, budgeted - spent),
                "percentage": (spent / budgeted * 100) if budgeted > 0 else 0
            })
        
        return {
            "dailyScore": daily_score,
            "financialData": financial_data,
            "budgetCategories": budget_categories
        }
    except Exception as e:
        print(f"Error getting dashboard data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting dashboard data: {str(e)}"
        )
