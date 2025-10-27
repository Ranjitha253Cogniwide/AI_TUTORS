# controller.py
from fastapi import APIRouter, FastAPI
from pydantic import BaseModel
from typing import Dict
from app.assessment_assistant.model import RetrivalChain
import json, re

app = FastAPI()

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
    subject = request.subject.strip().lower()
    grade = request.grade.strip()

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


@assessment_router.get("/get-initial-response/{subject}")
async def get_initial_response(subject: str, grade: str = "7"):
    """
    Returns an initial greeting with topics pulled from RetrivalChain.
    """
    subject = subject.lower()
    chain = RetrivalChain(subject=subject, grade=grade)

    # Assign topics and teacher dynamically
    if subject == "english":
        topic_text = "Grammar, Vocabulary, The Day the River Spoke"
        teacher = "Ms. Priya"
    elif subject == "maths":
        topic_text = "Arithmetic Expressions, Working with Fractions, Simple Equations"
        teacher = "Mr. Ravi"
    else:
        topic_text = "General topics"
        teacher = "Unknown"

    return {
        "response": f"<strong>Today's {subject.title()} Class</strong> — Topics: {topic_text}. Ready for the assessment?",
        "teacher": teacher,
        "topics": [t.strip() for t in topic_text.split(",")]
    }


# @assessment_router.post("/chat")
# async def chat_with_assistant(subject: str, question: str, grade: str = "7"):
#     """
#     Uses RetrivalChain from model.py to get AI-generated responses based on subject.
#     """
#     chain = RetrivalChain(subject=subject, grade=grade)
#     response = await chain.chat(question)

#     return {
#         "subject": subject,
#         "response": str(response)
#     }


app.include_router(assessment_router)



# from fastapi import APIRouter,FastAPI
# from pydantic import BaseModel
# from typing import Dict
# from app.assessment_assistant.model import RetrivalChain
# import json, re

# app = FastAPI()
 
# # Create router
# assessment_router = APIRouter(
#     prefix="/assessment",
#     tags=["assessment"]
# )
 
# # Request model
# class QueryRequest(BaseModel):
#     session_id: str
#     question: str
#     subject: str
#     grade: str = "7"  # default grade if not provided
 
# # Session memory map
# assessment_sessions: Dict[str, RetrivalChain] = {}
 
# @assessment_router.post("/query")
# async def ask_question(request: QueryRequest):
#     session_id = request.session_id.strip()
#     question = request.question.strip()
#     subject = request.subject
#     grade = request.grade
 
#     if not question:
#         return {
#             "response": "Please ask a valid question.",
#             "images": [],
#             "has_images": False,
#             "type": "invalid",
#         }
 
#     # Clear session memory if requested
#     if question.lower() == "clear":
#         if session_id in assessment_sessions:
#             del assessment_sessions[session_id]
#         return {
#             "response": "✅ Memory cleared for this session.",
#             "images": [],
#             "has_images": False,
#             "type": "cleared",
#         }
 
#     # Get or create retrieval chain for this session
#     if session_id not in assessment_sessions:
#         retriever = RetrivalChain(subject=subject, grade=grade)
#         retriever.get_documents()  # initialize retriever directly
#         assessment_sessions[session_id] = retriever
#     else:
#         retriever = assessment_sessions[session_id]
 
#     # Ask the question using the chain
#     result = await retriever.chat(question)
#     answer_text = result.strip() if isinstance(result, str) else str(result)
#     images_raw = []
#     response_type = "answer"
 
#     # Parse structured JSON response if provided
#     try:
#         parsed = json.loads(answer_text)
#         if isinstance(parsed, dict):
#             answer_text = parsed.get("answer", "").strip()
#             images_raw = parsed.get("images", [])
#             response_type = parsed.get("type", "answer")
#     except json.JSONDecodeError:
#         pass
 
#     # Extract image filenames
#     cleaned_images = []
#     for image in images_raw:
#         if isinstance(image, dict) and "url" in image:
#             url_str = image["url"]
#         else:
#             url_str = str(image)
#         match = re.search(r'/([^/]+\.(?:jpg|jpeg|png|gif))$', url_str, re.IGNORECASE)
#         if match:
#             cleaned_images.append(match.group(1))
 
#     return {
#         "response": answer_text,
#         "images": cleaned_images,
#         "has_images": len(cleaned_images) > 0,
#         "type": response_type,
#     }
# @assessment_router.get("/get-initial-response/{subject}")
# async def get_initial_response(subject: str, grade: str = "7"):
#     """
#     Returns an initial greeting with topics pulled from RetrivalChain.
#     """
#     chain = RetrivalChain(subject=subject, grade=grade)

#     # Get topics based on subject
#     if subject.lower() == "english":
#         topics = getattr(chain, "system_prompt", None)  # or define a method to get topics
#         topic_text = "Grammar, Vocabulary, the day the river spoke"
#         teacher = "Ms. Priya"
#     elif subject.lower() == "maths":
#         topic_text = "ARITHMETIC EXPRESSIONS, WORKING WITH FRACTIONS"
#         teacher = "Mr. Ravi"
#     else:
#         topic_text = "General topics"
#         teacher = "Unknown"

#     return {
#         "response": f"<strong>Today's {subject.title()} Class</strong> — Topics: {topic_text}. Ready for the assessment?",
#         "teacher": teacher,
#         "topics": topic_text.split(", ")
#     }

# @assessment_router.post("/chat")
# async def chat_with_assistant(subject: str, question: str, grade: str = "7"):
#     """
#     Uses RetrivalChain from model.py to get AI-generated responses based on subject.
#     """
#     chain = RetrivalChain(subject=subject, grade=grade)
#     response = await chain.chat(question)

#     return {
#         "subject": subject,
#         "response": str(response)
#     }


