from fastapi import APIRouter, Depends

from database import db
from dependencies import get_current_user


router = APIRouter(
    prefix="/team",
    tags=["Team"]
)


# =========================================================
# GET COMPANY TEAM
# =========================================================

@router.get("/")
async def get_team(
    current_user: dict = Depends(get_current_user)
):
    org_id = current_user["org_id"]
    role = current_user["role"]

    # Get users only from the logged-in user's organization
    users = await db.users.find(
        {"org_id": org_id},
        {
            "password_hash": 0
        }
    ).to_list(length=None)

    team = []

    for user in users:

        member = {
            "user_id": str(user["_id"]),
            "full_name": user["full_name"],
            "email": user["email"],
            "role": user["role"],
            "created_at": user.get("created_at")
        }

        # Managers and Owners need open ticket count
        if role in ["manager", "owner"]:

            open_ticket_count = await db.tickets.count_documents({
                "org_id": org_id,
                "created_by": str(user["_id"]),
                "status": {
                    "$in": [
                        "open",
                        "triaged",
                        "in_progress",
                        "resolved"
                    ]
                }
            })

            member["open_ticket_count"] = open_ticket_count

        team.append(member)

    return {
        "organization_id": org_id,
        "members": team
    }