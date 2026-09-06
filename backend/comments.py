from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from database import db
from dependencies import get_current_user


router = APIRouter(
    prefix="/tickets",
    tags=["Comments"]
)


# =========================================================
# COMMENT REQUEST
# =========================================================

class CommentCreate(BaseModel):
    content: str


# =========================================================
# ADD COMMENT
# =========================================================

@router.post("/{ticket_id}/comments")
async def add_comment(
    ticket_id: str,
    data: CommentCreate,
    current_user: dict = Depends(get_current_user)
):
    if not ObjectId.is_valid(ticket_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid ticket ID."
        )

    # Scope ticket to organization
    query = {
        "_id": ObjectId(ticket_id),
        "org_id": current_user["org_id"]
    }

    # Employee can comment only on their own ticket
    if current_user["role"] == "employee":
        query["created_by"] = current_user["user_id"]

    ticket = await db.tickets.find_one(query)

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found."
        )

    now = datetime.now(timezone.utc)

    comment = {
        "user_id": current_user["user_id"],
        "role": current_user["role"],
        "content": data.content,
        "created_at": now
    }

    result = await db.comments.insert_one({
        "ticket_id": ticket_id,
        "org_id": current_user["org_id"],
        **comment
    })

    # Add event to timeline
    await db.tickets.update_one(
        {
            "_id": ObjectId(ticket_id),
            "org_id": current_user["org_id"]
        },
        {
            "$push": {
                "events": {
                    "event": "Comment added",
                    "user_id": current_user["user_id"],
                    "role": current_user["role"],
                    "timestamp": now
                }
            },
            "$set": {
                "updated_at": now
            }
        }
    )

    return {
        "message": "Comment added successfully.",
        "comment_id": str(result.inserted_id)
    }


# =========================================================
# GET TICKET COMMENTS
# =========================================================

@router.get("/{ticket_id}/comments")
async def get_comments(
    ticket_id: str,
    current_user: dict = Depends(get_current_user)
):
    if not ObjectId.is_valid(ticket_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid ticket ID."
        )

    # Check ticket access
    query = {
        "_id": ObjectId(ticket_id),
        "org_id": current_user["org_id"]
    }

    if current_user["role"] == "employee":
        query["created_by"] = current_user["user_id"]

    ticket = await db.tickets.find_one(query)

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found."
        )

    cursor = db.comments.find({
        "ticket_id": ticket_id,
        "org_id": current_user["org_id"]
    }).sort("created_at", 1)

    comments = []

    async for comment in cursor:
        comments.append({
            "id": str(comment["_id"]),
            "user_id": comment["user_id"],
            "role": comment["role"],
            "content": comment["content"],
            "created_at": comment["created_at"]
        })

    return {
        "ticket_id": ticket_id,
        "comments": comments
    }