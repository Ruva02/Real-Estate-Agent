import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    # MongoDB Connection String
    MONGO_URI = os.getenv("MONGO_URL")

    # Database Name
    DB_NAME = os.getenv("DB_NAME", "realestate_db")

    # JWT Secret (ensure it is at least 32 bytes for SHA256)
    JWT_SECRET = os.getenv("JWT_SECRET", "haven-ai-professional-concierge-secret-key-2026-v1")
