from flask import Flask, render_template, request, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta, timezone
from dateutil.relativedelta import relativedelta
from sqlalchemy import func
from flask_apscheduler import APScheduler
from statsmodels.tsa.statespace.sarimax import SARIMAX
from builtins import round

app = Flask(__name__)
app.secret_key = 'your_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///financial_data.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SCHEDULER_API_ENABLED'] = True
scheduler = APScheduler()
scheduler.init_app(app)
db = SQLAlchemy(app)

@scheduler.task('cron', id='update_spending_limit', hour=0)
def update_spending_limit():
    try:
        # Get the list of users
        users = Account.query.all()

        for user in users:
            # Calculate the total money spent by the user today
            total_money_spent_today = calculate_total_money_spent_today(user.username)

            # Retrieve the user's account and update the spending limit
            account = Account.query.filter_by(username=user.username).first()
            if account:
                account.spending_limit -= total_money_spent_today
                db.session.commit()

    except Exception as e:
        # Handle exceptions or log errors
        print(f"Error updating spending limit: {str(e)}")

def calculate_total_money_spent_today(username):
    # Calculate the start and end timestamps for today
    start_of_day = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(days=1)

    # Retrieve expenses made by the user today
    expenses_today = Expense.query.filter(
        Expense.username == username,
        Expense.timestamp >= start_of_day,
        Expense.timestamp < end_of_day
    ).all()

    # Calculate the total money spent today
    total_money_spent_today = sum(expense.price for expense in expenses_today)
    return total_money_spent_today

def round_env(value, precision=0):
    """Round a number to a certain number of decimal places."""
    try:
        return round(float(value), precision)
    except (ValueError, TypeError):
        return value

app.jinja_env.filters['round_env'] = round_env
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


#Calculations

def calculate_non_repeatable_expenses_last_24_hours(username, current_date):
    try:
        # Calculate the start and end timestamps for the last 24 hours
        start_time = current_date - timedelta(hours=24)
        end_time = current_date

        # Retrieve non-repeatable expenses made by the user within the last 24 hours
        non_repeatable_expenses = Expense.query.filter(
            Expense.username == username,
            Expense.timestamp >= start_time,
            Expense.timestamp <= end_time,
            Expense.repeating == 'No'  # Assuming 'No' is used for non-repeating expenses
        ).all()

        # Calculate the total of non-repeatable expenses made in the last 24 hours
        total_expenses_last_24_hours = sum(expense.price for expense in non_repeatable_expenses)

        return total_expenses_last_24_hours
    except Exception as e:
        # Log the exception for debugging purposes
        print(f"Error calculating non-repeatable expenses: {str(e)}")
        return 0  # Return a default value or handle the error as needed

    return total_expenses_last_24_hours

def calculate_daily_limit(username, current_date):
    # Retrieve account information
    account = Account.query.filter_by(username=username).first()

    if account:
        # Calculate total monthly expenses for non-repeating expenses
        start_of_month = current_date - timedelta(days=30)
        end_of_month = start_of_month + timedelta(days=30)
        monthly_expenses_non_repeating = calculate_monthly_expenses(username)

        # Calculate daily savings needed (monthly savings goal divided by 30)
        daily_savings_needed = account.monthly_savings_goal / 30

        # Total daily expenses including the savings needed portion
        daily_expenses_total = monthly_expenses_non_repeating / 30 + daily_savings_needed

        # Calculate weekly earnings
        start_of_week = current_date - timedelta(days=current_date.weekday())
        end_of_week = start_of_week + timedelta(days=7)
        weekly_earnings = calculate_weekly_earnings(username, start_of_week, end_of_week)

        # Calculate daily earnings
        daily_earnings = calculate_daily_earnings(username, current_date)

        # Calculate total non-repeatable expenses made in the last 24 hours
        non_repeatable_expenses_last_24_hours = calculate_non_repeatable_expenses_last_24_hours(username, current_date)

        # Subtract non-repeatable expenses made in the last 24 hours from daily expenses total
        daily_expenses_total -= non_repeatable_expenses_last_24_hours

        # Subtract spending limit from the daily limit
        spending_limit = account.spending_limit  # Retrieve spending limit from the account
        daily_limit = max(0, weekly_earnings / 7 - daily_expenses_total + spending_limit)
        
        return round_env(daily_limit, 2)

    return 0  # Default to 0 if account not found

