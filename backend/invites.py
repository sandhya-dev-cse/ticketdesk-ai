import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext

from database import db
from dependencies import require_roles


router = APIRouter(
    prefix="/invites",
    tags=["Invites"]
)

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# =========================================================
# REQUEST MODELS
# =========================================================

class InviteRequest(BaseModel):
    email: EmailStr
    role: str


class AcceptInviteRequest(BaseModel):
    full_name: str
    password: str


# =========================================================
# CREATE INVITE
# OWNER ONLY
# =========================================================

@router.post("/")
async def create_invite(
    data: InviteRequest,
    current_user: dict = Depends(require_roles("owner"))
):

    # Only Manager and Employee can be invited
    if data.role not in ["manager", "employee"]:
        raise HTTPException(
            status_code=400,
            detail="Role must be manager or employee."
        )

    email = data.email.lower()

    # Check whether user already exists
    existing_user = await db.users.find_one({
        "email": email,
        "org_id": current_user["org_id"]
    })

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists in your company."
        )

    # Check whether a pending invite already exists
    existing_invite = await db.invites.find_one({
        "email": email,
        "org_id": current_user["org_id"],
        "status": "pending"
    })

    if existing_invite:
        raise HTTPException(
            status_code=400,
            detail="A pending invite already exists for this email."
        )

    # Generate secure token
    token = secrets.token_urlsafe(32)

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=2)

    invite = {
        "org_id": current_user["org_id"],
        "email": email,
        "role": data.role,
        "token": token,
        "status": "pending",
        "created_at": now,
        "expires_at": expires_at
    }

    await db.invites.insert_one(invite)

    # Development invite link
    invite_link = f"https://ticketdeskai.vercel.app/invite/{token}"

    print("\n========================================")
    print("NEW INVITE CREATED")
    print(f"Email: {email}")
    print(f"Role: {data.role}")
    print(f"Invite link: {invite_link}")
    print("========================================\n")

    return {
        "message": "Invite created successfully.",
        "invite_link": invite_link,
        "email": email,
        "role": data.role
    }


# =========================================================
# VIEW INVITE
# PUBLIC
# =========================================================

@router.get("/{token}")
async def get_invite(token: str):

    invite = await db.invites.find_one({
        "token": token,
        "status": "pending"
    })

    if not invite:
        raise HTTPException(
            status_code=404,
            detail="Invite not found."
        )

    # MongoDB may return a naive datetime.
    # Make it UTC-aware before comparing.
    expires_at = invite.get("expires_at")

    if expires_at is None:
        raise HTTPException(
            status_code=400,
            detail="Invite expiration information is missing."
        )

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=400,
            detail="Invite has expired."
        )

    return {
        "email": invite["email"],
        "role": invite["role"]
    }


# =========================================================
# ACCEPT INVITE
# PUBLIC
# =========================================================

@router.post("/{token}/accept")
async def accept_invite(
    token: str,
    data: AcceptInviteRequest
):

    invite = await db.invites.find_one({
        "token": token,
        "status": "pending"
    })

    if not invite:
        raise HTTPException(
            status_code=404,
            detail="Invite not found."
        )

    # Check expiration
    expires_at = invite.get("expires_at")

    if expires_at is None:
        raise HTTPException(
            status_code=400,
            detail="Invite expiration information is missing."
        )

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=400,
            detail="Invite has expired."
        )

    # Check whether email already exists
    existing_user = await db.users.find_one({
        "email": invite["email"],
        "org_id": invite["org_id"]
    })

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User already exists."
        )

    # Hash password
    hashed_password = pwd_context.hash(data.password)

    # Create invited user
    user = {
        "org_id": invite["org_id"],
        "full_name": data.full_name,
        "email": invite["email"],
        "password_hash": hashed_password,
        "role": invite["role"],
        "created_at": datetime.now(timezone.utc)
    }

    result = await db.users.insert_one(user)

    # Mark invite as accepted
    await db.invites.update_one(
        {
            "_id": invite["_id"]
        },
        {
            "$set": {
                "status": "accepted",
                "accepted_at": datetime.now(timezone.utc)
            }
        }
    )

    return {
        "message": "Invite accepted successfully. You can now log in.",
        "user_id": str(result.inserted_id),
        "role": invite["role"]
    }