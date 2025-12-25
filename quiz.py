"""
quiz.py
Interactive AWS DVA-C02 Quiz using LangChain + OpenAI + Chroma
- Uses structured JSON output from LLM
- Explanations shown only at the end
- Random chunk selection and shuffled options
"""

import os
import random
from pydantic import BaseModel
from langchain_chroma import Chroma
from langchain_openai import ChatOpenAI
from langchain_ollama import OllamaEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ----------------------------
# CONFIG
# ----------------------------
PERSIST_DIR = "vectorstore"
COLLECTION_NAME = "aws_dva_c02_notes"
OLLAMA_BASE_URL = "http://localhost:11434"
EMBEDDING_MODEL = "nomic-embed-text:latest"
OPENAI_MODEL = "gpt-5-nano"  # or "gpt-4o" for more powerful model

# ----------------------------
# MCQ MODEL
# ----------------------------
class Options(BaseModel):
    A: str
    B: str
    C: str
    D: str

class MCQ(BaseModel):
    question: str
    options: Options
    answer: str  # A/B/C/D
    explanation: str

# ----------------------------
# LOAD VECTORSTORE AND LLM
# ----------------------------
# Initialize embeddings (must match ingestion!)
embeddings = OllamaEmbeddings(
    model=EMBEDDING_MODEL,
    base_url=OLLAMA_BASE_URL
)

# Pass embeddings to Chroma
vectorstore = Chroma(
    persist_directory=PERSIST_DIR,
    collection_name=COLLECTION_NAME,
    embedding_function=embeddings
)

# Initialize OpenAI LLM with structured output
llm = ChatOpenAI(
    model=OPENAI_MODEL,
    temperature=0.7,
    api_key=os.getenv("OPENAI_API_KEY")
).with_structured_output(MCQ)

# ----------------------------
# PROMPT TEMPLATE
# ----------------------------
prompt_template = ChatPromptTemplate.from_messages([
    ("system", """You are an AWS Certified Developer - Associate (DVA-C02) exam question generator.

Generate questions that match the AWS DVA-C02 exam style:

QUESTION CHARACTERISTICS:
- Scenario-based: Present a real-world developer problem or use case
- Focus on DEVELOPER tasks: deploying apps, debugging, monitoring, CI/CD, coding with AWS SDKs
- Test practical knowledge, not just memorization
- Include specific details (service names, features, configuration options)
- Ask "which solution..." or "what should the developer do..." style questions

CONTENT DOMAINS (DVA-C02):
- Development with AWS Services (32%): Lambda, API Gateway, DynamoDB, S3, SQS/SNS, Step Functions
- Security (26%): IAM, Cognito, Secrets Manager, KMS, encryption
- Deployment (24%): CI/CD, CodePipeline, CodeBuild, CodeDeploy, CloudFormation, SAM, Elastic Beanstalk
- Troubleshooting and Optimization (18%): CloudWatch, X-Ray, performance tuning, cost optimization

ANSWER OPTIONS:
- Four plausible options (A, B, C, D) - only one correct
- Make distractors realistic but clearly wrong when analyzed
- Include specific AWS service names and features
- Avoid obviously incorrect options

DIFFICULTY: Intermediate level - requires understanding of AWS services, best practices, and how services integrate.

Output the question with explanation."""),
    ("user", "Generate a DVA-C02 exam-style question based on these notes:\n\n{chunk_text}")
])

# ----------------------------
# GENERATE MCQ FROM CHUNK
# ----------------------------
def generate_mcq_from_chunk(chunk_text: str) -> MCQ:
    """Generate an MCQ from a text chunk using OpenAI with structured output."""
    try:
        messages = prompt_template.format_messages(chunk_text=chunk_text)
        mcq = llm.invoke(messages)
        return mcq
    except Exception as e:
        print(f"❌ Error generating question: {e}")
        raise

# ----------------------------
# MAIN QUIZ LOOP
# ----------------------------
def main():
    print("Welcome to the AWS DVA-C02 interactive quiz!\n")
    score = 0
    num_questions = 3

    quiz_history = []

    for i in range(num_questions):
        try:
            # select a random chunk
            docs = vectorstore.similarity_search("AWS DVA-C02 topics", k=3)
            chunk = random.choice(docs).page_content

            # generate MCQ
            print(f"Generating question {i+1}...")
            mcq = generate_mcq_from_chunk(chunk)

            # shuffle options
            options_dict = {
                'A': mcq.options.A,
                'B': mcq.options.B,
                'C': mcq.options.C,
                'D': mcq.options.D
            }
            keys = list(options_dict.keys())
            random.shuffle(keys)
            shuffled_options = {label: options_dict[old] for label, old in zip(['A','B','C','D'], keys)}
            correct_answer_label = [label for label, old in zip(['A','B','C','D'], keys) if old == mcq.answer][0]

            # ask user
            print(f"\nQuestion {i+1}: {mcq.question}")
            for key, val in shuffled_options.items():
                print(f"{key}) {val}")
            user_ans = input("Your answer (A/B/C/D): ").strip().upper()

            if user_ans == correct_answer_label:
                print("✅ Correct!")
                score += 1
            else:
                print("❌ Wrong!")

            # store history
            quiz_history.append({
                "question": mcq.question,
                "options": shuffled_options,
                "user_answer": user_ans,
                "correct_answer": correct_answer_label,
                "explanation": mcq.explanation
            })
            
        except Exception as e:
            print(f"\n⚠️  Skipping question {i+1} due to error: {e}")
            continue

    # ----------------------------
    # SHOW SUMMARY AND EXPLANATIONS
    # ----------------------------
    print("\n=== Quiz Completed ===")
    print(f"Your final score: {score}/{num_questions}\n")

    if quiz_history:
        print("Explanations:\n")
        for idx, entry in enumerate(quiz_history, start=1):
            print(f"Q{idx}: {entry['question']}")
            print(f"Your answer: {entry['user_answer']} | Correct answer: {entry['correct_answer']}")
            print(f"Explanation: {entry['explanation']}\n")
    else:
        print("No questions were completed.")

if __name__ == "__main__":
    main()