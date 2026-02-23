import json
import re
from typing import Optional, List, Any, Dict
from datetime import datetime
from bson.objectid import ObjectId
from crewai import Agent, Task, Crew, Process, LLM
from langchain.tools import tool
from services.db import get_db
import os
from dotenv import load_dotenv

# Use absolute path for .env
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(BASE_DIR, '.env')
load_dotenv(dotenv_path=env_path)

db = get_db()
properties_collection = db.properties
sessions_collection = db.chat_sessions


@tool
def search_properties(
    action: Optional[str] = None, 
    location: Optional[str] = None, 
    bhk: Optional[int] = None, 
    max_price: Optional[float] = None,
    property_id: Optional[str] = None
) -> str:
    """Search for properties based on user requirements. 
    action: 'Buy' or 'Rent'
    location: City name
    bhk: Number of bedrooms
    max_price: Maximum price/budget
    property_id: Specific database ID of a property
    """
    if property_id:
        try:
            # Clean property_id if it has # prefix
            clean_id = property_id.replace("#", "").strip()
            # Try searching by ObjectId
            if len(clean_id) == 24:
                prop = properties_collection.find_one({"_id": ObjectId(clean_id)})
                if prop:
                    prop["_id"] = str(prop["_id"])
                    prop["location"] = prop.get("city")
                    return json.dumps([prop])
            
            # Fallback: search for ID as a string in other fields if needed, 
            # but usually users provide the hex ID
        except Exception as e:
            print(f"Error searching by ID: {e}")

    query = {}
    if action:
        query["action"] = {"$regex": f"^{action}$", "$options": "i"}
    if location:
        query["city"] = {"$regex": f"^{location}$", "$options": "i"}
    if bhk:
        try:
            query["bedrooms"] = int(bhk)
        except:
            pass
    
    # Try strict price first
    strict_query = query.copy()
    if max_price:
        strict_query["price"] = {"$lte": float(max_price)}
    
    results = list(properties_collection.find(strict_query).sort("price", 1).limit(2))
    
    # Fallback: If no results with strict budget, try "around the price"
    if not results and max_price:
        print("No exact budget matches, performing flexible search...")
        # Search for properties in the same city/action but slightly higher budget or just any price sorted by closeness
        flex_query = query.copy()
        # No strict budget filter, just sort by price proximity
        # We'll fetch properties and sort by distance to target price in Python for simplicity
        results = list(properties_collection.find(flex_query).sort("price", 1).limit(20))
        
        if results:
            target = float(max_price)
            # Sort by absolute difference to target price
            results.sort(key=lambda x: abs((x.get("price") or 0) - target))
            results = results[:2] # Keep top 2 closest
            print(f"Found {len(results)} recommendations around the price.")

    essential_results = []
    for r in results:
        essential_results.append({
            "_id": str(r["_id"]),
            "title": r.get("title"),
            "price": r.get("price"),
            "city": r.get("city"),
            "location": r.get("city"),
            "bedrooms": r.get("bedrooms"),
            "action": r.get("action")
        })

    if not essential_results:
        return "No properties found matching those criteria. Please try broadening your search."
    
    return "MANDATORY_JSON_RESULTS: " + json.dumps(essential_results)

from crewai.tools import BaseTool

class SearchPropertiesTool(BaseTool):
    name: str = "search_properties"
    description: str = "Search for properties based on user requirements (Buy/Rent, Location, BHK, Max Price, Property ID)."

    def _run(self, action: Optional[str] = None, location: Optional[str] = None, bhk: Optional[int] = None, max_price: Optional[float] = None, property_id: Optional[str] = None) -> str:
        return search_properties(
            action=action,
            location=location,
            bhk=bhk,
            max_price=max_price,
            property_id=property_id
        )

search_properties_crew = SearchPropertiesTool()

# LLM Setup - Using 8B model for higher rate limits on free tier
# Ensure CrewAI sees the API key in the environment
groq_key = os.getenv("GROQ_API_KEY")

if groq_key:
    os.environ["GROQ_API_KEY"] = groq_key

# Explicitly use the Groq provider via LiteLLM prefix
llm = LLM(
    model="groq/llama-3.1-8b-instant",
    temperature=0
)

# CrewAI Agents
concierge_agent = Agent(
    role="Real Estate Concierge",
    goal="Help users find property.",
    backstory="""You are a helpful and conversational real estate concierge.
    Rules: 
    1. Be conversational and polite.
    2. Do NOT assume a location, budget, or other details unless explicitly stated by the user. If missing, ASK clarifying questions politely.
    3. Ask ONE question at a time.
    4. When you have enough info, use the search tool.
    5. NO property text/bullets. Output ONLY JSON for results when the search tool returns properties.
    6. Ignore stale city/action if the user changes the topic.""",
    verbose=False,
    allow_delegation=False,
    llm=llm,
    tools=[search_properties_crew],
    max_iter=2,
    max_rpm=10
)

def get_session_history(email: str) -> List[Dict]:
    """Retrieve chat history from MongoDB."""
    session = sessions_collection.find_one({"email": email})
    if session:
        return session.get("history", [])
    return []

def save_session_history(email: str, history: List[Dict]):
    """Save chat history to MongoDB."""
    sessions_collection.update_one(
        {"email": email},
        {"$set": {"history": history, "last_updated": datetime.utcnow()}},
        upsert=True
    )

def process_chat_message(email: str, message: str) -> str:
    """Processes a message using CrewAI agents and manages session history."""
    # history = get_session_history(email)
    
    # Minimal history for TPM savings
    # formatted_history = "\n".join([f"{m['role']}: {m['content'][:200]}" for m in history[-2:]])
    formatted_history = "No history provided."
    
    unified_task = Task(
        description=f"Msg: '{message}' | History: {formatted_history}\nRules: if 'MANDATORY_JSON_RESULTS' found, use ONLY JSON block. No descriptions.",
        expected_output="Text + JSON block.",
        agent=concierge_agent
    )
    
    crew = Crew(
        agents=[concierge_agent],
        tasks=[unified_task],
        process=Process.sequential
    )
    
    try:
        result = crew.kickoff()
    except Exception as e:
        print(f"CrewAI Kickoff Error: {e}")
        raise e
    
    # Update history
    # history.append({"role": "user", "content": message, "timestamp": datetime.utcnow()})
    # history.append({"role": "assistant", "content": str(result), "timestamp": datetime.utcnow()})
    # save_session_history(email, history)
    
    return str(result)

def parse_analysis(text: str) -> dict:
    """Parses the <analysis> tag from LLM response."""
    try:
        match = re.search(r"<analysis>(.*?)</analysis>", text, re.DOTALL)
        if match:
            data = json.loads(match.group(1))
            # Harden: Ensure it's a dict, not a list
            if isinstance(data, list) and len(data) > 0:
                data = data[0]
            if isinstance(data, dict):
                return data
    except Exception as e:
        print(f"Error parsing analysis: {e}")
    
    return {
        "category": "General",
        "urgency": "Low",
        "location": None,
        "budget": None,
        "bhk": None,
        "ids": [],
        "dates": []
    }

def extract_text(content: Any) -> str:
    return str(content)
