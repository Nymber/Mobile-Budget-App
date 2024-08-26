from app_settings import app
from flask_apscheduler import APScheduler
import calculations
# Task_Scheduler
scheduler = APScheduler()

# Function to update spending limit daily
@scheduler.task('cron', id='update_spending_limit', hour=0)
def update_spending_limit():
    with app.app_context():
        try:
            from db_env import Account
            from db_env import db
            # Get the list of users
            users = Account.query.all()

            for user in users:
                # Calculate the total money spent by the user today
                total_money_spent_today = calculations.calculate_total_money_spent_today(user.username)

                # Retrieve the user's account and update the spending limit
                account = Account.query.filter_by(username=user.username).first()
                if account:
                    account.spending_limit -= total_money_spent_today
                    db.session.commit()

        except Exception as e:
            # Handle exceptions or log errors
            print(f"Error updating spending limit: {str(e)}")

# Function to create a new FinancialOverview entry per user per day
@scheduler.task('cron', id='create_financial_overview', hour=0)
def create_financial_overview():
    with app.app_context():
        try:
            from db_env import Account
            from db_env import FinancialOverview
            from db_env import db
            # Get the list of users
            users = Account.query.all()

            for user in users:
                # Calculate the financial overview for the user
                account = Account.query.filter_by(username=user.username).first()
                
                if account:
                    msg = account.monthly_savings_goal
                    calc = calculations.calculated(user.username, account)
                    # Create a new instance of FinancialOverview for today
                    new_financial_overview = FinancialOverview(
                        username=user.username, # type: ignore
                        monthly_savings_goal=msg, # type: ignore
                        daily_limit=calc.daily_limit, # type: ignore
                        total_income=calc.total_income, # type: ignore
                        daily_earnings=calc.daily_earnings,
                        weekly_earnings=calc.weekly_earnings, # type: ignore
                        monthly_expenses_non_repeating=calc.monthly_expenses_non_repeating,
                        monthly_expenses=calc.monthly_expenses,
                        total_money_spent_today=calc.total_money_spent_today,
                        daily_expenses_total=calc.daily_expenses_total,
                        monthly_earnings=calc.monthly_earnings,
                        savings_rate=calc.savings_rate, # type: ignore
                        average_daily_expenses=calc.average_daily_expenses, # type: ignore
                        total_expenses=calc.total_expenses, # type: ignore
                        start_of_month=calc.start_of_month, # type: ignore
                        end_of_month=calc.end_of_month, # type: ignore
                        start_of_week=calc.start_of_week,
                        end_of_week=calc.end_of_week,
                        timestamp=datetime.now(timezone.utc) # type: ignore
                    )

                    # Add the new financial overview entry to the database
                    db.session.add(new_financial_overview)
                    db.session.commit()
                else:
                    continue
        except Exception as e:
            # Handle exceptions or log errors
            print(f"Error creating financial overview: {str(e)}")
        

# Initialize and start the scheduler
scheduler.init_app(app)
scheduler.start()