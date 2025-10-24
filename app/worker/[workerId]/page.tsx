'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import WorkerCalendarView from '@/components/features/worker-view/WorkerCalendarView';

export default function WorkerDashboard() {
  const params = useParams();
  const router = useRouter();
  const workerId = params.workerId as string;
  const [loading, setLoading] = useState(true);
  const [workerName, setWorkerName] = useState<string>('');

  useEffect(() => {
    // Check if worker is logged in
    const storedWorkerId = sessionStorage.getItem('workerId');
    const storedWorkerName = sessionStorage.getItem('workerName');

    if (!storedWorkerId || storedWorkerId !== workerId) {
      router.push('/worker-login');
      return;
    }

    if (storedWorkerName) {
      setWorkerName(storedWorkerName);
    }

    setLoading(false);
  }, [workerId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  return <WorkerCalendarView workerId={workerId} workerName={workerName} />;
}
