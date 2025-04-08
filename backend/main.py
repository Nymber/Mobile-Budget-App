from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from pathlib import Path
from starlette.middleware.base import BaseHTTPMiddleware

# Import routes
from routes import router

# Define static file directories
FRONTEND_DIR = Path(__file__).parent.parent / "frontend"
NEXT_BUILD_DIR = FRONTEND_DIR / ".next"
PUBLIC_DIR = FRONTEND_DIR / "public"

# Define lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup events
    # Check .next directory (Next.js 12+ build output)
    if NEXT_BUILD_DIR.exists():
        static_dir = NEXT_BUILD_DIR / "static"
        if static_dir.exists():
            app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
            print(f"Mounted Next.js static files from: {static_dir}")
        else:
            print(f"Warning: Next.js static directory does not exist at {static_dir}")
    
    # Check for out directory (Next.js export output)
    out_dir = FRONTEND_DIR / "out"
    if out_dir.exists():
        app.mount("/out", StaticFiles(directory=str(out_dir)), name="out")
        print(f"Mounted Next.js export files from: {out_dir}")
    
    # Mount public directory for other static assets
    if PUBLIC_DIR.exists():
        app.mount("/public", StaticFiles(directory=str(PUBLIC_DIR)), name="public")
        print(f"Mounted public files from: {PUBLIC_DIR}")
    
    yield  # Yield control back to FastAPI
    
    # Shutdown events can be added here if needed

# Create the FastAPI app with lifespan
app = FastAPI(title="Budget App API", lifespan=lifespan)

# Define all possible frontend origins
allowed_origins = [
    "https://pzqh821b-3000.usw2.devtunnels.ms",
    "https://pzqh821b-8000.usw2.devtunnels.ms",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "http://10.0.0.31:3000",  
    "http://10.0.0.31:8000",  
    "http://76.121.92.139:8000"  
]

# Custom middleware to handle CORS with credentials properly
class CustomCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin")
        
        # Get the response from the next middleware or route handler
        response = await call_next(request)
        
        # If the origin is in allowed_origins, set the specific origin
        if origin in allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
        
        return response

# Add the custom CORS middleware
app.add_middleware(CustomCORSMiddleware)

# Add FastAPI's CORS middleware with specific configurations
# We're still using this but with no wildcard for credentials support
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add a diagnostic endpoint to check data fetching
@app.get("/api/debug/connection", tags=["Debug"])
async def check_connection():
    """
    Diagnostic endpoint to verify API connectivity
    Returns current timestamp and connection status
    """
    import time
    return {
        "status": "ok",
        "timestamp": time.time(),
        "message": "API connection successful"
    }

# Include our router
app.include_router(router)

# Serve index.html from Next.js build or a fallback
@app.get("/", include_in_schema=False)
async def serve_index():
    index_paths = [
        NEXT_BUILD_DIR / "server" / "pages" / "index.html",
        FRONTEND_DIR / "out" / "index.html",
        PUBLIC_DIR / "index.html"
    ]
    
    for path in index_paths:
        if path.exists():
            return FileResponse(path)
    
    # Fallback response if no index file is found
    return {"message": "API server is running. Frontend is not built or configured correctly."}

# Wildcard route to serve Next.js pages
@app.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend(full_path: str):
    # Skip API routes
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Not found")
    
    # Check if file exists in out directory
    if (FRONTEND_DIR / "out").exists():
        file_path = FRONTEND_DIR / "out" / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        
        # Try with .html extension
        html_path = file_path.with_suffix(".html")
        if html_path.exists():
            return FileResponse(html_path)
        
        # Serve index.html for SPA navigation
        index_path = FRONTEND_DIR / "out" / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
    
    # Fallback for server-side rendering or when "out" directory doesn't exist
    return {"message": "Page not found. Make sure your frontend is built correctly."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
