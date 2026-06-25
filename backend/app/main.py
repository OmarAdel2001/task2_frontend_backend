import datetime
import json
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import engine, Base, get_db
from . import models, schemas, crud, heuristics

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DPhish Security Engine API",
    description="Backend threat intelligence and heuristics auditing platform for phishing prevention awareness.",
    version="1.2.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, allow all origins
    allow_credentials=False,  # Set to False to avoid conflicts with wildcard * origin
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hardcoded Quiz Questions
QUIZ_QUESTIONS = [
    {
        "id": 1,
        "sender": "Netflix Security",
        "senderEmail": "support@netflix-billing-update.com",
        "subject": "Action Required: Update your payment method",
        "body": "Dear customer, your membership could not be renewed because there is an issue with your current billing details. To prevent service interruption, please update your payment method by clicking the button below:\n\n[UPDATE MY MEMBERSHIP]\n\nIf you do not update your details within 48 hours, your account will be closed.",
        "isPhishing": True,
        "hoverUrl": "http://netflix.account-billing-login-portal.info/update",
        "explanation": "This is PHISHING. Note the sender email domain (\"netflix-billing-update.com\" instead of \"netflix.com\") and the link URL which redirects to a suspicious .info domain. Additionally, it uses urgent language (\"prevent service interruption\") and generic greetings (\"Dear customer\")."
    },
    {
        "id": 2,
        "sender": "GitHub Security",
        "senderEmail": "noreply@github.com",
        "subject": "[GitHub] Security Alert: New SSH key added",
        "body": "Hi omar-adel,\n\nThe following SSH key was recently added to your account:\n\nSHA256:u1vWXY90zAB/CdeFGhijKLMNoPqRsTuvwxyZaBCdeFG\n\nIf you added this key, you can safely ignore this email. If you did not recognize it, please visit your settings to remove it and secure your account immediately.",
        "isPhishing": False,
        "hoverUrl": "https://github.com/settings/keys",
        "explanation": "This email is LEGITIMATE. The sender is \"noreply@github.com\" which is a valid GitHub domain. The destination link goes directly to \"github.com\". It addresses the user by their username (\"omar-adel\") and does not demand immediate password changes or financial information."
    },
    {
        "id": 3,
        "sender": "DHL Express Delivery",
        "senderEmail": "delivery-agent-402@dhl-delivery-status.net",
        "subject": "Package Delivery Pending - Address Verification Required",
        "body": "Your package with tracking number DHL-8490-9382 could not be delivered due to an incorrect street address. \n\nA shipping fee of $1.50 is pending to reschedule. Please verify your address and complete the payment online:\n\n[RESCHEDULE PACKAGE DELIVERY]\n\nPlease note: Packages will be returned to the sender after 3 business days.",
        "isPhishing": True,
        "hoverUrl": "http://192.168.45.2/dhl/checkout.php",
        "explanation": "This is PHISHING. Attackers frequently mimic delivery companies like DHL, FedEx, or USPS. The sender email domain is suspicious (\"dhl-delivery-status.net\" instead of \"dhl.com\"). More importantly, the link points directly to a local/private IP address (192.168.45.2) instead of a secure DHL domain."
    },
    {
        "id": 4,
        "sender": "Google Workspace",
        "senderEmail": "no-reply@accounts.google.com",
        "subject": "Security Alert: New sign-in detected on Linux",
        "body": "We noticed a new sign-in to your Google Account on a Linux device from Cairo, Egypt.\n\nIf this was you, you don't need to do anything. If you don't recognize this activity, we can help you secure your account.\n\n[CHECK ACTIVITY]",
        "isPhishing": False,
        "hoverUrl": "https://myaccount.google.com/notifications",
        "explanation": "This email is LEGITIMATE. The sender address \"no-reply@accounts.google.com\" is Google's official domain. The link resolves to a valid sub-domain of Google (\"myaccount.google.com\"). It is a standard automated security notification."
    },
    {
        "id": 5,
        "sender": "Microsoft Accounts Department",
        "senderEmail": "support-office-365@secure-microsoft-verify.org",
        "subject": "ALERT: Password expiration in 24 hours",
        "body": "Dear Microsoft Office 365 Client,\n\nYour Office 365 account password will expire in 24 hours. To retain your current password and avoid losing access to your inbox, please verify your credentials immediately.\n\n[KEEP MY CURRENT PASSWORD]\n\nThank you,\nMicrosoft User Services",
        "isPhishing": True,
        "hoverUrl": "https://login.microsoftonline.com.secure-sign-in.tk/oauth",
        "explanation": "This is PHISHING. Microsoft will never email you to \"retain your current password\". The sender email (\"secure-microsoft-verify.org\") and the target link contain brand terms but point to a free \".tk\" subdomain (\"secure-sign-in.tk\") designed to look like Microsoft online portal."
    }
]

