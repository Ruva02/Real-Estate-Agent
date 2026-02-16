from fastapi import APIRouter, HTTPException
from datetime import datetime
import random
from backend.schemas import UserSignup, UserLogin, ForgotPassword, VerifyOTP, ResetPassword
from backend.core.database import users_collection, otps_collection
from backend.core.security import hash_password, verify_password
from backend.services.email import send_otp_email

router = APIRouter()

@router.post("/signup")
async def signup(user: UserSignup):
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user.model_dump()
    user_dict["password"] = hash_password(user.password)
    user_dict["created_at"] = datetime.utcnow()
    
    await users_collection.insert_one(user_dict)
    return {"message": "User created successfully"}

@router.post("/login")
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

@router.post("/forgot-password")
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

@router.post("/verify-otp")
async def verify_otp(data: VerifyOTP):
    otp_record = await otps_collection.find_one({"email": data.email, "otp": data.otp})
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    return {"message": "OTP verified successfully"}

@router.post("/reset-password")
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
