import os
import random
from langchain_chroma import Chroma
from langchain_openai import ChatOpenAI
from langchain_ollama import OllamaEmbeddings
from models import Options, MCQ, SYSTEM_PROMPT
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

load_dotenv()

PERSIST_DIR = "../vectorstore" 
COLLECTION_NAME = "aws_dva_c02_notes"
OLLAMA_BASE_URL = "http://localhost:11434"
EMBEDDING_MODEL = "nomic-embed-text:latest"
OPENAI_MODEL = "gpt-4o-mini"

class QuizGenerator:
    def __init__(self):
        
        # Initialise embeddings
        self.embeddings = OllamaEmbeddings( model=EMBEDDING_MODEL,base_url=OLLAMA_BASE_URL )
        
        # Initialise vector store
        try:
            self.vectorstore = Chroma( persist_directory=PERSIST_DIR,collection_name=COLLECTION_NAME,embedding_function=self.embeddings )
        except Exception as e:
            print(f"Error loading vector store: {e}")
            raise
        
        # Initialize LLM with a structured output following the custom MCQ pydantic model
        self.llm = ChatOpenAI( model=OPENAI_MODEL,temperature=0.7,api_key=os.getenv("OPENAI_API_KEY")).with_structured_output(MCQ)
        
        # Prompt template
        self.prompt_template = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_PROMPT),
            ("user", "Generate a DVA-C02 exam-style question based on these notes:\n\n{chunk_text}")
        ])
    
    async def generate_question(self) -> MCQ:
        """Generate a single question from a random chunk, using various search queries to get more diverse questions"""

        search_queries = [
            "AWS Lambda functions",
            "DynamoDB database",
            "S3 storage",
            "API Gateway",
            "CloudFormation",
            "IAM security",
            "CodePipeline deployment",
            "CloudWatch monitoring",
            "AWS services",
            "developer tools"
        ]
        
        # pick 5 documents based on a randomly selected topic
        query = random.choice(search_queries)
        docs = self.vectorstore.similarity_search(query, k=5)
        
        if not docs:
            # fallback: try a broader search
            print(f"No documents found for query '{query}', trying broader search...")
            docs = self.vectorstore.similarity_search("AWS DVA-C02", k=10)
        
        if not docs:
            raise ValueError("Vector store returned no documents. Please check your vectorstore setup.")
        
        # pick a random chunk from the selected documents 
        chunk = random.choice(docs).page_content
        
        # generate question based on the chosen chunk
        messages = self.prompt_template.format_messages(chunk_text=chunk)
        mcq = self.llm.invoke(messages)
        
        # shuffle options
        options_dict = { 'A': mcq.options.A,'B': mcq.options.B,'C': mcq.options.C,'D': mcq.options.D }
        keys = list(options_dict.keys())
        random.shuffle(keys)
        
        # create mapping, then shuffle and remap
        label_mapping = {old: new for new, old in zip(['A','B','C','D'], keys)}
        shuffled_options = Options( A=options_dict[keys[0]],B=options_dict[keys[1]],C=options_dict[keys[2]],D=options_dict[keys[3]] )
    
        remapped_answers = sorted([label_mapping[ans] for ans in mcq.answers])
        
        return MCQ( question=mcq.question,options=shuffled_options,answers=remapped_answers,explanation=mcq.explanation,num_correct=mcq.num_correct )