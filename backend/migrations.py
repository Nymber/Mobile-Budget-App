
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timezone
import calculations
from db_env import Base, Account, FinancialOverview
from settings.db_settings import SQLALCHEMY_DATABASE_URL

def safe_migrate():
    """Safely migrate database schema and data"""
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # 1. Check if tables exist, create if they don't
        if not inspect(engine).has_table('financial_overview'):
            Base.metadata.tables['financial_overview'].create(bind=engine)
        
        # 2. Add new columns safely
        inspector = inspect(engine)
        existing_columns = {col['name'] for col in inspector.get_columns('financial_overview')}
        
        new_columns = {
            'monthly_expenses_repeating': 'FLOAT DEFAULT 0.0',
            'monthly_expenses_non_repeating': 'FLOAT DEFAULT 0.0',
            'total_money_spent_today': 'FLOAT DEFAULT 0.0',
            'daily_earnings': 'FLOAT DEFAULT 0.0'
        }
        
        for col_name, col_type in new_columns.items():
            if col_name not in existing_columns:
                session.execute(text(f"""
                    ALTER TABLE financial_overview 
                    ADD COLUMN {col_name} {col_type}
                """))
        
        # 3. Update existing records with calculated values
        accounts = session.query(Account).all()
        current_date = datetime.now(timezone.utc)
        
        for account in accounts:
            # Get or create financial overview
            overview = session.query(FinancialOverview).filter_by(
                username=account.username
            ).first()
            
            if not overview:
                overview = FinancialOverview(username=account.username)
                session.add(overview)
            
            # Update with calculated values
            overview.monthly_expenses_repeating = calculations.calculate_monthly_expenses_repeating(account.username)
            overview.monthly_expenses_non_repeating = calculations.calculate_non_repeating_monthly_expenses(
                account.username, current_date
            )
            overview.total_money_spent_today = calculations.calculate_total_money_spent_today(
                account.username, current_date
            )
            overview.daily_earnings = calculations.calculate_daily_earnings(
                account.username, current_date
            )
        
        session.commit()
        print("Migration completed successfully")
        
    except Exception as e:
        session.rollback()
        print(f"Migration failed: {str(e)}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    safe_migrate()