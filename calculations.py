from sqlalchemy import func
from typing import Union
from datetime import datetime, timedelta

import env as env

def calculate_daily_limit(username, current_date):
    try:
        # Retrieve account information
        from db_env import Account
        account = Account.query.filter_by(username=username).first()

        if not account:
            print(f"No account found for username: {username}")
            return 0

        # Calculate total monthly expenses for non-repeating expenses
        monthly_expenses_non_repeating = calculate_non_repeating_monthly_expenses(username, current_date)
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
    except Exception as e:
        print(f"Error calculating daily limit for {username}: {str(e)}")
        return 0

def calculate_total_non_repeating_expenses_within_24_hours(username, today_date):
    try:
        from db_env import Expense
        """Calculate the total non-repeating expenses within the last 24 hours."""
        start_of_day = today_date - timedelta(days=1)

        expenses_within_24_hours = Expense.query.filter(
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

def calculate_non_repeatable_expenses_last_24_hours(username, current_date):
    try:
        from db_env import Expense
        start_time = current_date - timedelta(hours=24)
        end_time = current_date

        non_repeatable_expenses = Expense.query.filter(
            Expense.username == username,
            Expense.timestamp >= start_time,
            Expense.timestamp <= end_time,
            Expense.repeating.is_(False)
        ).all()

        total_expenses_last_24_hours = sum(expense.price for expense in non_repeatable_expenses)

        return total_expenses_last_24_hours
    except Exception as e:
        print(f"Error calculating non-repeatable expenses for {username}: {str(e)}")
        return 0

def calculate_monthly_expenses_repeating(username):
    """Calculate total monthly expenses for repeating expenses of a given user."""
    try:
        from db_env import Expense
        total_expenses = Expense.query.with_entities(func.sum(Expense.price)). \
            filter(Expense.username == username,
                   Expense.repeating.is_(True)).scalar() or 0
        return total_expenses

    except Exception as e:
        print(f"An error occurred while calculating repeating expenses for {username}: {str(e)}")
        return 0

def calculate_non_repeating_monthly_expenses(username, today):
    try:
        from db_env import Expense
        from db_env import db
        """Calculate total non-repeating expenses in the last 30 days for a given user."""
        start_of_month = today - timedelta(days=30)
        total_expenses = Expense.query.filter(
            (Expense.username == username) &
            ((Expense.timestamp >= start_of_month) & (Expense.timestamp <= today)) &
            (Expense.repeating == False)
        ).with_entities(db.func.sum(Expense.price)).scalar() or 0
        return total_expenses
    except Exception as e:
        print(f"An error occurred while calculating non-repeating monthly expenses for {username}: {str(e)}")
        return 0

def calculate_weekly_earnings(username, start_of_week, end_of_week):
    try:
        from db_env import DailyEarning
        """Calculate total weekly earnings for a given user."""
        earnings = DailyEarning.query.filter(
            DailyEarning.username == username,
            DailyEarning.timestamp >= start_of_week,
            DailyEarning.timestamp < end_of_week
        ).all()
        total_earnings = sum(earning.cash_tips for earning in earnings)
        total_earnings = sum(earning.hourly_rate * earning.hours for earning in earnings) + total_earnings
        total_earnings = sum(earning.salary / 55 for earning in earnings) + total_earnings
        return total_earnings
    except Exception as e:
        print(f"Error calculating weekly earnings for {username}: {str(e)}")
        return 0

def calculate_daily_earnings(username, date):
    try:
        from db_env import DailyEarning
        # Determine the start and end dates of the week
        start_of_week = date - timedelta(days=date.weekday())
        end_of_week = start_of_week + timedelta(days=7)

        # Retrieve earnings data for the week plus one day
        earnings = DailyEarning.query.filter(
            DailyEarning.username == username,
            DailyEarning.timestamp >= start_of_week,
            DailyEarning.timestamp <= date
        ).all()

        # Calculate total earnings for the week
        total_cash_tips = sum(earning.cash_tips for earning in earnings)
        total_hourly_earnings = sum(earning.hourly_rate * earning.hours for earning in earnings)
        total_salary_earnings = sum(earning.salary / 365 for earning in earnings)

        # Aggregate total earnings
        total_earnings = (total_cash_tips + total_hourly_earnings + total_salary_earnings) / 7

        return total_earnings
    except Exception as e:
        print(f"Error calculating daily earnings for {username}: {str(e)}")
        return 0

def calculate_monthly_earnings(username, start_of_month):
    try:
        from db_env import DailyEarning
        """Calculate total monthly earnings for a given user."""
        end_of_month = start_of_month + timedelta(days=30)
        earnings = DailyEarning.query.filter(
            DailyEarning.username == username,
            DailyEarning.timestamp >= start_of_month,
            DailyEarning.timestamp < end_of_month
        ).all()
        total_earnings = sum(earning.cash_tips for earning in earnings)
        total_earnings = sum(earning.hourly_rate * earning.hours for earning in earnings) + total_earnings
        total_earnings = sum(earning.salary / 12 for earning in earnings) + total_earnings
        return total_earnings
    except Exception as e:
        print(f"Error calculating monthly earnings for {username}: {str(e)}")
        return 0

def calculate_total_income(username, start_date, end_date):
    try:
        from db_env import DailyEarning
        """Calculate the total income for a given user within a specified period."""
        earnings = DailyEarning.query.filter(
            DailyEarning.username == username,
            DailyEarning.timestamp >= start_date,
            DailyEarning.timestamp < end_date   
        ).all()
        total_earnings = sum(earning.hourly_rate * earning.hours for earning in earnings)
        total_income = sum(earning.salary + earning.cash_tips for earning in earnings) + total_earnings
        return total_income
    except Exception as e:
        print(f"Error calculating total income for {username}: {str(e)}")
        return 0

def calculate_average_daily_expenses(username: str, today_date: Union[datetime, str]) -> float:
    try:
        """Calculate the average daily expenses for a given user over a specified period."""
        if isinstance(today_date, str):
            today_date = datetime.strptime(today_date, '%Y-%m-%d')

        # Calculate the start date of 30 days ago
        thirty_days_ago = today_date - timedelta(days=30)

        total_monthly_expenses_last_30_days = (
            calculate_monthly_expenses_repeating(username) +
            calculate_non_repeating_monthly_expenses(username, today_date)
        )
        total_average_daily_expenses = total_monthly_expenses_last_30_days / 30  # Divide by 30 days

        return total_average_daily_expenses
    except Exception as e:
        print(f"Error calculating average daily expenses for {username}: {str(e)}")
        return 0.0

def generate_forecast_data(username):
    try:
        """Generate forecasts for savings, expenses, and earnings for the next 6 months using SARIMA."""
        expense_forecast = generate_expense_forecast(username)
        earnings_forecast = generate_earnings_forecast(username)
        savings_forecast = generate_savings_forecast(username)

        forecast_data = [expense_forecast, earnings_forecast, savings_forecast]
        return forecast_data
    except Exception as e:
        print(f"Error generating forecast data for {username}: {str(e)}")
        return []

def get_historical_expenses(username):
    try:
        from db_env import Expense
        """Retrieve the historical expenses for a given user."""
        expenses = Expense.query.filter(Expense.username == username).all()
        historical_expenses = [expense.price for expense in expenses]
        return historical_expenses
    except Exception as e:
        print(f"Error retrieving historical expenses for {username}: {str(e)}")
        return []

def generate_expense_forecast(username):
    try:
        """Generate a forecast for future expenses for a given user using a simple moving average."""
        historical_expenses = get_historical_expenses(username)
        forecast = [sum(historical_expenses[-6:]) / 6] * 6  # Simple moving average of the last 6 months
        return forecast
    except Exception as e:
        print(f"Error generating expense forecast for {username}: {str(e)}")
        return []

def get_total_historical_earnings(username):
    try:
        from db_env import DailyEarning
        """Retrieve the total historical earnings for a given user."""
        earnings = DailyEarning.query.filter(DailyEarning.username == username).all()
        total_earnings = sum(earning.hourly_rate * earning.hours + earning.cash_tips for earning in earnings)
        total_earnings += sum(earning.salary / 12 for earning in earnings)
        return total_earnings
    except Exception as e:
        print(f"Error retrieving total historical earnings for {username}: {str(e)}")
        return 0

def generate_earnings_forecast(username):
    try:
        """Generate a forecast for future earnings for a given user using a simple moving average."""
        historical_earnings = get_total_historical_earnings(username)
        forecast = [historical_earnings / 6] * 6  # Simple moving average of the last 6 months
        return forecast
    except Exception as e:
        print(f"Error generating earnings forecast for {username}: {str(e)}")
        return []

def generate_savings_forecast(username):
    try:
        """Generate a forecast for future savings for a given user using SARIMA."""
        expense_forecast = generate_expense_forecast(username)
        earnings_forecast = generate_earnings_forecast(username)
        savings_forecast = [earnings - expense for earnings, expense in zip(earnings_forecast, expense_forecast)]
        return savings_forecast
    except Exception as e:
        print(f"Error generating savings forecast for {username}: {str(e)}")
        return []

def calculate_total_money_spent_today(username):
    try:
        from db_env import Expense
        start_of_day = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)

        expenses_today = Expense.query.filter(
            Expense.username == username,
            Expense.timestamp >= start_of_day,
            Expense.timestamp < end_of_day
        ).all()

        total_money_spent_today = sum(expense.price for expense in expenses_today)
        return total_money_spent_today
    except Exception as e:
        print(f"Error calculating total money spent today for {username}: {str(e)}")
        return 0

