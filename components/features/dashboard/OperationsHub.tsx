'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Users, ListTodo, AlertTriangle, TrendingUp, Upload, Bell, Calendar, UserCheck, Menu, X, Zap, Clock, Eye, Briefcase } from 'lucide-react';
import type { ActiveProject, DashboardStats, Alert, Activity as ActivityType, Project, Task } from '@/types';
import MultiViewCalendar from '@/components/features/calendar/MultiViewCalendar';
import PremiumLaborCard from '@/components/features/labor/PremiumLaborCard';
import ProjectsListView from '@/components/features/projects/ProjectsListView';
import ProjectDetailView from '@/components/features/projects/ProjectDetailView';
import TaskAdminModal from '@/components/features/tasks/TaskAdminModal';
import UploadAssignView from '@/components/features/upload/UploadAssignView';
import WorkersModule from '@/components/features/workers/WorkersModule';
import { BreadcrumbPath } from '@/components/features/projects/Breadcrumb';

export default function OperationsHub() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [breadcrumbPath, setBreadcrumbPath] = useState<BreadcrumbPath>({ view: 'dashboard' });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [activeProject] = useState<ActiveProject>({
    number: '2037',
    client: 'Maddie Thompson',
    totalTasks: 12,
    assigned: 9,
    unassigned: 3,
    photosNeeded: 2
  });

  const [stats] = useState<DashboardStats>({
    teamAvailable: 3,
    teamTotal: 4,
    activeTasks: 12,
    needsAction: 3,
    performance: 4.85
  });

  const [alerts] = useState<Alert[]>([
    {
      type: 'conflict',
      title: 'Scheduling Conflict Detected',
      description: 'Juan is busy until Oct 12, but assigned Install GFCI protection in kitchen for Oct 8',
      timestamp: '1:26 PM'
    },
    {
      type: 'conflict',
      title: 'Scheduling Conflict Detected',
      description: 'Juan is busy until Oct 12, but assigned Replace smoke alarms throughout for Oct 9',
      timestamp: '1:26 PM'
    },
    {
      type: 'conflict',
      title: 'Scheduling Conflict Detected',
      description: 'Juan is busy until Oct 12, but assigned Attic junction box for fan splices for Oct 10',
      timestamp: '1:18 PM'
    },
    {
      type: 'warning',
      title: '12 tasks awaiting confirmation',
      description: 'Auto-reminders will be sent if not confirmed within 6 hours',
      timestamp: '1:11 PM'
    }
  ]);

  const [activity] = useState<ActivityType[]>([
    {
      type: 'assignment',
      text: 'Defective Deck Stair footings assigned to Juan',
      timestamp: '1:26 PM',
      status: 'completed'
    },
    {
      type: 'confirmation',
      text: 'Carlos confirmed the Defective Deck Stair footings task',
      timestamp: '1:26 PM',
      status: 'completed'
    },
    {
      type: 'auto',
      text: 'AI auto-assigned 12 tasks to best-matched laborers',
      timestamp: '1:19 PM',
      status: 'completed'
    },
    {
      type: 'upload',
      text: 'New estimate uploaded: #2037 for Maddie Thompson',
      timestamp: '1:18 PM',
      status: 'completed'
    },
    {
      type: 'confirmation',
      text: 'David confirmed the Install Radon Fan & Exhaust task',
      timestamp: '1:15 PM',
      status: 'completed'
    },
    {
      type: 'batch',
      text: 'Work orders sent to 3 laborers',
      timestamp: '1:11 PM',
      status: 'completed'
    }
  ]);

  const quickActions = [
    { icon: Upload, label: 'Upload', color: 'from-blue-500 to-blue-600', action: 'upload' },
    { icon: ListTodo, label: 'Estimate', color: 'from-purple-500 to-purple-600', action: 'estimate' },
    { icon: UserCheck, label: 'Labor', color: 'from-green-500 to-green-600', action: 'labor' },
    { icon: Calendar, label: 'Calendar', color: 'from-orange-500 to-orange-600', action: 'calendar' },
    { icon: Bell, label: 'Reminders', color: 'from-pink-500 to-pink-600', action: 'reminders' },
    { icon: TrendingUp, label: 'Reports', color: 'from-cyan-500 to-cyan-600', action: 'reports' }
  ];

  // Mock project for detail view
  const mockProject: Project = {
    id: 'p1',
    number: '2037',
    client: 'Maddie Thompson',
    address: '123 Oak Street, Denver CO',
    totalTasks: 12,
    completedTasks: 9,
    budget: 45000,
    spent: 38000,
    startDate: '2025-10-06',
    estimatedCompletion: '2025-10-15',
    priority: 'high',
    status: 'active'
  };

  const handleNavigate = (newPath: Partial<BreadcrumbPath>) => {
    setBreadcrumbPath(prev => ({ ...prev, ...newPath }));

    // Set active tab based on view
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
      {/* Overlay for mobile - only shows when sidebar is open */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full w-64 bg-gray-900 text-white p-6 z-40 transition-transform duration-300 shadow-2xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="font-black text-lg">Digital PM</div>
            <div className="text-xs text-gray-400 font-medium">Modern Design & Development</div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">
              📊 Command Center
            </div>
            <button
              onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
              className={`w-full rounded-lg p-3 font-bold transition-all flex items-center gap-3 ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-gray-300 hover:bg-gray-800 active:bg-gray-700'
              }`}
            >
              <ListTodo className="w-4 h-4" />
              Dashboard
            </button>
          </div>

          <div>
            <div className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">
              🔧 Core System
            </div>
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  setActiveTab('projects');
                  setBreadcrumbPath({ view: 'projects' });
                  setSidebarOpen(false);
                }}
                className={`w-full rounded-lg p-3 font-bold transition-all flex items-center gap-3 ${
                  activeTab === 'projects'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-gray-300 hover:bg-gray-800 active:bg-gray-700'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Projects
              </button>
              <button
                onClick={() => { setActiveTab('workers'); setSidebarOpen(false); }}
                className={`w-full rounded-lg p-3 font-bold transition-all flex items-center gap-3 ${
                  activeTab === 'workers'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-gray-300 hover:bg-gray-800 active:bg-gray-700'
                }`}
              >
                <Users className="w-4 h-4" />
                Workers
              </button>
              <button
                onClick={() => { setActiveTab('calendar'); setSidebarOpen(false); }}
                className={`w-full rounded-lg p-3 font-bold transition-all flex items-center gap-3 ${
                  activeTab === 'calendar'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-gray-300 hover:bg-gray-800 active:bg-gray-700'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Calendar
              </button>
            </div>
          </div>

          <div>
            <div className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">
              ⚡ Quick Actions
            </div>
            <div className="space-y-1.5">
              <button
                onClick={() => { /* TODO: Open new project modal */ }}
                className="w-full rounded-lg p-3 font-bold transition-all flex items-center gap-3 text-gray-300 hover:bg-gray-800 active:bg-gray-700"
              >
                <Upload className="w-4 h-4" />
                + New Project
              </button>
              <button
                onClick={() => { /* TODO: Open add worker modal */ }}
                className="w-full rounded-lg p-3 font-bold transition-all flex items-center gap-3 text-gray-300 hover:bg-gray-800 active:bg-gray-700"
              >
                <UserCheck className="w-4 h-4" />
                + Add Worker
              </button>
              <button
                onClick={() => { setActiveTab('labor-preview'); setSidebarOpen(false); }}
                className={`w-full rounded-lg p-3 font-bold transition-all flex items-center gap-3 ${
                  activeTab === 'labor-preview'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-gray-300 hover:bg-gray-800 active:bg-gray-700'
                }`}
              >
                <Eye className="w-4 h-4" />
                <div className="flex-1 text-left">
                  <div className="text-xs font-bold">Worker View</div>
                  <div className="text-[10px] text-gray-400">Preview</div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <div className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">
              📈 Modules
            </div>
            <div className="space-y-1.5">
              <button
                disabled
                className="w-full rounded-lg p-3 font-bold transition-all flex items-center gap-3 text-gray-500 cursor-not-allowed opacity-50"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="flex-1 text-left">Analytics</span>
                <span className="text-[10px] bg-gray-800 px-2 py-0.5 rounded">Soon</span>
              </button>
              <button
                disabled
                className="w-full rounded-lg p-3 font-bold transition-all flex items-center gap-3 text-gray-500 cursor-not-allowed opacity-50"
              >
                <Bell className="w-4 h-4" />
                <span className="flex-1 text-left">Notifications</span>
                <span className="text-[10px] bg-gray-800 px-2 py-0.5 rounded">Soon</span>
              </button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-black">
              E
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm">Erick</div>
              <div className="text-xs text-gray-400">Administrator</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen bg-gray-50">
        {/* Unified Header Bar */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              {/* Left: Burger + Title */}
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Toggle menu"
                >
                  {sidebarOpen ? <X className="w-6 h-6 text-gray-900" /> : <Menu className="w-6 h-6 text-gray-900" />}
                </button>

                {/* Title & Subtitle */}
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                    {activeTab === 'calendar' ? 'Calendar' :
                     activeTab === 'labor-preview' ? 'Worker View Preview' :
                     activeTab === 'projects' ? 'Projects' :
                     activeTab === 'upload' ? 'Upload & Assign' :
                     activeTab === 'workers' ? 'Workers' :
                     activeTab === 'analytics' ? 'Analytics' :
                     activeTab === 'reminders' ? 'Notifications' :
                     'Operations Hub'}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-2">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                    <span className="truncate">
                      {activeTab === 'calendar' ? 'Visual crew & project scheduling' :
                       activeTab === 'labor-preview' ? 'See how workers receive & complete tasks' :
                       activeTab === 'projects' ? 'Manage all active and completed projects' :
                       activeTab === 'upload' ? 'Upload estimates & auto-assign tasks' :
                       activeTab === 'workers' ? 'Manage crew members and track performance' :
                       activeTab === 'analytics' ? 'Performance metrics and budget tracking' :
                       activeTab === 'reminders' ? 'Automated notifications and reminders' :
                       'AI-powered command center'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Right: Bell + New Project */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <button className="px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm text-sm sm:text-base whitespace-nowrap">
                  New Project
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Conditional rendering based on active tab */}
            {activeTab === 'calendar' ? (
              <MultiViewCalendar />
            ) : activeTab === 'labor-preview' ? (
              <PremiumLaborCard />
            ) : activeTab === 'workers' ? (
              <WorkersModule />
            ) : activeTab === 'projects' ? (
              <>
                {breadcrumbPath.project ? (
                  <ProjectDetailView
                    project={mockProject}
                    onNavigate={handleNavigate}
                    onTaskClick={handleTaskClick}
                  />
                ) : (
                  <ProjectsListView onNavigate={handleNavigate} />
                )}
              </>
            ) : activeTab === 'upload' ? (
              <UploadAssignView />
            ) : (
              <>
            {/* Quick Stats - Compact Circular Design */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{stats.teamAvailable}</div>
                    <div className="text-xs text-gray-500">of {stats.teamTotal}</div>
                  </div>
                </div>
                <div className="text-xs font-medium text-gray-600">Team Available</div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{stats.activeTasks}</div>
                    <div className="text-xs text-gray-500">active</div>
                  </div>
                </div>
                <div className="text-xs font-medium text-gray-600">Tasks Running</div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{stats.needsAction}</div>
                    <div className="text-xs text-gray-500">pending</div>
                  </div>
                </div>
                <div className="text-xs font-medium text-gray-600">Needs Action</div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{stats.performance}</div>
                    <div className="text-xs text-gray-500">rating</div>
                  </div>
                </div>
                <div className="text-xs font-medium text-gray-600">Performance</div>
              </div>
            </div>

            {/* Quick Actions Wheel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTab(action.action)}
                    className="group flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-all active:scale-95"
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                      <action.icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Alerts Section - 2 columns on desktop */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4 lg:p-6 border-b border-gray-100 bg-red-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Needs Attention</h2>
                        <p className="text-xs text-gray-600">{alerts.length} active alerts</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 lg:p-6 max-h-96 overflow-y-auto">
                    <div className="space-y-3">
                      {alerts.map((alert, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200 hover:shadow-md transition-shadow">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 mb-1 text-sm">{alert.title}</div>
                            <div className="text-xs text-gray-600 mb-2">{alert.description}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {alert.timestamp}
                            </div>
                          </div>
                          <button className="w-full sm:w-auto px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 active:bg-red-700 transition-colors shadow-sm">
                            Resolve
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Assistant */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">AI Assistant Active</h3>
                      <p className="text-xs text-blue-100">Monitoring in real-time</p>
                    </div>
                  </div>
                  <p className="text-blue-100 text-sm leading-relaxed">
                    Your AI is actively monitoring projects, detecting conflicts, and optimizing schedules.
                    Get instant alerts for potential delays and smart labor assignment suggestions.
                  </p>
                </div>
              </div>

              {/* Right Column - 1 column on desktop */}
              <div className="space-y-6">
                {/* Active Project */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg text-white p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <ListTodo className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-blue-200">Active Project</div>
                      <div className="text-xl font-bold">#{activeProject.number}</div>
                    </div>
                  </div>
                  <div className="text-sm text-blue-200 mb-6">{activeProject.client}</div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{activeProject.totalTasks}</div>
                      <div className="text-xs text-blue-200 mt-1">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-300">{activeProject.assigned}</div>
                      <div className="text-xs text-blue-200 mt-1">Assigned</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-amber-300">{activeProject.unassigned}</div>
                      <div className="text-xs text-blue-200 mt-1">Pending</div>
                    </div>
                  </div>

                  <button className="w-full bg-white text-blue-700 font-semibold py-3 rounded-xl hover:bg-blue-50 active:bg-blue-100 transition-colors shadow-lg">
                    View Details
                  </button>
                </div>

                {/* Today's Activity */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-green-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-gray-900">Today&apos;s Activity</h2>
                        <p className="text-xs text-gray-600">Live updates</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 max-h-80 overflow-y-auto">
                    <div className="space-y-3">
                      {activity.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-gray-900 leading-relaxed">{item.text}</div>
                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
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
            </>
            )}
          </div>
        </div>
      </div>

      {/* Task Admin Modal */}
      {selectedTask && (
        <TaskAdminModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSave={(updatedTask) => {
            // TODO: Handle task update
            console.log('Task updated:', updatedTask);
            setSelectedTask(null);
          }}
          onDelete={(taskId) => {
            // TODO: Handle task deletion
            console.log('Task deleted:', taskId);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
