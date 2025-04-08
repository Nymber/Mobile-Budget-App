# This file handles user authentication, JWT tokens, and password hashing.
# It is used to verify user credentials and generate JWT tokens for authentication.

# cSpell:words jose

import os
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from passlib.context import CryptContext
from pydantic import BaseModel

# Local Imports
from settings.db_settings import get_db
from db_env import Account

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", default="bcrypt")

# Secret key to encode and decode JWT tokens
SECRET_KEY = "YOUR_SECRET_KEY_HERE"  # Replace with a secure secret key

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

class TokenData(BaseModel):
    username: Optional[str] = None
    exp: Optional[float] = None

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        exp: float = payload.get("exp")
        
        if username is None:
            raise credentials_exception
        
        # Check if token has expired
        if exp and datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        token_data = TokenData(username=username, exp=exp)
    except JWTError:
        raise credentials_exception
    
    user = db.query(Account).filter(Account.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

def authenticate_user(db: Session, username: str, password: str):
    try:
        user = db.query(Account).filter(Account.username == username).first()
        if not user:
            print(f"User not found: {username}")
            return False
        if not verify_password(password, user.password):
            print(f"Password verification failed for user: {username}")
            return False
        return user
    except Exception as e:
        print(f"Error in authenticate_user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication error occurred."
        )

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)