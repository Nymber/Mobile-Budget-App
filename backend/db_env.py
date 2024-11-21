from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from datetime import datetime

# Local imports
from settings.db_settings import Base, engine  # Updated import

# Database models
class Expense(Base):
    __tablename__ = 'expenses'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, ForeignKey('accounts.username'))
    name = Column(String)
    price = Column(Float)
    repeating = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

class Task(Base):
    __tablename__ = 'tasks'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, ForeignKey('accounts.username'))
    title = Column(String)
    is_complete = Column(Boolean, default=False)
    repeat_daily = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

class DailyEarning(Base):
    __tablename__ = 'daily_earnings'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, ForeignKey('accounts.username'))
    hourly_rate = Column(Float)
    hours = Column(Float)
    cash_tips = Column(Float)
    salary = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

class InventoryItem(Base):
    __tablename__ = 'inventory_items'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, ForeignKey('accounts.username'))
    name = Column(String)
    quantity = Column(Float)
    price = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

class FinancialOverview(Base):
    __tablename__ = 'financial_overview'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, ForeignKey('accounts.username'))
    daily_limit = Column(Float)
    daily_earnings = Column(Float)
    total_money_spent_today = Column(Float)
    monthly_earnings = Column(Float)
    monthly_expenses = Column(Float)
    savings_rate = Column(Float)
    savings_forecast = Column(Float)
    daily_expenses_total = Column(Float)
    average_daily_expenses = Column(Float)
    total_expenses = Column(Float)
    start_of_month = Column(DateTime)
    end_of_month = Column(DateTime)
    start_of_week = Column(DateTime)
    end_of_week = Column(DateTime)
    unused_daily_limit = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow)

class Account(Base):
    __tablename__ = 'accounts'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    email = Column(String, unique=True, index=True)
    spending_limit = Column(Float, default=0.0)
    monthly_savings_goal = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)
