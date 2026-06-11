'use client';

import { useState } from 'react';
import {
  loginRequest,
  persistAuthSession,
  registerRequest,
} from '@shared/lib/auth-api.client';

const DEMO_PROFILES = [
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Alex Morgan',
    role: 'sales_manager' as const,
    email: 'alex.morgan@relanto.com',
    password: 'Password123!',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Sarah Chen',
    role: 'sales_rep' as const,
    email: 'sarah.chen@relanto.com',
    password: 'Password123!',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Michael Rodriguez',
    role: 'sales_rep' as const,
    email: 'michael.rod@relanto.com',
    password: 'Password123!',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'David Park',
    role: 'sales_rep' as const,
    email: 'david.park@relanto.com',
    password: 'Password123!',
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    name: 'Sujeevan',
    role: 'sales_rep' as const,
    email: 'sujeevan@relanto.com',
    password: 'Password123!',
  },
];

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'sales_rep' | 'sales_manager'>('sales_rep');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleProfileClick = (user: (typeof DEMO_PROFILES)[number]) => {
    setIsRegistering(false);
    setEmail(user.email);
    setPassword(user.password);
  };

  const redirectAfterAuth = (frontendRole: string) => {
    window.location.href = frontendRole === 'sales_manager' ? '/revenue' : '/engage';
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!name || !email || !password) {
        throw new Error('Please fill out all fields to register.');
      }

      const payload = await registerRequest({ name, email, password, role });
      persistAuthSession(payload);
      showToast(`Successfully registered ${name}!`, 'success');
      setTimeout(() => redirectAfterAuth(payload.user.frontendRole), 600);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      showToast(message, 'error');
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const payload = await loginRequest(email, password);
      persistAuthSession(payload);
      showToast(`Welcome back, ${payload.user.name}!`, 'success');
      setTimeout(() => redirectAfterAuth(payload.user.frontendRole), 600);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      showToast(message, 'error');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 font-sans relative">
      {toast && (
        <div
          className={`absolute top-6 left-1/2 -translate-x-1/2 px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 ${
            toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
          }`}
        >
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl flex flex-col justify-center">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              R-Revenue
            </h1>
            <p className="text-gray-400 mt-2 text-sm">
              {isRegistering ? 'Create a new account (tenant: relanto)' : 'Sign in with your JWT account'}
            </p>
          </div>

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="John Doe"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="name@relanto.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Password123!"
                required
              />
            </div>

            {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Account Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'sales_rep' | 'sales_manager')}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="sales_rep">Sales Representative</option>
                  <option value="sales_manager">Sales Manager</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? 'Processing...' : isRegistering ? 'Register Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            {isRegistering ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(false);
                    setError('');
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-medium ml-1"
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(true);
                    setError('');
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-medium ml-1"
                >
                  Register Now
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-8 flex flex-col">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Seeded Test Profiles</h2>
            <p className="text-sm text-gray-400 mt-1">Tenant slug: <code className="text-indigo-300">relanto</code> · Password: <code className="text-indigo-300">Password123!</code></p>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {DEMO_PROFILES.map((u) => (
              <div
                key={u.id}
                onClick={() => handleProfileClick(u)}
                className="bg-gray-800 border border-gray-700 hover:border-indigo-500/50 rounded-xl p-4 transition-all cursor-pointer flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                  {u.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-gray-400">{u.email}</div>
                </div>
                <div className="px-2 py-1 bg-gray-900 rounded text-xs font-medium text-gray-400 border border-gray-700">
                  {u.role === 'sales_manager' ? 'Manager' : 'Sales Rep'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
