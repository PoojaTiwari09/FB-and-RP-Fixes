import React from 'react';

const exampleQuestions = [
  {
    text: 'What patterns distinguish our won deals from lost deals this quarter?',
    keywords: ['patterns', 'distinguish', 'won deals', 'lost deals', 'quarter'],
  },
  {
    text: 'Which reps have the highest talk-track adoption rate in discovery?',
    keywords: ['reps', 'talk-track', 'adoption rate', 'discovery'],
  },
  {
    text: 'How is integration complexity being handled across my West team?',
    keywords: ['integration complexity', 'West team'],
  },
];

export default function ExampleQuestions({ onQuestionClick }) {
  const renderWithKeywords = (text, keywords) => {
    let parts = [text];
    keywords.forEach((kw) => {
      const newParts = [];
      parts.forEach((part) => {
        if (typeof part !== 'string') {
          newParts.push(part);
          return;
        }
        const idx = part.toLowerCase().indexOf(kw.toLowerCase());
        if (idx === -1) {
          newParts.push(part);
          return;
        }
        if (idx > 0) newParts.push(part.slice(0, idx));
        newParts.push(
          <span key={kw + idx} className="keyword">
            {part.slice(idx, idx + kw.length)}
          </span>
        );
        if (idx + kw.length < part.length) newParts.push(part.slice(idx + kw.length));
      });
      parts = newParts;
    });
    return parts;
  };

  return (
    <div className="example-questions-section">
      <div className="example-questions-label">Example Questions</div>
      {exampleQuestions.map((eq, i) => (
        <div
          key={i}
          className="example-question-item"
          onClick={() => onQuestionClick(eq.text)}
        >
          {renderWithKeywords(eq.text, eq.keywords)}
        </div>
      ))}
    </div>
  );
}
