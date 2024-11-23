from typing import Union
from datetime import timedelta, datetime, timezone
from sqlalchemy import func
from db_env import Account, Expense, DailyEarning, FinancialOverview  # Add FinancialOverview
from settings.db_settings import SessionLocal  # Updated import
import env as env

def get_account(session, username):
    """Retrieve account information for given username."""
    return session.query(Account).filter_by(username=username).first()

def verify_account(account, username):
    """Verify account exists for given username."""
    if not account:
        print(f"No account found for username: {username}")
        return False
    return True

def get_verified_account(session, username) -> Union[Account, None]:
    """Get and verify account for given username. Returns None if not found."""
    account = get_account(session, username)
    return account if verify_account(account, username) else None

def verify_and_get_account(session, username) -> Union[Account, int]:
    """Get verified account or return 0 if not found."""
    account = get_verified_account(session, username)
    return account if account else 0

def get_local_date(utc_date):
    """Convert UTC date to local date"""
    # Assuming EST timezone (UTC-5). Adjust offset as needed for your timezone
    local_date = utc_date - timedelta(hours=5)
    return local_date.replace(hour=0, minute=0, second=0, microsecond=0)

def calculate_daily_limit(username, current_date):
    session = SessionLocal()
    try:
        account = verify_and_get_account(session, username)
        if isinstance(account, int):
            return 0
            
        # Calculate base daily limit
        monthly_earnings = calculate_monthly_earnings(username)
        monthly_expenses_repeating = calculate_monthly_expenses_repeating(username)
        monthly_savings_goal = account.monthly_savings_goal or 0
        
        # Calculate discretionary money per day
        discretionary_monthly = monthly_earnings - monthly_expenses_repeating - monthly_savings_goal
        base_daily_limit = max(0, discretionary_monthly / 30)
        
        # Get today's non-repeating expenses
        total_spent_today = calculate_total_money_spent_today(username, current_date)
        
        # Calculate remaining daily limit
        remaining_limit = max(0, base_daily_limit - total_spent_today)
        
        return env.round_env(base_daily_limit, 2)
    except Exception as e:
        print(f"Error calculating daily limit for {username}: {str(e)}")
        return 0
    finally:
        session.close()

def calculate_unused_daily_limit(username, current_date, daily_limit):
    session = SessionLocal()
    try:
        # Get today's non-repeating expenses
        start_of_day = current_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        daily_expenses = session.query(Expense).filter(
            Expense.username == username,
            Expense.timestamp >= start_of_day,
            Expense.timestamp < end_of_day,
            Expense.repeating == False
        ).with_entities(func.sum(Expense.price)).scalar() or 0
        
        # Calculate unused amount
        unused = max(0, daily_limit - daily_expenses)
        return env.round_env(unused, 2)
    except Exception as e:
        print(f"Error calculating unused daily limit for {username}: {str(e)}")
        return 0
    finally:
        session.close()

def calculate_total_non_repeating_expenses_within_24_hours(username, today_date):
    session = SessionLocal()
    try:
        """Calculate the total non-repeating expenses within the last 24 hours."""
        start_of_day = today_date - timedelta(days=1)

        expenses_within_24_hours = session.query(Expense).filter(
            Expense.username == username,
            Expense.timestamp >= start_of_day,
            Expense.timestamp < today_date + timedelta(days=1),
            Expense.repeating.is_(False)
        ).all()

        total_non_repeating_expenses_within_24_hours = sum(expense.price for expense in expenses_within_24_hours)
        return total_non_repeating_expenses_within_24_hours
    except Exception as e:
        print(f"Error calculating non-repeating expenses within 24 hours for {username}: {str(e)}")
        return 0
    finally:
        session.close()

def calculate_non_repeating_monthly_expenses(username, today):
    session = SessionLocal()
    try:
        """Calculate total non-repeating expenses in the last 30 days for a given user."""
        start_of_month = today - timedelta(days=30)
        total_expenses = session.query(Expense).filter(
            (Expense.username == username) &
            ((Expense.timestamp >= start_of_month) & (Expense.timestamp <= today)) &
            (Expense.repeating == False)
        ).with_entities(func.sum(Expense.price)).scalar() or 0
        return total_expenses
    except Exception as e:
        print(f"An error occurred while calculating non-repeating monthly expenses for {username}: {str(e)}")
        return 0
    finally:
        session.close()

def calculate_daily_earnings(username, date):
    session = SessionLocal()
    try:
        # Get monthly earnings and divide by 30
        monthly_earnings = calculate_monthly_earnings(username, date)
        daily_earnings = monthly_earnings / 30
        
        return env.round_env(daily_earnings, 2)
    except Exception as e:
        print(f"Error calculating daily earnings for {username}: {str(e)}")
        return 0
    finally:
        session.close()

