import os
import logging
import langchain

from typing import List
 
from dotenv import load_dotenv
from langchain.schema import Document
from langchain.prompts import ChatPromptTemplate
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.memory import ConversationSummaryMemory
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_community.chat_models import AzureChatOpenAI
 
from app.assessment_assistant.prompts.prompts import mat_system_prompt, eng_system_prompt

logging.basicConfig(level=logging.DEBUG)
langchain.debug = True

load_dotenv()
 
OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
OPENAI_API_TYPE = os.getenv("AZURE_OPENAI_API_TYPE")
OPENAI_API_BASE = os.getenv("AZURE_OPENAI_API_BASE")
OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")
 
 
class RetrivalChain:
    """
    Retrieval chain for assessment assistant.
    Uses pre-built Chroma DB and directly queries user input.
    """
    def __init__(self, subject: str, grade: str = "7", persist_directory: str = "chroma_db/books"):
        self.subject = subject
        self.grade = grade
        self.persist_directory = persist_directory
 
        # Embedding model (must match the one used to build Chroma DB)
        self.embeddings = HuggingFaceEmbeddings(model_name='sentence-transformers/all-MiniLM-L6-v2')
 
        # System prompt selection
        if subject == "maths":
            self.system_prompt = mat_system_prompt()
        elif subject == "english":
            self.system_prompt = eng_system_prompt()
        else:
            self.system_prompt = f"Assistant for grade {grade} {subject} topics."
 
        # Azure LLM
        self.llm = AzureChatOpenAI(
            openai_api_version=OPENAI_API_VERSION,
            openai_api_key=OPENAI_API_KEY,
            openai_api_base=OPENAI_API_BASE,
            openai_api_type=OPENAI_API_TYPE,
            deployment_name="gpt-4o-mini",
            temperature=0,
            verbose=True,
        )
 
        # Conversation Summary Memory - now properly configured
        self.memory = ConversationSummaryMemory(
            llm=self.llm,
            memory_key="chat_history",
            return_messages=False,  # Changed to False to get summary as string
            input_key="input",
            output_key="answer"
        )
       
        self.retriever = None
 
        # ensure image folder exists
        os.makedirs("app/assessment_assistant/output/images", exist_ok=True)
 
    def get_documents(self) -> Chroma:
        """
        Initialize a retriever from an existing Chroma DB.
        Raises error if no documents found.
        """
        if not os.path.exists(self.persist_directory):
            raise FileNotFoundError(f"Chroma DB directory not found: {self.persist_directory}")
 
        vectorstore = Chroma(persist_directory=self.persist_directory, embedding_function=self.embeddings)
 
        filter_dict = {"$and": [{"grade": self.grade}, {"subject": self.subject}]}
 
        retriever = vectorstore.as_retriever(search_kwargs={"k": 3, "filter": filter_dict})
        self.retriever = retriever
        return retriever
 
    def build_conversational_chain(self):
        if not self.retriever:
            raise ValueError("Call get_documents() first to initialize the retriever.")
 
        prompt = ChatPromptTemplate.from_messages([
            ("system", self.system_prompt),
            ("human", "Conversation Summary:\n{chat_history}\n\nUser question:\n{input}")
        ])
 
        combine_docs_chain = create_stuff_documents_chain(llm=self.llm, prompt=prompt)
        retrieval_chain = create_retrieval_chain(retriever=self.retriever, combine_docs_chain=combine_docs_chain)
        return retrieval_chain
 
    async def chat(self, user_input: str):
        if not self.retriever:
            self.get_documents()  # directly initialize retriever
 
        chain = self.build_conversational_chain()
 
        # Get the summarized conversation history instead of full chat history
        memory_variables = self.memory.load_memory_variables({})
        conversation_summary = memory_variables.get("chat_history", "")
 
        invoke_vars = {
            "input": user_input,
            "chat_history": conversation_summary,  # Now using summary instead of full history
        }
 
        if self.subject == "english":
            invoke_vars["eng_topic"] = "Grammar, Vocabulary, the day the river spoke"
        elif self.subject == "maths":
            invoke_vars["math_topic"] = "Algebra, Geometry"
 
        response = await chain.ainvoke(invoke_vars)
 
        answer_text = response
        if isinstance(response, dict) and "answer" in response:
            answer_text = response["answer"]
 
        # Save to memory - the summary is automatically updated
        self.memory.save_context(
            {"input": user_input}, 
            {"answer": str(answer_text)}
        )
 
        return answer_text