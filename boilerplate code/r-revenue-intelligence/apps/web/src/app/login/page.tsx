'use client';
import React, { useState } from 'react';
import Link from 'next/link';

const API = 'http://localhost:3001/api/v1/forecasting';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Invalid credentials');
      const user = await res.json();
      localStorage.setItem('m6_user', JSON.stringify(user));
      window.location.href = '/';
    } catch {
      // Demo fallback — allow preset demo accounts
      const demoUsers: Record<string, any> = {
        'cro@demo.com': { id: 'cro-01', name: 'Sarah Executive', role: 'executive', email: 'cro@demo.com', tenantId: 'demo-tenant-01' },
        'manager@demo.com': { id: 'mgr-01', name: 'Rajan Sharma', role: 'manager', email: 'manager@demo.com', tenantId: 'demo-tenant-01' },
        'rahul@demo.com': { id: 'usr-01', name: 'Rahul Kumar', role: 'sales_rep', repId: 'rep-01', email: 'rahul@demo.com', tenantId: 'demo-tenant-01' },
        'priya@demo.com': { id: 'usr-02', name: 'Priya Mehta', role: 'sales_rep', repId: 'rep-02', email: 'priya@demo.com', tenantId: 'demo-tenant-01' },
      };
      if (demoUsers[email] && (password === 'cro123' || password === 'manager123' || password === 'rep123')) {
        localStorage.setItem('m6_user', JSON.stringify(demoUsers[email]));
        window.location.href = '/';
      } else {
        setError('Invalid email or password. Try cro@demo.com / cro123');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 leading-none">M6 Forecasting</p>
              <p className="text-xs text-gray-400">AI Revenue Predictor</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your forecast workspace</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@company.com"
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-600 font-semibold hover:text-blue-700">Sign up</Link>
          </p>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-[11px] font-bold text-blue-700 mb-2">Demo credentials</p>
          <div className="space-y-1 text-[11px] text-blue-600 font-mono">
            <p>CRO: cro@demo.com / cro123</p>
            <p>Manager: manager@demo.com / manager123</p>
            <p>Sales Rep: rahul@demo.com / rep123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
