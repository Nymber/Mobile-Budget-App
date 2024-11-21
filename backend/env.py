from builtins import round
from jinja2 import Environment, FileSystemLoader

def round_env(value, precision=0):

    """Round a number to a certain number of decimal places."""
    try:
        return round(float(value), precision)
    except (ValueError, TypeError):
        return value

# Create Jinja2 environment
jinja_env = Environment(loader=FileSystemLoader("templates"))
jinja_env.filters['round_env'] = round_env