# Preset contents for seeding
MOCK_SCANS_SEED = [
    {
        "title": "Suspicious Paypal Alert",
        "content": "Subject: URGENT: Your PayPal Account Has Been Restricted!\n\nDear Customer,\n\nWe detected unauthorized login attempts to your PayPal account from a device in Russia. For your safety, we have temporarily restricted your access.\n\nhttp://verify-paypal-secure-support.com/signin",
        "timestamp": "2026-06-18 10:20"
    },
    {
        "title": "Mandatory HR Benefits Update",
        "content": "Subject: Mandatory Employee Benefits Update - Action Required\n\nHi Team,\n\nPlease review the revised 2026 Employee Health Benefits Package policy update. All employees are required to sign the updated agreement by Friday.\n\nhttps://portal-benefits-update.internal-hr-dashboard.net/login",
        "timestamp": "2026-06-18 09:45"
    },
    {
        "title": "Legitimate Calendar Invite",
        "content": "Subject: Weekly Design Review\n\nHi everyone,\n\nJust a reminder that our weekly design review is scheduled for tomorrow at 10:00 AM in Conference Room B.\n\nhttps://docs.google.com/document/d/1A_B3C9dE_meeting_agenda/edit",
        "timestamp": "2026-06-18 08:30"
    }
]

@app.on_event("startup")
def preseed_database():
    db = next(get_db())
    try:
        # Seed scans if history is empty
        if db.query(models.ScanHistory).count() == 0:
            for seed in reversed(MOCK_SCANS_SEED):
                result = heuristics.analyze_content(seed["content"])
                indicators_list = [dict(type=ind.type, message=ind.message) for ind in result.indicators]
                crud.create_scan_history(
                    db=db,
                    title=seed["title"],
                    content=seed["content"],
                    score=result.score,
                    level=result.level,
                    indicators=indicators_list,
                    timestamp=seed["timestamp"]
                )
    except Exception as e:
        print(f"Failed database seeding: {e}")
    finally:
        db.close()

# Helper serializer for ScanHistory DB object
def db_scan_to_response(db_scan) -> schemas.ScanHistoryResponse:
    indicators_list = []
    if db_scan.indicators:
        try:
            raw_list = json.loads(db_scan.indicators)
            indicators_list = [schemas.ThreatIndicator(**item) for item in raw_list]
        except Exception:
            pass
    return schemas.ScanHistoryResponse(
        id=db_scan.id,
        title=db_scan.title,
        content=db_scan.content,
        score=db_scan.score,
        level=db_scan.level,
        indicators=indicators_list,
        timestamp=db_scan.timestamp
    )

@app.post("/api/analyze", response_model=schemas.ScanResult)
def analyze_input(input_data: schemas.ScanInput):
    """
    Perform a real-time heuristics scan on the content without saving it to database.
    """
    return heuristics.analyze_content(input_data.content)

@app.get("/api/scans", response_model=List[schemas.ScanHistoryResponse])
def read_scans(limit: int = 20, db: Session = Depends(get_db)):
    """
    Retrieve recent threat scans history.
    """
    db_scans = crud.get_scan_history(db, limit=limit)
    return [db_scan_to_response(scan) for scan in db_scans]

@app.post("/api/scans", response_model=schemas.ScanHistoryResponse)
def save_scan(input_data: schemas.ScanInput, db: Session = Depends(get_db)):
    """
    Perform a scan and persist it in database.
    """
    result = heuristics.analyze_content(input_data.content)
    
    # Generate title if not provided
    title = input_data.title
    if not title:
        first_line = input_data.content.strip().split("\n")[0]
        title = first_line[:30] + "..." if len(first_line) > 30 else first_line
    
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    indicators_list = [dict(type=ind.type, message=ind.message) for ind in result.indicators]
    
    db_scan = crud.create_scan_history(
        db=db,
        title=title,
        content=input_data.content,
        score=result.score,
        level=result.level,
        indicators=indicators_list,
        timestamp=timestamp
    )
    return db_scan_to_response(db_scan)

@app.get("/api/stats", response_model=schemas.DashboardStatsResponse)
def get_stats(db: Session = Depends(get_db)):
    """
    Retrieve real-time metrics telemetry.
    """
    stats_data = crud.get_dashboard_stats(db)
    recent_responses = [db_scan_to_response(scan) for scan in stats_data["recentScans"]]
    
    return schemas.DashboardStatsResponse(
        totalScans=stats_data["totalScans"],
        threatsDetected=stats_data["threatsDetected"],
        avgScore=stats_data["avgScore"],
        sparklineTrend=stats_data["sparklineTrend"],
        recentScans=recent_responses
    )

@app.get("/api/quiz/questions", response_model=List[schemas.QuizQuestionResponse])
def get_quiz_questions():
    """
    Retrieve phishing quiz questions bank.
    """
    return [schemas.QuizQuestionResponse(**q) for q in QUIZ_QUESTIONS]

@app.post("/api/quiz/submit", response_model=schemas.QuizResultResponse)
def submit_quiz(result_data: schemas.QuizResultCreate, db: Session = Depends(get_db)):
    """
    Record a user quiz score assessment.
    """
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    db_result = crud.create_quiz_result(
        db=db,
        score=result_data.score,
        total_questions=result_data.total_questions,
        rank_title=result_data.rank_title,
        timestamp=timestamp
    )
    return db_result

@app.get("/api/quiz/results", response_model=List[schemas.QuizResultResponse])
def read_quiz_results(limit: int = 10, db: Session = Depends(get_db)):
    """
    Retrieve previous quiz results.
    """
    return crud.get_quiz_results(db, limit=limit)

@app.get("/")
def read_root():
    """
    Root endpoint returning API service status details.
    """
    return {
        "status": "DPhish Security Engine API is running",
        "version": "1.2.0",
        "docs_url": "/docs"
    }
