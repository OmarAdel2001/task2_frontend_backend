from sqlalchemy import Column, Integer, String, Text
from .database import Base

class ScanHistory(Base):
    __tablename__ = "scan_history"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(Text)
    score = Column(Integer)
    level = Column(String)
    indicators = Column(Text)  # JSON-serialized string of indicators list
    timestamp = Column(String)

class QuizResult(Base):
    __tablename__ = "quiz_results"

    id = Column(Integer, primary_key=True, index=True)
    score = Column(Integer)
    total_questions = Column(Integer)
    rank_title = Column(String)
    timestamp = Column(String)
