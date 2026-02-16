from fastapi import APIRouter, HTTPException
from langchain_core.messages import HumanMessage, ToolMessage
from backend.schemas import ChatRequest, ChatResponse
from backend.services.llm import llm, llm_with_tools, search_properties, chat_history, extract_text

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    # Note: Using the global chat_history from services.llm
    # In a real app, you'd fetch history based on user session/ID
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
