from builtins import round
from app_settings import app

def round_env(value, precision=0):

    """Round a number to a certain number of decimal places."""
    try:
        return round(float(value), precision)
    except (ValueError, TypeError):
        return value

app.jinja_env.filters['round_env'] = round_env