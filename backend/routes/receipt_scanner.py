from fastapi import APIRouter, UploadFile, HTTPException, Depends, status, File
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import io
import re
from PIL import Image, ImageOps
import os
import sys

try:
    import pytesseract
    if sys.platform.startswith('win'):
        tesseract_paths = [
            r'C:\Program Files\Tesseract-OCR\tesseract.exe',
            r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
            os.environ.get('TESSERACT_PATH', '')
        ]
        pytesseract.pytesseract.tesseract_cmd = next(
            (path for path in tesseract_paths if os.path.exists(path)), None
        )
    TESSERACT_AVAILABLE = pytesseract.get_tesseract_version() is not None
except ImportError:
    TESSERACT_AVAILABLE = False

from auth import get_current_user
from settings.db_settings import get_db
from db_env import Receipt, Account, Expense, InventoryItem

router = APIRouter()

# Precompile regex patterns for efficiency
TOTAL_PATTERNS = [re.compile(p, re.IGNORECASE) for p in [
    r'total\s*[:\$]?\s*(\d+\.\d{2})',
    r'subtotal\s*[:\$]?\s*(\d+\.\d{2})',
    r'amount\s*[:\$]?\s*(\d+\.\d{2})',
    r'sum\s*[:\$]?\s*(\d+\.\d{2})',
    r'\$\s*(\d+\.\d{2})'
]]
DATE_PATTERNS = [re.compile(p, re.IGNORECASE) for p in [
    r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
    r'(\d{2,4}[/-]\d{1,2}[/-]\d{1,2})',
    r'date\s*[:\$]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})'
]]
# Original item pattern
ITEM_PATTERN = re.compile(r'(\d+)\s+(.+?)\s+(\d+\.\d{2})')
# Alternative item patterns
ALT_ITEM_PATTERN = re.compile(r'([A-Za-z\s]+)\s+(\d+\.\d{2})')
# New pattern for "Item - qty @ $price" format
NEW_ITEM_PATTERN = re.compile(r'([A-Za-z\s\d&]+)\s*-\s*(\d+)\s*@\s*\$\s*(\d+\.\d{2})')

CATEGORY_KEYWORDS = {
    "Groceries": ["grocery", "market", "food", "supermarket", "walmart", "kroger", "safeway", "aldi", "costco", "trader joe", "produce", "bakery", "deli", "organic", "fruits", "vegetables"],
    "Dining": ["restaurant", "cafe", "diner", "bistro", "bar", "grill", "eatery", "pizzeria", "sushi", "takeout", "delivery", "fast food", "mcdonald", "starbucks", "chipotle", "taco", "burger"],
    "Entertainment": ["cinema", "theater", "movie", "game", "entertainment", "concert", "festival", "amusement", "netflix", "spotify", "disney", "hulu", "ticket", "park", "event", "bowling"],
    "Transportation": ["gas", "fuel", "taxi", "uber", "lyft", "transport", "parking", "toll", "bus", "train", "subway", "airline", "flight", "rental car", "metro", "transit", "exxon", "shell"],
    "Utilities": ["electric", "water", "gas", "internet", "phone", "utility", "cable", "broadband", "wireless", "sewage", "trash", "waste", "at&t", "verizon", "comcast", "xfinity", "power"],
    "Healthcare": ["doctor", "pharmacy", "hospital", "clinic", "health", "medical", "dental", "vision", "prescription", "insurance", "walgreens", "cvs", "therapy", "urgent care", "laboratory"],
    "Shopping": ["mall", "store", "amazon", "target", "retail", "clothing", "electronics", "furniture", "department", "online", "purchase", "ebay", "best buy", "home depot", "walmart"],
    "Education": ["tuition", "school", "college", "university", "textbook", "course", "class", "education", "student", "loan", "supplies", "books", "academic"],
    "Personal Care": ["salon", "spa", "haircut", "beauty", "cosmetics", "barber", "gym", "fitness", "wellness", "makeup", "skincare"]
}

