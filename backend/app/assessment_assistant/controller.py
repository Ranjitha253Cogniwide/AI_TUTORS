from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict
from app.assessment_assistant.model import RetrivalChain
import json, re
 
# Create router
assessment_router = APIRouter(
    prefix="/assessment",
    tags=["assessment"]
)
 
# Request model
class QueryRequest(BaseModel):
    session_id: str
    question: str
    subject: str
    grade: str = "7"  # default grade if not provided
 
# Session memory map
assessment_sessions: Dict[str, RetrivalChain] = {}
 
@assessment_router.post("/query")
async def ask_question(request: QueryRequest):
    session_id = request.session_id.strip()
    question = request.question.strip()
    subject = request.subject
    grade = request.grade
 
    if not question:
        return {
            "response": "Please ask a valid question.",
            "images": [],
            "has_images": False,
            "type": "invalid",
        }
 
    # Clear session memory if requested
    if question.lower() == "clear":
        if session_id in assessment_sessions:
            del assessment_sessions[session_id]
        return {
            "response": "✅ Memory cleared for this session.",
            "images": [],
            "has_images": False,
            "type": "cleared",
        }
 
    # Get or create retrieval chain for this session
    if session_id not in assessment_sessions:
        retriever = RetrivalChain(subject=subject, grade=grade)
        retriever.get_documents()  # initialize retriever directly
        assessment_sessions[session_id] = retriever
    else:
        retriever = assessment_sessions[session_id]
 
    # Ask the question using the chain
    result = await retriever.chat(question)
    answer_text = result.strip() if isinstance(result, str) else str(result)
    images_raw = []
    response_type = "answer"
 
    # Parse structured JSON response if provided
    try:
        parsed = json.loads(answer_text)
        if isinstance(parsed, dict):
            answer_text = parsed.get("answer", "").strip()
            images_raw = parsed.get("images", [])
            response_type = parsed.get("type", "answer")
    except json.JSONDecodeError:
        pass
 
    # Extract image filenames
    cleaned_images = []
    for image in images_raw:
        if isinstance(image, dict) and "url" in image:
            url_str = image["url"]
        else:
            url_str = str(image)
        match = re.search(r'/([^/]+\.(?:jpg|jpeg|png|gif))$', url_str, re.IGNORECASE)
        if match:
            cleaned_images.append(match.group(1))
 
    return {
        "response": answer_text,
        "images": cleaned_images,
        "has_images": len(cleaned_images) > 0,
        "type": response_type,
    }