# app.include_router(assessment_router)

#for the assessment initial response (at now the api call is not used in frontend)
# @assessment_router.get("/get-initial-response/{subject}")
# async def get_initial_response(subject: str):
#     if subject == "maths":
#         return {
#             "response": "<strong>Today These are the Topic's you learned is there any confusions are restudy the topic or we will continue with the Assessment,All the Best!</strong>",
#             "data":[   
#             {"title":"Large Numbers and their properties (Exact and Approximate Values)"},
#             {"title":"Arithmetic Expressions and Algebra using Letter Numbers (Simplification, Formulas, Patterns)"},
#             {"title":"Decimal Numbers (Place Value, Notation, Units of Measurement, Operations)"},
#             {"title":"Advanced Operations with Fractions (Multiplication, Division, Area connection)"},
#             {"title":"Geometry: Properties of Parallel and Intersecting Lines (Transversals, Angles)"},
#             {"title":"Geometry: Construction and Properties of Triangles (Angle Sum, Exterior Angles, Altitudes)"},
#             {"title":"Number Play (Sequences like Virahānka Fibonacci Numbers, Magic Squares)"}
#          ]
#         }
#     if subject == "english":
#         return {
#             "response": "<strong>Today These are the Topic's you learned is there any confusions are restudy the topic or we will continue with the Assessment,All the Best!</strong>",
#             "data":[
#   {
#     "Unit_No": "1",
#     "Unit_Name": "Learning Together",
#     "Lesson_Name": "The Day the River Spoke",
#     "Grammar_Topics": [
#       "Sentence Completion",
#       "Onomatopoeia",
#       "Fill in the blanks",
#       "Preposition"
#     ]
#   },
#   {
#     "Unit_No": "1",
#     "Unit_Name": "Learning Together",
#     "Lesson_Name": "Try Again",
#     "Grammar_Topics": [
#       "Phrases",
#       "Metaphor and Simile"
#     ]
#   },
#   {
#     "Unit_No": "1",
#     "Unit_Name": "Learning Together",
#     "Lesson_Name": "Three Days to See",
#     "Grammar_Topics": [
#       "Modal Verbs",
#       "Descriptive Paragraph"
#     ]
#   },
#   {
#     "Unit_No": "2",
#     "Unit_Name": "Wit and Humour",
#     "Lesson_Name": "Animals, Birds, and Dr. Dolittle",
#     "Grammar_Topics": [
#       "Compound Words",
#       "Palindrome",
#       "Verbs (Present Perfect Tense)",
#       "Notice Writing"
#     ]
#   },
#   {
#     "Unit_No": "2",
#     "Unit_Name": "Wit and Humour",
#     "Lesson_Name": "A Funny Man",
#     "Grammar_Topics": [
#       "Phrasal Verbs",
#       "Adverbs and Prepositions"
#     ]
#   },
#   {
#     "Unit_No": "2",
#     "Unit_Name": "Wit and Humour",
#     "Lesson_Name": "Say the Right Thing",
#     "Grammar_Topics": [
#       "Suffix",
#       "Verb Forms",
#       "Tense (Present Continuous/Present Perfect Continuous)",
#       "Kinds of Sentences"
#     ]
#   },
#   {
#     "Unit_No": "3",
#     "Unit_Name": "Dreams & Discoveries",
#     "Lesson_Name": "My Brother's Great Invention",
#     "Grammar_Topics": [
#       "Onomatopoeia",
#       "Binomials (Conjunction)",
#       "Phrasal Verb",
#       "Idioms",
#       "Verbs (Simple Past & Past Perfect)"
#     ]
#   },
#   {
#     "Unit_No": "3",
#     "Unit_Name": "Dreams & Discoveries",
#     "Lesson_Name": "Paper Boats",
#     "Grammar_Topics": [
#       "Opposites (Antonyms)",
#       "Diary Entry"
#     ]
#   },
#   {
#     "Unit_No": "3",
#     "Unit_Name": "Dreams & Discoveries",
#     "Lesson_Name": "North, South, East, West",
#     "Grammar_Topics": [
#       "Associate Words with Meanings",
#       "Subject-Verb Agreement",
#       "Letter (Leave Application)"
#     ]
#   },
#   {
#     "Unit_No": "4",
#     "Unit_Name": "Travel and Adventure",
#     "Lesson_Name": "The Tunnel",
#     "Grammar_Topics": [
#       "Phrases",
#       "Onomatopoeia",
#       "Punctuation",
#       "Descriptive Paragraph Writing"
#     ]
#   },
#   {
#     "Unit_No": "4",
#     "Unit_Name": "Travel and Adventure",
#     "Lesson_Name": "Travel",
#     "Grammar_Topics": [
#       "Onomatopoeia"
#     ]
#   },
#   {
#     "Unit_No": "4",
#     "Unit_Name": "Travel and Adventure",
#     "Lesson_Name": "Conquering the Summit",
#     "Grammar_Topics": [
#       "Phrases",
#       "Correct Parts of Speech",
#       "Article",
#       "Formal Letter"
#     ]
#   },
#   {
#     "Unit_No": "5",
#     "Unit_Name": "Bravehearts",
#     "Lesson_Name": "A Homage to Our Brave Soldiers",
#     "Grammar_Topics": [
#       "Prefix and Root Words",
#       "Main Clause",
#       "Subordinate Clause",
#       "Subordinating Conjunctions",
#       "Collocations"
#     ]
#   },
#   {
#     "Unit_No": "5",
#     "Unit_Name": "Bravehearts",
#     "Lesson_Name": "My Dear Soldiers",
#     "Grammar_Topics": [
#       "Fill in the blanks (Spelling)",
#       "Speech (Direct & Indirect Speech)"
#     ]
#   }
# ]
#         }
    