def extract_amount(text):
    for pattern in TOTAL_PATTERNS:
        match = pattern.search(text)
        if match:
            return float(match.group(1))
    amounts = [float(a) for a in re.findall(r'\$?\s*(\d+\.\d{2})', text)]
    return max(amounts, default=0.0)

def extract_date(lines):
    for line in lines:
        for pattern in DATE_PATTERNS:
            match = pattern.search(line)
            if match:
                for fmt in ['%m/%d/%Y', '%d/%m/%Y', '%Y/%m/%d']:
                    try:
                        return datetime.strptime(match.group(1), fmt)
                    except ValueError:
                        continue
    return datetime.now()

def determine_category(text, vendor):
    text_lower = text.lower()
    for cat, keywords in CATEGORY_KEYWORDS.items():
        if any(keyword in text_lower or keyword in vendor.lower() for keyword in keywords):
            return cat
    return "Uncategorized"

def normalize_text(text):
    """Pre-process text to improve OCR accuracy and pattern matching"""
    # Replace common OCR errors
    text = text.replace('S', '$').replace('O', '0').replace('l', '1')
    # Normalize spaces
    text = re.sub(r'\s+', ' ', text)
    # Normalize price separators
    text = re.sub(r'(\d+)[.,](\d{2})', r'\1.\2', text)
    return text

def extract_items(text):
    """Extract item details from receipt text with improved format handling"""
    text = normalize_text(text)
    items = []

    # First try the "[Item] - [quantity] @ $[price]" format
    for match in NEW_ITEM_PATTERN.findall(text):
        try:
            item_name, quantity, item_price = match
            quantity = int(quantity)
            item_price = float(item_price)
            
            # Remove quantity prefix from item name if it exists
            item_name = re.sub(r'^\d+\s+', '', item_name.strip())
            
            items.append({
                "quantity": quantity,
                "name": item_name.strip(),
                "price": item_price,
                "confidence": "high"
            })
        except ValueError:
            continue

    # If no items found with the first pattern, try the original pattern
    if not items:
        for match in ITEM_PATTERN.findall(text):
            try:
                quantity, item_name, item_price = match
                quantity = int(quantity)
                item_price = float(item_price)
                
                # Accept all quantities (including 0) to allow for manual correction
                items.append({
                    "quantity": quantity,
                    "name": item_name.strip(),
                    "price": item_price,
                    "confidence": "medium"
                })
            except ValueError:
                continue

    # If still no items, try the alternative pattern
    if not items:
        for match in ALT_ITEM_PATTERN.findall(text):
            try:
                item_name, item_price = match
                item_price = float(item_price)
                
                # Skip totals, subtotals, etc.
                if any(word in item_name.lower() for word in ["total", "subtotal", "tax", "amount", "sum", "balance"]):
                    continue
                    
                # Check if the item name starts with a number (which might be quantity)
                quantity_match = re.match(r'^(\d+)\s+(.+)$', item_name)
                if quantity_match:
                    quantity = int(quantity_match.group(1))
                    item_name = quantity_match.group(2)
                else:
                    quantity = 1
                    
                items.append({
                    "quantity": quantity,
                    "name": item_name.strip(),
                    "price": item_price,
                    "confidence": "low"
                })
            except ValueError:
                continue

    # Post-process: clean up item names
    for item in items:
        # Remove price-like strings from item names
        item["name"] = re.sub(r'\$?\d+\.\d{2}', '', item["name"]).strip()
        # Remove trailing dashes, periods, commas
        item["name"] = re.sub(r'[-.,]+$', '', item["name"]).strip()
        
    return items

def extract_vendor_and_address(lines):
    vendor = lines[0] if lines else "Unknown"
    address = ""
    for line in lines[1:]:
        if any(char.isdigit() for char in line):  # Simple heuristic for address
            address = line
            break
    return vendor, address

def extract_payment_method(text):
    payment_methods = ["cash", "credit card", "debit card", "check", "paypal"]
    for method in payment_methods:
        if method in text.lower():
            return method.capitalize()
    return "Unknown"