def calculate_monthly_expenses(username):
    """Calculate total monthly expenses for repeating expenses of a given user."""
    try:
        total_expenses = Expense.query.with_entities(func.sum(Expense.price)). \
            filter(Expense.username == username,
                   Expense.repeating.is_(True)).scalar() or 0

        return total_expenses

    except Exception as e:
        print(f"An error occurred while calculating expenses: {str(e)}")
        return 0

def calculate_non_repeating_monthly_expenses(username, today):
    """Calculate total non-repeating expenses in the last 30 days for a given user."""
    start_of_month = today - timedelta(days=30)
    total_expenses = Expense.query.filter(
        (Expense.username == username) &
        ((Expense.timestamp >= start_of_month) & (Expense.timestamp <= today)) &
        (Expense.repeating == False)
    ).with_entities(db.func.sum(Expense.price)).scalar() or 0
    return total_expenses

def calculate_weekly_earnings(username, start_of_week, end_of_week):
    """Calculate total weekly earnings for a given user."""
    earnings = DailyEarning.query.filter(
        DailyEarning.username == username,
        DailyEarning.timestamp >= start_of_week,
        DailyEarning.timestamp < end_of_week
    ).all()
    total_earnings = sum(earning.salary + earning.cash_tips for earning in earnings)
    return total_earnings


def calculate_daily_earnings(username, date):
    """Calculate the daily earnings ratio based on the week plus one day of earnings."""
    # Determine the start and end dates of the week
    start_of_week = date - timedelta(days=date.weekday())
    end_of_week = start_of_week + timedelta(days=6)

    # Retrieve earnings data for the week plus one day
    earnings = DailyEarning.query.filter(
        DailyEarning.username == username,
        DailyEarning.timestamp >= start_of_week,
        DailyEarning.timestamp <= date
    ).all()

    # Calculate total earnings for the week plus one day
    total_earnings = sum(earning.salary + earning.cash_tips for earning in earnings)

    # Calculate the number of days in the week plus one
    days_in_week_plus_one = (end_of_week - start_of_week).days + 1

    # Calculate the daily earnings ratio
    if days_in_week_plus_one > 0:
        daily_earnings_ratio = total_earnings / days_in_week_plus_one
    else:
        daily_earnings_ratio = 0

    return daily_earnings_ratio


def calculate_monthly_earnings(username, start_of_month):
    """Calculate total monthly earnings for a given user."""
    end_of_month = start_of_month + timedelta(days=30)
    earnings = DailyEarning.query.filter(
        DailyEarning.username == username,
        DailyEarning.timestamp >= start_of_month,
        DailyEarning.timestamp < end_of_month
    ).all()
    total_earnings = sum(earning.salary + earning.cash_tips for earning in earnings)
    return total_earnings


def calculate_total_income(username, start_date, end_date):
    """Calculate the total income for a given user within a specified period."""
    earnings = DailyEarning.query.filter(
        DailyEarning.username == username,
        DailyEarning.timestamp >= start_date,
        DailyEarning.timestamp < end_date
    ).all()
    total_income = sum(earning.salary + earning.cash_tips for earning in earnings)
    return total_income

