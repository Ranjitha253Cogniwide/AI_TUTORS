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
    model="groq/compound",
    api_key="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", 
)

 
system_prompt = (
    """
You are a helpful AI tutor. Use ONLY the provided Context to answer the user's question.
 
RULES (must be followed exactly):
1) Explain the solution more detailed step by setp it should be clear.
2) Convert any equations in the Context to human-readable math (plain text).
3) If the Context contains images in Markdown (e.g. ![](images/abc.jpg)), extract those URLs and include them in the "images" array.
4) Do NOT reference or suggest external resources.
5) If you don't know the answer, set "response" to exactly: I don't know
6) OUTPUT REQUIREMENT (critical): Return ONLY valid JSON (no surrounding text, no Markdown fences, no explanations) with exactly these two keys:
 
   "{{\n"
    "  'answer': '<Only use for LLM text Response>',\n"
    "  'images': [{{"url": "<image_url>"}}]
    "}}\n"
 
   - "response" must be plain text (not JSON or escaped JSON).
   - Use double quotes for JSON keys and string values.
   - If no images are present, "images" must be an empty array: [].
7) If user with greetings responsed with a greeting, you should return a greeting message and no answer.
Context: {context}
"""
)


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
session_store: Dict[str, List[Dict[str, str]]] = {}
 
# -----------------------------
# POST endpoint
@app.post("/ask")
async def ask_question(request: QueryRequest):
    session_id = request.session_id
    question = request.question.strip()
    if not question:
        return {"response": "Please ask a valid question.", "images": []}
    # Retrieve session history (not used in this example, but saved)
    history = session_store.get(session_id, [])
 
    # Invoke LLM via RAG
    result = chain.invoke({"input": question})  # ✅ FIXED: input key must be "query"
    print(f"LLM response: {result}")
    # Try parsing JSON from LLM output
    try:
        parsed = json.loads(result['answer'])
        answer_text = parsed.get("answer", "")
        images = parsed.get("images", [])
    except json.JSONDecodeError:
        # fallback if LLM doesn't respond in JSON
        answer_text = result['result']
        images = []
 
    # Add images from source docs if available and not already included
    for doc in result.get("source_documents", []):
        if "image_url" in doc.metadata:
            url = doc.metadata["image_url"]
            if url not in [img.get("url") for img in images]:
                images.append({"url": url})
 
    # Store history
    history.append({"question": question, "answer": answer_text})
    session_store[session_id] = history
 
    return {
        "response": answer_text,
        "images": images,
        "has_images": len(images) > 0
    }
 
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)