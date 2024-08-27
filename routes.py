from datetime import datetime, timedelta, timezone
from flask import send_file, Blueprint, render_template, request, redirect, url_for, session, jsonify, flash
from sqlalchemy import func
from sqlalchemy.orm import Query
import pandas as pd
from io import BytesIO

# Local imports
from app_settings import app
import calculations as calculations
from calculations import calculated
import db_env as db_env
from db_env import db



routes = Blueprint('routes', __name__)

# Ensure correct typing in filter conditions


def build_filter(query: Query, column, value, operator='=='):
    """Builds a filter condition for SQLAlchemy queries, ensuring correct types."""
    if value is None:
        return query
    if operator == '==':
        return query.filter(column == value)
    elif operator == '>=':
        return query.filter(column >= value)
    elif operator == '<':
        return query.filter(column < value)
    else:
        raise ValueError(f"Unsupported operator {operator}")


# Routes and views
@routes.route('/')
def index():
    return render_template('index.html')

@routes.route('/download_excel_earnings', methods=['GET'])
def download_excel_earnings():

    # Query all Expense records from the database
    if 'username' not in session:
        return redirect(url_for('routes.login'))
    earnings = db_env.DailyEarning.query.filter_by(username=session['username']).all()

    # Create lists to store data for each column
    names = [earning.username for earning in earnings]
    hourly_rates = [earning.hourly_rate for earning in earnings]
    hours_worked = [earning.hours for earning in earnings]
    cash_tips = [earning.cash_tips for earning in earnings]
    salaries = [earning.salary for earning in earnings]
    timestamps = [earning.timestamp for earning in earnings]

    # Create a DataFrame from the extracted data
    df = pd.DataFrame({
        'date': timestamps,
        'cash_tips/paychecks': cash_tips,
        'salaries': salaries,
        'hours_worked': hours_worked,
        'hourly_rates': hourly_rates,
    })

    # Export the DataFrame to an Excel file in memory (BytesIO)
    excel_buffer = BytesIO()
    df.to_excel(excel_buffer, index=False)
    excel_buffer.seek(0)  # Reset buffer position to the beginning

    # Specify the attachment filename
    excel_file_path = 'expense_data.xlsx'

    # Send the Excel file as a downloadable response
    return send_file(
        excel_buffer,
        as_attachment=True,
        download_name='earnings_data.xlsx',
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
        
@routes.route('/download_excel_expenses', methods=['GET'])
def download_excel():

    # Query all Expense records from the database
    if 'username' in session:
        expenses = db_env.Expense.query.filter_by(username=session['username']).all()
        earnings = db_env.DailyEarning.query.filter_by(username=session['username']).all()

        # Create lists to store data for each column
        names = [expense.name for expense in expenses]
        prices = [expense.price for expense in expenses]  # Assuming 'price' represents age here for demonstration purposes
        times = [expense.timestamp for expense in expenses]
        repeating_monthly = [expense.repeating for expense in expenses]

        # Create a DataFrame from the extracted data
        df = pd.DataFrame({
            'Name': names,
            'prices': prices,
            'timestamp': times,
            'Repeating Monthly': repeating_monthly
        })

        # Export the DataFrame to an Excel file in memory (BytesIO)
        excel_buffer = BytesIO()
        df.to_excel(excel_buffer, index=False)
        excel_buffer.seek(0)  # Reset buffer position to the beginning

        # Specify the attachment filename
        excel_file_path = 'expense_data.xlsx'

    # Send the Excel file as a downloadable response
        return send_file(
            excel_buffer,
            as_attachment=True,
            download_name='expense_data.xlsx',
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    else:
            return redirect(url_for('routes.login'))
    
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

        # Check if the email already exists
        existing_account = db_env.Account.query.filter_by(email=email).first()
        if existing_account:
            flash('Email address already registered.')
            return redirect(url_for('routes.register'))

        account = db_env.Account(username=username, password=password, email=email, ip_address=ip_address)
        calc = calculated(username, account)
        
        if account:
            if calc is None:
                # Handle the case where the calculated object could not be created
                print(f"Failed to create calculated object for user: {username}")
                return render_template('error.html', message="Failed to calculate financial data.")
            else:
                # Create initial entry 
                new_financial_overview = db_env.FinancialOverview(
                    username=username,
                    monthly_savings_goal=account.monthly_savings_goal,
                    daily_limit=calc.daily_limit,
                    total_income=calc.total_income,
                    daily_earnings=calc.daily_earnings,
                    weekly_earnings=calc.weekly_earnings,
                    monthly_expenses_non_repeating=calc.monthly_expenses_non_repeating,
                    monthly_expenses_repeating=calc.monthly_expenses_repeating,
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
                    timestamp=datetime.utcnow()
                )

                try:
                    db.session.add(new_financial_overview)
                    db.session.commit()
                    print("New entry created successfully.")
                except Exception as e:
                    db.session.rollback()
                    print(f"An error occurred while creating a new entry: {e}")
                db.session.add(account)
                db.session.commit()
                return redirect(url_for('routes.login'))
        return render_template('register.html')
    return render_template('register.html')


@routes.route('/inventory', methods=['GET', 'POST'])
def inventory():
    if 'username' in session:

        # Initialize variables
        username = session['username']
        current_date = datetime.utcnow()

        # Retrieve account information
        account = db_env.Account.query.filter_by(username=username).first()

        if account:
            if request.method == 'POST':

                # Handle form submission for adding items to inventory
                item_name = request.form['item_name']
                quantity = float(request.form['quantity'])
                unit_of_measurement = request.form['unit_of_measurement']

                # Create a new InventoryItem object and add it to the database
                new_item = db_env.InventoryItem(item_name=item_name, quantity=quantity,
                                                unit_of_measurement=unit_of_measurement, username=username)
                db.session.add(new_item)
                db.session.commit()

            # Retrieve inventory items for the current user
            inventory_items = db_env.InventoryItem.query.filter_by(username=username).all()

            # Render the inventory template with inventory data
            return render_template('inventory.html',
                                   username=username,
                                   inventory_items=inventory_items)
        else:
            return redirect(url_for('routes.login'))

    return redirect(url_for('routes.login'))

@routes.route('/fetch_inventory_items', methods=['GET'])
def fetch_inventory_items():
    if 'username' in session:
        username = session['username']

        # Retrieve inventory items for the current user
        inventory_items = db_env.InventoryItem.query.filter_by(username=username).all()

        # Construct HTML content for inventory items
        html_content = "<ul>"
        for item in inventory_items:
            html_content += "<li>" + item.item_name + " - Quantity: " + str(item.quantity) + " " + item.unit_of_measurement + "</li>"
        html_content += "</ul>"

        return html_content
    else:
        return jsonify({'error': 'User not logged in'})
    
@routes.route('/dashboard', methods=['GET', 'POST'])
def dashboard():
    if 'username' in session:
        username = session['username']
        account = db_env.Account.query.filter_by(username=username).first()
        calc = calculated(username, account)
        
        if account:
            if calc is None:
                # Handle the case where the calculated object could not be created
                print(f"Failed to create calculated object for user: {username}")
                return render_template('error.html', message="Failed to calculate financial data.")

            else:
                if request.method == 'POST':
                    monthly_savings_goal = request.form.get('monthly_savings_goal', type=float)
                    if monthly_savings_goal is not None:
                        account.monthly_savings_goal = monthly_savings_goal
                        db.session.commit()

                    start_of_day = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
                    end_of_day = start_of_day + timedelta(days=1)

                    # Build the query using the helper function
                    query = db_env.FinancialOverview.query
                    query = build_filter(query, db_env.FinancialOverview.username, account.username, '==')
                    query = build_filter(query, db_env.FinancialOverview.timestamp, start_of_day, '>=')
                    query = build_filter(query, db_env.FinancialOverview.timestamp, end_of_day, '<')

                    # Fetch the existing financial overview for the user for today
                    existing_financial_overview = query.first()

                    # Check if there is an existing entry
                    if existing_financial_overview:
                        entry_date = existing_financial_overview.timestamp.date()
                        current_date = datetime.utcnow().date()

                        # Check if the entry is for the current day by comparing dates
                        if entry_date == current_date:
                            print(f"An entry already exists for today for user: {username}. Updating the existing entry.")
                            # Update the existing entry with new values
                            existing_financial_overview.monthly_savings_goal = account.monthly_savings_goal
                            existing_financial_overview.daily_limit = calc.daily_limit
                            existing_financial_overview.total_income = calc.total_income
                            existing_financial_overview.daily_earnings = calc.daily_earnings
                            existing_financial_overview.weekly_earnings = calc.weekly_earnings
                            existing_financial_overview.monthly_expenses_non_repeating = calc.monthly_expenses_non_repeating
                            existing_financial_overview.monthly_expenses_repeating = calc.monthly_expenses_repeating
                            existing_financial_overview.monthly_expenses = calc.monthly_expenses
                            existing_financial_overview.total_money_spent_today = calc.total_money_spent_today
                            existing_financial_overview.daily_expenses_total = calc.daily_expenses_total
                            existing_financial_overview.monthly_earnings = calc.monthly_earnings
                            existing_financial_overview.savings_rate = calc.savings_rate
                            existing_financial_overview.average_daily_expenses = calc.average_daily_expenses
                            existing_financial_overview.total_expenses = calc.total_expenses
                            existing_financial_overview.start_of_month = calc.start_of_month
                            existing_financial_overview.end_of_month = calc.end_of_month
                            existing_financial_overview.start_of_week = calc.start_of_week
                            existing_financial_overview.end_of_week = calc.end_of_week
                            existing_financial_overview.timestamp = datetime.utcnow()  # Update timestamp if necessary

                            try:
                                db.session.commit()
                                print("Existing entry updated successfully.")
                            except Exception as e:
                                db.session.rollback()
                                print(f"An error occurred while updating: {e}")
                        else:
                            print("No entry found for today. Creating a new entry.")
                            # Create a new entry for today
                            new_financial_overview = db_env.FinancialOverview(
                                username=username,
                                monthly_savings_goal=account.monthly_savings_goal,
                                daily_limit=calc.daily_limit,
                                total_income=calc.total_income,
                                daily_earnings=calc.daily_earnings,
                                weekly_earnings=calc.weekly_earnings,
                                monthly_expenses_non_repeating=calc.monthly_expenses_non_repeating,
                                monthly_expenses_repeating=calc.monthly_expenses_repeating,
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
                                timestamp=datetime.utcnow()
                            )

                            try:
                                db.session.add(new_financial_overview)
                                db.session.commit()
                                print("New entry created successfully.")
                            except Exception as e:
                                db.session.rollback()
                                print(f"An error occurred while creating a new entry: {e}")

            return render_template('dashboard.html',
                                   username=username,
                                   monthly_savings_goal=account.monthly_savings_goal,
                                   daily_limit=calc.daily_limit,
                                   total_income=calc.total_income,
                                   daily_earnings=calc.daily_earnings,
                                   weekly_earnings=calc.weekly_earnings,
                                   monthly_expenses_non_repeating=calc.monthly_expenses_non_repeating,
                                   monthly_expenses_repeating=calc.monthly_expenses_repeating,
                                   total_money_spent_today=calc.total_money_spent_today,
                                   daily_expenses_total=calc.daily_expenses_total,
                                   monthly_earnings=calc.monthly_earnings,
                                   savings_rate=calc.savings_rate,
                                   average_daily_expenses=calc.average_daily_expenses,
                                   expense_forecast=calc.expense_forecast,
                                   earnings_forecast=calc.earnings_forecast,
                                   savings_forecast=calc.savings_forecast,
                                   total_expenses=calc.total_expenses,
                                   start_of_month=calc.start_of_month,
                                   end_of_month=calc.end_of_month,
                                   start_of_week=calc.start_of_week,
                                   end_of_week=calc.end_of_week)
        else:
            return redirect(url_for('routes.login'))
    return redirect(url_for('routes.login'))


@routes.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('routes.index'))


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
    if 'username' in session:
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
    else:
        return redirect(url_for('routes.login'))

@routes.route('/view_earnings')
def view_earnings():
    if 'username' in session:
        earnings = db_env.DailyEarning.query.filter_by(username=session['username']).all()
        return render_template('view_earnings.html', earnings=earnings)
    return redirect(url_for('routes.login'))

@routes.route('/view_expenses')
def view_expenses():
    if 'username' in session:
        expenses = db_env.Expense.query.filter_by(username=session['username']).all()
        return render_template('view_expenses.html', expenses=expenses)
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


# Define a Blueprint for routes
inventory_routes = Blueprint('inventory_routes', __name__)

# Route to view inventory items
@inventory_routes.route('/view_inventory', methods=['GET'])

def view_inventory():
    if 'username' in session:
        inventory_items = db_env.InventoryItem.query.filter_by(username=session['username']).all()
        return render_template('inventory.html', inventory_items=inventory_items, username=session['username'])
    return redirect(url_for('routes.login',username=session['username']))

# Helper function to retrieve inventory items
@inventory_routes.route('/get_inventory_items', methods=['GET'])
def get_inventory_items():
    username = session['username']
    if 'username' in session:
        # Retrieve inventory items from the database
        inventory_items = db_env.InventoryItem.query.filter_by(username=session['username']).all()
    
        # Convert inventory items to a list of dictionaries
        inventory_list = []
        for item in inventory_items:
            item_dict = {
                'id': item.id,
                'item_name': item.item_name,
                'quantity': item.quantity,
                'unit_of_measurement': item.unit_of_measurement
            }
            inventory_list.append(item_dict)
        return render_template('view_inventory.html', inventory_items=inventory_items, username=username)
    return redirect(url_for('routes.login'))

@inventory_routes.route('/update_inventory_item/<string:item_id>', methods=['POST'])
def update_inventory_item(item_id):
    # Receive data from the form submission
    if 'username' in session:
        # Receive data from the form submission
        new_item_name = request.form.get('itemName')
        new_quantity = request.form.get('quantity')
        new_unit_of_measurement = request.form.get('unitOfMeasurement')

        # Query the database to find the specific InventoryItem by its ID
        item = db_env.InventoryItem.query.get(item_id)

        if item:
            # Update the relevant fields of the InventoryItem object
            item.item_name = new_item_name
            item.quantity = new_quantity
            item.unit_of_measurement = new_unit_of_measurement

            # Commit the changes to the database
            db.session.commit()

            # Redirect to the appropriate page after the update operation
            return render_template('view_inventory.html')
        else:
            # Handle the case where the item with the given ID does not exist
            flash('Item not found.', 'error')
            return render_template('view_inventory.html')
    else:
        # If the user is not logged in, redirect to the login page
        return redirect(url_for('routes.login'))
    
@inventory_routes.route('/delete_inventory_item/<int:item_id>', methods=['POST'])
def delete_inventory_item(item_id):
    if 'username' in session:

        # Query the database to find the inventory item by its ID
        inventory_item = db_env.InventoryItem.query.get(item_id)

        # Check if the inventory item exists and belongs to the current user
        if inventory_item and inventory_item.username == session['username']:
            # Delete the inventory item from the database
            db.session.delete(inventory_item)
            db.session.commit()
            flash('Inventory item deleted successfully', 'success')
        else:
            flash('Inventory item not found or you do not have permission to delete it', 'error')

        # Redirect to the inventory view after deletion
        return render_template('view_inventory.html')
    else:
        # If the user is not logged in, redirect to the login page
        return redirect(url_for('routes.login'))
    
@inventory_routes.route('/get_updated_table_data', methods=['GET'])
def get_updated_table_data():
    if 'username' in session:
        # Render the table body with the updated inventory data
        return render_template('view_inventory.html', inventory_items=db_env.InventoryItem.query.filter_by(username=session['username']).all())
    else:
        # If the user is not logged in, redirect to the login page
        return redirect(url_for('routes.login'))
    
@inventory_routes.route('/download_excel_inventory', methods=['GET'])
def download_excel_inventory():
    if 'username' in session:

        # Query all InventoryItem records from the database
        inventory_items = db_env.InventoryItem.query.filter_by(username=session['username']).all()

        # Create lists to store data for each column
        item_names = [item.item_name for item in inventory_items]
        quantities = [item.quantity for item in inventory_items]
        units = [item.unit_of_measurement for item in inventory_items]
        timestamps = [item.timestamp for item in inventory_items]

        # Create a DataFrame from the extracted data
        df = pd.DataFrame({
            'Item Name': item_names,
            'Quantity': quantities,
            'Unit of Measurement': units,
            'Timestamp': timestamps
        })

        # Export the DataFrame to an Excel file in memory (BytesIO)
        excel_buffer = BytesIO()
        df.to_excel(excel_buffer, index=False)
        excel_buffer.seek(0)  # Reset buffer position to the beginning

        # Specify the attachment filename
        excel_file_path = 'inventory_data.xlsx'

        # Send the Excel file as a downloadable response
        return send_file(
            excel_buffer,
            as_attachment=True,
            download_name='inventory_data.xlsx',
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    else:
        return redirect(url_for('routes.login'))




charts = Blueprint('charts', __name__)

@charts.route('/api/financial_overview', methods=['GET'])
def get_financial_overview():
    thirty_days_ago = datetime.now() - timedelta(days=30)

    # Start building the query using the build_filter function
    query = db_env.FinancialOverview.query
    query = build_filter(query, db_env.FinancialOverview.timestamp, thirty_days_ago, '>=')

    # Execute the query and fetch all records
    records = query.all()

    # Prepare the data to be returned in JSON format
    data = {
        'labels': [record.timestamp.strftime('%Y-%m-%d') for record in records],
        'daily_earnings': [record.daily_earnings for record in records],
        'weekly_earnings': [record.weekly_earnings for record in records],
        'monthly_earnings': [record.monthly_earnings for record in records],
        'total_money_spent_today': [record.daily_expenses_total for record in records],
        'daily_expenses_total': [record.daily_expenses_total for record in records],
        'savings_rate': [record.savings_rate for record in records],
        'total_expenses': [record.total_expenses for record in records],
        'monthly_expenses_repeating': [record.monthly_expenses_repeating for record in records],
        'monthly_expenses_non_repeating': [record.monthly_expenses_non_repeating for record in records]
    }

    return jsonify(data)