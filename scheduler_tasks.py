from flask_apscheduler import APScheduler
from datetime import datetime

# Local imports
import calculations
from calculations import calculated
import db_env
from db_env import db
from app_settings import app

scheduler = APScheduler()

@scheduler.task('cron', id='update_spending_limit', hour=0)
def update_spending_limit():
    try:
        # Get the list of users
        users = db_env.Account.query.all()

        for user in users:
            # Calculate the total money spent by the user today
            total_money_spent_today = calculations.calculate_total_money_spent_today(user.username)

            # Retrieve the user's account and update the spending limit
            account = db_env.Account.query.filter_by(username=user.username).first()
            if account:
                account.spending_limit -= total_money_spent_today
                db.session.commit()

    except Exception as e:
        # Handle exceptions or log errors

        print(f"Error updating spending limit: {str(e)}")
@scheduler.task('cron', id='update_spending_limit', hour=0)
def update_spending_limit():
    users = db_env.Account.query.all()
    for user in users:
            # Calculate the total money spent by the user today
            total_money_spent_today = calculations.calculate_total_money_spent_today(user.username)

            # Retrieve the user's account and update the spending limit
            account = db_env.Account.query.filter_by(username=user.username).first()
            calc = calculated(user.username, account)

            # Create a new instance of FinancialOverview if no entry exists for today
            Finances = db_env.FinancialOverview(
                monthly_savings_goal=account.monthly_savings_goal,
                daily_limit=calc.daily_limit,
                total_income=calc.total_income,
                daily_earnings=calc.daily_earnings,
                weekly_earnings=calc.weekly_earnings,
                monthly_expenses_non_repeating=calc.monthly_expenses_non_repeating,
                monthly_expenses=calc.monthly_expenses,
                total_money_spent_today=calc.total_money_spent_today,
                daily_expenses_total=calc.daily_expenses_total,
                monthly_earnings=calc.monthly_earnings,
                savings_rate=calc.savings_rate,
                average_daily_expenses=calc.average_daily_expenses,
                total_expenses=calc.total_expenses,
                start_of_month=calc.start_of_month,
                end_of_month=calc.end_of_month,
                start_of_week=calc.start_of_week,
                end_of_week=calc.end_of_week,
                timestamp=datetime.utcnow(),  # Correct datetime usage
                username=user.username
            )

            # Add the new instance to the session and commit the changes
            db.session.add(Finances)
            try:
                db.session.commit()
                print("New entry created successfully.")
            except Exception as e:
                db.session.rollback()
                print(f"An error occurred while creating a new entry: {e}")

scheduler.init_app(app)