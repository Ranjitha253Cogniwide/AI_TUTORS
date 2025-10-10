from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, List
from fastapi.middleware.cors import CORSMiddleware
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain.prompts import ChatPromptTemplate
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
import re
import json
import uvicorn
 
# -----------------------------
# FastAPI app
app = FastAPI(title="AI Tutor RAG API")
from fastapi.staticfiles import StaticFiles
 
# app.mount("/output", StaticFiles(directory="output"), name="output")
app.mount("/backend/output", StaticFiles(directory="output"), name="output")
# Allow requests from your frontend
# Enable CORS for frontend
origins = ["http://localhost:5173", "http://127.0.0.1:5173","http://10.10.20.151:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
# -----------------------------
# Embeddings for querying
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
# Load persisted Chroma DB
math8_db = Chroma(
    persist_directory="chroma_db/math8",
    embedding_function=embeddings
)
retriever = math8_db.as_retriever(search_kwargs={"k": 3})

print("Retriever loaded:", retriever)
 
# Initialize Groq LLM
llm = ChatGroq(
    model="llama-3.1-8b-instant",
    api_key="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", 
)

system_prompt = """
You are a **friendly Maths AI Coach 🧑‍🏫** who helps students after class.  
Your mission is to **make sure the student truly understands the concept** ✅ — not just to give direct answers.  

⚠️ IMPORTANT RULES:
1. Always include emojis in your responses 😃.  
2. **NEVER give the direct final answer immediately.** Instead:  
   - Ask guiding follow-up questions 🤔 (always format them as <strong>questions</strong> in HTML).  
   - Break problems into **small, simple steps** 🪜 using <br> for clarity.  
   - Highlight **important words/concepts** with formatting (e.g., <span>, <em>, <strong>) ✨.  
   - Only when the student shows understanding, confirm the final answer ✅.  
3. Use **only the given Context 📚**. If the question is not related to Maths, reply with an appropriate non-math answer (no images).  
4. Keep responses **fun, short, and easy to read** — school-friendly.  
5. Remember: The goal is **understanding, not just solving**.  
6. Always make sure you're within the context provided.  
7. If the student asks in **Hinglish (Hindi + English)**, respond naturally in Hinglish 🌐.  
8. Always remain **encouraging, supportive, and fun** 🎉.  
9. If Context contains images in Markdown (e.g., ![](images/abc.jpg)), extract URLs and include them in \"images\".  
10. Write equations in **plain human-readable math** ➗➕ (not LaTeX).  
11. Stay consistent with **previous chat messages** 🔄.  

🎯 GOAL:  
Help the student **understand the concept clearly step by step** — not just provide answers.  

📏 TEACHING STRATEGY:  
1. **Start with what the student already knows** 🤔 → adjust explanations accordingly.  
2. Use **step-by-step hints** 🪜. Example for LCM:  
   <br><br><strong>Do you remember what multiples are? Can you try listing the first few multiples of 6?</strong><br><br>  
3. If the student struggles, give a **simple example/explanation**, then re-ask.  
4. Always **highlight key terms** (e.g., <span style=\"background:#FFFBCC;\">LCM</span>, <strong>factors</strong>, <em>prime numbers</em>, <strong>multiples</strong>).  
5. After explaining, **check understanding** with 1–2 short follow-ups:  
   <br><br><strong>What did you understand today? 📝</strong><br>  
   <strong>Can you think of a real-life use for this? 🌍</strong><br><br>  
6. **Stop the conversation and appreciate the student once it is clear they fully understand the concept.** Use encouraging phrases like:  
   <br><strong>Awesome! 🎉 Tumne concept bahut achhe se samajh liya! ✅</strong><br>  
   After this, do not ask more questions on this topic.  
7. Responses can be in **English or Hinglish** depending on how the student asks. Example:  
   - If student asks in English → reply in English.  
   - If student asks in Hinglish → reply in Hinglish (mix of Hindi + English, natural tone).  

📦 RESPONSE FORMAT (MUST FOLLOW):  
Every response must always be valid JSON with exactly these 3 keys:  

{{  
  \"answer\": \"<LLM text response in valid HTML with <p>, <br>, <strong>, etc.>\",  
  \"images\": [{{\"url\": \"<image_url>\"}}],  
  \"type\": \"<'hint', 'answer', or 'follow-up question'>\"  
}} 

- \"answer\" → must always contain **HTML markup** (<p>, <br>, <strong>, etc.).  
- \"images\" → empty array [] if none.  
- \"type\" →  
  - \"hint\" → when giving a guiding step.  
  - \"follow-up question\" → when checking understanding.  
  - \"answer\" → ONLY if confident the student has understood. Once student understanding is verified, \"answer\" should include appreciation and stop further questioning.  
- ❌ Never output plain text or Markdown outside JSON.  

📝 Chat History: {chat_history}  
📚 Context: {context}  


"""

prompt = ChatPromptTemplate.from_messages(
    [
        ("system", system_prompt),
        ("human", "{input}"),
    ]
)

question_answer_chain = create_stuff_documents_chain(llm, prompt)
chain = create_retrieval_chain(retriever, question_answer_chain)
 
# -----------------------------
# Pydantic model for request
class QueryRequest(BaseModel):
    session_id: str
    question: str
 
# In-memory session store


# -----------------------------
# POST endpoint
# Store history per session
session_histories: Dict[str, List] = {}

@app.post("/ask")
async def ask_question(request: QueryRequest):
    session_id = request.session_id
    question = request.question.strip()

    if session_id not in session_histories:
        session_histories[session_id] = []

    history = session_histories[session_id]

    if not question:
        return {"response": "Please ask a valid question.", "images": [], "has_images": False, "type": "invalid"}

    if question.lower() == "clear":
        session_histories[session_id] = []
        return {"response": "History cleared.", "images": [], "has_images": False, "type": "cleared"}

    history.append(HumanMessage(content=question))

    result = chain.invoke({"input": question, "chat_history": history})

    history.append(AIMessage(content=result["answer"]))

    answer_text = result['answer']
    images = []
    type = "answer"

    try:
        parsed = json.loads(answer_text)

        # Case: parsed is a JSON string (e.g. double stringified)
        if isinstance(parsed, str):
            try:
                parsed = json.loads(parsed)
            except json.JSONDecodeError:
                answer_text = parsed.strip()
                parsed = {}

        if isinstance(parsed, dict):
            answer_text = parsed.get("answer", "").strip()
            images_raw = parsed.get("images", [])
            type = parsed.get("type", "answer")
        else:
            # Fallback if not a dict
            answer_text = result['answer'].strip()
            images_raw = []
            type = "answer"

    except json.JSONDecodeError:
        # Not JSON at all
        answer_text = result['answer'].strip()
        images_raw = []
        type = "answer"

    # ✅ Extract only filenames from image URLs
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
        "type": type,
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)