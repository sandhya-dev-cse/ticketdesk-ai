import os
import uuid
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse

from database import db
from dependencies import get_current_user
from ai import extract_error_from_image


router = APIRouter(
    prefix="/tickets",
    tags=["Attachments"]
)


UPLOAD_DIR = "uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)


ALLOWED_TYPES = {
    "image/png",
    "image/jpeg",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


# =========================================================
# HELPER - CHECK TICKET ACCESS
# =========================================================

async def get_accessible_ticket(
    ticket_id: str,
    current_user: dict
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

    # Employee can only access their own ticket
    if current_user["role"] == "employee":
        query["created_by"] = current_user["user_id"]

    ticket = await db.tickets.find_one(query)

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found."
        )

    return ticket


# =========================================================
# UPLOAD ATTACHMENT
# =========================================================

@router.post("/{ticket_id}/attachments")
async def upload_attachment(
    ticket_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):

    await get_accessible_ticket(
        ticket_id,
        current_user
    )

    # =====================================================
    # VALIDATE FILE TYPE
    # =====================================================

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="File type not allowed."
        )

    # =====================================================
    # READ FILE
    # =====================================================

    contents = await file.read()

    # =====================================================
    # VALIDATE FILE SIZE
    # =====================================================

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size must be 10 MB or less."
        )

    # =====================================================
    # GENERATE UNIQUE FILENAME
    # =====================================================

    original_filename = file.filename or "attachment"

    extension = os.path.splitext(
        original_filename
    )[1]

    stored_filename = f"{uuid.uuid4()}{extension}"

    file_path = os.path.join(
        UPLOAD_DIR,
        stored_filename
    )

    # =====================================================
    # SAVE FILE
    # =====================================================

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    # =====================================================
    # AI SCREENSHOT ERROR EXTRACTION
    # =====================================================

    ai_extraction = {
        "error_text": "",
        "technical_details": ""
    }

    # Only images are sent to the vision model
    if file.content_type in {
        "image/png",
        "image/jpeg",
        "image/webp"
    }:

        try:

            ai_extraction = extract_error_from_image(
                file_path,
                file.content_type
            )

        except Exception as e:

            # AI failure should NOT stop attachment upload
            print(
                f"AI image extraction failed: {e}"
            )

    now = datetime.now(timezone.utc)

    # =====================================================
    # STORE ATTACHMENT IN MONGODB
    # =====================================================

    attachment = {
        "ticket_id": ticket_id,
        "org_id": current_user["org_id"],
        "uploaded_by": current_user["user_id"],

        "original_filename": original_filename,
        "stored_filename": stored_filename,
        "content_type": file.content_type,
        "size": len(contents),
        "path": file_path,

        # AI extracted information
        "ai_error_text": ai_extraction.get(
            "error_text",
            ""
        ),

        "ai_technical_details": ai_extraction.get(
            "technical_details",
            ""
        ),

        "created_at": now
    }

    result = await db.attachments.insert_one(
        attachment
    )

    # =====================================================
    # ADD TIMELINE EVENT
    # =====================================================

    await db.tickets.update_one(
        {
            "_id": ObjectId(ticket_id),
            "org_id": current_user["org_id"]
        },
        {
            "$push": {
                "events": {
                    "event": (
                        f"Attachment added: "
                        f"{original_filename}"
                    ),
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

    # =====================================================
    # RESPONSE
    # =====================================================

    return {
        "message": "Attachment uploaded successfully.",

        "attachment_id": str(
            result.inserted_id
        ),

        "filename": original_filename,

        "size": len(contents),

        "content_type": file.content_type,

        "ai_error_text": ai_extraction.get(
            "error_text",
            ""
        ),

        "ai_technical_details": ai_extraction.get(
            "technical_details",
            ""
        )
    }


# =========================================================
# GET TICKET ATTACHMENTS
# =========================================================

@router.get("/{ticket_id}/attachments")
async def get_attachments(
    ticket_id: str,
    current_user: dict = Depends(get_current_user)
):

    await get_accessible_ticket(
        ticket_id,
        current_user
    )

    cursor = db.attachments.find(
        {
            "ticket_id": ticket_id,
            "org_id": current_user["org_id"]
        }
    ).sort(
        "created_at",
        1
    )

    attachments = []

    async for attachment in cursor:

        attachments.append({
            "id": str(
                attachment["_id"]
            ),

            "ticket_id": attachment[
                "ticket_id"
            ],

            "original_filename": attachment[
                "original_filename"
            ],

            "content_type": attachment[
                "content_type"
            ],

            "size": attachment[
                "size"
            ],

            "uploaded_by": attachment[
                "uploaded_by"
            ],

            "created_at": attachment[
                "created_at"
            ],

            # AI extracted information
            "ai_error_text": attachment.get(
                "ai_error_text",
                ""
            ),

            "ai_technical_details": attachment.get(
                "ai_technical_details",
                ""
            )
        })

    return {
        "ticket_id": ticket_id,
        "attachments": attachments
    }


# =========================================================
# DOWNLOAD / VIEW ATTACHMENT
# =========================================================

@router.get(
    "/{ticket_id}/attachments/{attachment_id}"
)
async def download_attachment(
    ticket_id: str,
    attachment_id: str,
    current_user: dict = Depends(get_current_user)
):

    await get_accessible_ticket(
        ticket_id,
        current_user
    )

    if not ObjectId.is_valid(
        attachment_id
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid attachment ID."
        )

    attachment = await db.attachments.find_one(
        {
            "_id": ObjectId(attachment_id),
            "ticket_id": ticket_id,
            "org_id": current_user["org_id"]
        }
    )

    if not attachment:
        raise HTTPException(
            status_code=404,
            detail="Attachment not found."
        )

    file_path = attachment.get("path")

    if (
        not file_path
        or not os.path.exists(file_path)
    ):
        raise HTTPException(
            status_code=404,
            detail="Attachment file is not available."
        )

    return FileResponse(
        path=file_path,

        media_type=attachment.get(
            "content_type",
            "application/octet-stream"
        ),

        filename=attachment.get(
            "original_filename",
            "attachment"
        )
    )