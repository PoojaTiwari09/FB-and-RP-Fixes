import React from 'react';

export default function TopBar({ role = 'Sales Manager', onRoleChange }) {
  return (
    <div className="topbar">
      <div className="topbar-title">
        Revenue Intelligence UI - {role}
        <svg className="topbar-dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  );
}