def calculate_average_daily_expenses(username, today_date):
    """Calculate the average daily expenses for a given user over a specified period."""
    # Calculate the start date of 30 days ago
    thirty_days_ago = today_date - timedelta(days=30)

    # Retrieve total monthly expenses for the last 30 days
    total_monthly_expenses_last_30_days = calculate_monthly_expenses(username) + calculate_non_repeating_monthly_expenses(username, today_date)

    # Retrieve total expenses for today
    expenses_today = Expense.query.filter(
        Expense.username == username,
        Expense.timestamp >= today_date,
        Expense.timestamp < today_date + timedelta(days=1)
    ).all()

    # Calculate total expenses for today
    total_expenses_today = sum(expense.price for expense in expenses_today)

    # Calculate the number of days in the last 30 days
    days_in_last_30_days = (today_date - thirty_days_ago).days

    # Calculate the average daily expenses over the last 30 days
    if days_in_last_30_days > 0:
        average_daily_expenses_last_30_days = total_monthly_expenses_last_30_days / days_in_last_30_days
    else:
        average_daily_expenses_last_30_days = 0

    # Calculate the total average daily expenses over the specified period
    total_average_daily_expenses = (total_expenses_today + (average_daily_expenses_last_30_days * 30)) / 31

    return total_average_daily_expenses


def generate_forecast_data(username):
    """Generate forecasts for savings, expenses, and earnings for the next 6 months using SARIMA."""
    # Generate forecasts for expenses, earnings, and savings
    expense_forecast = generate_expense_forecast(username)
    earnings_forecast = generate_earnings_forecast(username)
    savings_forecast = generate_savings_forecast(username)

    # Combine the forecasts into a single data structure
    forecast_data = [expense_forecast, earnings_forecast, savings_forecast]

    return forecast_data

def get_historical_expenses(username):
    """Retrieve the historical expenses for a given user."""
    # Replace with actual implementation to retrieve historical expenses
    expenses = Expense.query.filter(Expense.username == username).all()
    historical_expenses = [expense.price for expense in expenses]
    return historical_expenses

def generate_expense_forecast(username):
    """Generate a forecast for future expenses for a given user using a simple moving average."""
    # Replace placeholder code with actual implementation
    historical_expenses = get_historical_expenses(username)
    forecast = [sum(historical_expenses[-6:]) / 6] * 6  # Simple moving average of the last 6 months
    return forecast

def get_total_historical_earnings(username):
    """Retrieve the total historical earnings for a given user."""
    # Retrieve all historical earnings for the user
    earnings = DailyEarning.query.filter(DailyEarning.username == username).all()

    # Initialize the total earnings variable
    total_earnings = 0

    # Calculate total earnings from hourly_rate, hours, and cash_tips
    for earning in earnings:
        total_earnings += earning.hourly_rate * earning.hours + earning.cash_tips

    # If salary is present, add it to total earnings (divided by 12 for monthly data)
    for earning in earnings:
        total_earnings += earning.salary / 12

    return total_earnings

def generate_earnings_forecast(username):
    """Generate a forecast for future earnings for a given user using a simple moving average."""
    # Actual implementation: Use a simple moving average to forecast earnings for the next 6 months
    historical_earnings = get_total_historical_earnings(username)
    forecast = [historical_earnings / 6] * 6  # Simple moving average of the last 6 months
    return forecast

def generate_savings_forecast(username):
    """Generate a forecast for future savings for a given user using SARIMA."""
    # Placeholder implementation: Calculate savings based on difference between earnings and expenses
    expense_forecast = generate_expense_forecast(username)
    earnings_forecast = generate_earnings_forecast(username)

    # Apply a more sophisticated savings forecast model
    savings_forecast = [earnings - expense for earnings, expense in zip(earnings_forecast, expense_forecast)]

    return savings_forecast


def calculate_total_non_repeating_expenses_within_24_hours(username, today_date):
    """Calculate the total non-repeating expenses within the last 24 hours."""
    # Calculate the start and end timestamps for the last 24 hours
    start_of_day = today_date - timedelta(days=1)

    # Retrieve non-repeating expenses within the last 24 hours
    expenses_within_24_hours = Expense.query.filter(
        Expense.username == username,
        Expense.timestamp >= start_of_day,
        Expense.timestamp < today_date + timedelta(days=1),
        Expense.repeating.is_(False)
    ).all()

    # Calculate total non-repeating expenses within the last 24 hours
    total_non_repeating_expenses_within_24_hours = sum(expense.price for expense in expenses_within_24_hours)

    return total_non_repeating_expenses_within_24_hours


