# This file marks the routes directory as a Python package
# This allows importing modules from this directory using the syntax:
# from routes.module_name import ...

from fastapi import APIRouter
from .auth_routes import router as auth_router
from .dashboard_routes import router as dashboard_router
from .receipt_scanner import router as receipt_router
from .inventory_routes import router as inventory_router
from .tasks_routes import router as tasks_router
from .earnings_routes import router as earnings_router
from .expenses_routes import router as expenses_router
from .feedback_routes import router as feedback_router

router = APIRouter()
router.include_router(auth_router, tags=["Authentication"])
router.include_router(dashboard_router, tags=["Dashboard"])
router.include_router(receipt_router, tags=["Receipts"])
router.include_router(inventory_router, tags=["Inventory"])
router.include_router(tasks_router, tags=["Tasks"])
router.include_router(earnings_router, tags=["Earnings"])
router.include_router(expenses_router, tags=["Expenses"])
router.include_router(feedback_router, tags=["Feedback"])