import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")

if not MONGODB_URL:
    raise ValueError("MONGODB_URL is not set in .env")

if not DATABASE_NAME:
    raise ValueError("DATABASE_NAME is not set in .env")


client = AsyncIOMotorClient(MONGODB_URL)

db = client[DATABASE_NAME]


async def connect_to_mongodb():
    await client.admin.command("ping")
    print(f"Connected to MongoDB database: {DATABASE_NAME}")


async def close_mongodb_connection():
    client.close()
    print("MongoDB connection closed.")