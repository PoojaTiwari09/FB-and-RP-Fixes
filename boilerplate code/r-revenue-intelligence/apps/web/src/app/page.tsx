'use client';
import React, { useEffect, useState } from 'react';
import M06ForecastingPage from '../modules/m06-forecasting-prediction/page';
import ManagerDashboard from '../modules/m06-forecasting-prediction/ManagerDashboard';
import CroDashboard from '../modules/m06-forecasting-prediction/CroDashboard';

export default function RootPage() {
  const [user, setUser] = useState<any>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('m6_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setChecked(true);
  }, []);

  useEffect(() => {
    if (checked && !user) {
      window.location.href = '/login';
    }
  }, [checked, user]);

  const handleLogout = () => {
    localStorage.removeItem('m6_user');
    window.location.href = '/login';
  };

  if (!checked || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user.role === 'manager') {
    return <ManagerDashboard user={user} onLogout={handleLogout} />;
  }

  if (user.role === 'executive') {
    return <CroDashboard user={user} onLogout={handleLogout} />;
  }

  return <M06ForecastingPage user={user} onLogout={handleLogout} />;
}
