from datetime import datetime, timedelta, timezone
from ai import prioritize_tickets, summarize_ticket

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from database import db
from dependencies import get_current_user
from schemas import TicketCreate, TicketUpdate


router = APIRouter(
    prefix="/tickets",
    tags=["Tickets"]
)


# =========================================================
# STATUS REQUEST
# =========================================================

class StatusUpdate(BaseModel):
    status: str


# =========================================================
# HELPER - ADD TIMELINE EVENT
# =========================================================

async def add_ticket_event(
    ticket_id: ObjectId,
    current_user: dict,
    action: str
):
    event = {
        "event": action,
        "user_id": current_user["user_id"],
        "role": current_user["role"],
        "timestamp": datetime.now(timezone.utc)
    }

    await db.tickets.update_one(
        {
            "_id": ticket_id,
            "org_id": current_user["org_id"]
        },
        {
            "$push": {
                "events": event
            }
        }
    )



    

   # =========================================================
# CREATE TICKET
# =========================================================

@router.post("/")
async def create_ticket(
    data: TicketCreate,
    current_user: dict = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)

    status = (data.status or "open").strip().lower()

    allowed_statuses = [
        "open",
        "triaged",
        "in_progress",
        "resolved",
        "closed"
    ]

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid ticket status."
        )

    ticket = {
        "org_id": current_user["org_id"],
        "created_by": current_user["user_id"],
        "title": data.title,
        "description": data.description,
        "priority": data.priority,
        "status": status,
        "category": data.category,
        "assigned_to": None,
        "events": [
            {
                "event": "Ticket created",
                "user_id": current_user["user_id"],
                "role": current_user["role"],
                "timestamp": now
            }
        ],
        "created_at": now,
        "updated_at": now
    }

    result = await db.tickets.insert_one(ticket)

    return {
        "message": "Ticket created successfully.",
        "ticket_id": str(result.inserted_id)
    }


# =========================================================
# GET ALL TICKETS
# =========================================================

@router.get("/")
async def get_tickets(
    current_user: dict = Depends(get_current_user)
):
    org_id = current_user["org_id"]
    role = current_user["role"]

    # Employees can see only their own tickets.
    # Managers and Owners can see the whole company queue.
    query = {
        "org_id": org_id
    }

    if role == "employee":
        query["created_by"] = current_user["user_id"]

    cursor = db.tickets.find(query).sort("created_at", -1)

    tickets = []

    async for ticket in cursor:
        ticket["id"] = str(ticket["_id"])
        del ticket["_id"]
        tickets.append(ticket)

    return {
        "tickets": tickets
    }


    # =========================================================
# AI SUMMARIZE TICKET
# =========================================================
@router.post("/{ticket_id}/summarize")
async def summarize_ticket_endpoint(
    ticket_id: str,
    current_user: dict = Depends(get_current_user)
):

    if current_user["role"] not in ["manager", "owner"]:
        raise HTTPException(
            status_code=403,
            detail="Only managers and owners can summarize tickets."
        )

    if not ObjectId.is_valid(ticket_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid ticket ID."
        )

    print("================================")
    print("TICKET ID:", ticket_id)
    print("CURRENT USER:", current_user)

    test_ticket = await db.tickets.find_one({
        "_id": ObjectId(ticket_id)
    })

    print("TICKET WITHOUT ORG FILTER:", test_ticket)
    print("================================")

    # Find ticket inside current organization
    ticket = await db.tickets.find_one({
        "_id": ObjectId(ticket_id),
        "org_id": current_user["org_id"]
    })

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found."
        )


        
    

    

    
    

    # Get comments
    cursor = db.comments.find({
        "ticket_id": ticket_id,
        "org_id": current_user["org_id"]
    }).sort("created_at", 1)

    comments = []

    async for comment in cursor:
        comments.append({
            "role": comment.get("role", "user"),
            "content": comment.get("content", "")
        })

    try:
        result = summarize_ticket(
            ticket.get("title", ""),
            ticket.get("description", ""),
            comments
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI summarization failed: {str(e)}"
        )

    summary = result.get("summary", "")

    # Store AI result separately
    await db.tickets.update_one(
        {
            "_id": ObjectId(ticket_id),
            "org_id": current_user["org_id"]
        },
        {
            "$set": {
                "ai_summary": summary,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )

    return {
        "message": "Ticket summarized successfully.",
        "ticket_id": ticket_id,
        "summary": summary
    }


# =========================================================
# GET SINGLE TICKET
# =========================================================

@router.get("/{ticket_id}")
async def get_ticket(
    ticket_id: str,
    current_user: dict = Depends(get_current_user)
):
    if not ObjectId.is_valid(ticket_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid ticket ID."
        )

    query = {
        "_id": ObjectId(ticket_id),
        "org_id": current_user["org_id"]
    }

    # Employee can access only their own ticket.
    if current_user["role"] == "employee":
        query["created_by"] = current_user["user_id"]

    ticket = await db.tickets.find_one(query)

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found."
        )

    ticket["id"] = str(ticket["_id"])
    del ticket["_id"]

    return ticket


# =========================================================
# UPDATE TICKET
# =========================================================

@router.put("/{ticket_id}")
async def update_ticket(
    ticket_id: str,
    data: TicketUpdate,
    current_user: dict = Depends(get_current_user)
):
    if not ObjectId.is_valid(ticket_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid ticket ID."
        )

    # Employee can update only their own ticket.
    # Manager and Owner can update company tickets.
    query = {
        "_id": ObjectId(ticket_id),
        "org_id": current_user["org_id"]
    }

    if current_user["role"] == "employee":
        query["created_by"] = current_user["user_id"]

    update_data = {
        key: value
        for key, value in data.model_dump().items()
        if value is not None
    }

    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No fields provided for update."
        )

    update_data["updated_at"] = datetime.now(timezone.utc)

    result = await db.tickets.update_one(
        query,
        {
            "$set": update_data
        }
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found."
        )

    return {
        "message": "Ticket updated successfully."
    }


