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
    r'amount\s*[:\$]?\s*(\d+\.\d{2})',
    r'sum\s*[:\$]?\s*(\d+\.\d{2})',
    r'\$\s*(\d+\.\d{2})'
]]
DATE_PATTERNS = [re.compile(p, re.IGNORECASE) for p in [
    r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
    r'(\d{2,4}[/-]\d{1,2}[/-]\d{1,2})',
    r'date\s*[:\$]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})'
]]
ITEM_PATTERN = re.compile(r'(\d+)\s+(.+?)\s+(\d+\.\d{2})')
ALT_ITEM_PATTERN = re.compile(r'([A-Za-z\s]+)\s+(\d+\.\d{2})')

CATEGORY_KEYWORDS = {
    "Groceries": ["grocery", "market", "food", "supermarket"],
    "Dining": ["restaurant", "cafe", "diner", "bistro", "bar"],
    "Entertainment": ["cinema", "theater", "movie", "game", "entertainment"],
    "Transportation": ["gas", "fuel", "taxi", "uber", "lyft", "transport"],
    "Utilities": ["electric", "water", "gas", "internet", "phone", "utility"],
    "Healthcare": ["doctor", "pharmacy", "hospital", "clinic", "health"]
}

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
        text = pytesseract.image_to_string(image)

        amount = 0.0
        vendor = "Unknown"
        date_str = datetime.now().strftime("%Y-%m-%d")
        receipt_date = datetime.now()
        category = "Uncategorized"

        # Extract amount
        for pattern in TOTAL_PATTERNS:
            match = pattern.search(text)
            if match:
                amount = float(match.group(1))
                break

        if amount == 0.0:
            amounts = [float(a) for a in re.findall(r'\$?\s*(\d+\.\d{2})', text)]
            if amounts:
                amount = max(amounts)

        # Extract vendor and date
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        if lines:
            vendor = lines[0]
            for line in lines:
                for pattern in DATE_PATTERNS:
                    match = pattern.search(line)
                    if match:
                        for fmt in ['%m/%d/%Y', '%d/%m/%Y', '%Y/%m/%d']:
                            try:
                                receipt_date = datetime.strptime(match.group(1), fmt)
                                date_str = receipt_date.strftime('%Y-%m-%d')
                                break
                            except ValueError:
                                continue

        # Determine category
        text_lower = text.lower()
        for cat, keywords in CATEGORY_KEYWORDS.items():
            if any(keyword in text_lower or keyword in vendor.lower() for keyword in keywords):
                category = cat
                break

        # Extract items
        items = []
        for match in ITEM_PATTERN.findall(text):
            try:
                quantity, item_name, item_price = match
                items.append({
                    "quantity": int(quantity),
                    "name": item_name.strip(),
                    "price": float(item_price)
                })
            except ValueError:
                continue

        if not items:
            for match in ALT_ITEM_PATTERN.findall(text):
                try:
                    item_name, item_price = match
                    if any(word in item_name.lower() for word in ["total", "subtotal", "tax", "amount", "sum", "balance"]):
                        continue
                    items.append({
                        "quantity": 1,
                        "name": item_name.strip(),
                        "price": float(item_price)
                    })
                except ValueError:
                    continue

        # Save receipt and related data
        new_receipt = Receipt(
            username=current_user.username,
            image_data=contents,
            date=receipt_date,
            total=amount,
            vendor=vendor,
            category=category,
            items=items if items else None,
            processed_data={"text": text, "extracted_items": items},
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
        if add_to_inventory and items:
            for item in items:
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
                        "created": True
                    })

        db.commit()
        return {
            "category": category,
            "amount": amount,
            "date": date_str,
            "vendor": vendor,
            "items": items,
            "receipt_id": new_receipt.id,
            "expense_id": new_expense.id,
            "inventory_items": inventory_items
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing receipt: {str(e)}"
        )