# Routes and views
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        account = Account.query.filter_by(username=username, password=password).first()
        if account:
            session['username'] = username
            return redirect(url_for('dashboard'))
    return render_template('login.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        email = request.form['email']
        ip_address = request.remote_addr
        account = Account(username=username, password=password, email=email, ip_address=ip_address)
        db.session.add(account)
        db.session.commit()
        return redirect(url_for('login'))
    return render_template('register.html')


@app.route('/dashboard', methods=['GET', 'POST'])
def dashboard():
    if 'username' in session:
        # Initialize variables
        username = session['username']
        current_date = datetime.utcnow()

        # Retrieve account information
        account = Account.query.filter_by(username=username).first()

        if account:
            if request.method == 'POST':
                # Handle form submission for setting monthly savings goal
                monthly_savings_goal = float(request.form['monthly_savings_goal'])
                account.monthly_savings_goal = monthly_savings_goal
                db.session.commit()

            # Calculate daily expenses
            start_of_day = current_date - timedelta(days=1)
            daily_expenses = Expense.query.filter(
                Expense.username == username,
                Expense.timestamp >= start_of_day
            ).all()

            daily_expenses_total = sum(expense.price for expense in daily_expenses)
            monthly_expenses = calculate_monthly_expenses(username)

            # Calculate daily savings needed (monthly savings goal divided by 30)
            daily_savings_needed = account.monthly_savings_goal / 30

            # Total daily expenses including the savings needed portion
            daily_expenses_total += daily_savings_needed

            # Calculate total money spent today
            total_money_spent_today = calculate_total_non_repeating_expenses_within_24_hours(username, current_date)

            # Calculate total monthly expenses for non-repeating expenses
            start_of_month = current_date - timedelta(days=30)
            end_of_month = start_of_month + timedelta(days=30)
            monthly_expenses_non_repeating = calculate_non_repeating_monthly_expenses(username, current_date)

            # Calculate daily spending limit
            daily_limit = calculate_daily_limit(username, current_date)
            daily_limit = daily_limit - total_money_spent_today
            # Calculate weekly earnings
            start_of_week = current_date - timedelta(days=current_date.weekday())
            end_of_week = start_of_week + timedelta(days=7)
            weekly_earnings = calculate_weekly_earnings(username, start_of_week, end_of_week)

            # Calculate daily earnings
            daily_earnings = calculate_daily_earnings(username, current_date)

            # Calculate monthly earnings
            monthly_earnings = calculate_monthly_earnings(username, start_of_month)

            # Calculate Savings Rate
            total_income = monthly_earnings
            total_expenses = monthly_expenses_non_repeating + monthly_expenses
            savings = total_income - total_expenses
            savings_rate = (savings / total_income) * 100 if total_income > 0 else 0

            # Calculate Average Daily Expenses
            average_daily_expenses = calculate_average_daily_expenses(username, current_date)

            # Generate forecast data
            expense_forecast = generate_expense_forecast(username)
            earnings_forecast = generate_earnings_forecast(username)
            savings_forecast = generate_savings_forecast(username)
            
            # Render the dashboard template with the forecast data
            return render_template('dashboard.html',
                                   username=username,
                                   monthly_savings_goal=account.monthly_savings_goal,
                                   daily_limit=daily_limit,
                                   total_income=total_income,
                                   daily_earnings=daily_earnings,
                                   weekly_earnings=weekly_earnings,
                                   monthly_expenses_non_repeating=monthly_expenses_non_repeating,
                                   monthly_expenses=monthly_expenses,
                                   total_money_spent_today=total_money_spent_today,
                                   daily_expenses_total=daily_expenses_total,  # Pass daily_expenses_total here
                                   monthly_earnings=monthly_earnings,
                                   savings_rate=savings_rate,
                                   average_daily_expenses=average_daily_expenses,
                                   expense_forecast=expense_forecast,
                                   earnings_forecast=earnings_forecast,
                                   savings_forecast=savings_forecast,
                                   total_expenses=total_expenses,
                                   start_of_month=start_of_month,
                                   end_of_month=end_of_month,
                                   start_of_week=start_of_week,
                                   end_of_week=end_of_week)
        else:
            return redirect(url_for('login'))

    return redirect(url_for('login'))


@app.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('index'))


