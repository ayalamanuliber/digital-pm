'use client';

import { useState } from 'react';

export default function AdminSyncPage() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const checkCloudData = async () => {
    setDebugInfo('Checking cloud database...');
    try {
      const response = await fetch('/api/debug/kv');
      const data = await response.json();

      if (data.success) {
        const info = `📊 CLOUD DATABASE STATUS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Workers: ${data.data.workerCount}
Workers with PINs: ${data.data.workersWithPins}
Projects: ${data.data.projectCount}
Last Sync: ${data.data.timestamp}

${data.data.workers.length > 0 ? `\nWORKERS IN CLOUD:\n${data.data.workers.map((w: any) => `• ${w.name}: PIN = ${w.pin || 'MISSING!'}`).join('\n')}` : 'No workers in cloud yet!'}`;

        setDebugInfo(info);
      } else {
        setDebugInfo(`❌ Failed to check cloud: ${data.error}`);
      }
    } catch (error: any) {
      setDebugInfo(`❌ Error: ${error.message}`);
    }
  };

  const syncToCloud = async () => {
    setLoading(true);
    setStatus('Reading localStorage...');
    setDebugInfo('');

    try {
      // Get data from localStorage
      const projectsStr = localStorage.getItem('projects');
      const workersStr = localStorage.getItem('workers');

      if (!projectsStr && !workersStr) {
        setStatus('❌ No data found in localStorage.\n\nGo to your admin dashboard first, add workers with the Workers module, then come back here to sync!');
        setLoading(false);
        return;
      }

      const projects = projectsStr ? JSON.parse(projectsStr) : [];
      const workers = workersStr ? JSON.parse(workersStr) : [];

      setStatus(`Found ${workers.length} workers and ${projects.length} projects.\n\nChecking for PINs...`);

      // Check if workers have PINs
      const workersWithPins = workers.filter((w: any) => w.pin);
      const workersWithoutPins = workers.filter((w: any) => !w.pin);

      if (workersWithoutPins.length > 0) {
        setStatus(`⚠️ WARNING! ${workersWithoutPins.length} workers have NO PIN!\n\n${workersWithoutPins.map((w: any) => `• ${w.name}`).join('\n')}\n\nGo to Workers module and edit them to add PINs first!`);
        setLoading(false);
        return;
      }

      setStatus(`✓ All ${workers.length} workers have PINs.\n\nSyncing to cloud...`);

      // Send to cloud
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects, workers }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus(`✅ SUCCESS! Synced to cloud!\n\n📊 SYNCED DATA:\n• ${workers.length} workers\n• ${projects.length} projects\n\n🔑 WORKER PINs FOR LOGIN:`);

        // Show worker PINs
        if (workers.length > 0) {
          const pinList = workers.map((w: any) => `• ${w.name}: ${w.pin}`).join('\n');
          setStatus(prev => prev + '\n\n' + pinList + '\n\n✓ Workers can now login at:\nhttps://digital-pm-skku.vercel.app/worker-login');
        }
      } else {
        setStatus(`❌ Sync failed: ${JSON.stringify(data.error)}`);
      }
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin: Sync to Cloud</h1>
          <p className="text-gray-600">
            Push your workers and projects from localStorage to Vercel KV cloud storage
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={syncToCloud}
              disabled={loading}
              className="h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Syncing...' : '🚀 Sync to Cloud'}
            </button>
            <button
              onClick={checkCloudData}
              className="h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg shadow-lg transition-all"
            >
              🔍 Check Cloud
            </button>
          </div>

          {status && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <pre className="text-sm whitespace-pre-wrap font-mono text-gray-700">
                {status}
              </pre>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-semibold mb-2">📋 What this does:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Reads your workers and projects from browser localStorage</li>
              <li>Uploads them to Vercel KV cloud storage</li>
              <li>Enables workers to login from any device</li>
              <li>Shows you all worker PINs for testing</li>
            </ul>
          </div>

          <div className="text-center">
            <a href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