@router.post("/upload-receipt")
async def upload_receipt(
    receipt: UploadFile = File(...),
    current_user: Account = Depends(get_current_user),
    db: Session = Depends(get_db),
    add_to_inventory: bool = True
):
    if not TESSERACT_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OCR service is not available. Please install Tesseract OCR."
        )

    try:
        contents = await receipt.read()
        image = Image.open(io.BytesIO(contents))
        image = ImageOps.grayscale(image)  # Convert to grayscale for better OCR
        
        # Enhanced image preprocessing for better OCR results
        image = ImageOps.autocontrast(image)  # Improve contrast
        
        text = pytesseract.image_to_string(image)

        lines = [line.strip() for line in text.split('\n') if line.strip()]
        vendor, address = extract_vendor_and_address(lines)
        receipt_date = extract_date(lines)
        amount = extract_amount(text)
        category = determine_category(text, vendor)
        items = extract_items(text)
        payment_method = extract_payment_method(text)
        
        # Calculate overall confidence score
        confidence_scores = {"high": 3, "medium": 2, "low": 1}
        avg_confidence = "medium"
        if items:
            total_score = sum(confidence_scores.get(item.get("confidence", "low"), 1) for item in items)
            avg_score = total_score / len(items)
            if avg_score > 2.5:
                avg_confidence = "high"
            elif avg_score < 1.5:
                avg_confidence = "low"
            else:
                avg_confidence = "medium"

        # Save receipt and related data
        new_receipt = Receipt(
            username=current_user.username,
            image_data=contents,
            date=receipt_date,
            total=amount,
            vendor=vendor,
            category=category,
            items=items if items else None,
            processed_data={
                "text": text,
                "extracted_items": items,
                "vendor_address": address,
                "payment_method": payment_method,
                "confidence": avg_confidence,
                "raw_lines": lines
            },
            timestamp=datetime.now(timezone.utc)
        )
        db.add(new_receipt)

        new_expense = Expense(
            username=current_user.username,
            name=f"Receipt: {vendor}",
            price=amount,
            repeating=False,
            timestamp=receipt_date
        )
        db.add(new_expense)

        inventory_items = []
        low_confidence_items = []
        
        if add_to_inventory and items:
            for item in items:
                # Skip items with truly empty quantities (not just zero)
                if item["quantity"] is None:
                    continue
                    
                if item.get("confidence") == "low":
                    low_confidence_items.append(item["name"])
                
                existing_item = db.query(InventoryItem).filter(
                    InventoryItem.username == current_user.username,
                    InventoryItem.name == item["name"]
                ).first()
                if existing_item:
                    existing_item.quantity += item["quantity"]
                    inventory_items.append({
                        "id": existing_item.id,
                        "name": existing_item.name,
                        "quantity": existing_item.quantity,
                        "price": existing_item.price,
                        "confidence": item.get("confidence", "medium"),
                        "updated": True
                    })
                else:
                    new_item = InventoryItem(
                        username=current_user.username,
                        name=item["name"],
                        category=category,
                        quantity=item["quantity"],
                        price=item["price"],
                        timestamp=datetime.now(timezone.utc)
                    )
                    db.add(new_item)
                    db.flush()
                    inventory_items.append({
                        "id": new_item.id,
                        "name": new_item.name,
                        "quantity": new_item.quantity,
                        "price": new_item.price,
                        "confidence": item.get("confidence", "medium"),
                        "created": True
                    })

        db.commit()
        
        # Include confidence information and warnings in the response
        warnings = []
        if low_confidence_items:
            warnings.append(f"Low confidence in extracting: {', '.join(low_confidence_items)}")
        if avg_confidence == "low":
            warnings.append("Overall low confidence in receipt parsing. Please verify the extracted information.")
            
        return {
            "vendor": vendor,
            "address": address,
            "category": category,
            "amount": amount,
            "date": receipt_date.strftime('%Y-%m-%d'),
            "payment_method": payment_method,
            "items": items,
            "receipt_id": new_receipt.id,
            "expense_id": new_expense.id,
            "inventory_items": inventory_items,
            "confidence": avg_confidence,
            "warnings": warnings
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing receipt: {str(e)}"
        )