@app.route('/view_expenses')
def view_expenses():
    if 'username' in session:
        expenses = Expense.query.filter_by(username=session['username']).all()
        return render_template('view_expenses.html', expenses=expenses)
    return redirect(url_for('login'))


@app.route('/add_expense', methods=['GET', 'POST'])
def add_expense():
    if request.method == 'POST':
        name = request.form['name']
        price = float(request.form['price'])
        repeating = 'repeating' in request.form
        timestamp = datetime.utcnow().replace(tzinfo=timezone.utc)

        username = session.get('username')

        expense = Expense()
        expense.name = name
        expense.price = price
        expense.repeating = repeating
        expense.username = username
        expense.timestamp = timestamp

        db.session.add(expense)
        db.session.commit()

        return redirect(url_for('dashboard'))

    return render_template('add_expense.html', username=session.get('username'))


@app.route('/add_earnings', methods=['GET', 'POST'])
def add_earnings():
    last_hourly_rate = DailyEarning.query.filter_by(username=session['username']).order_by(
        DailyEarning.timestamp.desc()).first()
    last_hourly_rate = last_hourly_rate.hourly_rate if last_hourly_rate else 0
    if request.method == 'POST':
        try:
            earnings = None
            if request.form.get('earnings_type') == 'hourly':
                hourly_rate = float(request.form['hourly_rate'])
                hours = float(request.form['hours'])
                cash_tips = float(request.form['cash_tips'])

                earnings = DailyEarning()
                earnings.hourly_rate = hourly_rate
                earnings.hours = hours
                earnings.cash_tips = cash_tips
                earnings.salary = 0
                earnings.username = session['username']
            elif request.form.get('earnings_type') == 'salary':
                salary = float(request.form['salary_input'])

                earnings = DailyEarning()
                earnings.hourly_rate = 0
                earnings.hours = 0
                earnings.cash_tips = 0
                earnings.salary = salary
                earnings.username = session['username']

            if earnings:
                earnings.timestamp = datetime.now(timezone.utc)

            db.session.add(earnings)
            db.session.commit()
            return redirect(url_for('dashboard'))
        except Exception as e:
            return render_template('error.html', error=str(e))

    return render_template('add_earnings.html', last_hourly_rate=last_hourly_rate)


@app.route('/view_earnings')
def view_earnings():
    if 'username' in session:
        earnings = DailyEarning.query.filter_by(username=session['username']).all()
        return render_template('view_earnings.html', earnings=earnings)
    return redirect(url_for('login'))


@app.route('/delete_expense/<int:expense_id>', methods=['POST'])
def delete_expense(expense_id):
    expense = Expense.query.get_or_404(expense_id)
    db.session.delete(expense)
    db.session.commit()
    return redirect(url_for('view_expenses'))


@app.route('/delete_earning/<int:earning_id>', methods=['POST'])
def delete_earning(earning_id):
    earning = DailyEarning.query.get_or_404(earning_id)
    db.session.delete(earning)
    db.session.commit()
    return redirect(url_for('view_earnings'))


if __name__ == '__main__':
    # Create the database tables
    with app.app_context():
        db.create_all()
    # Run the Flask app
    app.run(debug=True)