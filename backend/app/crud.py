import json
from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas

def get_scan_history(db: Session, limit: int = 20):
    return db.query(models.ScanHistory).order_by(models.ScanHistory.id.desc()).limit(limit).all()

def create_scan_history(db: Session, title: str, content: str, score: int, level: str, indicators: list, timestamp: str):
    db_scan = models.ScanHistory(
        title=title,
        content=content,
        score=score,
        level=level,
        indicators=json.dumps(indicators),
        timestamp=timestamp
    )
    db.add(db_scan)
    db.commit()
    db.refresh(db_scan)
    return db_scan

def get_quiz_results(db: Session, limit: int = 10):
    return db.query(models.QuizResult).order_by(models.QuizResult.id.desc()).limit(limit).all()

def create_quiz_result(db: Session, score: int, total_questions: int, rank_title: str, timestamp: str):
    db_result = models.QuizResult(
        score=score,
        total_questions=total_questions,
        rank_title=rank_title,
        timestamp=timestamp
    )
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result

def get_dashboard_stats(db: Session):
    total_scans = db.query(models.ScanHistory).count()
    threats_detected = db.query(models.ScanHistory).filter(models.ScanHistory.level != "Safe").count()
    
    avg_score_query = db.query(func.avg(models.ScanHistory.score)).scalar()
    avg_score = float(avg_score_query) if avg_score_query is not None else 100.0

    # Fetch recent scans
    recent_db_scans = db.query(models.ScanHistory).order_by(models.ScanHistory.id.desc()).limit(10).all()
    
    # Generate a trend based on the scores of the recent scans (oldest to newest)
    # If we don't have enough, fill in with default values to make it look nice
    scores = [scan.score for scan in reversed(recent_db_scans)]
    if len(scores) < 10:
        # Prepend some standard values to simulate history
        default_trend = [85, 90, 75, 60, 95, 40, 70, 85, 90, 95]
        needed = 10 - len(scores)
        scores = default_trend[:needed] + scores

    return {
        "totalScans": total_scans,
        "threatsDetected": threats_detected,
        "avgScore": avg_score,
        "sparklineTrend": scores,
        "recentScans": recent_db_scans
    }
