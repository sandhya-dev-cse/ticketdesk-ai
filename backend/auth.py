import os
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Depends
from dependencies import get_current_user
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt

from database import db

load_dotenv()


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

JWT_SECRET = os.getenv("JWT_SECRET")

if not JWT_SECRET:
    raise ValueError("JWT_SECRET is not set in .env")

ALGORITHM = "HS256"



# =========================================================
# SIGNUP
# =========================================================

class SignupRequest(BaseModel):
    company_name: str
    full_name: str
    email: EmailStr
    password: str


@router.post("/signup")
async def signup(data: SignupRequest):

    existing_user = await db.users.find_one({
        "email": data.email.lower()
    })

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists."
        )

    # Create organization
    organization = {
        "name": data.company_name,
        "created_at": datetime.now(timezone.utc)
    }

    org_result = await db.orgs.insert_one(organization)
    org_id = str(org_result.inserted_id)

    # Hash password
    hashed_password = pwd_context.hash(data.password)

    # Create owner
    user = {
        "org_id": org_id,
        "full_name": data.full_name,
        "email": data.email.lower(),
        "password_hash": hashed_password,
        "role": "owner",
        "created_at": datetime.now(timezone.utc)
    }

    user_result = await db.users.insert_one(user)

    return {
        "message": "Company account created successfully.",
        "user_id": str(user_result.inserted_id),
        "org_id": org_id,
        "role": "owner"
    }


# =========================================================
# LOGIN
# =========================================================

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/login")
async def login(data: LoginRequest):

    # Find user
    user = await db.users.find_one({
        "email": data.email.lower()
    })

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    # Verify password
    if not pwd_context.verify(
        data.password,
        user["password_hash"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    # Token expiry
    expires = datetime.now(timezone.utc) + timedelta(hours=24)

    # JWT payload
    payload = {
        "user_id": str(user["_id"]),
        "org_id": user["org_id"],
        "role": user["role"],
        "exp": expires
    }

    token = jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=ALGORITHM
    )

    return {
        "message": "Login successful.",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "user_id": str(user["_id"]),
            "full_name": user["full_name"],
            "email": user["email"],
            "role": user["role"],
            "org_id": user["org_id"]
        }
    }

# =========================================================
# CURRENT USER
# =========================================================

@router.get("/me")
async def get_me(
    current_user: dict = Depends(get_current_user)
):
    return {
        "message": "Authenticated user",
        "user": current_user
    }