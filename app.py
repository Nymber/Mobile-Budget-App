from db_env import db
from app_settings import app
from routes import routes
app.register_blueprint(routes)


if __name__ == '__main__':
    # Create the database tables
    with app.app_context():
        db.create_all()
    # Run the Flask app
    app.run(debug=True)