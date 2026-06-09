'use client';

import { useEffect, useState } from 'react';

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('sales_rep');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [demoUsers, setDemoUsers] = useState<any[]>([]);
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load demo users from localStorage (or defaults)
  useEffect(() => {
    const defaultUsers = [
      { id: 'usr_manager_001', name: 'Alex Morgan', role: 'sales_manager', email: 'alex.morgan@relanto.com', password: 'password123' },
      { id: 'usr_sarah_123', name: 'Sarah Chen', role: 'sales_rep', email: 'sarah.chen@relanto.com', password: 'password123' },
      { id: 'usr_michael_002', name: 'Michael Rodriguez', role: 'sales_rep', email: 'michael.rod@relanto.com', password: 'password123' },
      { id: 'usr_david_003', name: 'David Park', role: 'sales_rep', email: 'david.park@relanto.com', password: 'password123' },
      { id: 'usr_sujeevan_005', name: 'Sujeevan', role: 'sales_rep', email: 'sujeevan@relanto.com', password: 'password123' }
    ];

    const stored = localStorage.getItem('demo_users');
    if (stored) {
      try {
        setDemoUsers(JSON.parse(stored));
      } catch (e) {
        setDemoUsers(defaultUsers);
      }
    } else {
      setDemoUsers(defaultUsers);
      localStorage.setItem('demo_users', JSON.stringify(defaultUsers));
    }
  }, []);

  const handleProfileClick = (user: any) => {
    setIsRegistering(false);
    setEmail(user.email);
    setPassword(user.password);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!name || !email || !password) {
        throw new Error('Please fill out all fields to register.');
      }
      
      const exists = demoUsers.find(u => u.email === email);
      if (exists) {
        throw new Error(`Registration Failed: A user with email ${email} already exists!`);
      }

      const newUser = {
        id: `usr_custom_${Date.now()}`,
        name,
        role,
        email,
        password
      };

      const updatedUsers = [...demoUsers, newUser];
      setDemoUsers(updatedUsers);
      localStorage.setItem('demo_users', JSON.stringify(updatedUsers));

      showToast(`Successfully registered ${name}! You can now log in.`, 'success');
      
      // Reset to login form
      setIsRegistering(false);
      setName('');
      
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      showToast(err.message || 'Registration failed due to invalid inputs.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = demoUsers.find(u => u.email === email && u.password === password);
      
      if (!user) {
        throw new Error(`Login Failed: The email "${email}" or password you entered is incorrect. If you haven't registered yet, please create an account.`);
      }

      await new Promise(resolve => setTimeout(resolve, 600));

      const mockJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ id: user.id, role: user.role, email: user.email }))}.mock-signature-123`;
      
      document.cookie = `rbac_token=${mockJwt}; path=/;`;
      document.cookie = `user_id=${user.id}; path=/;`;
      document.cookie = `user_role=${user.role}; path=/;`;
      document.cookie = `rbac_user_json=${encodeURIComponent(JSON.stringify(user))}; path=/;`;

      showToast(`Welcome back, ${user.name}! Redirecting securely...`, 'success');

      setTimeout(() => {
        if (user.role === 'sales_manager') {
          window.location.href = '/revenue';
        } else {
          window.location.href = '/engage';
        }
      }, 800);
      
    } catch (err: any) {
      setError(err.message || 'Login failed');
      showToast(err.message || 'Failed to securely authenticate user.', 'error');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 font-sans relative">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`absolute top-6 left-1/2 -translate-x-1/2 px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 transition-all duration-300 transform translate-y-0 opacity-100 ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
        }`}>
          {toast.type === 'error' ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8">
        
        {/* Left Side: Auth Form */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl flex flex-col justify-center">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              R-Revenue
            </h1>
            <p className="text-gray-400 mt-2 text-sm">
              {isRegistering ? 'Create a new testing account' : 'Sign in to your account'}
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
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
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
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                placeholder="name@company.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Account Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors appearance-none"
                >
                  <option value="sales_rep">Sales Representative</option>
                  <option value="sales_manager">Sales Manager</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-70 disabled:cursor-not-allowed mt-4 shadow-lg shadow-indigo-500/30"
            >
              {isLoading ? 'Processing...' : (isRegistering ? 'Register Account' : 'Sign In')}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-400">
            {isRegistering ? (
              <>Already have an account? <button onClick={() => { setIsRegistering(false); setError(''); }} className="text-indigo-400 hover:text-indigo-300 font-medium ml-1">Sign In</button></>
            ) : (
              <>Don't have an account? <button onClick={() => { setIsRegistering(true); setError(''); }} className="text-indigo-400 hover:text-indigo-300 font-medium ml-1">Register Now</button></>
            )}
          </div>
        </div>

        {/* Right Side: Demo Quick Profiles */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-8 flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Quick Test Profiles</h2>
              <p className="text-sm text-gray-400 mt-1">Click a profile to auto-fill credentials</p>
            </div>
            <div className="bg-gray-700 text-xs font-bold px-2 py-1 rounded text-gray-300">
              {demoUsers.length} Users
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {demoUsers.map(u => (
              <div
                key={u.id}
                onClick={() => handleProfileClick(u)}
                className="bg-gray-800 border border-gray-700 hover:border-indigo-500/50 rounded-xl p-4 transition-all cursor-pointer flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold shadow-inner">
                  {u.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-medium group-hover:text-indigo-300 transition-colors">{u.name}</div>
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
