from sqlalchemy import func
from typing import Union
from datetime import datetime, timedelta

# Local imports
import db_env
from db_env import db
import env

def calculate_non_repeatable_expenses_last_24_hours(username, current_date):
    try:
        start_time = current_date - timedelta(hours=24)
        end_time = current_date

        non_repeatable_expenses = db_env.Expense.query.filter(
            db_env.Expense.username == username,
            db_env.Expense.timestamp >= start_time,
            db_env.Expense.timestamp <= end_time,
            db_env.Expense.repeating.is_(False)  # Consider both repeating and non-repeating expenses
        ).all()

        total_expenses_last_24_hours = sum(expense.price for expense in non_repeatable_expenses)

        return total_expenses_last_24_hours
    except Exception as e:
        print(f"Error calculating non-repeatable expenses: {str(e)}")
        return 0


def calculate_daily_limit(username, current_date):

    # Retrieve account information
    account = db_env.Account.query.filter_by(username=username).first()

    if account:

        # Calculate total monthly expenses for non-repeating expenses
        monthly_expenses_non_repeating = calculate_monthly_expenses(username)
        daily_savings_needed = account.monthly_savings_goal / 30

        # Calculate daily expenses
        daily_expenses_total = monthly_expenses_non_repeating / 30 + daily_savings_needed

        # Calculate daily earnings
        daily_earnings = calculate_daily_earnings(username, current_date)

        # Calculate total non-repeatable expenses made in the last 24 hours
        non_repeatable_expenses_last_24_hours = calculate_total_non_repeating_expenses_within_24_hours(username, current_date)

        # Subtract non-repeatable expenses made in the last 24 hours from daily expenses total
        daily_expenses_total -= non_repeatable_expenses_last_24_hours

        # Subtract spending limit from the daily limit
        spending_limit = account.spending_limit
        daily_limit = max(0, daily_earnings - daily_expenses_total + spending_limit)

        return env.round_env(daily_limit, 2)

    return 0  # Default to 0 if account not found

def calculate_monthly_expenses(username):
    """Calculate total monthly expenses for repeating expenses of a given user."""
    try:
        total_expenses = db_env.Expense.query.with_entities(func.sum(db_env.Expense.price)). \
            filter(db_env.Expense.username == username,
                   db_env.Expense.repeating.is_(True)).scalar() or 0

        return total_expenses

    except Exception as e:
        print(f"An error occurred while calculating expenses: {str(e)}")
        return 0

def calculate_non_repeating_monthly_expenses(username, today):

    """Calculate total non-repeating expenses in the last 30 days for a given user."""
    start_of_month = today - timedelta(days=30)
    total_expenses = db_env.Expense.query.filter(
        (db_env.Expense.username == username) &
        ((db_env.Expense.timestamp >= start_of_month) & (db_env.Expense.timestamp <= today)) &
        (db_env.Expense.repeating == False)
    ).with_entities(db.func.sum(db_env.Expense.price)).scalar() or 0
    return total_expenses

def calculate_weekly_earnings(username, start_of_week, end_of_week):

    """Calculate total weekly earnings for a given user."""
    earnings = db_env.DailyEarning.query.filter(
        db_env.DailyEarning.username == username,
        db_env.DailyEarning.timestamp >= start_of_week,
        db_env.DailyEarning.timestamp < end_of_week
    ).all()
    total_earnings = sum(earning.cash_tips for earning in earnings)
    total_earnings = sum(earning.hourly_rate * earning.hours for earning in earnings) + total_earnings
    total_earnings = sum(earning.salary/55 for earning in earnings) + total_earnings
    return total_earnings


def calculate_daily_earnings(username, date):

    """Calculate the daily earnings ratio based on the week plus one day of earnings."""
    # Determine the start and end dates of the week
    start_of_week = date - timedelta(days=date.weekday())
    end_of_week = start_of_week + timedelta(days=6)

    # Retrieve earnings data for the week plus one day
    earnings = db_env.DailyEarning.query.filter(
        db_env.DailyEarning.username == username,
        db_env.DailyEarning.timestamp >= start_of_week,
        db_env.DailyEarning.timestamp <= date
    ).all()

    # Calculate total earnings for the week plus one day
    total_earnings = sum(earning.cash_tips for earning in earnings) / 7
    total_earnings = sum(earning.hourly_rate * earning.hours for earning in earnings) / 7 + total_earnings
    total_earnings = sum(earning.salary/365 for earning in earnings) + total_earnings

    # Calculate the number of days in the week plus one
    days_in_week_plus_one = (end_of_week - start_of_week).days + 1

    # Calculate the daily earnings ratio
    if days_in_week_plus_one > 0:
        daily_earnings_ratio = total_earnings / days_in_week_plus_one
    else:
        daily_earnings_ratio = 0

    return total_earnings


