import os
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# MongoDB Setup
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.haven_ai
users_collection = db.users
properties_collection = db.properties
otps_collection = db.otps

async def init_db():
    await otps_collection.create_index("created_at", expireAfterSeconds=600)
    print("MongoDB indexes created")
