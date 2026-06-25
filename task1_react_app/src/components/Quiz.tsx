import React, { useState } from 'react';
import { QUIZ_QUESTIONS } from '../utils/securityEngine';
import type { QuizQuestion } from '../utils/securityEngine';

interface QuizProps {
  onQuizFinished: (score: number, rankTitle: string) => void;
}

export const Quiz: React.FC<QuizProps> = ({ onQuizFinished }) => {
  const [gameState, setGameState] = useState<'welcome' | 'playing' | 'feedback' | 'finished'>('welcome');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [userSelectedPhish, setUserSelectedPhish] = useState<boolean | null>(null);

  const startQuiz = () => {
    setGameState('playing');
    setCurrentIdx(0);
    setScore(0);
    setUserSelectedPhish(null);
  };

  const currentQuestion: QuizQuestion = QUIZ_QUESTIONS[currentIdx];

  const handleAnswer = (isPhishChoice: boolean) => {
    setUserSelectedPhish(isPhishChoice);
    const isCorrect = isPhishChoice === currentQuestion.isPhishing;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    setGameState('feedback');
  };

  const handleNext = () => {
    setUserSelectedPhish(null);
    if (currentIdx + 1 < QUIZ_QUESTIONS.length) {
      setCurrentIdx(prev => prev + 1);
      setGameState('playing');
    } else {
      setGameState('finished');
      onQuizFinished(score, getRank(score).title);
    }
  };

  // Helper to highlight potential phishing keywords in body
  const renderFormattedBody = (bodyText: string, hoverUrl?: string) => {
    if (!hoverUrl) return bodyText;
    
    // We replace generic link placeholders like [UPDATE MY MEMBERSHIP] with interactive elements
    const parts = bodyText.split(/(\[.*?\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        const linkLabel = part.substring(1, part.length - 1);
        return (
          <a
            key={i}
            href="#"
            className="email-mock-link"
            data-hover-url={hoverUrl}
            onClick={(e) => e.preventDefault()}
          >
            {linkLabel}
          </a>
        );
      }
      return part;
    });
  };

  const getRank = (scoreVal: number) => {
    const total = QUIZ_QUESTIONS.length;
    const ratio = scoreVal / total;
    if (ratio === 1) return { title: 'Cyber Defender', desc: 'Flawless identification. You have advanced security awareness.' };
    if (ratio >= 0.7) return { title: 'Security Analyst', desc: 'Great job! You detected most threat variables.' };
    if (ratio >= 0.4) return { title: 'Vulnerable', desc: 'Caution needed. Review threat indicators to stay safe.' };
    return { title: 'High Threat Risk', desc: 'Action required: Take time to study the common signs of phishing.' };
  };

  return (
    <div>
      {/* Welcome State */}
      {gameState === 'welcome' && (
        <div className="glass-card quiz-welcome">
          <div className="welcome-icon">🛡️</div>
          <h1 className="section-title" style={{ fontSize: '1.75rem' }}>Phishing Awareness Quiz</h1>
          <p className="section-subtitle" style={{ fontSize: '0.95rem', margin: '0.75rem 0 1.5rem 0' }}>
            Train your cyber-defense skills. Read realistic email templates, inspect link locations by hovering over links, and determine whether they are legitimate or phishing.
          </p>
          <button className="action-btn" onClick={startQuiz}>
            Start Assessment
          </button>
        </div>
      )}

      {/* In-Game / Playing or Feedback States */}
      {(gameState === 'playing' || gameState === 'feedback') && (
        <div className="glass-card quiz-card">
          <div className="quiz-progress-bar-container">
            <div 
              className="quiz-progress-bar" 
              style={{ width: `${((currentIdx) / QUIZ_QUESTIONS.length) * 100}%` }}
            />
          </div>
          
          <div className="quiz-header">
            <span>QUESTION {currentIdx + 1} OF {QUIZ_QUESTIONS.length}</span>
            <span style={{ color: 'var(--accent-cyan)' }}>Current Score: {score}</span>
          </div>

          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '1rem' }}>
            Evaluate this email scenario:
          </h3>

          <div className="email-mock-container">
            <div className="email-mock-header">
              <div className="email-header-row">
                <span className="email-header-label">From:</span>
                <span className="email-header-val">{currentQuestion.sender} &lt;{currentQuestion.senderEmail}&gt;</span>
              </div>
              <div className="email-header-row">
                <span className="email-header-label">Subject:</span>
                <span className="email-header-val" style={{ fontWeight: 600 }}>{currentQuestion.subject}</span>
              </div>
            </div>
            <div className="email-mock-body">
              <p style={{ whiteSpace: 'pre-line' }}>
                {renderFormattedBody(currentQuestion.body, currentQuestion.hoverUrl)}
              </p>
            </div>
          </div>

          {/* Prompt banner to hover links */}
          {currentQuestion.hoverUrl && gameState === 'playing' && (
            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontStyle: 'italic' }}>
              💡 Hover over the link in the message above to preview the web path on your status bar.
            </div>
          )}

          {/* Action options */}
          {gameState === 'playing' && (
            <div className="quiz-options">
              <button 
                className="quiz-option-btn" 
                style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}
                onClick={() => handleAnswer(false)}
              >
                ✅ Legitimate Email
              </button>
              <button 
                className="quiz-option-btn" 
                style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}
                onClick={() => handleAnswer(true)}
              >
                🚨 Phishing Attempt
              </button>
            </div>
          )}

          {/* Feedback Section */}
          {gameState === 'feedback' && (
            <div>
              <div className={`quiz-explanation ${userSelectedPhish === currentQuestion.isPhishing ? 'correct' : 'incorrect'}`}>
                <div className={`explanation-status ${userSelectedPhish === currentQuestion.isPhishing ? 'correct' : 'incorrect'}`}>
                  {userSelectedPhish === currentQuestion.isPhishing ? '✓ Correct Answer!' : '✗ Incorrect identification'}
                </div>
                <div className="explanation-text">
                  {currentQuestion.explanation}
                </div>
              </div>

              <button className="action-btn" style={{ width: '100%' }} onClick={handleNext}>
                {currentIdx + 1 < QUIZ_QUESTIONS.length ? 'Next Question' : 'Finish Assessment'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Finished State */}
      {gameState === 'finished' && (
        <div className="glass-card quiz-results-container">
          <h1 className="section-title">Assessment Completed</h1>
          <p className="section-subtitle" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Security awareness rating analyzed.</p>
          
          <div className="quiz-score-ring">
            <span className="quiz-score-num">{score}</span>
            <span className="quiz-score-total">/ {QUIZ_QUESTIONS.length} Correct</span>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-cyan)', fontSize: '1.25rem', marginBottom: '0.25rem' }}>
              {getRank(score).title}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {getRank(score).desc}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="action-btn" style={{ flexGrow: 1 }} onClick={startQuiz}>
              Retry Quiz
            </button>
            <button 
              className="preset-btn" 
              style={{ padding: '0 1.5rem', borderRadius: 'var(--border-radius-md)' }}
              onClick={() => setGameState('welcome')}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
