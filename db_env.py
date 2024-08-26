from sqlalchemy import func
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
from flask_apscheduler import APScheduler

# Local imports
from app_settings import app
import calculations 


db = SQLAlchemy(app)

# Database models
class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    repeating = db.Column(db.Boolean, default=False)
    username = db.Column(db.String(100), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

class DailyEarning(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    hourly_rate = db.Column(db.Float)
    hours = db.Column(db.Float)
    cash_tips = db.Column(db.Float)
    salary = db.Column(db.Float)
    username = db.Column(db.String(100), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

class Account(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    ip_address = db.Column(db.String(100), nullable=False)
    spending_limit = db.Column(db.Float, default=0)
    monthly_savings_goal = db.Column(db.Float, default=0)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.now(timezone.utc))

    def __init__(self, username, password, email, ip_address, spending_limit=0, monthly_savings_goal=0):
        self.username = username
        self.password = password
        self.email = email
        self.ip_address = ip_address
        self.spending_limit = spending_limit
        self.monthly_savings_goal = monthly_savings_goal

class InventoryItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit_of_measurement = db.Column(db.String(20), nullable=False)  # For example: oz, gal, etc.
    username = db.Column(db.String(100), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def __init__(self, item_name, quantity, unit_of_measurement, username):
        self.item_name = item_name
        self.quantity = quantity
        self.unit_of_measurement = unit_of_measurement
        self.username = username

class FinancialOverview(db.Model):
    __tablename__ = 'financial_overview'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False)  # Ensure 'username' is a defined column
    monthly_savings_goal = db.Column(db.Float)
    daily_limit = db.Column(db.Float)
    total_income = db.Column(db.Float)
    daily_earnings = db.Column(db.Float)
    weekly_earnings = db.Column(db.Float)
    monthly_expenses_non_repeating = db.Column(db.Float)
    monthly_expenses = db.Column(db.Float)
    total_money_spent_today = db.Column(db.Float)
    daily_expenses_total = db.Column(db.Float)
    monthly_earnings = db.Column(db.Float)
    savings_rate = db.Column(db.Float)
    average_daily_expenses = db.Column(db.Float)
    total_expenses = db.Column(db.Float)
    start_of_month = db.Column(db.DateTime)
    end_of_month = db.Column(db.DateTime)
    start_of_week = db.Column(db.DateTime)
    end_of_week = db.Column(db.DateTime)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.now(timezone.utc))
    def __init__(self, username, monthly_savings_goal=None, daily_limit=None, total_income=None,
                 daily_earnings=None, weekly_earnings=None, monthly_expenses_non_repeating=None,
                 monthly_expenses=None, total_money_spent_today=None, daily_expenses_total=None,
                 monthly_earnings=None, savings_rate=None, average_daily_expenses=None,
                 total_expenses=None, start_of_month=None, end_of_month=None, start_of_week=None,
                 end_of_week=None, timestamp=None):
        self.username = username
        self.monthly_savings_goal = monthly_savings_goal
        self.daily_limit = daily_limit
        self.total_income = total_income
        self.daily_earnings = daily_earnings
        self.weekly_earnings = weekly_earnings
        self.monthly_expenses_non_repeating = monthly_expenses_non_repeating
        self.monthly_expenses = monthly_expenses
        self.total_money_spent_today = total_money_spent_today
        self.daily_expenses_total = daily_expenses_total
        self.monthly_earnings = monthly_earnings
        self.savings_rate = savings_rate
        self.average_daily_expenses = average_daily_expenses
        self.total_expenses = total_expenses
        self.start_of_month = start_of_month
        self.end_of_month = end_of_month
        self.start_of_week = start_of_week
        self.end_of_week = end_of_week
        self.timestamp = timestamp if timestamp else datetime.now(timezone.utc)