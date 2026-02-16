import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
from backend.routers import auth, chat
from backend.core.database import init_db

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await init_db()

@app.get("/health")
async def health():
    return {"status": "ok", "message": "Backend is running on port 8001"}

# Include Routers
app.include_router(auth.router)
app.include_router(chat.router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)

