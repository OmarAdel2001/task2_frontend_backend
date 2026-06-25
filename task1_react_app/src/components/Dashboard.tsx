import React from 'react';

interface DashboardProps {
  stats: {
    totalScans: number;
    threatsDetected: number;
    avgScore: number;
    sparklineTrend?: number[];
  };
  recentScans: Array<{
    id: string;
    title: string;
    score: number;
    level: 'Safe' | 'Suspicious' | 'Dangerous';
    timestamp: string;
  }>;
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, recentScans, onNavigate }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.avgScore / 100) * circumference;

  // Determine gauge color based on score
  let gaugeColor = 'var(--color-safe)';
  let gaugeGlow = 'var(--color-safe-glow)';
  if (stats.avgScore < 50) {
    gaugeColor = 'var(--color-danger)';
    gaugeGlow = 'var(--color-danger-glow)';
  } else if (stats.avgScore < 85) {
    gaugeColor = 'var(--color-warning)';
    gaugeGlow = 'var(--color-warning-glow)';
  }

  return (
    <div>
      <div className="widget-header" style={{ borderBottom: 'none', marginBottom: '0.5rem' }}>
        <div>
          <h1 className="section-title">Security Dashboard</h1>
          <p className="section-subtitle">Real-time threat telemetry and security awareness analytics.</p>
        </div>
        <button className="action-btn" onClick={() => onNavigate('analyzer')}>
          <span style={{ fontSize: '1.25rem' }}>+</span> Scan New Content
        </button>
      </div>

      <div className="dashboard-grid">
        {/* Left Card: Score Gauge */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 className="widget-title" style={{ alignSelf: 'flex-start', marginBottom: '1.5rem' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="widget-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            Overall Security Score
          </h2>
          
          <div className="gauge-container">
            <svg className="gauge-svg">
              <circle className="gauge-track" cx="80" cy="80" r={radius} />
              <circle 
                className="gauge-fill" 
                cx="80" 
                cy="80" 
                r={radius} 
                stroke={gaugeColor}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ filter: `drop-shadow(0 0 6px ${gaugeGlow})` }}
              />
            </svg>
            <div className="gauge-text">
              <div className="gauge-percentage">{Math.round(stats.avgScore)}%</div>
              <div className="gauge-desc">Safe Rating</div>
            </div>
          </div>
        </div>

        {/* Center Card: Key Metrics */}
        <div className="glass-card col-span-2">
          <h2 className="widget-title" style={{ marginBottom: '1.5rem' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="widget-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
            </svg>
            Security Telemetry
          </h2>
          
          <div className="kpi-row" style={{ marginBottom: '1.5rem' }}>
            <div className="kpi-card">
              <div className="kpi-label">Analyzed Items</div>
              <div className="kpi-value" style={{ color: 'var(--accent-cyan)' }}>{stats.totalScans}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Threats Blocked</div>
              <div className="kpi-value" style={{ color: 'var(--color-danger)' }}>{stats.threatsDetected}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Quiz Accuracy</div>
              <div className="kpi-value" style={{ color: 'var(--color-safe)' }}>90%</div>
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--card-border)', borderRadius: 'var(--border-radius-md)', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              <span>Historical Trend (Threat Activity)</span>
              <span style={{ color: 'var(--color-safe)' }}>● Stable Security posture</span>
            </div>
            {/* Custom SVG sparkline-type chart */}
            <div style={{ height: '70px', display: 'flex', alignItems: 'flex-end', gap: '4px', paddingTop: '10px' }}>
              {(() => {
                const trend = stats.sparklineTrend || [85, 90, 75, 60, 95, 40, 70, 85, 90, 95];
                const points = trend.map((score, i) => ({
                  x: i * 100,
                  y: 55 - (score / 100) * 45
                }));
                const pathD = points.length > 0 
                  ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
                  : '';
                const areaD = pathD ? `${pathD} L 900 60 L 0 60 Z` : '';
                return (
                  <svg width="100%" height="60" viewBox="0 0 900 60" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {areaD && <path d={areaD} fill="url(#chart-grad)" />}
                    {pathD && <path d={pathD} fill="none" stroke="var(--accent-cyan)" strokeWidth="3" />}
                    {points.map((p, idx) => {
                      // Highlight dangerous scores with red circles, others with cyan
                      const score = trend[idx];
                      const color = score < 50 ? 'var(--color-danger)' : score < 85 ? 'var(--color-warning)' : 'var(--accent-cyan)';
                      const isEnd = idx === points.length - 1;
                      const isDanger = score < 50;
                      if (isEnd || isDanger) {
                        return <circle key={idx} cx={p.x} cy={p.y} r={isEnd ? "5" : "4"} fill={color} />;
                      }
                      return null;
                    })}
                  </svg>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Live Threat Feed */}
        <div className="glass-card col-span-2">
          <h2 className="widget-title">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="widget-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            Recent Threat Scan Activity
          </h2>
          <p className="section-subtitle" style={{ marginBottom: '1.25rem', fontSize: '0.85rem' }}>Latest heuristic analysis performed by the system.</p>
          
          <div className="feed-list">
            {recentScans.map((scan) => (
              <div key={scan.id} className={`feed-item ${scan.level.toLowerCase()}`}>
                <div className="feed-item-info">
                  <span className="feed-item-title">{scan.title}</span>
                  <span className="feed-item-meta">{scan.timestamp} — Security Score: {scan.score}/100</span>
                </div>
                <span className={`feed-item-badge ${scan.level.toLowerCase()}`}>
                  {scan.level}
                </span>
              </div>
            ))}
            {recentScans.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No recent scans. Use the Threat Analyzer to start auditing content.
              </div>
            )}
          </div>
        </div>

        {/* Security Alert Quick Tip */}
        <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05), rgba(59, 130, 246, 0.05))', borderColor: 'rgba(6, 182, 212, 0.2)' }}>
          <h2 className="widget-title" style={{ color: 'var(--accent-cyan)', marginBottom: '1rem' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 -3h.008v.008H12V9.75zm0-4.5c4.97 0 9 4.03 9 9s-4.03 9-9 9-9-4.03-9-9 4.03-9 9-9z" />
            </svg>
            Active Defense Tip
          </h2>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p><strong>Hover before you click:</strong> Always hover your mouse pointer over any link in an email to check the actual destination URL shown at the bottom of your screen.</p>
            <p>Phishing attacks rely on styling links to look like official websites, while the actual href tag points to malicious domains.</p>
            <button 
              className="action-btn" 
              style={{ alignSelf: 'flex-start', padding: '0.4rem 0.8rem', fontSize: '0.8rem', marginTop: '0.5rem', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)', border: '1px solid rgba(6, 182, 212, 0.2)', boxShadow: 'none' }}
              onClick={() => onNavigate('quiz')}
            >
              Test Your Skills
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
