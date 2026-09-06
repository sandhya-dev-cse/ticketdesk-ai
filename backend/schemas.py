from pydantic import BaseModel, Field
from typing import Optional


class TicketCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    priority: str = "medium"
    status: str = "open"
    category: Optional[str] = None


class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None