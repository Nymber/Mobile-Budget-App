# This file contains the functions that are used by the scheduler to run tasks at a specific time. 
# The update_spending_limit function updates the spending limit for all users in the database. 
# While the reset_repeating_tasks function resets all repeating tasks to incomplete. 
# These functions are run at midnight every day using the BackgroundScheduler class from the apscheduler library.
from datetime import datetime, timezone
import calculations as calculations
from calculations import calculate_daily_limit as calculated
import db_env as db_env
from settings.db_settings import SessionLocal

def update_spending_limit():
    session = SessionLocal()
    try:
        users = session.query(db_env.Account).all()

        for user in users:
            account = session.query(db_env.Account).filter_by(username=user.username).first()
            calc = calculated(user.username, account)

            savings = calc.monthly_earnings - calc.monthly_expenses - account.monthly_savings_goal
            Finances = db_env.FinancialOverview(
                monthly_savings_goal=account.monthly_savings_goal,
                daily_limit=calc.daily_limit,
                total_income=calc.total_income,
                daily_earnings=calc.daily_earnings,
                weekly_earnings=calc.weekly_earnings,
                monthly_expenses=calc.monthly_expenses,
                total_money_spent_today=calc.total_money_spent_today,
                daily_expenses_total=calc.daily_expenses_total,
                monthly_earnings=calc.monthly_earnings,
                savings_rate=calc.savings_rate,
                savings_forecast=savings,
                average_daily_expenses=calc.average_daily_expenses,
                total_expenses=calc.total_expenses,
                start_of_month=calc.start_of_month,
                end_of_month=calc.end_of_month,
                start_of_week=calc.start_of_week,
                end_of_week=calc.end_of_week,
                timestamp=datetime.now(timezone.utc),
                username=user.username
            )

            session.add(Finances)
            session.commit()
            print("New entry created successfully.")

    except Exception as e:
        session.rollback()
        print(f"Error updating spending limit: {str(e)}")
    finally:
        session.close()

def reset_repeating_tasks():
    session = SessionLocal()
    try:
        tasks = session.query(db_env.Task).filter_by(repeat_daily=True).all()
        
        for task in tasks:
            task.is_complete = False
        
        session.commit()
        print("Successfully reset repeating tasks")
    except Exception as e:
        session.rollback()
        print(f"An error occurred while resetting tasks: {e}")
    finally:
        session.close()
