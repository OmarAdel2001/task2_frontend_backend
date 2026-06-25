import React, { useState } from 'react';
import { analyzeContent, SCANNER_PRESETS } from '../utils/securityEngine';
import type { ScanResult } from '../utils/securityEngine';

interface AnalyzerProps {
  onScanComplete: (title: string, result: ScanResult, rawContent?: string) => void;
  apiUrl?: string;
}

export const Analyzer: React.FC<AnalyzerProps> = ({ onScanComplete, apiUrl }) => {
  const [content, setContent] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  const handlePresetSelect = (id: string, presetContent: string) => {
    setActivePreset(id);
    setContent(presetContent);
    setResult(null);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setActivePreset(null);
    setResult(null);
  };

  const handleScan = async () => {
    if (!content.trim()) return;

    setIsScanning(true);
    setResult(null);

    // Determine the title
    let title = 'Custom Scan';
    if (activePreset) {
      const preset = SCANNER_PRESETS.find(p => p.id === activePreset);
      if (preset) title = preset.name;
    } else {
      const firstLine = content.trim().split('\n')[0];
      title = firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine;
    }

    if (apiUrl) {
      try {
        const delayPromise = new Promise(resolve => setTimeout(resolve, 800));
        
        const response = await fetch(`${apiUrl}/api/scans`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, title })
        });
        
        await delayPromise;

        if (!response.ok) throw new Error('API request failed');
        
        const scanResult = await response.json();
        setResult(scanResult);
        setIsScanning(false);
        onScanComplete(title, scanResult, content);
        return;
      } catch (err) {
        console.warn("Backend API unavailable. Falling back to local heuristic scan.", err);
      }
    }

    // Fallback local execution
    setTimeout(() => {
      const scanResult = analyzeContent(content);
      setResult(scanResult);
      setIsScanning(false);
      onScanComplete(title, scanResult, content);
    }, 1200);
  };

  const clearAll = () => {
    setContent('');
    setActivePreset(null);
    setResult(null);
  };

  return (
    <div>
      <div className="widget-header" style={{ borderBottom: 'none', marginBottom: '0.5rem' }}>
        <div>
          <h1 className="section-title">Heuristic Threat Analyzer</h1>
          <p className="section-subtitle">Paste email headers, body content, or URL links to check for security vulnerability indicators.</p>
        </div>
      </div>

      <div className="analyzer-container">
        {/* Input Panel */}
        <div className="glass-card analyzer-input-group">
          <h2 className="widget-title">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="widget-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 12h9m-9 3.75h9m-9-7.5h3m-3-3.75h3m-6 0h.008v.008H3v-.008zm0 3.75h.008v.008H3v-.008zm0 3.75h.008v.008H3v-.008zm0 3.75h.008v.008H3v-.008zm1.5-12.75h12.75c.621 0 1.125.504 1.125 1.125v16.5c0 .621-.504 1.125-1.125 1.125H4.5A1.125 1.125 0 013.375 19.5V3.75c0-.621.504-1.125 1.125-1.125z" />
            </svg>
            Audit Input
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Select a Threat Preset:</span>
            <div className="presets-container">
              {SCANNER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  className={`preset-btn ${activePreset === preset.id ? 'active' : ''}`}
                  onClick={() => handlePresetSelect(preset.id, preset.content)}
                  disabled={isScanning}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Or Paste Content for Audit:</span>
            <div className={`text-area-wrapper ${isScanning ? 'scanning' : ''}`}>
              <div className="scan-pulse-line" />
              <textarea
                className="analyzer-textarea"
                placeholder="Paste the suspicious email text, raw link, or headers here..."
                value={content}
                onChange={handleTextChange}
                disabled={isScanning}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              className="action-btn"
              style={{ flexGrow: 1 }}
              onClick={handleScan}
              disabled={isScanning || !content.trim()}
            >
              {isScanning ? (
                <>
                  <span className="spinner" style={{ display: 'inline-block', width: '1rem', height: '1rem', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Auditing Telemetry...
                </>
              ) : (
                <>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.602 10.602z" />
                  </svg>
                  Analyze Content
                </>
              )}
            </button>
            <button
              className="preset-btn"
              style={{ padding: '0 1.25rem', borderRadius: 'var(--border-radius-md)' }}
              onClick={clearAll}
              disabled={isScanning || !content}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
          <h2 className="widget-title" style={{ marginBottom: '1.5rem' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="widget-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-.621-.504-1.125-1.125-1.125H9.75M8.25 21h8.25c.621 0 1.125-.504 1.125-1.125V8.25c0-.621-.504-1.125-1.125-1.125M8.25 21a1.5 1.5 0 01-1.5-1.5V3.75A1.5 1.5 0 018.25 2.25h8.25a1.5 1.5 0 011.5 1.5V12M8.25 21a3 3 0 003-3V3.75m0 14.25a1.5 1.5 0 01-1.5-1.5V3.75" />
            </svg>
            Audit Diagnostics
          </h2>

          {!result && !isScanning && (
            <div className="analyzer-results-placeholder">
              <span className="placeholder-icon">🛡️</span>
              <h3>No Analysis Performed</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Provide text input or select one of the templates on the left, then click "Analyze Content" to start.</p>
            </div>
          )}

          {isScanning && (
            <div className="analyzer-results-placeholder" style={{ borderStyle: 'solid', borderColor: 'var(--accent-cyan)' }}>
              <span className="placeholder-icon" style={{ animation: 'pulse 1.5s infinite' }}>📡</span>
              <h3>Analyzing Heuristics...</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Parsing string expressions, evaluating link domains, inspecting safety protocols.</p>
            </div>
          )}

          {result && !isScanning && (
            <div className="result-card">
              <div className="result-score-header">
                <div>
                  <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>Threat Risk Rating</div>
                  <div className="indicator-title" style={{ 
                    color: result.level === 'Safe' ? 'var(--color-safe)' : result.level === 'Suspicious' ? 'var(--color-warning)' : 'var(--color-danger)',
                    fontSize: '1.5rem',
                    marginTop: '0.25rem'
                  }}>
                    {result.level}
                  </div>
                </div>
                <div className={`score-badge-large ${result.level.toLowerCase()}`}>
                  {result.score}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Diagnostic Indicators:</span>
                <div className="indicators-list">
                  {result.indicators.map((ind, i) => (
                    <div key={i} className={`indicator-item ${ind.type}`}>
                      <span className="indicator-bullet">
                        {ind.type === 'danger' ? '🔴' : ind.type === 'warning' ? '🟡' : '🟢'}
                      </span>
                      <span className="indicator-text">{ind.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { opacity: 0.4; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0.4; transform: scale(0.95); }
        }
      `}</style>
    </div>
  );
};