class Calculated:
    def __init__(self, username, account):
        try:
            # Dates
            from db_env import Expense
            self.current_date = datetime.utcnow()
            self.start_of_month = self.current_date - timedelta(days=30)
            self.end_of_month = self.start_of_month + timedelta(days=30)
            self.start_of_day = self.current_date - timedelta(days=1)
            
            # Calculate daily expenses
            self.daily_expenses = Expense.query.filter(
                Expense.username == username,
                Expense.timestamp >= self.start_of_day
            ).all()

            # Calculate days expenses
            self.daily_expenses_total = calculate_average_daily_expenses(username, self.current_date)

            # Calculate monthly expenses
            self.monthly_expenses = calculate_monthly_expenses_repeating(username) + calculate_non_repeating_monthly_expenses(username, self.current_date)

            # Calculate daily savings needed (monthly savings goal divided by 30)
            self.daily_savings_needed = account.monthly_savings_goal / 30

            # Total daily expenses including the savings needed portion
            self.daily_expenses_total += self.daily_savings_needed

            # Calculate total money spent today
            self.total_money_spent_today = calculate_total_non_repeating_expenses_within_24_hours(username, self.current_date)

            # Calculate total monthly expenses for non-repeating expenses
            self.monthly_expenses_non_repeating = calculate_non_repeating_monthly_expenses(username, self.current_date)
            self.monthly_expenses_repeating = calculate_monthly_expenses_repeating(username)
            
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
        except Exception as e:
            print(f"Error initializing Calculated class for {username}: {str(e)}")

def calculated(username, account):
    try:
        result = Calculated(username, account)
        return result
    except Exception as e:
        print(f"Error creating Calculated instance for {username}: {str(e)}")
        return None
