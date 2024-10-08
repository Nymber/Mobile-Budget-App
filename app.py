from db_env import db
from app_settings import app
from routes import routes, inventory_routes, charts, tasks
from task_scheduler import scheduler

app.register_blueprint(routes)
app.register_blueprint(inventory_routes)
app.register_blueprint(charts)
app.register_blueprint(tasks)


if __name__ == '__main__':
    # Create the database tables
    with app.app_context():
        db.create_all() 
    # Run the Flask app
    app.run(debug=True)