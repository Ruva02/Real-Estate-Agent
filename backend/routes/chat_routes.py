from flask import Blueprint, request, jsonify
from services.llm import (
    llm, 
    llm_with_tools, 
    search_properties, 
    chat_history, 
    extract_text, 
    parse_analysis
)
from services.user_service import log_inquiry
from langchain_core.messages import HumanMessage, ToolMessage
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
        
        # Single LLM call for response (now contains structured analysis)
        chat_history.append(HumanMessage(content=message))
        response = llm_with_tools.invoke(chat_history)
        
        raw_text = extract_text(response.content)
        analysis_data = parse_analysis(raw_text)
        
        # Log inquiry using parsed data
        log_inquiry(user_email, message, analysis_data)
        
        # Helper to clean response for the user
        def clean_output(text):
            import re
            return re.sub(r"<analysis>.*?</analysis>", "", text, flags=re.DOTALL).strip()

        if response.tool_calls:
            for tool_call in response.tool_calls:
                if tool_call["name"] == "search_properties":
                    args = tool_call["args"]
                    result = search_properties.invoke(args)
                    
                    chat_history.append(response)
                    chat_history.append(ToolMessage(content=result, tool_call_id=tool_call["id"]))
                    
                    final_response = llm.invoke(chat_history)
                    chat_history.append(final_response)
                    
                    final_text = extract_text(final_response.content)
                    return jsonify({"response": clean_output(final_text)})
        
        chat_history.append(response)
        return jsonify({"response": clean_output(raw_text)})
        
    except Exception as e:
        print(f"Error in chat: {e}")
        return jsonify({"error": str(e)}), 500
