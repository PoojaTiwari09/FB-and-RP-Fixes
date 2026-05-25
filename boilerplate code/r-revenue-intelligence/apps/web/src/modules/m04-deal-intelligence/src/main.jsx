import React from 'react';
import ReactDOM from 'react-dom/client';
import DealDriversApp from './DealDriversApp.jsx';

// Demo: set a fake JWT so the app works without a real auth server
if (!localStorage.getItem('authToken')) {
  // A minimal fake JWT — payload = { sub: 'm1', roles: ['sales_manager'], name: 'Sarah Chen' }
  const fakeHeader = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const fakePayload = btoa(JSON.stringify({
    sub: 'm1',
    roles: ['sales_manager'],
    name: 'Sarah Chen',
    email: 'sarah@company.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400,
  }));
  localStorage.setItem('authToken', `${fakeHeader}.${fakePayload}.fake-sig`);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DealDriversApp />
  </React.StrictMode>
);
