from db_env import db
from app_settings import app
from routes import routes, inventory_routes, charts


app.register_blueprint(routes)
app.register_blueprint(inventory_routes)
app.register_blueprint(charts)


if __name__ == '__main__':
    # Create the database tables
    with app.app_context():
        db.create_all() 
    # Run the Flask app
    app.run(debug=False)