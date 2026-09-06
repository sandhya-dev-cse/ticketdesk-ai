from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import (
    connect_to_mongodb,
    close_mongodb_connection,
)

from auth import router as auth_router
from tickets import router as tickets_router
from invites import router as invites_router
from team import router as team_router
from comments import router as comments_router
from attachments import router as attachments_router



@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongodb()
    yield
    await close_mongodb_connection()


app = FastAPI(
    title="TicketDesk AI API",
    version="1.0.0",
    lifespan=lifespan,
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "https://ticketdeskai.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROUTES
# =========================================================

app.include_router(auth_router)
app.include_router(tickets_router)
app.include_router(invites_router)
app.include_router(team_router)
app.include_router(comments_router)
app.include_router(attachments_router)



# =========================================================
# ROOT
# =========================================================

@app.get("/")
async def root():
    return {
        "message": "TicketDesk AI backend is running"
    }


# =========================================================
# HEALTH
# =========================================================

@app.get("/health")
async def health_check():
    return {
        "status": "healthy"
    }