"""
FastAPI Backend for AWS DVA-C02 Quiz Application
Enhanced with domain tracking and analytics
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
from typing import Dict
from datetime import datetime
from models import QuestionResponse, AnswerSubmission, ExamResult, DomainTrend, Statistics
import uuid
import asyncio
import csv
import io

from database import init_db, get_db
from models import ExamSession
from quiz_generator import QuizGenerator

# domain definitions for DVA-C02
DOMAINS = {
    "Compute": ["Lambda", "EC2", "Elastic Beanstalk", "compute", "serverless"],
    "Storage": ["S3", "EFS", "EBS", "storage", "bucket"],
    "Databases": ["DynamoDB", "RDS", "Aurora", "database", "table"],
    "Networking & Content Delivery": ["API Gateway", "CloudFront", "Route 53", "VPC", "ELB", "Load Balancer"],
    "Analytics": ["Kinesis", "Athena", "analytics", "streaming"],
    "Management & Governance": ["CloudFormation", "CloudWatch", "CloudTrail", "AWS Config", "Systems Manager"],
    "Developer Tools": ["CodePipeline", "CodeBuild", "CodeDeploy", "CodeCommit", "CI/CD", "deployment"],
    "Containers": ["ECS", "ECR", "Fargate", "container", "Docker"],
    "Security Identity & Compliance": ["IAM", "Cognito", "Secrets Manager", "KMS", "encryption", "security", "authentication"],
    "Application Integration": ["SQS", "SNS", "Step Functions", "EventBridge", "queue", "message"]
}

# global state for question generation
question_cache: Dict[str, dict] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    init_db()
    yield
    # shutdown
    pass

app = FastAPI(title="AWS DVA-C02 Quiz API", lifespan=lifespan)
app.add_middleware( CORSMiddleware,allow_origins=["http://localhost:5173"],allow_credentials=True,allow_methods=["*"],allow_headers=["*"] )

quiz_gen = QuizGenerator() # initialise quiz generator


def classify_question_domain(question_text: str, options: Dict[str, str]) -> str:
    """Classify which domain a question belongs to based on keywords"""
    text = (question_text + " " + " ".join(options.values())).lower()
    
    domain_scores = {}
    for domain, keywords in DOMAINS.items():
        score = sum(1 for keyword in keywords if keyword.lower() in text)
        domain_scores[domain] = score
    
    # return domain with highest score, or "General" if no matches
    if max(domain_scores.values()) > 0:
        return max(domain_scores, key=domain_scores.get)
    return "General"


async def generate_questions_background(exam_id: str, num_questions: int = 65):
    """Generate questions in the background"""
    try:
        questions = []
        for i in range(num_questions):
            # check if exam was cancelled, in which case stop generating questions
            if exam_id in question_cache and question_cache[exam_id].get("cancelled", False):
                print(f"Question generation cancelled for exam {exam_id}")
                break
            
            question = await quiz_gen.generate_question()
            
            # classify the question's domain
            domain = classify_question_domain(
                question.question,
                { "A": question.options.A,"B": question.options.B,"C": question.options.C,"D": question.options.D }
            )
            
            questions.append({
                "question_id": i,
                "question": question.question,
                "options": { "A": question.options.A,"B": question.options.B,"C": question.options.C,"D": question.options.D },
                "correct_answers": question.answers,
                "num_correct": question.num_correct,
                "explanation": question.explanation,
                "domain": domain
            })
            
            # update cache with progress of question generation
            question_cache[exam_id] = {
                "questions": questions,
                "generated_count": len(questions),
                "total": num_questions,
                "completed": len(questions) == num_questions,
                "user_answers": {},
                "start_time": question_cache[exam_id]["start_time"],
                "cancelled": question_cache[exam_id].get("cancelled", False)
            }
            
            await asyncio.sleep(0.5)
            
    except Exception as e:
        print(f"Error generating questions: {e}")
        if exam_id in question_cache:
            question_cache[exam_id]["error"] = str(e)



@app.get("/")
async def root():
    return {"message": "AWS DVA-C02 Quiz API", "status": "running"}

@app.get("/api/statistics", response_model=Statistics)
async def get_statistics():
    """Get exam statistics with domain trends"""
    db = next(get_db())
    
    try:
        exams = db.query(ExamSession).all()
        
        if not exams:
            return Statistics(
                total_exams=0,
                average_score=0.0,
                pass_rate=0.0,
                best_score=None,
                recent_exams=[],
                domain_trends=[]
            )
        
        completed_exams = [e for e in exams if e.completed]
        
        if completed_exams:
            average_score = sum(e.percentage for e in completed_exams) / len(completed_exams)
            pass_rate = len([e for e in completed_exams if e.passed]) / len(completed_exams) * 100
            best_score = max(e.percentage for e in completed_exams)
        else:
            average_score = 0.0
            pass_rate = 0.0
            best_score = None
        
        # get recent 5 exams
        recent = sorted(completed_exams, key=lambda x: x.completed_at, reverse=True)[:5]
        recent_exams = [
            {
                "exam_id": e.exam_id,
                "score": e.score,
                "total_possible": e.total_possible,
                "percentage": round(e.percentage, 1),
                "passed": e.passed,
                "date": e.completed_at.isoformat()
            }
            for e in recent
        ]
        
        # Calculate domain trends
        domain_trends = []
        all_domains = list(DOMAINS.keys()) + ["Overall"]
        
        for domain in all_domains:
            data_points = []
            for exam in sorted(completed_exams, key=lambda x: x.completed_at):
                if exam.domain_scores:
                    if domain == "Overall":
                        percentage = exam.percentage
                    elif domain in exam.domain_scores:
                        domain_data = exam.domain_scores[domain]
                        if domain_data["total"] > 0:
                            percentage = (domain_data["score"] / domain_data["total"]) * 100
                        else:
                            percentage = 0
                    else:
                        continue
                    
                    data_points.append({
                        "date": exam.completed_at.isoformat(),
                        "percentage": round(percentage, 1),
                        "exam_id": exam.exam_id
                    })
            
            if data_points:  # Only include domains with data
                domain_trends.append(DomainTrend(
                    domain=domain,
                    data_points=data_points
                ))
        
        return Statistics(
            total_exams=len(completed_exams),
            average_score=round(average_score, 1),
            pass_rate=round(pass_rate, 1),
            best_score=round(best_score, 1) if best_score else None,
            recent_exams=recent_exams,
            domain_trends=domain_trends
        )
    finally:
        db.close()

@app.get("/api/export/csv")
async def export_data_csv():
    """Export all exam data as CSV"""
    db = next(get_db())
    
    try:
        exams = db.query(ExamSession).filter(ExamSession.completed == True).all()
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        header = [
            "Exam ID", "Date", "Score", "Total Possible", "Percentage", 
            "Passed", "Duration (min)"
        ]
        # Add domain columns
        for domain in DOMAINS.keys():
            header.extend([f"{domain} Score", f"{domain} Total"])
        writer.writerow(header)
        
        # Write data
        for exam in exams:
            row = [
                exam.exam_id,
                exam.completed_at.strftime("%Y-%m-%d %H:%M:%S"),
                exam.score,
                exam.total_possible,
                round(exam.percentage, 1),
                "Yes" if exam.passed else "No",
                round(exam.duration_seconds / 60, 1)
            ]
            
            # Add domain scores
            if exam.domain_scores:
                for domain in DOMAINS.keys():
                    if domain in exam.domain_scores:
                        row.extend([
                            exam.domain_scores[domain]["score"],
                            exam.domain_scores[domain]["total"]
                        ])
                    else:
                        row.extend([0, 0])
            else:
                # No domain scores, fill with zeros
                row.extend([0, 0] * len(DOMAINS))
            
            writer.writerow(row)
        
        # Get CSV content
        csv_content = output.getvalue()
        output.close()
        
        return StreamingResponse(
            io.BytesIO(csv_content.encode()),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=exam_results.csv"}
        )
    finally:
        db.close()

@app.post("/api/exam/start")
async def start_exam(background_tasks: BackgroundTasks):
    """Start a new exam and begin generating questions in background"""
    exam_id = str(uuid.uuid4())
    
    question_cache[exam_id] = {
        "questions": [],
        "generated_count": 0,
        "total": 65,
        "completed": False,
        "user_answers": {},
        "start_time": datetime.now(),
        "cancelled": False
    }
    
    background_tasks.add_task(generate_questions_background, exam_id, 65)
    
    return {"exam_id": exam_id, "status": "generating"}

@app.get("/api/exam/{exam_id}/progress")
async def get_exam_progress(exam_id: str):
    """Check how many questions have been generated"""
    if exam_id not in question_cache:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    cache = question_cache[exam_id]
    return {
        "generated_count": cache["generated_count"],
        "total": cache["total"],
        "completed": cache["completed"],
        "error": cache.get("error")
    }

@app.get("/api/exam/{exam_id}/question/{question_id}", response_model=QuestionResponse)
async def get_question(exam_id: str, question_id: int):
    """Get a specific question"""
    if exam_id not in question_cache:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    cache = question_cache[exam_id]
    
    if question_id >= cache["generated_count"]:
        raise HTTPException(status_code=425, detail="Question not generated yet")
    
    question = cache["questions"][question_id]
    
    return QuestionResponse(
        question_id=question_id,
        question=question["question"],
        options=question["options"],
        num_correct=question["num_correct"],
        total_questions=cache["total"]
    )

@app.post("/api/exam/{exam_id}/cancel")
async def cancel_exam(exam_id: str):
    """Cancel question generation for an exam"""
    if exam_id not in question_cache:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Mark exam as cancelled
    question_cache[exam_id]["cancelled"] = True
    
    return {"status": "cancelled", "message": "Question generation will stop"}

@app.post("/api/exam/{exam_id}/answer")
async def submit_answer(exam_id: str, answer: AnswerSubmission):
    """Submit an answer for a question"""
    if exam_id not in question_cache:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    cache = question_cache[exam_id]
    cache["user_answers"][answer.question_id] = answer.selected_answers
    
    return {"status": "recorded"}

@app.post("/api/exam/{exam_id}/submit", response_model=ExamResult)
async def submit_exam(exam_id: str):
    """Submit the exam and calculate results with domain scores"""
    if exam_id not in question_cache:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    cache = question_cache[exam_id]
    
    # Calculate overall score and domain scores
    score = 0
    total_possible = 0
    domain_scores = {domain: {"score": 0, "total": 0} for domain in DOMAINS.keys()}
    domain_scores["General"] = {"score": 0, "total": 0}
    
    for question in cache["questions"]:
        qid = question["question_id"]
        correct_answers = sorted(question["correct_answers"])
        user_answers = sorted(cache["user_answers"].get(qid, []))
        domain = question["domain"]
        
        num_correct = question["num_correct"]
        total_possible += num_correct
        domain_scores[domain]["total"] += num_correct
        
        if user_answers == correct_answers:
            score += num_correct
            domain_scores[domain]["score"] += num_correct
        elif num_correct > 1:
            # Partial credit
            partial = len(set(user_answers) & set(correct_answers))
            score += partial
            domain_scores[domain]["score"] += partial
    
    percentage = (score / total_possible * 100) if total_possible > 0 else 0
    passed = percentage >= 72
    
    duration = (datetime.now() - cache["start_time"]).seconds
    
    # Save to database
    db = next(get_db())
    try:
        exam_session = ExamSession(
            exam_id=exam_id,
            score=score,
            total_possible=total_possible,
            percentage=percentage,
            passed=passed,
            duration_seconds=duration,
            completed=True,
            completed_at=datetime.now(),
            domain_scores=domain_scores
        )
        db.add(exam_session)
        db.commit()
        
    finally:
        db.close()
    
    return ExamResult(
        exam_id=exam_id,
        score=score,
        total_possible=total_possible,
        percentage=round(percentage, 1),
        passed=passed,
        duration_seconds=duration,
        completed_at=datetime.now().isoformat(),
        domain_scores=domain_scores
    )

@app.get("/api/exam/{exam_id}/review")
async def get_exam_review(exam_id: str):
    """Get review of all questions"""
    if exam_id not in question_cache:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    cache = question_cache[exam_id]
    review = []
    
    for question in cache["questions"]:
        qid = question["question_id"]
        correct_answers = sorted(question["correct_answers"])
        user_answers = sorted(cache["user_answers"].get(qid, []))
        is_correct = user_answers == correct_answers
        
        review.append({
            "question_id": qid,
            "question": question["question"],
            "options": question["options"],
            "user_answers": user_answers,
            "correct_answers": correct_answers,
            "is_correct": is_correct,
            "explanation": question["explanation"],
            "num_correct": question["num_correct"],
            "domain": question["domain"]
        })
    
    return {"questions": review}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)