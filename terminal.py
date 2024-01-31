from flask import Flask, render_template, request, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta, date
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///financial_data.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

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
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def __init__(self, username, password, email, ip_address, spending_limit=0):
        self.username = username
        self.password = password
        self.email = email
        self.ip_address = ip_address
        self.spending_limit = spending_limit

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
        with app.app_context():  
            account = Account(username=username, password=password, email=email, ip_address=ip_address)
            db.session.add(account)
            db.session.commit()
        return redirect(url_for('login'))
    return render_template('register.html')

@app.route('/dashboard', methods=['GET', 'POST'])
def dashboard():
    if 'username' in session:
        account = Account.query.filter_by(username=session['username']).first()
        
        # Calculate daily expenses
        daily_expenses = Expense.query.filter(
            Expense.username == session['username'],
            Expense.timestamp >= datetime.utcnow() - timedelta(days=1)
        ).all()
        # Total daily expenses including the monthly savings goal portion divided by 30 days
        daily_expenses_total = (sum(expense.price for expense in daily_expenses) + 
                                (account.monthly_savings_goal if account else 0)) / 30 if daily_expenses else 0
        
        # Calculate daily non-repeating expenses
        daily_expenses_not_repeating = Expense.query.filter(
            Expense.username == session['username'],
            Expense.timestamp >= datetime.utcnow() - timedelta(days=1),
            Expense.repeating == False
        ).all()
        
        # Calculate total money spent today
        total_money_spent_today = (sum(expense.price for expense in daily_expenses_not_repeating) + daily_expenses_total)
        daily_expenses_not_repeating = sum(expense.price for expense in daily_expenses_not_repeating) / 30 if daily_expenses_not_repeating else 0
        
        # Calculate monthly expenses
        monthly_expenses = (sum(expense.price for expense in daily_expenses) + 
                             (account.monthly_savings_goal if account else 0))
        
        # Calculate daily earnings
        daily_earnings = sum(
            (
                (
                    (earning.hourly_rate * earning.hours if earning.hourly_rate is not None and earning.hours is not None else 0)
                    + (earning.cash_tips if earning.cash_tips is not None else 0)
                    + (earning.salary / 365) if earning.salary is not None else 0
                )
                for earning in DailyEarning.query.filter(
                    DailyEarning.username == session['username'],
                    DailyEarning.timestamp >= date.today() - timedelta(days=1)
                ).all()
            )
        )

        # Calculate weekly earnings
        weekly_earnings = sum(
            (
                (
                    (earning.hourly_rate * earning.hours if earning.hourly_rate is not None and earning.hours is not None else 0)
                    + (earning.cash_tips if earning.cash_tips is not None else 0)
                    + (earning.salary / 55) if earning.salary is not None else 0
                )
                for earning in DailyEarning.query.filter(
                    DailyEarning.username == session['username'],
                    DailyEarning.timestamp >= date.today() - timedelta(days=7)
                ).all()
            )
        )

        # Calculate monthly earnings
        monthly_earnings = sum(
            (
                (
                    (earning.hourly_rate * earning.hours if earning.hourly_rate is not None and earning.hours is not None else 0)
                    + (earning.cash_tips if earning.cash_tips is not None else 0)
                    + (earning.salary / 12) if earning.salary is not None else 0
                )
                for earning in DailyEarning.query.filter(
                    DailyEarning.username == session['username'],
                    DailyEarning.timestamp >= date.today() - timedelta(days=30)
                ).all()
            )
        )

        # Calculate the daily spending limit considering daily earnings and non-repeating expenses
        daily_limit = (account.spending_limit - daily_expenses_total + daily_earnings - total_money_spent_today - 
                       (account.monthly_savings_goal / 30 if account else 0)) if account else 0

        # Check if it's a new day
        if account is not None and date.today() > account.timestamp.date():
            account.spending_limit += daily_limit
            account.timestamp = datetime.utcnow()
            db.session.commit()

        if request.method == 'POST':
            # Check if the form is submitted for setting the monthly savings goal
            if 'monthly_savings_goal' in request.form and account is not None:
                monthly_savings_goal = float(request.form['monthly_savings_goal'])
                account.monthly_savings_goal = monthly_savings_goal
                db.session.commit()
                return redirect(url_for('dashboard'))

        return render_template('dashboard.html', username=session['username'], 
                               daily_expenses_total=daily_expenses_total, 
                               daily_limit=daily_limit, daily_earnings=daily_earnings, 
                               monthly_expenses=monthly_expenses, weekly_earnings=weekly_earnings, 
                               monthly_earnings=monthly_earnings, 
                               daily_expenses_not_repeating=daily_expenses_not_repeating,
                               total_money_spent_today=total_money_spent_today,
                               monthly_savings_goal=account.monthly_savings_goal if account is not None else None)    
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
        timestamp = datetime.utcnow()

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
    last_hourly_rate = DailyEarning.query.filter_by(username=session['username']).order_by(DailyEarning.timestamp.desc()).first()
    last_hourly_rate = last_hourly_rate.hourly_rate if last_hourly_rate else 0
    if request.method == 'POST':
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
            earnings.timestamp = datetime.utcnow()

        try:
            db.session.add(earnings)
            db.session.commit()
            return redirect(url_for('dashboard'))
        except Exception as e:
            return render_template('error.html', error=str(e))

    return render_template('add_earnings.html',last_hourly_rate=last_hourly_rate)

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
    with app.app_context():  
        db.create_all()
    app.run(debug=True)