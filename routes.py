import calculations
from datetime import datetime, timedelta, timezone
from flask import Blueprint, render_template, request, redirect, url_for, session
import db_env
from db_env import db

routes = Blueprint('routes', __name__)
# Routes and views
@routes.route('/')
def index():
    return render_template('index.html')


@routes.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        account = db_env.Account.query.filter_by(username=username, password=password).first()
        if account:
            session['username'] = username
            return redirect(url_for('routes.dashboard'))
    return render_template('login.html')


@routes.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        email = request.form['email']
        ip_address = request.remote_addr
        account = db_env.Account(username=username, password=password, email=email, ip_address=ip_address)
        db.session.add(account)
        db.session.commit()
        return redirect(url_for('routes.login'))
    return render_template('register.html')


@routes.route('/dashboard', methods=['GET', 'POST'])
def dashboard():
    if 'username' in session:
        # Initialize variables
        username = session['username']
        current_date = datetime.utcnow()

        # Retrieve account information
        account = db_env.Account.query.filter_by(username=username).first()

        if account:
            if request.method == 'POST':
                # Handle form submission for setting monthly savings goal
                monthly_savings_goal = float(request.form['monthly_savings_goal'])
                account.monthly_savings_goal = monthly_savings_goal
                db.session.commit()

            # Calculate daily expenses
            start_of_day = current_date - timedelta(days=1)
            daily_expenses = db_env.Expense.query.filter(
                db_env.Expense.username == username,
                db_env.Expense.timestamp >= start_of_day
            ).all()

            daily_expenses_total = sum(expense.price for expense in daily_expenses)
            monthly_expenses = calculations.calculate_monthly_expenses(username)

            # Calculate daily savings needed (monthly savings goal divided by 30)
            daily_savings_needed = account.monthly_savings_goal / 30

            # Total daily expenses including the savings needed portion
            daily_expenses_total += daily_savings_needed

            # Calculate total money spent today
            total_money_spent_today = calculations.calculate_total_non_repeating_expenses_within_24_hours(username, current_date)

            # Calculate total monthly expenses for non-repeating expenses
            start_of_month = current_date - timedelta(days=30)
            end_of_month = start_of_month + timedelta(days=30)
            monthly_expenses_non_repeating = calculations.calculate_non_repeating_monthly_expenses(username, current_date)

            # Calculate daily spending limit
            daily_limit = calculations.calculate_daily_limit(username, current_date)
            daily_limit = daily_limit - total_money_spent_today
            # Calculate weekly earnings
            start_of_week = current_date - timedelta(days=current_date.weekday())
            end_of_week = start_of_week + timedelta(days=7)
            weekly_earnings = calculations.calculate_weekly_earnings(username, start_of_week, end_of_week)

            # Calculate daily earnings
            daily_earnings = calculations.calculate_daily_earnings(username, current_date)

            # Calculate monthly earnings
            monthly_earnings = calculations.calculate_monthly_earnings(username, start_of_month)

            # Calculate Savings Rate
            total_income = monthly_earnings
            total_expenses = monthly_expenses_non_repeating + monthly_expenses
            savings = total_income - total_expenses
            savings_rate = (savings / total_income) * 100 if total_income > 0 else 0

            # Calculate Average Daily Expenses
            average_daily_expenses = calculations.calculate_average_daily_expenses(username, current_date)

            # Generate forecast data
            expense_forecast = calculations.generate_expense_forecast(username)
            earnings_forecast = calculations.generate_earnings_forecast(username)
            savings_forecast = calculations.generate_savings_forecast(username)
            
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
            return redirect(url_for('routes.login'))

    return redirect(url_for('routes.login'))


@routes.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('routes.index'))


@routes.route('/view_expenses')
def view_expenses():
    if 'username' in session:
        expenses = db_env.Expense.query.filter_by(username=session['username']).all()
        return render_template('view_expenses.html', expenses=expenses)
    return redirect(url_for('routes.login'))


@routes.route('/add_expense', methods=['GET', 'POST'])
def add_expense():
    if request.method == 'POST':
        name = request.form['name']
        price = float(request.form['price'])
        repeating = 'repeating' in request.form
        timestamp = datetime.utcnow().replace(tzinfo=timezone.utc)

        username = session.get('username')

        expense = db_env.Expense()
        expense.name = name
        expense.price = price
        expense.repeating = repeating
        expense.username = username
        expense.timestamp = timestamp

        db.session.add(expense)
        db.session.commit()

        return redirect(url_for('routes.dashboard'))

    return render_template('add_expense.html', username=session.get('username'))


@routes.route('/add_earnings', methods=['GET', 'POST'])
def add_earnings():
    last_hourly_rate = db_env.DailyEarning.query.filter_by(username=session['username']).order_by(
        db_env.DailyEarning.timestamp.desc()).first()
    last_hourly_rate = last_hourly_rate.hourly_rate if last_hourly_rate else 0
    if request.method == 'POST':
        try:
            earnings = None
            if request.form.get('earnings_type') == 'hourly':
                hourly_rate = float(request.form['hourly_rate'])
                hours = float(request.form['hours'])
                cash_tips = float(request.form['cash_tips'])

                earnings = db_env.DailyEarning()
                earnings.hourly_rate = hourly_rate
                earnings.hours = hours
                earnings.cash_tips = cash_tips
                earnings.salary = 0
                earnings.username = session['username']
            elif request.form.get('earnings_type') == 'salary':
                salary = float(request.form['salary_input'])

                earnings = db_env.DailyEarning()
                earnings.hourly_rate = 0
                earnings.hours = 0
                earnings.cash_tips = 0
                earnings.salary = salary
                earnings.username = session['username']

            if earnings:
                earnings.timestamp = datetime.now(timezone.utc)

            db.session.add(earnings)
            db.session.commit()
            return redirect(url_for('routes.dashboard'))
        except Exception as e:
            return render_template('error.html', error=str(e))

    return render_template('add_earnings.html', last_hourly_rate=last_hourly_rate)


@routes.route('/view_earnings')
def view_earnings():
    if 'username' in session:
        earnings = db_env.DailyEarning.query.filter_by(username=session['username']).all()
        return render_template('view_earnings.html', earnings=earnings)
    return redirect(url_for('routes.login'))


@routes.route('/delete_expense/<int:expense_id>', methods=['POST'])
def delete_expense(expense_id):
    expense = db_env.Expense.query.get_or_404(expense_id)
    db.session.delete(expense)
    db.session.commit()
    return redirect(url_for('routes.view_expenses'))


@routes.route('/delete_earning/<int:earning_id>', methods=['POST'])
def delete_earning(earning_id):
    earning = db_env.DailyEarning.query.get_or_404(earning_id)
    db.session.delete(earning)
    db.session.commit()
    return redirect(url_for('routes.view_earnings'))