'use client';

import Link from 'next/link';
import { Monitor, Users, Eye } from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const [spectatorId, setSpectatorId] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">Quiz Platform</h1>
          <p className="text-lg text-slate-400">Real-time multiplayer quiz system</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/host"
            className="group bg-slate-800/50 backdrop-blur border border-slate-700 hover:border-indigo-500 p-8 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/20"
          >
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                <Monitor className="w-8 h-8 text-indigo-400" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2 text-center">Host</h2>
            <p className="text-slate-400 text-sm text-center">Manage quiz sessions</p>
          </Link>

          <Link
            href="/team"
            className="group bg-slate-800/50 backdrop-blur border border-slate-700 hover:border-emerald-500 p-8 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/20"
          >
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                <Users className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2 text-center">Team</h2>
            <p className="text-slate-400 text-sm text-center">Join and participate</p>
          </Link>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 p-8 rounded-xl">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-amber-500/10 rounded-lg">
                <Eye className="w-8 h-8 text-amber-400" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2 text-center">Spectator</h2>
            <p className="text-slate-400 text-sm text-center mb-4">Watch live</p>
            <input
              type="text"
              placeholder="Quiz ID"
              value={spectatorId}
              onChange={(e) => setSpectatorId(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-slate-900/50 text-white placeholder-slate-500 border border-slate-700 focus:outline-none focus:border-amber-500 transition-colors text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && spectatorId.trim()) {
                  window.location.href = `/quiz/${spectatorId.trim()}/spectator`;
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
