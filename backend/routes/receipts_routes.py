from datetime import datetime
import re

def extract_expense_data(text: str) -> dict:
    """Extract expense information from receipt text."""
    # Patterns for amounts
    amount_patterns = [
        r"\$?\s*([\d,]+(?:\.\d{2})?)",  # Generic amount pattern
        r"Total\s*[:\-]?\s*\$?\s*([\d,]+(?:\.\d{2})?)",  # "Total" keyword
        r"Amount\s*[:\-]?\s*\$?\s*([\d,]+(?:\.\d{2})?)"  # "Amount" keyword
    ]
    
    # Patterns for dates
    date_patterns = [
        r"(\d{1,2}/\d{1,2}/\d{2,4})",  # MM/DD/YYYY or MM/DD/YY
        r"(\d{4}-\d{2}-\d{2})",        # YYYY-MM-DD
        r"(\d{1,2}\s+\w+\s+\d{4})"     # DD Month YYYY (e.g., 12 March 2023)
    ]
    
    # Patterns for line items
    line_item_pattern = r"(\d+)\s+(.+?)\s+\$?(\d+\.\d{2})\s*$"

    # Extract amounts
    amounts = []
    for pattern in amount_patterns:
        amounts.extend(re.findall(pattern, text))
    
    # Extract dates
    dates = []
    for pattern in date_patterns:
        dates.extend(re.findall(pattern, text))
    
    # Extract line items
    line_items = []
    for match in re.findall(line_item_pattern, text):
        try:
            quantity, description, price = match
            line_items.append({
                "quantity": int(quantity),
                "description": re.sub(r'\s+', ' ', description.strip()),
                "price": float(price)
            })
        except ValueError:
            continue

    # Convert amounts to float and find the maximum
    amounts = [float(amount.replace(",", "")) for amount in amounts if amount]
    max_amount = max(amounts) if amounts else 0.0
    
    # Use the first valid date or fallback to the current date
    extracted_date = dates[0] if dates else datetime.now().strftime("%m/%d/%Y")
    
    return {
        "amount": max_amount,
        "date": extracted_date,
        "line_items": line_items
    }
