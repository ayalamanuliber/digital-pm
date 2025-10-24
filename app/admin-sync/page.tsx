'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function AdminSyncPage() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const syncToCloud = async () => {
    setLoading(true);
    setStatus('Reading localStorage...');

    try {
      // Get data from localStorage
      const projectsStr = localStorage.getItem('projects');
      const workersStr = localStorage.getItem('workers');

      if (!projectsStr && !workersStr) {
        setStatus('❌ No data found in localStorage. Please add workers/projects first.');
        setLoading(false);
        return;
      }

      const projects = projectsStr ? JSON.parse(projectsStr) : [];
      const workers = workersStr ? JSON.parse(workersStr) : [];

      setStatus(`Found ${workers.length} workers and ${projects.length} projects. Syncing to cloud...`);

      // Send to cloud
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects, workers }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus(`✅ SUCCESS! Synced ${workers.length} workers and ${projects.length} projects to cloud.\n\nWorker PINs:`);

        // Show worker PINs
        if (workers.length > 0) {
          const pinList = workers.map((w: any) => `• ${w.name}: ${w.pin || 'NO PIN - Add one!'}`).join('\n');
          setStatus(prev => prev + '\n\n' + pinList);
        }
      } else {
        setStatus(`❌ Sync failed: ${data.error}`);
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
          <Button
            onClick={syncToCloud}
            disabled={loading}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            {loading ? 'Syncing...' : '🚀 Sync to Cloud Now'}
          </Button>

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
