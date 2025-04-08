from datetime import datetime, timezone, timedelta
from fastapi import Depends, HTTPException, status, APIRouter, Header
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from logging import getLogger

# Local imports
from db_env import Account
from settings.db_settings import get_db
from auth import get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, pwd_context, authenticate_user, SECRET_KEY, ALGORITHM
# Use PyJWT instead of jwt
import jwt

router = APIRouter()
logger = getLogger(__name__)

# Base Models
class UserCreate(BaseModel):
    username: str
    password: str
    email: EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str
    expiration: datetime

@router.post("/register")
async def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(Account).filter_by(username=user.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    if db.query(Account).filter_by(email=user.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    hashed_password = pwd_context.hash(user.password)
    new_user = Account(
        username=user.username,
        password=hashed_password,
        email=user.email
    )
    db.add(new_user)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating user"
        )
    return {"message": "User created successfully"}

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login endpoint that accepts username and password as form data"""
    try:
        logger.info(f"Login attempt for user: {form_data.username}")

        # Authenticate user
        user = authenticate_user(db, form_data.username, form_data.password)
        if not user:
            logger.warning(f"Authentication failed for user: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Generate access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        expire = datetime.now(timezone.utc) + access_token_expires
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )

        logger.info(f"Login successful for user: {form_data.username}")
        logger.info(f"Token created for user: {form_data.username}, expires at: {expire}")

        # Return token with expiration
        return {"access_token": access_token, "token_type": "bearer", "expiration": expire}
    except HTTPException as http_exc:
        logger.error(f"HTTPException during login: {http_exc.detail}")
        raise http_exc
    except Exception as e:
        logger.error(f"Unexpected error during login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during login. Please try again later."
        )

@router.post("/auth/refresh")
async def refresh_token(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Endpoint to refresh an expired or soon-to-expire token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization.replace("Bearer ", "")
    
    try:
        # Decode token without verifying expiration
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_exp": False})
        username = payload.get("sub")
        
        if not username:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token contents",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify username exists in the database
        user = db.query(Account).filter(Account.username == username).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        # Create a new token
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        expire = datetime.now(timezone.utc) + expires_delta
        new_token = create_access_token(
            data={"sub": username, "exp": expire.timestamp()}
        )
        
        return {
            "access_token": new_token,  # Use access_token consistently for compatibility with frontend
            "token": new_token,         # Also include token for backward compatibility
            "token_type": "bearer",
            "expiration": expire
        }
        
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.get("/username")
async def get_username(current_user: Account = Depends(get_current_user)):
    return {"username": current_user.username}

@router.get("/validate-token")
async def validate_token(current_user: Account = Depends(get_current_user)):
    """Endpoint to validate if the current token is still valid"""
    return {"valid": True, "username": current_user.username}
