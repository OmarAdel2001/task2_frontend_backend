import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Analyzer } from './components/Analyzer';
import { Quiz } from './components/Quiz';
import { Education } from './components/Education';
import type { ScanResult } from './utils/securityEngine';

const API_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`;

interface RecentScan {
  id: string;
  title: string;
  score: number;
  level: 'Safe' | 'Suspicious' | 'Dangerous';
  timestamp: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Local state fallback / pre-seeded scans
  const [recentScans, setRecentScans] = useState<RecentScan[]>([
    {
      id: '1',
      title: 'Suspicious Paypal Alert',
      score: 30,
      level: 'Dangerous',
      timestamp: '2026-06-18 10:20'
    },
    {
      id: '2',
      title: 'Mandatory HR Benefits Update',
      score: 55,
      level: 'Suspicious',
      timestamp: '2026-06-18 09:45'
    },
    {
      id: '3',
      title: 'Legitimate Calendar Invite',
      score: 95,
      level: 'Safe',
      timestamp: '2026-06-18 08:30'
    }
  ]);

  const [backendStats, setBackendStats] = useState<{
    totalScans: number;
    threatsDetected: number;
    avgScore: number;
    sparklineTrend: number[];
  } | null>(null);

  // Sync with Backend metrics and scans history
  const fetchBackendStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/stats`);
      if (!res.ok) throw new Error('API connection error');
      const data = await res.json();
      setBackendStats({
        totalScans: data.totalScans,
        threatsDetected: data.threatsDetected,
        avgScore: data.avgScore,
        sparklineTrend: data.sparklineTrend
      });
      // Convert backend scan objects to match React RecentScan format
      const formattedScans = data.recentScans.map((s: any) => ({
        id: String(s.id),
        title: s.title,
        score: s.score,
        level: s.level as 'Safe' | 'Suspicious' | 'Dangerous',
        timestamp: s.timestamp
      }));
      setRecentScans(formattedScans);
    } catch (err) {
      console.warn("FastAPI backend is offline. Using local storage heuristics and fallback mockup telemetry.", err);
    }
  };

  useEffect(() => {
    fetchBackendStats();
    // Poll stats occasionally to sync updates
    const interval = setInterval(fetchBackendStats, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handle addition of a new scan result (from Analyzer component)
  const handleScanComplete = (title: string, result: ScanResult, _rawContent?: string) => {
    // Refresh stats if scanned via API
    fetchBackendStats();

    const newScan: RecentScan = {
      id: Date.now().toString(),
      title,
      score: result.score,
      level: result.level as 'Safe' | 'Suspicious' | 'Dangerous',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setRecentScans(prev => {
      // Avoid visual duplication on instant updates
      if (prev.some(s => s.title === title && Math.abs(s.score - result.score) < 1)) {
        return prev;
      }
      return [newScan, ...prev];
    });
  };

  // Submit quiz metrics to backend DB
  const handleQuizFinished = async (score: number, rankTitle: string) => {
    console.log(`Quiz completed. Score: ${score}/5, Rank: ${rankTitle}`);
    try {
      await fetch(`${API_URL}/api/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: score,
          total_questions: 5,
          rank_title: rankTitle
        })
      });
      fetchBackendStats(); // Update dashboard telemetry
    } catch (err) {
      console.error("Failed to submit quiz statistics to backend:", err);
    }
  };

  // Compute stats dynamically (acts as fallback if backendStats is null)
  const totalScans = recentScans.length;
  const threatsDetected = recentScans.filter(s => s.level !== 'Safe').length;
  const avgScore = totalScans > 0 
    ? recentScans.reduce((acc, curr) => acc + curr.score, 0) / totalScans 
    : 100;

  const stats = {
    totalScans: backendStats ? backendStats.totalScans : totalScans,
    threatsDetected: backendStats ? backendStats.threatsDetected : threatsDetected,
    avgScore: backendStats ? backendStats.avgScore : avgScore,
    sparklineTrend: backendStats ? backendStats.sparklineTrend : undefined
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            stats={stats} 
            recentScans={recentScans} 
            onNavigate={(tab) => setActiveTab(tab)} 
          />
        );
      case 'analyzer':
        return (
          <Analyzer onScanComplete={handleScanComplete} apiUrl={API_URL} />
        );
      case 'quiz':
        return (
          <Quiz onQuizFinished={handleQuizFinished} />
        );
      case 'education':
        return (
          <Education />
        );
      default:
        return <Dashboard stats={stats} recentScans={recentScans} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <a href="#" className="logo-section" onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}>
            <div className="logo-icon">DP</div>
            <div className="logo-text">DPhish</div>
            <div className="logo-badge">Security</div>
          </a>

          <nav className="main-nav">
            <button 
              className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button 
              className={`nav-btn ${activeTab === 'analyzer' ? 'active' : ''}`}
              onClick={() => setActiveTab('analyzer')}
            >
              Threat Analyzer
            </button>
            <button 
              className={`nav-btn ${activeTab === 'quiz' ? 'active' : ''}`}
              onClick={() => setActiveTab('quiz')}
            >
              Phishing Quiz
            </button>
            <button 
              className={`nav-btn ${activeTab === 'education' ? 'active' : ''}`}
              onClick={() => setActiveTab('education')}
            >
              Education
            </button>
          </nav>
        </div>
      </header>

      {/* Main Panel Content */}
      <main className="app-main">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <span>&copy; 2026 DPhish Cyber Threat Labs. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Engine: v1.2.0-Heuristics</span>
            <span style={{ color: 'var(--color-safe)' }}>● Secure Connection</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
