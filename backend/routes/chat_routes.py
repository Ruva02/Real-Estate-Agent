from flask import Blueprint, request, jsonify
from services.llm import (
    process_chat_message,
    parse_analysis
)
from services.user_service import log_inquiry
from utils.auth_middleware import token_required

chat_bp = Blueprint("chat", __name__)

@chat_bp.route("/chat", methods=["POST"])
@token_required
def chat():
    data = request.json
    message = data.get("message")
    
    if not message:
        return jsonify({"error": "Message required"}), 400

    try:
        user_email = request.user.get("email", "unknown")
        
        # New Process using CrewAI
        response_text = process_chat_message(user_email, message)
        
        analysis_data = parse_analysis(response_text)
        
        # Extract properties before cleaning the text
        import json
        import re
        properties = []
        
        # Robust extraction: find the first block that looks like a JSON array
        import json
        
        def extract_json_array(text):
            # Find all potential arrays [...]
            potential_arrays = re.findall(r"(\[[\s\S]*?\])", text)
            for pot in potential_arrays:
                try:
                    data = json.loads(pot)
                    if isinstance(data, list):
                        return data
                except:
                    continue
            return []

        properties = extract_json_array(response_text)
        
        # Fallback for the "results" object format if used
        if not properties:
            results_match = re.search(r"\{\s*\"results\"\s*:\s*(\[[\s\S]*?\])\s*\}", response_text)
            if results_match:
                try:
                    properties = json.loads(results_match.group(1))
                except:
                    pass

        # Log inquiry using parsed data
        log_inquiry(user_email, message, analysis_data)
        
        # Helper to clean response for the user
        def clean_output(text):
            if not text: return ""
            # 1. Strip everything from <analysis> onwards
            idx = text.find("<analysis>")
            if idx != -1:
                text = text[:idx]
            
            # 2. Aggressively remove anything that looks like JSON or tool headers
            text = re.sub(r"MANDATORY_JSON_RESULTS:.*", "", text)
            text = re.sub(r"```json[\s\S]*?```", "", text)
            text = re.sub(r"\[\s*\{\s*\"[\s\S]*?\}\s*\]", "", text) # Remove raw arrays
            
            return text.strip()

        final_text = clean_output(response_text)
        
        return jsonify({
            "response": final_text or "I've found some options for you.",
            "properties": properties
        })
        
    except Exception as e:
        err_str = str(e).lower()
        if "rate_limit" in err_str or "limit reached" in err_str or "429" in err_str:
            return jsonify({
                "response": "Great things take time! I've briefly reached my limit. Please try again in 30 seconds.",
                "properties": []
            })
        print(f"Error in chat: {e}")
        return jsonify({"error": str(e)}), 500