# =========================================================
# CHANGE STATUS
# =========================================================

@router.patch("/{ticket_id}/status")
async def change_ticket_status(
    ticket_id: str,
    data: StatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    if not ObjectId.is_valid(ticket_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid ticket ID."
        )

    new_status = data.status.lower()

    allowed_statuses = [
        "open",
        "triaged",
        "in_progress",
        "resolved",
        "closed"
    ]

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid ticket status."
        )

    # Employee can access only their own ticket.
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

    old_status = ticket.get("status", "open")

    # Same status doesn't need another event.
    if old_status == new_status:
        return {
            "message": f"Ticket is already {new_status}."
        }

    role = current_user["role"]

    # -----------------------------------------------------
    # EMPLOYEE PERMISSION
    # -----------------------------------------------------
    if role == "employee":

        # Employee can close only after manager resolves it.
        if new_status != "closed":
            raise HTTPException(
                status_code=403,
                detail="Employees can only close a resolved ticket."
            )

        if old_status != "resolved":
            raise HTTPException(
                status_code=400,
                detail="A ticket can only be closed after it is resolved."
            )

    # -----------------------------------------------------
    # MANAGER / OWNER WORKFLOW
    # -----------------------------------------------------
    else:

        # Normal forward workflow
        valid_transition = {
            "open": ["triaged"],
            "triaged": ["in_progress"],
            "in_progress": ["resolved"],
            "resolved": ["closed"],
            "closed": []
        }

        # Reopen is handled separately below.
        if new_status == "open":

            if old_status != "closed":
                raise HTTPException(
                    status_code=400,
                    detail="Only closed tickets can be reopened."
                )

            closed_at = ticket.get("closed_at")

            if not closed_at:
                raise HTTPException(
                    status_code=400,
                    detail="This ticket cannot be reopened."
                )

            if closed_at.tzinfo is None:
                closed_at = closed_at.replace(
                    tzinfo=timezone.utc
                )

            if datetime.now(timezone.utc) - closed_at > timedelta(days=7):
                raise HTTPException(
                    status_code=400,
                    detail="A ticket can only be reopened within 7 days."
                )

        elif new_status not in valid_transition.get(old_status, []):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status transition: {old_status} → {new_status}."
            )

    # -----------------------------------------------------
    # UPDATE STATUS
    # -----------------------------------------------------

    now = datetime.now(timezone.utc)

    update_data = {
        "status": new_status,
        "updated_at": now
    }

    if new_status == "closed":
        update_data["closed_at"] = now

    if new_status == "open" and old_status == "closed":
        update_data["reopened_at"] = now
        update_data["closed_at"] = None

    await db.tickets.update_one(
        {
            "_id": ObjectId(ticket_id),
            "org_id": current_user["org_id"]
        },
        {
            "$set": update_data
        }
    )

    # -----------------------------------------------------
    # TIMELINE EVENT
    # -----------------------------------------------------

    await add_ticket_event(
        ObjectId(ticket_id),
        current_user,
        f"Status changed from {old_status} to {new_status}"
    )

    return {
        "message": "Ticket status updated successfully.",
        "old_status": old_status,
        "new_status": new_status
    }


