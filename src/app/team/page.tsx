'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TeamPage() {
  const [quizId, setQuizId] = useState('');
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (quizId.trim()) {
      router.push(`/quiz/${quizId.trim()}/team`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">👥 Join Quiz</h1>
        
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Quiz ID</label>
            <input
              type="text"
              value={quizId}
              onChange={(e) => setQuizId(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter Quiz ID from host"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 py-3 rounded-lg font-semibold"
          >
            Join Quiz
          </button>
        </form>
      </div>
    </div>
  );
}
