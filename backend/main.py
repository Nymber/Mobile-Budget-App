from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from contextlib import asynccontextmanager
from routes import router
from scheduler_tasks import update_spending_limit, reset_repeating_tasks

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://192.168.1.100:3000",  # Add your computer's IP address
    "http://10.0.0.31:3000",  # Add your public IP address if needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(_: FastAPI):
    scheduler.add_job(update_spending_limit, 'cron', hour=0, id='update_spending_limit')
    scheduler.add_job(reset_repeating_tasks, 'cron', hour=0, id='reset_repeating_tasks')
    scheduler.start()
    yield
    scheduler.shutdown()

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
