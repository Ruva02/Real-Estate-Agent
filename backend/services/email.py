import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

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