def calculate_monthly_earnings(username, start_of_month):

    """Calculate total monthly earnings for a given user."""
    end_of_month = start_of_month + timedelta(days=30)
    earnings = db_env.DailyEarning.query.filter(
        db_env.DailyEarning.username == username,
        db_env.DailyEarning.timestamp >= start_of_month,
        db_env.DailyEarning.timestamp < end_of_month
    ).all()
    total_earnings = sum(earning.cash_tips for earning in earnings)
    total_earnings = sum(earning.hourly_rate * earning.hours for earning in earnings) + total_earnings
    total_earnings = sum(earning.salary/12 for earning in earnings) + total_earnings
    return total_earnings


def calculate_total_income(username, start_date, end_date):

    """Calculate the total income for a given user within a specified period."""
    earnings = db_env.DailyEarning.query.filter(
        db_env.DailyEarning.username == username,
        db_env.DailyEarning.timestamp >= start_date,
        db_env.DailyEarning.timestamp < timedelta(days=365)   
    ).all()
    total_earnings = sum(earning.hourly_rate * earning.hours for earning in earnings)
    total_income = sum(earning.salary + earning.cash_tips for earning in earnings) + total_earnings
    return total_income

def calculate_average_daily_expenses(username: str, today_date: Union[datetime, str]) -> float:

    """Calculate the average daily expenses for a given user over a specified period."""
    if isinstance(today_date, str):
        today_date = datetime.strptime(today_date, '%Y-%m-%d')

    # Calculate the start date of 30 days ago
    thirty_days_ago = today_date - timedelta(days=30)

    # Assuming these functions are defined elsewhere
    total_monthly_expenses_last_30_days = calculate_monthly_expenses(username) + calculate_non_repeating_monthly_expenses(username, today_date)
    total_average_daily_expenses = total_monthly_expenses_last_30_days / 30  # Divide by 30 days

    return total_average_daily_expenses

def generate_forecast_data(username):

    """Generate forecasts for savings, expenses, and earnings for the next 6 months using SARIMA."""
    # Generate forecasts for expenses, earnings, and savings
    expense_forecast = generate_expense_forecast(username)
    earnings_forecast = generate_earnings_forecast(username)
    savings_forecast = generate_savings_forecast(username)

    # Combine the forecasts into a single data structure
    forecast_data = [expense_forecast, earnings_forecast, savings_forecast]

    return forecast_data

def get_historical_expenses(username):

    """Retrieve the historical expenses for a given user."""
    # Replace with actual implementation to retrieve historical expenses
    expenses = db_env.Expense.query.filter(db_env.Expense.username == username).all()
    historical_expenses = [expense.price for expense in expenses]
    return historical_expenses

def generate_expense_forecast(username):

    """Generate a forecast for future expenses for a given user using a simple moving average."""
    # Replace placeholder code with actual implementation
    historical_expenses = get_historical_expenses(username)
    forecast = [sum(historical_expenses[-6:]) / 6] * 6  # Simple moving average of the last 6 months
    return forecast

def get_total_historical_earnings(username):

    """Retrieve the total historical earnings for a given user."""
    # Retrieve all historical earnings for the user
    earnings = db_env.DailyEarning.query.filter(db_env.DailyEarning.username == username).all()

    # Initialize the total earnings variable
    total_earnings = 0

    # Calculate total earnings from hourly_rate, hours, and cash_tips
    for earning in earnings:
        total_earnings += earning.hourly_rate * earning.hours + earning.cash_tips

    # If salary is present, add it to total earnings (divided by 12 for monthly data)
    for earning in earnings:
        total_earnings += earning.salary / 12

    return total_earnings

def generate_earnings_forecast(username):

    """Generate a forecast for future earnings for a given user using a simple moving average."""
    # Actual implementation: Use a simple moving average to forecast earnings for the next 6 months
    historical_earnings = get_total_historical_earnings(username)
    forecast = [historical_earnings / 6] * 6  # Simple moving average of the last 6 months
    return forecast

