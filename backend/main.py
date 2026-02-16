import os
import json
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Body, Depends
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, ToolMessage
from langchain.tools import tool
from fastapi.middleware.cors import CORSMiddleware
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

load_dotenv()

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

@app.get("/health")
async def health():
    return {"status": "ok", "message": "Backend is running on port 8001"}

# MongoDB Setup
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.haven_ai
users_collection = db.users
properties_collection = db.properties
otps_collection = db.otps

@app.on_event("startup")
async def startup_db_client():
    await otps_collection.create_index("created_at", expireAfterSeconds=600)
    print("MongoDB indexes created")

# Password Hashing
def hash_password(password: str) -> str:
    # Use bcrypt directly for better compatibility with modern Python/libraries
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'), 
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False

# Pydantic Models
class UserSignup(BaseModel):
    full_name: str
    mobile: str
    email: EmailStr
    city: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPassword(BaseModel):
    email: EmailStr

class VerifyOTP(BaseModel):
    email: EmailStr
    otp: str

class ResetPassword(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

@tool
async def search_properties(
    action: Optional[str] = None, 
    location: Optional[str] = None, 
    bhk: Optional[int] = None, 
    max_price: Optional[float] = None
) -> str:
    """Search for properties based on user requirements. 
    action: 'Buy' or 'Rent'
    location: City name
    bhk: Number of bedrooms
    max_price: Maximum price/budget
    """
    query = {}
    if action:
        query["action"] = {"$regex": f"^{action}$", "$options": "i"}
    if location:
        query["location"] = {"$regex": f"^{location}$", "$options": "i"}
    if bhk:
        query["bhk"] = bhk
    if max_price:
        query["price"] = {"$lte": max_price}
    
    cursor = properties_collection.find(query)
    results = await cursor.to_list(length=20)
    
    for r in results:
        r["_id"] = str(r["_id"]) # Convert ObjectId to string

    if not results:
        return "No properties found matching those criteria."
    return json.dumps(results, indent=2)

# LLM Setup
llm = ChatGoogleGenerativeAI(model="gemini-flash-latest", temperature=0)
tools = [search_properties]
# Note: Since search_properties is now async, we'll need to handle it carefully in the chat endpoint
llm_with_tools = llm.bind_tools(tools)

# Simple in-memory chat history (per session)
chat_history: List[Any] = [
    SystemMessage(content="""You are a professional real estate agent. Your goal is to help users find their dream property.
Before showing any property, you MUST gather the following information if not already provided:
1. Whether they want to Buy, Sell, or Rent.
2. Primary Location (City).
3. Property Details (Number of BHK or Size/Measurements).
4. Their Budget.

Ask these questions one by one in a friendly, conversational manner. 
Only when you have enough information to perform a search, use the search_properties tool.

IMPORTANT: When you present properties, if you found results, you MUST include the property data JSON block at the END of your message so the frontend can display them visually.
""")
]

def extract_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        text_parts = []
        for part in content:
            if isinstance(part, str):
                text_parts.append(part)
            elif isinstance(part, dict) and "text" in part:
                text_parts.append(part["text"])
            else:
                text_parts.append(str(part))
        return "".join(text_parts)
    return str(content)

# Auth Endpoints
@app.post("/signup")
async def signup(user: UserSignup):
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user.model_dump()
    user_dict["password"] = hash_password(user.password)
    user_dict["created_at"] = datetime.utcnow()
    
    await users_collection.insert_one(user_dict)
    return {"message": "User created successfully"}

@app.post("/login")
async def login(user: UserLogin):
    db_user = await users_collection.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    return {
        "message": "Login successful",
        "user": {
            "full_name": db_user["full_name"],
            "email": db_user["email"],
            "city": db_user["city"]
        }
    }

async def send_otp_email(email: str, otp: str):
    msg = MIMEMultipart()
    msg['From'] = os.getenv("MAIL_FROM")
    msg['To'] = email
    msg['Subject'] = "Haven AI - Password Reset OTP"

    body = f"""
    Hello,

    You requested a password reset for your Haven AI account.
    Your One-Time Password (OTP) is: {otp}

    This OTP will expire in 10 minutes.

    If you did not request this, please ignore this email.

    Best regards,
    Haven AI Team
    """
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP(os.getenv("MAIL_SERVER"), int(os.getenv("MAIL_PORT", 587)))
        server.starttls()
        server.login(os.getenv("MAIL_USERNAME"), os.getenv("MAIL_PASSWORD"))
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

@app.post("/forgot-password")
async def forgot_password(data: ForgotPassword):
    db_user = await users_collection.find_one({"email": data.email})
    if not db_user:
        return {"message": "If an account exists for this email, you will receive reset instructions."}
    
    otp = str(random.randint(100000, 999999))
    await otps_collection.update_one(
        {"email": data.email},
        {"$set": {"otp": otp, "created_at": datetime.utcnow()}},
        upsert=True
    )
    
    # Always print for development/debug
    print(f"\n--- DEBUG OTP ---")
    print(f"Target: {data.email}")
    print(f"Code: {otp}")
    print(f"-----------------\n")

    success = await send_otp_email(data.email, otp)
    if success:
        return {"message": "OTP has been sent to your email."}
    else:
        return {"message": "Email sending failed. (Check backend terminal for OTP)"}

@app.post("/verify-otp")
async def verify_otp(data: VerifyOTP):
    otp_record = await otps_collection.find_one({"email": data.email, "otp": data.otp})
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    return {"message": "OTP verified successfully"}

@app.post("/reset-password")
async def reset_password(data: ResetPassword):
    otp_record = await otps_collection.find_one({"email": data.email, "otp": data.otp})
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    # Update password
    hashed_password = hash_password(data.new_password)
    await users_collection.update_one(
        {"email": data.email},
        {"$set": {"password": hashed_password}}
    )
    
    # Delete OTP after use
    await otps_collection.delete_one({"email": data.email})
    
    return {"message": "Password reset successfully"}

# Chat Endpoint
@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    global chat_history
    try:
        chat_history.append(HumanMessage(content=request.message))
        response = await llm_with_tools.ainvoke(chat_history)
        
        if response.tool_calls:
            for tool_call in response.tool_calls:
                if tool_call["name"] == "search_properties":
                    args = tool_call["args"]
                    # Call the async tool manually
                    result = await search_properties.ainvoke(args)
                    
                    chat_history.append(response)
                    chat_history.append(ToolMessage(content=result, tool_call_id=tool_call["id"]))
                    
                    final_response = await llm.ainvoke(chat_history)
                    chat_history.append(final_response)
                    return ChatResponse(response=extract_text(final_response.content))
        
        chat_history.append(response)
        return ChatResponse(response=extract_text(response.content))
        
    except Exception as e:
        print(f"Error in chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
    ## rohan ki gand mariiii
