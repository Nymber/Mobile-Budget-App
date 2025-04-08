# Mobile Budget App Backend

## Fixing Pydantic ORM Mode Warning

If you're seeing this warning:

```
C:\Users\badaw\OneDrive\Documents\GitHub\Mobile-Budget-App\backend\.venv\Lib\site-packages\pydantic\_internal\_config.py:373: UserWarning: Valid config keys have changed in V2:
* 'orm_mode' has been renamed to 'from_attributes'
  warnings.warn(message, UserWarning)
```

You can fix it by running the provided script to update all your Pydantic models:

1. Make sure you're in the project's backend directory
2. Run the script:

```bash
python scripts/fix_pydantic_models.py
```

This will scan all Python files in your project and update the deprecated `orm_mode = True` to the new `from_attributes = True` configuration.

After running the script, the warning should no longer appear when you run your application.

## Requirements

See `requirements.txt` for dependencies.
