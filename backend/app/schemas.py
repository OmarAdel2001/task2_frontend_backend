from pydantic import BaseModel
from typing import List, Optional

class ThreatIndicator(BaseModel):
    type: str  # 'danger', 'warning', 'safe'
    message: str

class ScanResult(BaseModel):
    score: int
    level: str  # 'Safe', 'Suspicious', 'Dangerous'
    indicators: List[ThreatIndicator]

class ScanInput(BaseModel):
    content: str
    title: Optional[str] = None

class ScanHistoryResponse(BaseModel):
    id: int
    title: str
    content: str
    score: int
    level: str
    indicators: List[ThreatIndicator]
    timestamp: str

    class Config:
        from_attributes = True

class QuizResultCreate(BaseModel):
    score: int
    total_questions: int
    rank_title: str

class QuizResultResponse(BaseModel):
    id: int
    score: int
    total_questions: int
    rank_title: str
    timestamp: str

    class Config:
        from_attributes = True

class DashboardStatsResponse(BaseModel):
    totalScans: int
    threatsDetected: int
    avgScore: float
    sparklineTrend: List[int]
    recentScans: List[ScanHistoryResponse]

class QuizQuestionResponse(BaseModel):
    id: int
    sender: str
    senderEmail: str
    subject: str
    body: str
    isPhishing: bool
    hoverUrl: Optional[str] = None
    explanation: str