def generate_savings_forecast(username):

    """Generate a forecast for future savings for a given user using SARIMA."""
    # Placeholder implementation: Calculate savings based on difference between earnings and expenses
    expense_forecast = generate_expense_forecast(username)
    earnings_forecast = generate_earnings_forecast(username)

    # Apply a more sophisticated savings forecast model
    savings_forecast = [earnings - expense for earnings, expense in zip(earnings_forecast, expense_forecast)]

    return savings_forecast


def calculate_total_non_repeating_expenses_within_24_hours(username, today_date):

    """Calculate the total non-repeating expenses within the last 24 hours."""
    # Calculate the start and end timestamps for the last 24 hours
    start_of_day = today_date - timedelta(days=1)

    # Retrieve non-repeating expenses within the last 24 hours
    expenses_within_24_hours = db_env.Expense.query.filter(
        db_env.Expense.username == username,
        db_env.Expense.timestamp >= start_of_day,
        db_env.Expense.timestamp < today_date + timedelta(days=1),
        db_env.Expense.repeating.is_(False)
    ).all()

    # Calculate total non-repeating expenses within the last 24 hours
    total_non_repeating_expenses_within_24_hours = sum(expense.price for expense in expenses_within_24_hours)

    return total_non_repeating_expenses_within_24_hours

def calculate_total_money_spent_today(username):

    # Calculate the start and end timestamps for today
    start_of_day = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(days=1)

    # Retrieve expenses made by the user today
    expenses_today = db_env.Expense.query.filter(
        db_env.Expense.username == username,
        db_env.Expense.timestamp >= start_of_day,
        db_env.Expense.timestamp < end_of_day
    ).all()

    # Calculate the total money spent today
    total_money_spent_today = sum(expense.price for expense in expenses_today)
    return total_money_spent_today

class Calculated:
    def __init__(self, username, account):
        self.current_date = datetime.utcnow()
        self.start_of_day = self.current_date - timedelta(days=1)

        # Calculate daily expenses
        self.daily_expenses = db_env.Expense.query.filter(
            db_env.Expense.username == username,
            db_env.Expense.timestamp >= self.start_of_day
        ).all()

        # Calculate days expenses
        self.daily_expenses_total = calculate_average_daily_expenses(username, self.current_date)

        # Calculate monthly expenses
        self.monthly_expenses = calculate_monthly_expenses(username)

        # Calculate daily savings needed (monthly savings goal divided by 30)
        self.daily_savings_needed = account.monthly_savings_goal / 30

        # Total daily expenses including the savings needed portion
        self.daily_expenses_total += self.daily_savings_needed

        # Calculate total money spent today
        self.total_money_spent_today = calculate_total_non_repeating_expenses_within_24_hours(username, self.current_date)

        # Calculate total monthly expenses for non-repeating expenses
        self.start_of_month = self.current_date - timedelta(days=30)
        self.end_of_month = self.start_of_month + timedelta(days=30)
        self.monthly_expenses_non_repeating = calculate_non_repeating_monthly_expenses(username, self.current_date)

        # Calculate daily spending limit
        self.daily_limit = calculate_daily_limit(username, self.current_date)
        self.daily_limit = self.daily_limit - self.total_money_spent_today

        # Calculate weekly earnings
        self.start_of_week = self.current_date - timedelta(days=self.current_date.weekday())
        self.end_of_week = self.start_of_week + timedelta(days=7)
        self.weekly_earnings = calculate_weekly_earnings(username, self.start_of_week, self.end_of_week)

        # Calculate daily earnings
        self.daily_earnings = calculate_daily_earnings(username, self.current_date)

        # Calculate monthly earnings
        self.monthly_earnings = calculate_monthly_earnings(username, self.start_of_month)

        # Calculate Savings Rate
        self.total_income = self.monthly_earnings
        self.total_expenses = self.monthly_expenses_non_repeating + self.monthly_expenses
        self.savings = self.total_income - self.total_expenses
        self.savings_rate = (self.savings / self.total_income) * 100 if self.total_income > 0 else 0

        # Calculate Average Daily Expenses
        self.average_daily_expenses = calculate_average_daily_expenses(username, self.current_date)

        # Generate forecast data
        self.expense_forecast = generate_expense_forecast(username)
        self.earnings_forecast = generate_earnings_forecast(username)
        self.savings_forecast = generate_savings_forecast(username)

def calculated(username, account):
    result = Calculated(username, account)
    return result
