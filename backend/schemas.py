from pydantic import BaseModel, EmailStr

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
