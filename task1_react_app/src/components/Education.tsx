import React, { useState } from 'react';

interface SecurityTip {
  icon: string;
  title: string;
  description: string;
  badge: string;
}

export const Education: React.FC = () => {
  const [checklist, setChecklist] = useState([
    { id: 1, text: 'I check the actual email address, not just the sender display name.', checked: false },
    { id: 2, text: 'I hover over hyperlinks to inspect the destination URL before clicking.', checked: false },
    { id: 3, text: 'I never supply credentials or financial data in response to urgent emails.', checked: false },
    { id: 4, text: 'I use Multi-Factor Authentication (MFA) on all my primary accounts.', checked: false },
    { id: 5, text: 'I verify suspicious internal requests via secondary communication channels (Slack, call).', checked: false }
  ]);

  const toggleCheck = (id: number) => {
    setChecklist(prev => 
      prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item)
    );
  };

  const tips: SecurityTip[] = [
    {
      icon: '📧',
      title: 'Sender Domain Spoofing',
      description: 'Phishers use display names that look authentic (e.g. "PayPal Security") but register misleading domains (e.g. "@secure-paypal-alerts.com"). Check the header carefully.',
      badge: 'Email Header Check'
    },
    {
      icon: '🔗',
      title: 'Deceptive Hyperlinks',
      description: 'The visible link text in an email can say "https://amazon.com", while the underlying href anchor refers to "http://amazon-verification-system.cn". Hover over links to confirm destinations.',
      badge: 'Link Analysis'
    },
    {
      icon: '⏰',
      title: 'Urgency & Coercion',
      description: 'Threats of account termination, security fines, or suspended payments are psychological triggers. Real institutions give generous warnings and do not demand immediate action.',
      badge: 'Psychological Triggers'
    },
    {
      icon: '🧩',
      title: 'Generic Greetings & Details',
      description: 'Phishing campaigns are often bulk operations. If the message starts with "Dear customer" or "Valued employee" rather than your actual name, treat it with caution.',
      badge: 'Content Inspection'
    },
    {
      icon: '📁',
      title: 'Malicious Attachments',
      description: 'Invoices or shipping notices sent as zipped files (.zip) or script formats (.exe, .js) can infect your computer with malware. Preview attachments online or scan before saving.',
      badge: 'Malware Prevention'
    },
    {
      icon: '🔑',
      title: 'MFA Defense Layer',
      description: 'Enable Multi-Factor Authentication (MFA). Even if you accidentally reveal your credentials, attackers will not be able to log in without the secondary token.',
      badge: 'Access Management'
    }
  ];

  const checkedCount = checklist.filter(i => i.checked).length;

  return (
    <div>
      <div className="widget-header" style={{ borderBottom: 'none', marginBottom: '0.5rem' }}>
        <div>
          <h1 className="section-title">Security Education & Tips</h1>
          <p className="section-subtitle">Learn core tactics to recognize phishing and maintain a safe digital footprint.</p>
        </div>
      </div>

      {/* Checklist Widget */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2 className="widget-title" style={{ marginBottom: '0.5rem' }}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="widget-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Active Defense Checklist
        </h2>
        <p className="section-subtitle" style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Check your daily compliance habits. You have completed {checkedCount} of {checklist.length} actions.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {checklist.map((item) => (
            <label 
              key={item.id} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                padding: '0.75rem 1rem', 
                background: item.checked ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                border: '1px solid',
                borderColor: item.checked ? 'var(--color-safe)' : 'var(--card-border)',
                borderRadius: 'var(--border-radius-sm)',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleCheck(item.id)}
                style={{ 
                  width: '18px', 
                  height: '18px', 
                  accentColor: 'var(--color-safe)',
                  cursor: 'pointer'
                }}
              />
              <span style={{ 
                fontSize: '0.9rem', 
                color: item.checked ? 'var(--text-primary)' : 'var(--text-secondary)',
                textDecoration: item.checked ? 'line-through' : 'none'
              }}>
                {item.text}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Grid of Tips */}
      <div className="tips-grid">
        {tips.map((tip, idx) => (
          <div key={idx} className="glass-card tip-card">
            <div className="tip-icon-wrapper">
              {tip.icon}
            </div>
            <h3 className="tip-title">{tip.title}</h3>
            <p className="tip-description">{tip.description}</p>
            <span className="tip-badge">{tip.badge}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
