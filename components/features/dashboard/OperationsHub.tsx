'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Users, ListTodo, AlertTriangle, TrendingUp, Upload, Bell, Calendar, UserCheck, Zap, Clock, Eye, Briefcase, MessageSquare, Plus, ChevronDown, FileText, Settings } from 'lucide-react';
import type { ActiveProject, DashboardStats, Alert, Activity as ActivityType, Project, Task } from '@/types';
import MultiViewCalendar from '@/components/features/calendar/MultiViewCalendar';
import PremiumLaborCard from '@/components/features/labor/PremiumLaborCard';
import TaskAdminModal from '@/components/features/tasks/TaskAdminModal';
import GlobalTasksView from '@/components/features/tasks/GlobalTasksView';
import UploadAssignView from '@/components/features/upload/UploadAssignView';
import WorkersModule from '@/components/features/workers/WorkersModule';
import ProjectsModule from '@/components/features/projects/ProjectsModule';
import WorkerCalendarView from '@/components/features/worker-view/WorkerCalendarView';
import { BreadcrumbPath } from '@/components/features/projects/Breadcrumb';
import { storage } from '@/lib/localStorage';
import NotificationsPanel from '@/components/features/notifications/NotificationsPanel';
import MessagesCenter from '@/components/features/messages/MessagesCenter';
import SettingsPanel from '@/components/features/settings/SettingsPanel';
import { initializeAudio, playNotificationSound } from '@/lib/notificationSounds';

