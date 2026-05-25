import React, { useState } from 'react';

const filterConfig = {
  timePeriod: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    options: ['Last 7 days', 'Last 14 days', 'Last 30 days', 'Last 60 days', 'Last 90 days'],
  },
  segment: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 0 0 20" />
        <line x1="2" y1="12" x2="22" y2="12" />
      </svg>
    ),
    options: ['All Segments', 'Enterprise', 'Mid-Market', 'SMB'],
  },
  stage: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    options: ['All Stages', 'Discovery', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
  },
  region: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="10" r="3" /><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" />
      </svg>
    ),
    options: ['All Regions', 'West', 'East', 'North', 'South'],
  },
  team: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    options: ['All Teams', 'My Team (8 reps)', 'West Sales Team', 'East Sales Team'],
    isTeamChip: true,
  },
};

export default function FilterDropdowns({ filters, onChange }) {
  const [openDropdown, setOpenDropdown] = useState(null);

  const handleToggle = (key) => {
    setOpenDropdown(prev => prev === key ? null : key);
  };

  const handleSelect = (key, value) => {
    onChange(key, value);
    setOpenDropdown(null);
  };

  // Close dropdown on outside click
  React.useEffect(() => {
    const handler = () => setOpenDropdown(null);
    if (openDropdown) {
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  }, [openDropdown]);

  return (
    <div className="filter-bar">
      {Object.entries(filterConfig).map(([key, config]) => (
        <div key={key} className="filter-dropdown-wrapper" onClick={(e) => e.stopPropagation()}>
          <button
            className={`filter-chip ${config.isTeamChip ? 'team-chip' : ''}`}
            onClick={() => handleToggle(key)}
          >
            {config.icon}
            {filters[key]}
            <svg className="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {openDropdown === key && (
            <div className="filter-dropdown-menu">
              {config.options.map((option) => (
                <button
                  key={option}
                  className={`filter-dropdown-item ${filters[key] === option ? 'selected' : ''}`}
                  onClick={() => handleSelect(key, option)}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
