#This file defines all SQLAlchemy database models and migration logic.
# It is used to create and update database tables, and run migrations safely.

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, inspect, text, LargeBinary  # Moved LargeBinary import
from sqlalchemy.dialects.postgresql import JSON  # Adjust JSON import if necessary
from datetime import datetime, timezone
from sqlalchemy.orm import relationship  # Added relationship import

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
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Task(Base):
    __tablename__ = 'tasks'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, ForeignKey('accounts.username'))
    title = Column(String)
    is_complete = Column(Boolean, default=False)
    repeat_daily = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class DailyEarning(Base):
    __tablename__ = 'daily_earnings'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, ForeignKey('accounts.username'))
    hourly_rate = Column(Float)
    hours = Column(Float)
    cash_tips = Column(Float)
    salary = Column(Float)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class InventoryItem(Base):
    __tablename__ = 'inventory_items'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, ForeignKey('accounts.username'))
    name = Column(String)
    category = Column(String)
    quantity = Column(Float)
    price = Column(Float)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class FinancialOverview(Base):
    __tablename__ = 'financial_overview'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, ForeignKey('accounts.username'))
    daily_limit = Column(Float)
    daily_earnings = Column(Float)
    total_money_spent_today = Column(Float)
    monthly_earnings = Column(Float)
    monthly_expenses = Column(Float)
    monthly_expenses_repeating = Column(Float)  # New field
    monthly_expenses_non_repeating = Column(Float)  # New field
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
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Account(Base):
    __tablename__ = 'accounts'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    email = Column(String, unique=True, index=True)
    spending_limit = Column(Float, default=0.0)
    monthly_savings_goal = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    feedback = relationship("Feedback", back_populates="user")  # Added relationship

class SharedCalendarEvent(Base):
    __tablename__ = 'calendar_events'
    id = Column(Integer, primary_key=True)
    title = Column(String)
    description = Column(String)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    created_by = Column(String, ForeignKey('accounts.username'))
    shared_with = Column(JSON)  # List of usernames

class Receipt(Base):
    __tablename__ = 'receipts'
    id = Column(Integer, primary_key=True)
    username = Column(String, ForeignKey('accounts.username'))
    image_data = Column(LargeBinary)
    processed_data = Column(JSON)
    date = Column(DateTime)
    total = Column(Float)
    items = Column(JSON)  # Store individual items
    category = Column(String, default="Uncategorized")
    vendor = Column(String)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Notification(Base):
    __tablename__ = 'notifications'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, ForeignKey('accounts.username'))
    message = Column(String)
    is_read = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Feedback(Base):
    __tablename__ = "feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, ForeignKey("accounts.username"))
    message = Column(String)
    type = Column(String)  # general, bug, feature, improvement
    rating = Column(Integer)  # 0-5 star rating
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Relationship with Account
    user = relationship("Account", back_populates="feedback")

def migrate_database():
    """Run database migrations safely"""
    try:
        # Create new columns if they don't exist
        with engine.connect() as conn:
            # Check if columns exist before adding them
            inspector = inspect(engine)
            
            # Financial overview table migrations
            financial_columns = {col['name'] for col in inspector.get_columns('financial_overview')}
            
            if 'monthly_expenses_repeating' not in financial_columns:
                conn.execute(text("""
                    ALTER TABLE financial_overview 
                    ADD COLUMN monthly_expenses_repeating FLOAT DEFAULT 0.0
                """))
                
            if 'monthly_expenses_non_repeating' not in financial_columns:
                conn.execute(text("""
                    ALTER TABLE financial_overview 
                    ADD COLUMN monthly_expenses_non_repeating FLOAT DEFAULT 0.0
                """))
            
            # Inventory items table migrations
            inventory_columns = {col['name'] for col in inspector.get_columns('inventory_items')}
            
            if 'category' not in inventory_columns:
                conn.execute(text("""
                    ALTER TABLE inventory_items 
                    ADD COLUMN category TEXT
                """))
            
            # Receipts table migrations
            if 'receipts' in inspector.get_table_names():
                receipts_columns = {col['name'] for col in inspector.get_columns('receipts')}
                
                if 'category' not in receipts_columns:
                    conn.execute(text("""
                        ALTER TABLE receipts 
                        ADD COLUMN category TEXT DEFAULT 'Uncategorized'
                    """))
                    conn.commit()  # Commit this change immediately
                
                if 'timestamp' not in receipts_columns:
                    conn.execute(text("""
                        ALTER TABLE receipts 
                        ADD COLUMN timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                    """))
                
                if 'vendor' not in receipts_columns:
                    conn.execute(text("""
                        ALTER TABLE receipts 
                        ADD COLUMN vendor TEXT
                    """))
            
            # Force recreate receipts table if needed
            if 'receipts' in inspector.get_table_names():
                if 'category' not in {col['name'] for col in inspector.get_columns('receipts')}:
                    print("Receipts table is missing required columns. Trying to fix...")
                    # First backup existing data
                    receipts_backup = conn.execute(text("SELECT * FROM receipts")).fetchall()
                    
                    # Drop and recreate table with proper schema
                    conn.execute(text("DROP TABLE IF EXISTS receipts_old"))
                    conn.execute(text("ALTER TABLE receipts RENAME TO receipts_old"))
                    
                    # Create new table with proper schema
                    Base.metadata.tables['receipts'].create(bind=engine)
                    
                    # Try to restore data that can be migrated
                    if receipts_backup:
                        print(f"Attempting to migrate {len(receipts_backup)} receipts to new schema")
                        # Will implement data restoration based on available columns
                
            conn.commit()
        
        print("Database migration completed successfully")
    except Exception as e:
        print(f"Error during migration: {str(e)}")
        raise

# Create tables
Base.metadata.create_all(bind=engine)

# Run migration when file is executed directly or when imported
migrate_database()

if __name__ == "__main__":
    print("Database setup completed")
