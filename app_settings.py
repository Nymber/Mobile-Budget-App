from flask import Flask

#App Creation/Settings
app = Flask(__name__)
app.secret_key = 'your_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///financial_data.db'
app.config['SCHEDULER_API_ENABLED'] = True
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
