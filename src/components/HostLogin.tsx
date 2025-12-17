'use client';

import { useState } from 'react';
import { hostLogin } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { Lock, Monitor } from 'lucide-react';

export default function HostLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await hostLogin(password);
    if (result.success) {
      router.refresh();
    } else {
      setError('Invalid password');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-indigo-500/10 rounded-lg">
            <Monitor className="w-10 h-10 text-indigo-400" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2 text-center">Host Login</h1>
        <p className="text-slate-400 text-sm text-center mb-6">Enter password to access host dashboard</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-900/50 text-white border border-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Enter password"
                required
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                {error}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 py-3 rounded-lg font-medium text-white transition-colors"
          >
            Access Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
