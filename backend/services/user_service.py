from services.db import get_db
from datetime import datetime
from models.property_model import create_property

def parse_budget(budget_str):
    """Converts budget strings like '2cr', '50L', '80k' to numbers."""
    if not budget_str or budget_str == "null" or budget_str == "None":
        return 0
    
    try:
        # Handle cases where it's already a number
        if isinstance(budget_str, (int, float)):
            return float(budget_str)
            
        s = str(budget_str).lower().strip()
        # Remove common currency symbols and extra characters
        s = s.replace('₹', '').replace('rs', '').replace('$', '').replace(',', '').strip()
        
        multiplier = 1
        if 'cr' in s:
            multiplier = 10000000
            s = s.replace('cr', '').strip()
        elif 'l' in s:
            multiplier = 100000
            s = s.replace('l', '').replace('akh', '').strip()
        elif 'k' in s:
            multiplier = 1000
            s = s.replace('k', '').strip()
            
        return float(s) * multiplier
    except:
        return 0

def log_inquiry(email, message, analysis_data):
    """Logs a user inquiry to specific collections based on intent."""
    db = get_db()
    
    category = analysis_data.get("category", "General")
    
    # Selection of collection based on category
    collection_mapping = {
        "Buy": db.buy_users,
        "Rent": db.rent_user,
        "Sell": db.sell_user
    }
    
    collection = collection_mapping.get(category, db.inquiry_logs)
    
    # NEW: Robust budget parsing
    raw_budget = analysis_data.get("budget")
    parsed_budget = parse_budget(raw_budget)
    
    inquiry = {
        "email": email,
        "message": message,
        "category": category,
        "location": analysis_data.get("location"),
        "budget": parsed_budget,
        "bhk": analysis_data.get("bhk"),
        "timestamp": datetime.utcnow()
    }
    
    result = collection.insert_one(inquiry)
    print(f"Logged inquiry to {collection.name} for {email}")

    # NEW: If it's a "Sell" inquiry, automatically list it as a property for buyers
    if category == "Sell":
        try:
            bhk = analysis_data.get("bhk") or 0
            location = analysis_data.get("location")
            
            # Simple fallback if location missing in structured analysis but might be in message
            if not location or location == "null" or location == "None":
                location = "Unknown City"
            
            property_data = {
                "title": f"{bhk}BHK for Sale in {location}",
                "price": parsed_budget,
                "city": location,
                "bedrooms": int(bhk),
                "listed_by": email,
                "action": "Buy" # List as 'Buy' so it shows up for buyers
            }
            create_property(property_data)
            print(f"Automatically created property listing for {email} in {location}")
        except Exception as e:
            print(f"Error creating automatic property listing: {e}")

    return str(result.inserted_id)