export default function OperationsHub() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [breadcrumbPath, setBreadcrumbPath] = useState<BreadcrumbPath>({ view: 'dashboard' });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const previousNotificationCount = React.useRef(0);

  const [workers, setWorkers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    storage.init();
    setWorkers(storage.getWorkers());
    setProjects(storage.getProjects());
    updateCounts();

    // Initialize audio context on first user interaction
    const initAudio = () => {
      initializeAudio();
      // Remove listener after first click
      document.removeEventListener('click', initAudio);
    };
    document.addEventListener('click', initAudio);

    const handleProjectsUpdate = () => {
      setProjects(storage.getProjects());
      updateCounts();
    };

    const handleNotificationsUpdate = () => {
      const newCount = storage.getUnreadNotificationCount();

      // Play sound if new notifications arrived
      if (newCount > previousNotificationCount.current && previousNotificationCount.current >= 0) {
        console.log('Playing notification sound: new =', newCount, 'prev =', previousNotificationCount.current);
        playNotificationSound('notification');
      }

      previousNotificationCount.current = newCount;
      updateCounts();
    };

    window.addEventListener('projectsUpdated', handleProjectsUpdate);
    window.addEventListener('notificationsUpdated', handleNotificationsUpdate);

    return () => {
      window.removeEventListener('projectsUpdated', handleProjectsUpdate);
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdate);
      document.removeEventListener('click', initAudio);
    };
  }, []);

  const updateCounts = () => {
    setNotificationCount(storage.getUnreadNotificationCount());
    setMessageCount(storage.getUnreadMessageCount());
  };

  const activeProjects = projects.filter((p: any) => p.status === 'active');
  const availableWorkers = workers.filter((w: any) => w.status === 'available');
  const totalTasks = projects.reduce((acc: number, p: any) => acc + p.tasks.length, 0);
  const completedTasks = projects.reduce((acc: number, p: any) => acc + p.tasks.filter((t: any) => t.status === 'completed').length, 0);

  const rejectedTasks = projects.flatMap((p: any) =>
    p.tasks
      .filter((t: any) => t.status === 'rejected')
      .map((t: any) => ({
        taskId: t.id,
        projectId: p.id,
        projectNumber: p.number,
        description: t.description,
        reason: t.rejectionReason,
        timestamp: t.updatedAt
      }))
  );

  const stats: DashboardStats = {
    teamAvailable: availableWorkers.length,
    teamTotal: workers.length,
    activeTasks: totalTasks - completedTasks,
    needsAction: rejectedTasks.length + notificationCount,
    performance: 4.85
  };

  const alerts: Alert[] = rejectedTasks.map((task: any) => ({
    id: task.taskId,
    title: `Task Rejected: ${task.description}`,
    description: `Reason: "${task.reason}" - Project #${task.projectNumber}`,
    timestamp: new Date(task.timestamp).toLocaleString(),
    priority: 'high' as const
  }));

  const activity: ActivityType[] = projects
    .flatMap((p: any) =>
      p.tasks.flatMap((t: any) =>
        (t.activity || []).map((a: any) => ({
          id: a.id,
          text: `Project #${p.number}: ${a.action} - ${t.description}`,
          timestamp: new Date(a.date).toLocaleString(),
          user: a.user
        }))
      )
    )
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  const quickActions = [
    { icon: Upload, label: 'Upload', color: 'from-blue-500 to-blue-600', action: 'upload' },
    { icon: ListTodo, label: 'Estimate', color: 'from-purple-500 to-purple-600', action: 'estimate' },
    { icon: UserCheck, label: 'Labor', color: 'from-green-500 to-green-600', action: 'labor' },
    { icon: Calendar, label: 'Calendar', color: 'from-orange-500 to-orange-600', action: 'calendar' },
    { icon: Bell, label: 'Reminders', color: 'from-pink-500 to-pink-600', action: 'reminders' },
    { icon: TrendingUp, label: 'Reports', color: 'from-cyan-500 to-cyan-600', action: 'reports' }
  ];

  const handleNavigate = (newPath: Partial<BreadcrumbPath>) => {
    setBreadcrumbPath(prev => ({ ...prev, ...newPath }));

    if (newPath.view === 'projects') {
      setActiveTab('projects');
    } else if (newPath.view === 'dashboard') {
      setActiveTab('dashboard');
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-12">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-base font-semibold text-gray-900 tracking-tight">Digital PM</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveTab('dashboard');
                    setBreadcrumbPath({ view: 'dashboard' });
                  }}
                  className={`px-4 py-2 font-medium text-sm transition-all ${
                    activeTab === 'dashboard'
                      ? 'text-gray-900'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Dashboard
                  {activeTab === 'dashboard' && (
                    <div className="h-0.5 bg-blue-600 mt-2 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setActiveTab('projects');
                    setBreadcrumbPath({ view: 'projects' });
                  }}
                  className={`px-4 py-2 font-medium text-sm transition-all ${
                    activeTab === 'projects'
                      ? 'text-gray-900'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Projects
                  {activeTab === 'projects' && (
                    <div className="h-0.5 bg-blue-600 mt-2 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`px-4 py-2 font-medium text-sm transition-all ${
                    activeTab === 'tasks'
                      ? 'text-gray-900'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Tasks
                  {activeTab === 'tasks' && (
                    <div className="h-0.5 bg-blue-600 mt-2 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('workers')}
                  className={`px-4 py-2 font-medium text-sm transition-all ${
                    activeTab === 'workers'
                      ? 'text-gray-900'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Workers
                  {activeTab === 'workers' && (
                    <div className="h-0.5 bg-blue-600 mt-2 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('worker-view')}
                  className={`px-4 py-2 font-medium text-sm transition-all ${
                    activeTab === 'worker-view'
                      ? 'text-gray-900'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Worker View
                  {activeTab === 'worker-view' && (
                    <div className="h-0.5 bg-blue-600 mt-2 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`px-4 py-2 font-medium text-sm transition-all ${
                    activeTab === 'calendar'
                      ? 'text-gray-900'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Calendar
                  {activeTab === 'calendar' && (
                    <div className="h-0.5 bg-blue-600 mt-2 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('materials')}
                  className={`px-4 py-2 font-medium text-sm transition-all ${
                    activeTab === 'materials'
                      ? 'text-gray-900'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Materials
                  {activeTab === 'materials' && (
                    <div className="h-0.5 bg-blue-600 mt-2 rounded-full" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowMessages(true)}
                className="p-2 hover:bg-gray-50 rounded-lg transition-all relative"
              >
                <MessageSquare className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                {messageCount > 0 && (
                  <span className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                    {messageCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowNotifications(true)}
                className="p-2 hover:bg-gray-50 rounded-lg transition-all relative"
              >
                <Bell className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                {notificationCount > 0 && (
                  <span className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 hover:bg-gray-50 rounded-lg transition-all"
              >
                <Settings className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
              </button>
              <div className="relative ml-2">
                <button
                  onClick={(e) => {
                    const dropdown = e.currentTarget.nextElementSibling as HTMLElement;
                    dropdown?.classList.toggle('hidden');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all text-sm"
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </button>
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 hidden z-50">
                  <button
                    onClick={(e) => {
                      setActiveTab('projects');
                      setBreadcrumbPath({ view: 'projects', subview: 'upload' });
                      const dropdown = e.currentTarget.parentElement as HTMLElement;
                      dropdown?.classList.add('hidden');
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 rounded-t-lg"
                  >
                    <Upload className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium">Upload Estimate</div>
                      <div className="text-xs text-gray-500">AI will parse the PDF</div>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      setActiveTab('projects');
                      setBreadcrumbPath({ view: 'projects', subview: 'add' });
                      const dropdown = e.currentTarget.parentElement as HTMLElement;
                      dropdown?.classList.add('hidden');
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 border-t border-gray-100 rounded-b-lg"
                  >
                    <FileText className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="font-medium">Manual Entry</div>
                      <div className="text-xs text-gray-500">Create from scratch</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="w-full">
        {activeTab === 'calendar' ? (
          <MultiViewCalendar />
        ) : activeTab === 'labor-preview' ? (
          <PremiumLaborCard />
        ) : activeTab === 'workers' ? (
          <WorkersModule />
        ) : activeTab === 'projects' ? (
          <ProjectsModule initialView={breadcrumbPath.subview as any} />
        ) : activeTab === 'tasks' ? (
          <GlobalTasksView />
        ) : activeTab === 'worker-view' ? (
          <WorkerCalendarView />
        ) : activeTab === 'upload' ? (
          <UploadAssignView />
        ) : activeTab === 'materials' ? (
          <div className="p-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Materials Module</h2>
              <p className="text-gray-600">Coming soon</p>
            </div>
          </div>
        ) : (
          <div className="p-8">
            <div className="grid grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-semibold text-gray-900">{stats.teamAvailable}</div>
                    <div className="text-xs text-gray-400 mt-0.5">of {stats.teamTotal}</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-600">Team Available</div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-semibold text-gray-900">{stats.activeTasks}</div>
                    <div className="text-xs text-gray-400 mt-0.5">active</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-600">Tasks Running</div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-semibold text-gray-900">{stats.needsAction}</div>
                    <div className="text-xs text-gray-400 mt-0.5">pending</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-600">Needs Action</div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-semibold text-gray-900">{stats.performance}</div>
                    <div className="text-xs text-gray-400 mt-0.5">rating</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-600">Performance</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-8 mt-8">
              <h2 className="text-base font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-6">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTab(action.action)}
                    className="group flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-gray-50 transition-all"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-600">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-gray-900">Needs Attention</h2>
                        <p className="text-xs text-gray-500 mt-0.5">{alerts.length} active alerts</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 max-h-96 overflow-y-auto">
                    <div className="space-y-4">
                      {alerts.map((alert, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row items-start gap-4 p-4 bg-red-50 rounded-xl border border-red-100 hover:border-red-200 transition-all">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 mb-1 text-sm">{alert.title}</div>
                            <div className="text-xs text-gray-600 mb-2">{alert.description}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />
                              {alert.timestamp}
                            </div>
                          </div>
                          <button className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                            Resolve
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">AI Assistant Active</h3>
                      <p className="text-xs text-blue-100 mt-0.5">Monitoring in real-time</p>
                    </div>
                  </div>
                  <p className="text-blue-50 text-sm leading-relaxed">
                    Your AI is actively monitoring projects, detecting conflicts, and optimizing schedules.
                    Get instant alerts for potential delays and smart labor assignment suggestions.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl text-white p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <ListTodo className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-blue-100">Active Projects</div>
                      <div className="text-2xl font-semibold mt-0.5">{activeProjects.length}</div>
                    </div>
                  </div>

                  {activeProjects.length > 0 ? (
                    <>
                      <div className="text-sm text-blue-50 mb-6">
                        Latest: #{activeProjects[0].number} - {activeProjects[0].clientName}
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center">
                          <div className="text-2xl font-semibold">{activeProjects[0].tasks.length}</div>
                          <div className="text-xs text-blue-100 mt-1">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-semibold text-green-200">
                            {activeProjects[0].tasks.filter((t: any) => t.status === 'completed').length}
                          </div>
                          <div className="text-xs text-blue-100 mt-1">Done</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-semibold text-amber-200">
                            {activeProjects[0].tasks.filter((t: any) => t.status === 'pending').length}
                          </div>
                          <div className="text-xs text-blue-100 mt-1">Pending</div>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveTab('projects')}
                        className="w-full bg-white text-blue-600 font-medium py-3 rounded-xl hover:bg-blue-50 transition-colors"
                      >
                        View Projects
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-blue-50 mb-4">No active projects</p>
                      <button
                        onClick={() => setActiveTab('projects')}
                        className="w-full bg-white text-blue-600 font-medium py-3 rounded-xl hover:bg-blue-50 transition-colors"
                      >
                        Create Project
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-gray-900">Today&apos;s Activity</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Live updates</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 max-h-80 overflow-y-auto">
                    <div className="space-y-4">
                      {activity.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-gray-900 leading-relaxed">{item.text}</div>
                            <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.timestamp}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskAdminModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSave={(updatedTask) => {
            console.log('Task updated:', updatedTask);
            setSelectedTask(null);
          }}
          onDelete={(taskId) => {
            console.log('Task deleted:', taskId);
            setSelectedTask(null);
          }}
        />
      )}

      {showNotifications && (
        <NotificationsPanel
          onClose={() => setShowNotifications(false)}
          onNavigateToTask={(projectId, taskId, tab) => {
            // Switch to projects view
            setActiveTab('projects');
            setBreadcrumbPath({ view: 'projects' });

            // Dispatch custom event for ProjectsModule to handle
            window.dispatchEvent(new CustomEvent('navigateToTask', {
              detail: { projectId, taskId, tab }
            }));
          }}
        />
      )}

      {showMessages && (
        <MessagesCenter onClose={() => setShowMessages(false)} />
      )}

      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
