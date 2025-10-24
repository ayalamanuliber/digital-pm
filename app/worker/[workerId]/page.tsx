'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  CheckCircle,
  X,
  AlertCircle,
  Loader2,
  TrendingUp,
  Award,
  Zap,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import PremiumLaborCard from '@/components/features/labor/PremiumLaborCard';

interface Task {
  id: string;
  description: string;
  status: string;
  projectId: string;
  projectNumber: string;
  projectClient: string;
  projectAddress: string;
  projectColor: string;
  scheduledDate?: string;
  scheduledTime?: string;
  estimatedHours?: number;
  price?: number;
  amount?: number;
  type?: string;
  notes?: string;
}

interface Worker {
  id: string;
  name: string;
  skills: string[];
}

export default function WorkerDashboard() {
  const params = useParams();
  const router = useRouter();
  const workerId = params.workerId as string;

  const [worker, setWorker] = useState<Worker | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  useEffect(() => {
    // Check if worker is logged in
    const storedWorkerId = sessionStorage.getItem('workerId');
    const workerName = sessionStorage.getItem('workerName');

    if (!storedWorkerId || storedWorkerId !== workerId) {
      router.push('/worker-login');
      return;
    }

    if (workerName) {
      setWorker({ id: workerId, name: workerName, skills: [] });
    }

    loadTasks();

    // Poll for updates every 5 seconds
    const interval = setInterval(loadTasks, 5000);
    return () => clearInterval(interval);
  }, [workerId, router]);

  const loadTasks = async () => {
    try {
      const response = await fetch(`/api/worker/tasks?workerId=${workerId}`);
      const data = await response.json();

      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTask = async (task: Task) => {
    setActionLoading(`accept-${task.id}`);

    try {
      const response = await fetch('/api/worker/update-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: task.projectId,
          taskId: task.id,
          workerId,
          action: 'accept',
        }),
      });

      const data = await response.json();

      if (data.success) {
        await loadTasks();
      }
    } catch (error) {
      console.error('Failed to accept task:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectTask = async () => {
    if (!selectedTask || !rejectReason.trim()) return;

    setActionLoading(`reject-${selectedTask.id}`);

    try {
      const response = await fetch('/api/worker/update-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedTask.projectId,
          taskId: selectedTask.id,
          workerId,
          action: 'reject',
          reason: rejectReason,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowRejectModal(false);
        setRejectReason('');
        setSelectedTask(null);
        await loadTasks();
      }
    } catch (error) {
      console.error('Failed to reject task:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartWork = async (task: Task) => {
    // Mark task as in_progress and show PremiumLaborCard
    await fetch('/api/worker/update-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: task.projectId,
        taskId: task.id,
        workerId,
        action: 'start',
      }),
    });

    setActiveTask(task);
  };

  const getRelativeDate = (dateString?: string): string => {
    if (!dateString) return 'No date set';

    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);

    if (taskDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (taskDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return taskDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getTasksByStatus = () => {
    const pending = tasks.filter((t) => t.status === 'pending_acceptance');
    const confirmed = tasks.filter((t) => t.status === 'confirmed' || t.status === 'accepted');
    const inProgress = tasks.filter((t) => t.status === 'in_progress');
    const completed = tasks.filter((t) => t.status === 'completed');

    return { pending, confirmed, inProgress, completed };
  };

  const { pending, confirmed, inProgress, completed } = getTasksByStatus();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-bold">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show PremiumLaborCard when worker starts a task
  if (activeTask) {
    return (
      <div className="relative">
        <button
          onClick={() => setActiveTask(null)}
          className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg font-bold text-slate-700 hover:bg-white transition-all"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <PremiumLaborCard
          taskData={{
            id: activeTask.id,
            taskName: activeTask.description,
            clientName: activeTask.projectClient,
            address: activeTask.projectAddress,
            date: activeTask.scheduledDate || 'TBD',
            time: activeTask.scheduledTime || '9:00 AM',
            duration: `${activeTask.estimatedHours || 2}-${(activeTask.estimatedHours || 2) + 1} hours`,
            assignedTo: worker?.name || 'Worker',
            projectId: activeTask.projectId,
            projectNumber: activeTask.projectNumber,
            notes: activeTask.notes ? [activeTask.notes] : [],
            contacts: { office: '(303) 555-0199' },
          }}
          workerId={workerId}
          onComplete={async () => {
            await loadTasks();
            setActiveTask(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 shadow-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center font-black text-xl">
                  {worker?.name?.charAt(0) || 'W'}
                </div>
                <div>
                  <h1 className="text-2xl font-black">{worker?.name || 'Worker'}</h1>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Zap size={14} />
                    <span>Active</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                sessionStorage.clear();
                router.push('/worker-login');
              }}
              className="text-sm text-slate-300 hover:text-white font-bold"
            >
              Logout
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur rounded-xl p-3">
              <div className="text-2xl font-black mb-1">{tasks.length}</div>
              <div className="text-xs text-slate-300">Total Tasks</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3">
              <div className="text-2xl font-black mb-1">{pending.length}</div>
              <div className="text-xs text-slate-300">Need Action</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3">
              <div className="text-2xl font-black mb-1">{completed.length}</div>
              <div className="text-xs text-slate-300">Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6 mt-6">
        {/* Pending Tasks */}
        {pending.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <AlertCircle size={20} className="text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Waiting for You</h2>
                <p className="text-sm text-slate-600">{pending.length} task{pending.length !== 1 ? 's' : ''} need your response</p>
              </div>
            </div>

            <div className="space-y-3">
              {pending.map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl shadow-lg border-2 border-orange-200 p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div
                        className="inline-block px-2 py-1 rounded-lg text-xs font-bold mb-2"
                        style={{ backgroundColor: task.projectColor + '20', color: task.projectColor }}
                      >
                        #{task.projectNumber}
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mb-1">{task.description}</h3>
                      <p className="text-sm text-slate-600 mb-3">{task.projectClient}</p>

                      <div className="flex flex-wrap gap-3 text-sm">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Calendar size={16} />
                          <span className="font-bold">{getRelativeDate(task.scheduledDate)}</span>
                        </div>
                        {task.scheduledTime && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <Clock size={16} />
                            <span className="font-bold">{task.scheduledTime}</span>
                          </div>
                        )}
                        {task.estimatedHours && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <TrendingUp size={16} />
                            <span className="font-bold">{task.estimatedHours}h</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-start gap-2 mt-3 bg-blue-50 p-3 rounded-xl">
                        <MapPin size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm font-bold text-blue-900">{task.projectAddress}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptTask(task)}
                      disabled={actionLoading === `accept-${task.id}`}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:scale-[0.98] text-white font-black py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading === `accept-${task.id}` ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <>
                          <CheckCircle size={20} />
                          Accept
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTask(task);
                        setShowRejectModal(true);
                      }}
                      className="flex-1 border-2 border-slate-300 hover:border-red-500 hover:bg-red-50 active:scale-[0.98] text-slate-700 hover:text-red-600 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <X size={20} />
                      Can't Do
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confirmed/In Progress Tasks */}
        {(confirmed.length > 0 || inProgress.length > 0) && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <CheckCircle size={20} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Your Schedule</h2>
                <p className="text-sm text-slate-600">{confirmed.length + inProgress.length} task{confirmed.length + inProgress.length !== 1 ? 's' : ''} scheduled</p>
              </div>
            </div>

            <div className="space-y-3">
              {[...confirmed, ...inProgress].map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="px-2 py-1 rounded-lg text-xs font-bold"
                          style={{ backgroundColor: task.projectColor + '20', color: task.projectColor }}
                        >
                          #{task.projectNumber}
                        </div>
                        {task.status === 'in_progress' && (
                          <div className="px-2 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-700">
                            IN PROGRESS
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mb-1">{task.description}</h3>
                      <p className="text-sm text-slate-600 mb-3">{task.projectClient}</p>

                      <div className="flex flex-wrap gap-3 text-sm mb-3">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Calendar size={16} />
                          <span className="font-bold">{getRelativeDate(task.scheduledDate)}</span>
                        </div>
                        {task.scheduledTime && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <Clock size={16} />
                            <span className="font-bold">{task.scheduledTime}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-xl">
                        <MapPin size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm font-bold text-blue-900">{task.projectAddress}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(task.projectAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <MapPin size={20} />
                      Directions
                    </a>
                    {task.status !== 'in_progress' && (
                      <button
                        onClick={() => handleStartWork(task)}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:scale-[0.98] text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Zap size={20} />
                        Start Work
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award size={40} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">All Caught Up!</h3>
            <p className="text-slate-600">No tasks assigned yet. Check back later.</p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Can't Do This Task?</h3>
                <p className="text-sm text-slate-600">Let us know why</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Reason (required)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="E.g., Schedule conflict, don't have tools, too far, etc."
                className="w-full h-32 p-4 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedTask(null);
                }}
                className="flex-1 border-2 border-slate-300 hover:border-slate-400 active:scale-[0.98] text-slate-700 font-bold py-3 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectTask}
                disabled={!rejectReason.trim() || actionLoading === `reject-${selectedTask.id}`}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:scale-[0.98] text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading === `reject-${selectedTask.id}` ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Contact Button */}
      <a
        href="tel:(303)555-0199"
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-50"
      >
        <Phone size={24} />
      </a>
    </div>
  );
}
