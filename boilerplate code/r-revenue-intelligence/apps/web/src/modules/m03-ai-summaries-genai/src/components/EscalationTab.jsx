import React, { useState } from 'react';
import { askAnything, createResearchJob } from '../services/api';

export default function EscalationTab({ query: initialQuery, onRunDeepAnalysis }) {
  const [askQuery, setAskQuery] = useState('');
  const [conversation, setConversation] = useState({
    question: initialQuery || "Which objections are most common in my team's mid-market calls?",
    answer: `Based on recent call analysis, the most common objections in mid-market calls are:

1. **Integration complexity** - mentioned in ~45% of calls
2. **Pricing concerns** - mentioned in ~38% of calls
3. **Incumbent vendor relationships** - mentioned in ~31% of calls

These patterns appear consistently across your team, though resolution rates vary significantly by rep.`,
  });
  const [isAsking, setIsAsking] = useState(false);

  const handleAskQuestion = async () => {
    if (!askQuery.trim()) return;
    setIsAsking(true);
    try {
      const response = await askAnything({ query: askQuery });
      setConversation({
        question: askQuery,
        answer: response.answer || 'Could not generate an answer.',
      });
      setAskQuery('');
    } catch (err) {
      console.error(err);
    }
    setIsAsking(false);
  };

  const handleRunDeepAnalysis = () => {
    if (onRunDeepAnalysis) {
      onRunDeepAnalysis();
    }
  };

  // Format answer text with bold markers
  const renderAnswer = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="escalation-content">
      {/* Ask Anything Session Indicator */}
      <div className="ask-session-indicator">
        <span className="ask-session-dot" />
        Ask Anything Session
      </div>

      {/* Your Question */}
      <div className="question-card">
        <div className="question-label">Your Question</div>
        <div className="question-text">{conversation.question}</div>
      </div>

      {/* AI Answer */}
      <div className="answer-card">
        <div className="answer-label">
          <svg className="sparkle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          AI Answer
        </div>
        <div className="answer-text">
          {conversation.answer.split('\n').map((line, i) => {
            if (!line.trim()) return <br key={i} />;
            return <p key={i}>{renderAnswer(line)}</p>;
          })}
        </div>
      </div>

      {/* Deep Analysis CTA */}
      <div className="deep-analysis-cta">
        <div className="deep-analysis-cta-header">
          <div className="cta-brain-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a9 9 0 0 1 9 9c0 3.6-2.4 6.6-5.7 7.7L12 22l-3.3-3.3C5.4 17.6 3 14.6 3 11a9 9 0 0 1 9-9z" />
              <path d="M12 6v4" /><path d="M10 10h4" />
            </svg>
          </div>
          <div>
            <div className="cta-title">Want a deeper analysis?</div>
          </div>
        </div>

        <div className="cta-description">
          AI Deep Researcher can generate a comprehensive, evidence-backed report with detailed findings, citation-level evidence, trend analysis, and actionable recommendations. This typically includes:
        </div>

        <ul className="cta-features">
          <li>Statistical analysis across all relevant calls and data sources</li>
          <li>Rep-level performance breakdowns with coaching priorities</li>
          <li>Direct citations with deep links to specific call moments</li>
          <li>Trend detection and predictive insights</li>
        </ul>

        <button className="btn-deep-analysis" onClick={handleRunDeepAnalysis}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <path d="M12 2a9 9 0 0 1 9 9c0 3.6-2.4 6.6-5.7 7.7L12 22l-3.3-3.3C5.4 17.6 3 14.6 3 11a9 9 0 0 1 9-9z" />
          </svg>
          Run Deep Analysis →
        </button>
      </div>

      {/* Footer note */}
      <div className="deep-analysis-footer">
        Deep analysis typically completes in 2-3 minutes and will appear in your Report History.
      </div>
    </div>
  );
}
