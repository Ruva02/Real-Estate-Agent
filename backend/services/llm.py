import os
import json
from typing import Optional, List, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.tools import tool
from langchain_core.messages import SystemMessage
from backend.core.database import properties_collection
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

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
# In a real app, this should be stored in the database or Redis
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
