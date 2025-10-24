import os
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.prompts import ChatPromptTemplate
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.memory import ConversationBufferWindowMemory
from langchain.chains import ConversationalRetrievalChain
from langchain_groq import ChatGroq
from dotenv import load_dotenv
from app.tutor_assistant.prompts.prompt import get_system_prompt_english
from langchain.chat_models import AzureChatOpenAI
import openai
from langchain.callbacks.manager import CallbackManager
from langchain.callbacks.base import BaseCallbackHandler


load_dotenv()

OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
OPENAI_API_TYPE = os.getenv("AZURE_OPENAI_API_TYPE")
OPENAI_API_BASE = os.getenv("AZURE_OPENAI_API_BASE")
OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")

# Set the OpenAI library configuration using the retrieved environment variables
openai.api_type = OPENAI_API_TYPE
openai.api_base = OPENAI_API_BASE
openai.api_version = OPENAI_API_VERSION
openai.api_key = OPENAI_API_KEY

groq_api_key=os.getenv('GROQ_API_KEY')
# ───────────────────────────────────────────────
# Tutor Assistant Classes
# ───────────────────────────────────────────────

class TutorAssistant:
    def __init__(self):
        pass

    def load_file(self):
        self.base_path = 'app/tutor_assistant/output/book'
        for path in os.listdir(self.base_path):
            if path not in ['.DS_Store']:
                for grade_path in os.listdir(os.path.join(self.base_path, path)):
                    if grade_path not in ['.DS_Store']:
                        for subject_path in os.listdir(os.path.join(self.base_path, path, grade_path)):
                            if subject_path.endswith('.md'):
                                with open(os.path.join(self.base_path, path, grade_path, subject_path), 'r') as file:
                                    markdown_data = file.read()
                                    chunk_data = ChunkData()
                                    embedding_data = chunk_data.chunk_markdown_data(markdown_data, subject_path)
                                    embeddings = EmbeddingDocuments()
                                    embeddings.embed_documents(embedding_data)


class ChunkData:
    def __init__(self):
        self.documents = []

    def chunk_markdown_data(self, markdown_data, metadata_key):
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", " ", ""],
        )

        chunks = text_splitter.split_text(markdown_data)

        subject_value = metadata_key.split('_')[1]
        grade_value = metadata_key.split('_')[2].split('.')[0]

    

        for i, chunk in enumerate(chunks):
            doc = Document(
                page_content=chunk,
                metadata={"source": f"chunk_{i}", "grade": grade_value, "subject": subject_value}
            )
            # print(doc)
            self.documents.append(doc)

        return self.documents


class EmbeddingDocuments:
    def embedding_model(self, embedding_model='sentence-transformers/all-MiniLM-L6-v2'):
        return HuggingFaceEmbeddings(model_name=embedding_model)

    def embed_documents(self, documents):
        db = Chroma.from_documents(
            documents=documents,
            embedding=self.embedding_model(),
            persist_directory="chroma_db/books"
        )
        db.persist()
        print("✅ Chroma DB created successfully!")



class TokenUsageHandler(BaseCallbackHandler):
    """Custom handler to record token usage."""
    def __init__(self):
        self.input_tokens = 0
        self.output_tokens = 0

    def on_llm_end(self, response, **kwargs):
        try:
            usage = response.llm_output.get("token_usage", {})
            self.input_tokens += usage.get("prompt_tokens", 0)
            self.output_tokens += usage.get("completion_tokens", 0)
        except Exception:
            pass

    # def get_total_cost(self, model: str):
    #     # ⚙️ Define cost per 1K tokens for known models (adjust as per actual Groq pricing)
    #     pricing = {
    #         "llama-3.1-8b-instant": {"input": 0.00005, "output": 0.00008},
    #         "qwen/qwen3-32b": {"input": 0.00006, "output": 0.00012},
    #         "openai/gpt-oss-20b": {"input": 0.00010, "output": 0.00020},
    #         "gpt-4o-mini": {"input": 0.00015, "output": 0.00060},
    #     }
    #     price = pricing.get(model, {"input": 0.0001, "output": 0.0001})
    #     return round(
    #         (self.input_tokens / 1000 * price["input"]) +
    #         (self.output_tokens / 1000 * price["output"]),
    #         6
    #     )
    def get_total_cost(self, model: str):
        pricing = {
            "llama-3.1-8b-instant": {"input": 0.00005, "output": 0.00008},
            "qwen/qwen3-32b": {"input": 0.00006, "output": 0.00012},
            "openai/gpt-oss-20b": {"input": 0.00010, "output": 0.00020},
            "azure/gpt-4o-mini": {"input": 0.00015, "output": 0.00060},
        }
        model_key = model.lower().strip()
        price = pricing.get(model_key, {"input": 0.0001, "output": 0.0001})
        return round(
            (self.input_tokens / 1000 * price["input"]) +
            (self.output_tokens / 1000 * price["output"]),
            6
        )