# =========================================================
# DELETE TICKET
# OWNER ONLY
# =========================================================

@router.delete("/{ticket_id}")
async def delete_ticket(
    ticket_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "owner":
        raise HTTPException(
            status_code=403,
            detail="Only the Owner can delete tickets."
        )

    if not ObjectId.is_valid(ticket_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid ticket ID."
        )

    result = await db.tickets.delete_one({
        "_id": ObjectId(ticket_id),
        "org_id": current_user["org_id"]
    })

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found."
        )

    return {
        "message": "Ticket deleted successfully."
    }

    # =========================================================
# ASSIGN / REASSIGN TICKET
# =========================================================

class AssignTicketRequest(BaseModel):
    user_id: str


@router.patch("/{ticket_id}/assign")
async def assign_ticket(
    ticket_id: str,
    data: AssignTicketRequest,
    current_user: dict = Depends(get_current_user)
):
    # Only Manager and Owner can assign tickets
    if current_user["role"] not in ["manager", "owner"]:
        raise HTTPException(
            status_code=403,
            detail="Only Managers and Owners can assign tickets."
        )

    if not ObjectId.is_valid(ticket_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid ticket ID."
        )

    # Find ticket within the current organization
    ticket = await db.tickets.find_one({
        "_id": ObjectId(ticket_id),
        "org_id": current_user["org_id"]
    })

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found."
        )

    # Find assignee within the same organization
    assignee = await db.users.find_one({
        "_id": ObjectId(data.user_id),
        "org_id": current_user["org_id"],
        "role": {
            "$in": ["manager", "owner"]
        }
    })

    if not assignee:
        raise HTTPException(
            status_code=404,
            detail="Assignee not found in your organization."
        )

    now = datetime.now(timezone.utc)

    await db.tickets.update_one(
        {
            "_id": ObjectId(ticket_id),
            "org_id": current_user["org_id"]
        },
        {
            "$set": {
                "assigned_to": data.user_id,
                "updated_at": now
            },
            "$push": {
                "events": {
                    "event": f"Ticket assigned to {assignee['full_name']}",
                    "user_id": current_user["user_id"],
                    "role": current_user["role"],
                    "timestamp": now
                }
            }
        }
    )

    return {
        "message": "Ticket assigned successfully.",
        "assigned_to": data.user_id,
        "assignee_name": assignee["full_name"]
    }

    # =========================================================
# AI PRIORITIZE TICKETS
# =========================================================

@router.post("/prioritize")
async def prioritize_open_tickets(
    current_user: dict = Depends(get_current_user)
):

    # Only Manager and Owner can prioritize
    if current_user["role"] not in ["manager", "owner"]:
        raise HTTPException(
            status_code=403,
            detail="Only managers and owners can prioritize tickets."
        )

    # Get open / untriaged tickets from this organization
    cursor = db.tickets.find({
        "org_id": current_user["org_id"],
        "status": "open"
    })

    tickets = []

    async for ticket in cursor:
        tickets.append(ticket)

    if not tickets:
        return {
            "message": "No open tickets available for prioritization.",
            "tickets": []
        }

    try:
        ai_results = prioritize_tickets(tickets)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI prioritization failed: {str(e)}"
        )

    updated_tickets = []

    for result in ai_results:

        ticket_id = result.get("ticket_id")

        if not ObjectId.is_valid(ticket_id):
            continue

        priority = result.get("priority", "medium")
        category = result.get("category", "general")
        reason = result.get("reason", "")

        await db.tickets.update_one(
            {
                "_id": ObjectId(ticket_id),
                "org_id": current_user["org_id"],
                "status": "open"
            },
            {
                "$set": {
                    "ai_priority": priority,
                    "ai_category": category,
                    "ai_reason": reason,
                    "priority": priority,
                    "category": category,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )

        updated_tickets.append({
            "ticket_id": ticket_id,
            "priority": priority,
            "category": category,
            "reason": reason
        })

    return {
        "message": "Tickets prioritized successfully.",
        "tickets": updated_tickets
    }