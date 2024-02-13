from sqlalchemy import func
from flask_sqlalchemy import SQLAlchemy
from app_settings import app
from datetime import datetime, timedelta, timezone

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

    def __init__(self, username, password, email, ip_address, spending_limit=0):
        self.username = username
        self.password = password
        self.email = email
        self.ip_address = ip_address
        self.spending_limit = spending_limit