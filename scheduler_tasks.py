from flask_apscheduler import APScheduler
import calculations
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
        
scheduler.init_app(app)