def calculate_monthly_expenses_repeating(username):
    """Calculate total monthly repeating expenses for a given user."""
    session = SessionLocal()
    try:
        repeating_expenses = session.query(Expense).filter(
            Expense.username == username,
            Expense.repeating == True
        ).all()
        
        total_expenses = sum(expense.price for expense in repeating_expenses)
        print(f"Debug - Repeating expenses: {[{'name': e.name, 'price': e.price} for e in repeating_expenses]}")
        
        return env.round_env(total_expenses, 2)
    except Exception as e:
        print(f"An error occurred while calculating repeating monthly expenses for {username}: {str(e)}")
        return 0
    finally:
        session.close()

def calculate_average_daily_expenses(username, current_date):
    """Calculate average daily expenses over the last 30 days."""
    session = SessionLocal()
    try:
        # Calculate start date (30 days ago)
        start_date = current_date - timedelta(days=30)
        
        # Get total expenses for the last 30 days (both repeating and non-repeating)
        total_expenses = session.query(Expense).filter(
            (Expense.username == username) &
            (Expense.timestamp >= start_date) &
            (Expense.timestamp <= current_date)
        ).with_entities(func.sum(Expense.price)).scalar() or 0
        
        # Get monthly repeating expenses
        monthly_repeating = calculate_monthly_expenses_repeating(username)
        
        # Add monthly repeating expenses to total
        total_expenses += monthly_repeating
        
        # Calculate daily average (total expenses divided by 30 days)
        average_daily = total_expenses / 30
        
        return env.round_env(average_daily, 2)
    except Exception as e:
        print(f"Error calculating average daily expenses for {username}: {str(e)}")
        return 0
    finally:
        session.close()

def calculate_total_money_spent_today(username, current_date=None):
    session = SessionLocal()
    try:
        if current_date is None:
            current_date = get_local_date(datetime.now(timezone.utc))
        else:
            current_date = get_local_date(current_date)
        
        # Get start and end of today in UTC for database queries
        start_of_day = current_date.replace(tzinfo=timezone.utc)
        end_of_day = (current_date + timedelta(days=1)).replace(tzinfo=timezone.utc)
        
        # Get today's non-repeating expenses
        non_repeating_expenses = session.query(Expense).filter(
            Expense.username == username,
            Expense.timestamp >= start_of_day,
            Expense.timestamp < end_of_day,
            Expense.repeating == False
        ).all()
        
        # Get daily portion of repeating expenses
        repeating_expenses = session.query(Expense).filter(
            Expense.username == username,
            Expense.repeating == True
        ).all()
        
        # Calculate totals
        non_repeating = sum(e.price for e in non_repeating_expenses)
        daily_repeating = sum(e.price for e in repeating_expenses) / 30
        
        total = env.round_env(non_repeating + daily_repeating, 2)
        return total
    except Exception as e:
        print(f"Error calculating total money spent today for {username}: {str(e)}")
        return 0
    finally:
        session.close()

def calculate_monthly_earnings(username, current_date=None):
    """Calculate total monthly earnings including salary, hourly wages, and tips."""
    session = SessionLocal()
    try:
        if current_date is None:
            current_date = datetime.now(timezone.utc)
        
        # Calculate start of month (30 days ago)
        start_of_month = current_date - timedelta(days=30)
        
        # Get all earnings records for the past 30 days
        earnings = session.query(DailyEarning).filter(
            DailyEarning.username == username,
            DailyEarning.timestamp >= start_of_month,
            DailyEarning.timestamp <= current_date
        ).all()
        
        # Calculate total earnings components
        total_cash_tips = sum(earning.cash_tips for earning in earnings)
        total_hourly_earnings = sum(earning.hourly_rate * earning.hours for earning in earnings)
        
        # For salary, we need to get the most recent salary entry and calculate monthly portion
        latest_salary = session.query(DailyEarning).filter(
            DailyEarning.username == username,
            DailyEarning.salary > 0
        ).order_by(DailyEarning.timestamp.desc()).first()
        
        monthly_salary = (latest_salary.salary / 12) if latest_salary else 0
        
        # Sum up all earnings
        total_monthly_earnings = total_cash_tips + total_hourly_earnings + monthly_salary
        
        return env.round_env(total_monthly_earnings, 2)
    except Exception as e:
        print(f"Error calculating monthly earnings for {username}: {str(e)}")
        return 0
    finally:
        session.close()

# Ensure to add session management to other functions similarly
