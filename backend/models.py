from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

Base = declarative_base()

class ExamSession(Base):
    __tablename__ = "exam_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(String, unique=True, index=True)
    score = Column(Integer)
    total_possible = Column(Integer)
    percentage = Column(Float)
    passed = Column(Boolean)
    duration_seconds = Column(Integer)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)
    completed_at = Column(DateTime, nullable=True)
    
    # Domain scores stored as JSON
    # Format: {"Development": {"score": 20, "total": 25}, "Security": {...}, ...}
    domain_scores = Column(JSON, nullable=True)
    
    # Relationship to individual question results
    questions = relationship("QuestionResult", back_populates="exam")

class QuestionResult(Base):
    __tablename__ = "question_results"
    
    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(String, ForeignKey("exam_sessions.exam_id"))
    question_number = Column(Integer)
    correct = Column(Boolean)
    user_answer = Column(String)
    correct_answer = Column(String)
    domain = Column(String, nullable=True)  # Track which domain this question belongs to
    
    # Relationship back to exam
    exam = relationship("ExamSession", back_populates="questions")

class Options(BaseModel):
    A: str
    B: str
    C: str
    D: str

class MCQ(BaseModel):
    question: str
    options: Options
    answers: List[str] = Field(description="List of correct answers")
    explanation: str
    num_correct: int = Field(description="Number of correct answers")

class QuestionResponse(BaseModel):
    question_id: int
    question: str
    options: Dict[str, str]
    num_correct: int
    total_questions: int

class AnswerSubmission(BaseModel):
    question_id: int
    selected_answers: List[str]

class ExamResult(BaseModel):
    exam_id: str
    score: int
    total_possible: int
    percentage: float
    passed: bool
    duration_seconds: int
    completed_at: str
    domain_scores: Dict[str, Dict[str, int]]

class DomainTrend(BaseModel):
    domain: str
    data_points: List[Dict[str, Any]]  # [{"date": "...", "percentage": 75.0}, ...]

class Statistics(BaseModel):
    total_exams: int
    average_score: float
    pass_rate: float
    best_score: Optional[float]
    recent_exams: List[dict]
    domain_trends: List[DomainTrend]

SYSTEM_PROMPT = """You are an AWS Certified Developer - Associate (DVA-C02) exam question generator.

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
- Four plausible options (A, B, C, D)
- IMPORTANT: Randomly vary the number of correct answers:
  * 70 percent of questions: 1 correct answer
  * 20 percent of questions: 2 correct answers (state "Select 2 answers" in the question)
  * 10 percent of questions: 3 correct answers (state "Select 3 answers" in the question)
- Make distractors realistic but clearly wrong when analyzed
- Include specific AWS service names and features
- For multi-answer questions, ensure all correct answers are independently valid solutions

DIFFICULTY: Intermediate level - requires understanding of AWS services, best practices, and how services integrate.

Output the question with:
- question: the full question text (include "Select X answers" if multiple)
- options: all 4 options (A, B, C, D)
- answers: list of correct answer letters (e.g., ["A"] or ["B", "D"])
- num_correct: number indicating how many answers are correct (1, 2, or 3)
- explanation: why the correct answers are right"""