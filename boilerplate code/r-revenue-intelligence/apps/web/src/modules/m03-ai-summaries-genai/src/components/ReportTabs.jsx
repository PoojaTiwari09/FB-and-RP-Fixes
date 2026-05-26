import React from 'react';

export default function ReportTabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="report-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`report-tab ${tab.isEscalation ? 'escalation' : ''} ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
