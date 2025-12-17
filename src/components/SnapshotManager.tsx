'use client';

import { useState, useEffect } from 'react';
import { Save, RotateCcw, Trash2, Clock } from 'lucide-react';
import { createSnapshot, restoreSnapshot, deleteSnapshot, createAutoSnapshot, getSnapshots } from '@/lib/snapshot';

interface Snapshot {
  id: string;
  name: string;
  createdAt: string;
}

function ClientTimestamp({ date }: { date: string }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return <span>Loading...</span>;
  
  return <span>{new Date(date).toLocaleString()}</span>;
}

export default function SnapshotManager({ quizId, snapshots: initialSnapshots, quizStatus }: { quizId: string; snapshots: Snapshot[]; quizStatus: string }) {
  const [snapshots, setSnapshots] = useState(initialSnapshots);
  const [snapshotName, setSnapshotName] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoSnapshotEnabled, setAutoSnapshotEnabled] = useState(true);
  const [autoInterval, setAutoInterval] = useState(30);
  const [showAll, setShowAll] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage after mount
  useEffect(() => {
    setMounted(true);
    const savedEnabled = localStorage.getItem('autoSnapshotEnabled');
    const savedInterval = localStorage.getItem('autoSnapshotInterval');
    
    if (savedEnabled !== null) {
      setAutoSnapshotEnabled(savedEnabled === 'true');
    }
    if (savedInterval) {
      setAutoInterval(Number(savedInterval));
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('autoSnapshotEnabled', String(autoSnapshotEnabled));
    }
  }, [autoSnapshotEnabled, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('autoSnapshotInterval', String(autoInterval));
    }
  }, [autoInterval, mounted]);

  useEffect(() => {
    if (!autoSnapshotEnabled || quizStatus !== 'active') return;

    const interval = setInterval(async () => {
      const result = await createAutoSnapshot(quizId);
      if (result.success) {
        // Silently fetch updated snapshots without reload
        const updated = await getSnapshots(quizId);
        setSnapshots(JSON.parse(JSON.stringify(updated)));
      }
    }, autoInterval * 1000);

    return () => clearInterval(interval);
  }, [quizId, autoSnapshotEnabled, quizStatus, autoInterval]);

  const handleCreateSnapshot = async () => {
    if (!snapshotName.trim()) {
      alert('Please enter a snapshot name');
      return;
    }
    
    setLoading(true);
    const result = await createSnapshot(quizId, snapshotName);
    if (result.success) {
      window.location.reload();
    } else {
      alert('Failed to create snapshot');
    }
    setLoading(false);
  };

  const handleRestore = async (snapshotId: string) => {
    if (!confirm('Are you sure you want to restore this snapshot? Current state will be lost.')) return;
    
    setLoading(true);
    const result = await restoreSnapshot(snapshotId);
    if (result.success) {
      window.location.reload();
    } else {
      alert('Failed to restore snapshot');
    }
    setLoading(false);
  };

  const handleDelete = async (snapshotId: string) => {
    if (!confirm('Delete this snapshot?')) return;
    
    setLoading(true);
    await deleteSnapshot(snapshotId);
    window.location.reload();
    setLoading(false);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-6 border border-slate-700/50">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        <Save className="w-6 h-6" />
        Quiz Snapshots
      </h2>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-white/70 text-sm">
            Save the current quiz state to restore later if something goes wrong
          </p>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={autoSnapshotEnabled}
                onChange={(e) => setAutoSnapshotEnabled(e.target.checked)}
                className="rounded"
              />
              Auto-save every
            </label>
            <select
              value={autoInterval}
              onChange={(e) => setAutoInterval(Number(e.target.value))}
              disabled={!autoSnapshotEnabled}
              className="px-2 py-1 rounded bg-slate-700 text-white text-sm border border-slate-600 disabled:opacity-50"
            >
              <option value={15}>15s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={120}>2m</option>
              <option value={300}>5m</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={snapshotName}
            onChange={(e) => setSnapshotName(e.target.value)}
            placeholder="Snapshot name (e.g., After Question 5)"
            className="flex-1 px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={handleCreateSnapshot}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Saved Snapshots ({snapshots.length})</h3>
          {snapshots.length > 2 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              {showAll ? 'Show Less' : 'Show All'}
            </button>
          )}
        </div>
        {snapshots.length === 0 ? (
          <p className="text-white/50 text-sm">No snapshots yet</p>
        ) : (
          (showAll ? snapshots : snapshots.slice(0, 2)).map((snapshot) => (
            <div
              key={snapshot.id}
              className="flex items-center justify-between p-4 bg-slate-900/30 rounded-lg border border-slate-700/50"
            >
              <div>
                <div className="text-white font-semibold">{snapshot.name}</div>
                <div className="text-white/50 text-sm flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  <ClientTimestamp date={snapshot.createdAt} />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRestore(snapshot.id)}
                  disabled={loading}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restore
                </button>
                <button
                  onClick={() => handleDelete(snapshot.id)}
                  disabled={loading}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
