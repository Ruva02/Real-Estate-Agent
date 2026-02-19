import json
from typing import Optional, List, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.tools import tool
from langchain_core.messages import SystemMessage, HumanMessage, ToolMessage
from services.db import get_db
from dotenv import load_dotenv

load_dotenv()

db = get_db()
properties_collection = db.properties

@tool
def search_properties(
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
        try:
            query["bhk"] = int(bhk)
        except:
            pass
    if max_price:
        try:
            query["price"] = {"$lte": float(max_price)}
        except:
            pass
    
    results = list(properties_collection.find(query).limit(20))
    
    for r in results:
        r["_id"] = str(r["_id"]) # Convert ObjectId to string

    if not results:
        return "No properties found matching those criteria."
    return json.dumps(results, indent=2)

# LLM Setup
llm = ChatGoogleGenerativeAI(model="gemini-flash-latest", temperature=0)
tools = [search_properties]
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

CRITICAL: At the VERY END of your message, you MUST include a structured analysis in this EXACT format:
<analysis>{"category": "Buy/Rent/Sell/General", "location": "City or null", "budget": "Price or null", "bhk": number or null}</analysis>

IMPORTANT: If you use the search_properties tool and find results, include the property data JSON block AFTER the <analysis> tag.
""")
]

def parse_analysis(text: str) -> dict:
    """Parses the <analysis> tag from LLM response."""
    try:
        import re
        match = re.search(r"<analysis>(.*?)</analysis>", text, re.DOTALL)
        if match:
            data = json.loads(match.group(1))
            # Validate category
            valid = ["Buy", "Rent", "Sell"]
            for v in valid:
                if v.lower() in str(data.get("category", "")).lower():
                    data["category"] = v
                    return data
            data["category"] = "General"
            return data
    except Exception as e:
        print(f"Error parsing analysis: {e}")
    
    return {
        "category": "General",
        "location": None,
        "budget": None,
        "bhk": None
    }

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