class RetrievalChain:
    def __init__(self, subject: str, prompt: bool, model: str, custom_prompt: str = None):
        self.embeddings = EmbeddingDocuments().embedding_model(
            embedding_model='sentence-transformers/all-MiniLM-L6-v2'
        )

        if subject == "maths":
            self.system_prompt = custom_prompt
        else:
            self.system_prompt = get_system_prompt_english()

        # Attach token handler
        self.token_handler = TokenUsageHandler()
        self.callback_manager = CallbackManager([self.token_handler])

        # Choose model
        if model in ["llama-3.1-8b-instant", "qwen/qwen3-32b", "openai/gpt-oss-20b"]:
            self.llm = ChatGroq(
                api_key=groq_api_key,
                model=model,
                verbose=True,
                callback_manager=self.callback_manager
            )
        else:
            self.llm = AzureChatOpenAI(
                openai_api_version=OPENAI_API_VERSION,
                openai_api_key=OPENAI_API_KEY,
                openai_api_base=OPENAI_API_BASE,
                openai_api_type=OPENAI_API_TYPE,
                deployment_name="gpt-4o-mini",
                temperature=0,
                verbose=True,
                callback_manager=self.callback_manager
            )

        print("Chosen model:", model)

        # Memory
        self.memory = ConversationBufferWindowMemory(
            memory_key="chat_history",
            k=3,
            return_messages=True
        )

        self.retriever = None
        self.subject = subject
        self.model = model

    def get_documents(self):
        vectorstore = Chroma(
            persist_directory="chroma_db/books",
            embedding_function=self.embeddings,
        )
        self.retriever = vectorstore.as_retriever(
            search_kwargs={
                "k": 3,
                "filter": {
                    "$and": [
                        {"grade": "7"},
                        {"subject": self.subject}
                    ]
                }
            }
        )
        return self.retriever

    def build_conversational_chain(self):
        if not self.retriever:
            raise ValueError("Call get_documents() first.")

        prompt = ChatPromptTemplate.from_messages([
            ("system", self.system_prompt),
            ("human", "CHAT HISTORY:\n{chat_history}\nHuman:\n{question}")
        ])

        retrieval_chain = ConversationalRetrievalChain.from_llm(
            llm=self.llm,
            retriever=self.retriever,
            memory=self.memory,
            return_source_documents=False,
            verbose=True,
            combine_docs_chain_kwargs={"prompt": prompt},
            rephrase_question=False,
        )

        return retrieval_chain

    async def chat(self, user_input: str):
        if not self.retriever:
            self.get_documents()

        chain = self.build_conversational_chain()
        response = await chain.ainvoke({
            "question": user_input,
            "chat_history": self.memory.chat_memory.messages
        })
        
        print("input_tokens", self.token_handler.input_tokens)
        print("output_tokens", self.token_handler.output_tokens)
        print("Total Cost:", self.token_handler.get_total_cost(self.model))

        result = {
            "answer": response["answer"],
            "input_tokens": self.token_handler.input_tokens,
            "output_tokens": self.token_handler.output_tokens,
            "total_cost": self.token_handler.get_total_cost(self.model)
        }

        return result

