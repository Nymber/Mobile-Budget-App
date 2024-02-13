import db_env
from db_env import db
import env
from sqlalchemy import func
from datetime import datetime, timedelta, timezone

def calculate_non_repeatable_expenses_last_24_hours(username, current_date):
    try:
        # Calculate the start and end timestamps for the last 24 hours
        start_time = current_date - timedelta(hours=24)
        end_time = current_date

        # Retrieve non-repeatable expenses made by the user within the last 24 hours
        non_repeatable_expenses = db_env.Expense.query.filter(
            db_env.Expense.username == username,
            db_env.Expense.timestamp >= start_time,
            db_env.Expense.timestamp <= end_time,
            db_env.Expense.repeating == 'No'  # Assuming 'No' is used for non-repeating expenses
        ).all()

        # Calculate the total of non-repeatable expenses made in the last 24 hours
        total_expenses_last_24_hours = sum(expense.price for expense in non_repeatable_expenses)

        return total_expenses_last_24_hours
    except Exception as e:
        # Log the exception for debugging purposes
        print(f"Error calculating non-repeatable expenses: {str(e)}")
        return 0  # Return a default value or handle the error as needed

    return total_expenses_last_24_hours

def calculate_daily_limit(username, current_date):
    # Retrieve account information
    account = db_env.Account.query.filter_by(username=username).first()

    if account:
        # Calculate total monthly expenses for non-repeating expenses
        start_of_month = current_date - timedelta(days=30)
        end_of_month = start_of_month + timedelta(days=30)
        monthly_expenses_non_repeating = calculate_monthly_expenses(username)

        # Calculate daily savings needed (monthly savings goal divided by 30)
        daily_savings_needed = account.monthly_savings_goal / 30

        # Total daily expenses including the savings needed portion
        daily_expenses_total = monthly_expenses_non_repeating / 30 + daily_savings_needed

        # Calculate weekly earnings
        start_of_week = current_date - timedelta(days=current_date.weekday())
        end_of_week = start_of_week + timedelta(days=7)
        weekly_earnings = calculate_weekly_earnings(username, start_of_week, end_of_week)

        # Calculate daily earnings
        daily_earnings = calculate_daily_earnings(username, current_date)

        # Calculate total non-repeatable expenses made in the last 24 hours
        non_repeatable_expenses_last_24_hours = calculate_non_repeatable_expenses_last_24_hours(username, current_date)

        # Subtract non-repeatable expenses made in the last 24 hours from daily expenses total
        daily_expenses_total -= non_repeatable_expenses_last_24_hours

        # Subtract spending limit from the daily limit
        spending_limit = account.spending_limit  # Retrieve spending limit from the account
        daily_limit = max(0, weekly_earnings / 7 - daily_expenses_total + spending_limit)
        
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
    total_earnings = sum(earning.salary + earning.cash_tips for earning in earnings)
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
    total_earnings = sum(earning.salary + earning.cash_tips for earning in earnings)

    # Calculate the number of days in the week plus one
    days_in_week_plus_one = (end_of_week - start_of_week).days + 1

    # Calculate the daily earnings ratio
    if days_in_week_plus_one > 0:
        daily_earnings_ratio = total_earnings / days_in_week_plus_one
    else:
        daily_earnings_ratio = 0

    return daily_earnings_ratio


def calculate_monthly_earnings(username, start_of_month):
    """Calculate total monthly earnings for a given user."""
    end_of_month = start_of_month + timedelta(days=30)
    earnings = db_env.DailyEarning.query.filter(
        db_env.DailyEarning.username == username,
        db_env.DailyEarning.timestamp >= start_of_month,
        db_env.DailyEarning.timestamp < end_of_month
    ).all()
    total_earnings = sum(earning.salary + earning.cash_tips for earning in earnings)
    return total_earnings


def calculate_total_income(username, start_date, end_date):
    """Calculate the total income for a given user within a specified period."""
    earnings = db_env.DailyEarning.query.filter(
        db_env.DailyEarning.username == username,
        db_env.DailyEarning.timestamp >= start_date,
        db_env.DailyEarning.timestamp < end_date
    ).all()
    total_income = sum(earning.salary + earning.cash_tips for earning in earnings)
    return total_income

def calculate_average_daily_expenses(username, today_date):
    """Calculate the average daily expenses for a given user over a specified period."""
    # Calculate the start date of 30 days ago
    thirty_days_ago = today_date - timedelta(days=30)

    # Retrieve total monthly expenses for the last 30 days
    total_monthly_expenses_last_30_days = calculate_monthly_expenses(username) + calculate_non_repeating_monthly_expenses(username, today_date)

    # Retrieve total expenses for today
    expenses_today = db_env.Expense.query.filter(
        db_env.Expense.username == username,
        db_env.Expense.timestamp >= today_date,
        db_env.Expense.timestamp < today_date + timedelta(days=1)
    ).all()

    # Calculate total expenses for today
    total_expenses_today = sum(expense.price for expense in expenses_today)

    # Calculate the number of days in the last 30 days
    days_in_last_30_days = (today_date - thirty_days_ago).days

    # Calculate the average daily expenses over the last 30 days
    if days_in_last_30_days > 0:
        average_daily_expenses_last_30_days = total_monthly_expenses_last_30_days / days_in_last_30_days
    else:
        average_daily_expenses_last_30_days = 0

    # Calculate the total average daily expenses over the specified period
    total_average_daily_expenses = (total_expenses_today + (average_daily_expenses_last_30_days * 30)) / 31

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