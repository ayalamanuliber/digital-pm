'use client';

import React, { useState, useEffect, useRef } from 'react';
import { storage, Task, Worker } from '@/lib/localStorage';
import { Bell, Calendar, Clock, MapPin, ChevronRight, ChevronDown, Package, Wrench, AlertCircle, User, CheckCircle, Camera, Phone, MessageSquare, Image, Trash2, X } from 'lucide-react';
import { playNotificationSound } from '@/lib/notificationSounds';

// Project-grouped tasks type
interface ProjectGroup {
  projectId: string;
  projectNumber: string;
  projectClient: string;
  projectAddress: string;
  projectColor: string;
  scheduledDate?: string;
  scheduledTime?: string;
  tasks: any[];
  totalHours: number;
  status: 'assigned' | 'confirmed' | 'active' | 'completed';
}

// Activity log utility
const logActivity = async (type: string, description: string, metadata?: any) => {
  try {
    await fetch('/api/activity-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, description, metadata })
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

// Format date relative to today
const getRelativeDate = (dateString: string): string => {
  if (!dateString) return '';

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
    // Format as "Oct 10"
    return taskDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

export default function WorkerTaskView({ workerId }: { workerId?: string }) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState(workerId || '');
  const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectGroup | null>(null);
  const [selectedProjectKey, setSelectedProjectKey] = useState<string | null>(null); // unique key: projectId-phase
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<string[]>([]); // track collapsed status sections

  // Task-level session management
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Calendar view state
  const [calendarCollapsed, setCalendarCollapsed] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null); // For expanding day details

  // Workflow phase state
  const [phase, setPhase] = useState('dashboard'); // dashboard → project-overview → task workflow
  const [showCantConfirm, setShowCantConfirm] = useState(false);
  const [cantConfirmReason, setCantConfirmReason] = useState('');
  const [reminderTime, setReminderTime] = useState('1hr');
  const [checkedMat, setCheckedMat] = useState<number[]>([]);
  const [checkedTools, setCheckedTools] = useState<number[]>([]);
  const [doneSteps, setDoneSteps] = useState<number[]>([]);
  const [stepPhotos, setStepPhotos] = useState<Record<number, any[]>>({});
  const [expandStep, setExpandStep] = useState<number | null>(null);
  const [cleanChecks, setCleanChecks] = useState<string[]>([]);
  const [cleanPhotos, setCleanPhotos] = useState<any[]>([]);
  const [inspectDone, setInspectDone] = useState(false);
  const [customerOK, setCustomerOK] = useState(false);
  const [finalPhotos, setFinalPhotos] = useState<any[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showComm, setShowComm] = useState(false);
  const [messageText, setMessageText] = useState('');
  const previousMessageCount = useRef(-1);

  useEffect(() => {
    loadData();
  }, []);

  // Real-time updates when project is selected
  useEffect(() => {
    if (!selectedWorkerId || !selectedProject) return;

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('projectsUpdated', handleUpdate);
    const pollInterval = setInterval(() => {
      loadData();
    }, 2000);

    return () => {
      window.removeEventListener('projectsUpdated', handleUpdate);
      clearInterval(pollInterval);
    };
  }, [selectedWorkerId, selectedProject?.projectId]);

  useEffect(() => {
    if (selectedWorkerId) {
      loadData();
    }
  }, [selectedWorkerId]);

  const loadData = () => {
    const allWorkers = storage.getWorkers();
    setWorkers(allWorkers);

    if (selectedWorkerId) {
      const projects = storage.getProjects();

      // Group tasks by project AND status - create separate cards for each phase
      const projectMap = new Map<string, ProjectGroup>();

      projects.forEach(project => {
        const workerTasks = project.tasks.filter(t => t.assignedTo === selectedWorkerId);

        if (workerTasks.length > 0) {
          // Group tasks by their individual status/phase
          const tasksByPhase = {
            assigned: workerTasks.filter(t => t.status === 'pending_acceptance' || t.status === 'rejected'),
            confirmed: workerTasks.filter(t => t.status === 'accepted' || t.status === 'confirmed'),
            active: workerTasks.filter(t => t.status === 'in_progress'),
            completed: workerTasks.filter(t => t.status === 'completed')
          };

          // Create a separate project card for each phase that has tasks
          Object.entries(tasksByPhase).forEach(([phase, phaseTasks]) => {
            if (phaseTasks.length === 0) return;

            const totalHours = phaseTasks.reduce((sum, task) => {
              return sum + (task.duration || task.estimatedHours || 0);
            }, 0);

            // Use unique key: projectId + phase
            const uniqueKey = `${project.id}-${phase}`;

            projectMap.set(uniqueKey, {
              projectId: project.id,
              projectNumber: project.number,
              projectClient: project.clientName,
              projectAddress: project.clientAddress,
              projectColor: project.color || 'blue',
              scheduledDate: phaseTasks[0]?.scheduledDate || phaseTasks[0]?.assignedDate,
              scheduledTime: phaseTasks[0]?.scheduledTime || phaseTasks[0]?.time,
              tasks: phaseTasks.map(t => ({
                ...t,
                projectId: project.id,
                projectNumber: project.number,
                projectClient: project.clientName,
                projectAddress: project.clientAddress,
                projectColor: project.color || 'blue',
                // Ensure each task has scheduledDate (fallback to assignedDate if not set)
                scheduledDate: t.scheduledDate || t.assignedDate,
                scheduledTime: t.scheduledTime || t.time
              })),
              totalHours,
              status: phase as ProjectGroup['status']
            });
          });
        }
      });

      setProjectGroups(Array.from(projectMap.values()));

      // Don't update selectedProject during polling to prevent morphing
      // The user opened a specific card - keep it locked to that exact state
    }
  };

  const handleConfirmProject = () => {
    if (!selectedProject || !selectedProject.tasks || selectedTaskIds.length === 0) return;

    const worker = workers.find(w => w.id === selectedWorkerId);
    if (worker) {
      // Confirm selected tasks
      selectedTaskIds.forEach(taskId => {
        const task = selectedProject.tasks.find(t => t.id === taskId);
        if (task) {
          storage.confirmTask(selectedProject.projectId, taskId, worker.name);

          // Log activity
          logActivity(
            'task_confirmed',
            `${worker.name} confirmed task: ${task.description}`,
            {
              workerId: worker.id,
              workerName: worker.name,
              projectId: selectedProject.projectId,
              projectNumber: selectedProject.projectNumber,
              taskId: task.id,
              taskDescription: task.description
            }
          );
        }
      });

      // Send notification to admin about partial acceptance
      if (selectedTaskIds.length < selectedProject.tasks.length) {
        const message = `${worker.name} confirmed ${selectedTaskIds.length} of ${selectedProject.tasks.length} tasks for Project #${selectedProject.projectNumber}`;
        if (selectedProject.tasks[0]) {
          storage.sendMessage(selectedProject.projectId, selectedProject.tasks[0].id, message, worker.name);
        }
      }

      setPhase('calendar');
      loadData();
    }
  };

  const handleCantConfirm = (reason: string) => {
    if (!selectedProject || !selectedProject.tasks) return;

    const worker = workers.find(w => w.id === selectedWorkerId);
    if (worker) {
      // Send message to admin with reason
      let messageText = `Can't confirm yet for Project #${selectedProject.projectNumber}. Reason: ${reason}`;
      if (reason === 'Other') {
        messageText = `Can't confirm yet for Project #${selectedProject.projectNumber}. Opening chat to explain.`;
      }

      if (selectedProject.tasks[0]) {
        storage.sendMessage(selectedProject.projectId, selectedProject.tasks[0].id, messageText, worker.name);
      }

      if (reason === 'Other') {
        setShowComm(true);
      }

      setShowCantConfirm(false);
      setSelectedProject(null);
      setPhase('review');
      loadData();
    }
  };

  const downloadCalendar = () => {
    if (!selectedProject || !selectedProject.tasks) return;

    const taskDescriptions = selectedProject.tasks
      .filter(t => selectedTaskIds.includes(t.id))
      .map(t => `- ${t.description}`)
      .join('\\n');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Modern Design & Development//Job Card//EN',
      'BEGIN:VEVENT',
      `SUMMARY:Project #${selectedProject.projectNumber} - ${selectedProject.projectClient}`,
      `DESCRIPTION:${taskDescriptions}`,
      `LOCATION:${selectedProject.projectAddress}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `project-${selectedProject.projectNumber}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const addPhoto = (stepId: number) => {
    const curr = stepPhotos[stepId] || [];
    setStepPhotos({ ...stepPhotos, [stepId]: [...curr, { id: Date.now(), ts: new Date().toISOString() }] });
  };

  const rmPhoto = (stepId: number, photoId: number) => {
    setStepPhotos({ ...stepPhotos, [stepId]: (stepPhotos[stepId] || []).filter(p => p.id !== photoId) });
  };

  const canComplete = (step: any) => !step.minPhotos || (stepPhotos[step.id] || []).length >= step.minPhotos;

  const handleSendMessage = (projectId?: string, taskId?: string) => {
    if (!messageText.trim()) return;

    const worker = workers.find(w => w.id === selectedWorkerId);
    if (worker) {
      const pid = projectId || selectedProject?.projectId;
      const tid = taskId || selectedProject?.tasks[0]?.id;

      if (pid && tid) {
        storage.sendMessage(pid, tid, messageText, worker.name);
        setMessageText('');
        window.dispatchEvent(new Event('projectsUpdated'));
        setTimeout(() => {
          loadData();
        }, 100);
      }
    }
  };

  const selectedWorker = workers.find(w => w.id === selectedWorkerId);

  // Helper to return to dashboard and reset state
  const returnToDashboard = () => {
    setSelectedProject(null);
    setSelectedProjectKey(null);
    setSelectedTask(null);
    setSelectedTaskIds([]);
    setPhase('dashboard');
    setCheckedMat([]);
    setCheckedTools([]);
    setDoneSteps([]);
    setStepPhotos({});
    setCleanChecks([]);
    setCleanPhotos([]);
    setFinalPhotos([]);
    setInspectDone(false);
    setCustomerOK(false);
    setStartTime(null);
    loadData();
  };

  // Mock steps data
  const steps = selectedProject && selectedProject.tasks ? [
    { id: 1, title: "Document Before", action: "Take photos showing current condition from multiple angles.", minPhotos: 2 },
    { id: 2, title: "Complete Main Work", action: selectedProject.tasks.map(t => t.description).join(', '), minPhotos: 1 },
    { id: 3, title: "Test & Verify", action: "Test work and verify everything functions properly.", minPhotos: 1 }
  ] : [];

  // Render messages section
  const renderMessagesSection = () => {
    if (!selectedProject || !selectedProject.tasks || selectedProject.tasks.length === 0) return null;

    const allMessages = selectedProject.tasks.flatMap(t => t.messages || []).sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return (
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">Messages with Office</h3>
        </div>

        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
          {allMessages.length === 0 ? (
            <div className="text-center text-gray-400 py-8 text-sm">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No messages yet</p>
            </div>
          ) : (
            allMessages.map((msg: any) => {
              const isWorker = msg.sender === selectedWorker?.name;
              return (
                <div key={msg.id} className={`flex ${isWorker ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-xl p-3 ${
                    isWorker
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="text-xs opacity-75 mb-1 font-medium">{msg.sender}</div>
                    <div className="text-sm">{msg.text}</div>
                    <div className="text-xs opacity-60 mt-1">
                      {new Date(msg.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-2 border-t border-gray-200 pt-4">
          <textarea
            key="worker-message-input"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type your message to the office..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm text-gray-900 bg-white placeholder:text-gray-400"
            rows={3}
            autoComplete="off"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!messageText.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Send Message
          </button>
        </div>
      </div>
    );
  };

  // Worker selection screen
  if (!selectedWorkerId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">Worker Login</h1>
            <p className="text-gray-600">Select your profile to view assignments</p>
          </div>

          <div className="space-y-3">
            {workers.map(w => (
              <button
                key={w.id}
                onClick={() => setSelectedWorkerId(w.id)}
                className="w-full p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-200 rounded-2xl transition-all active:scale-[0.98] text-left"
              >
                <div className="font-black text-gray-900 text-lg">{w.name}</div>
                <div className="text-sm text-gray-600">{w.skills.join(', ')}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show completed project summary
  if (selectedProject && selectedProject.status === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-emerald-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <button
            onClick={() => setSelectedProject(null)}
            className="mb-4 px-4 py-2 bg-white rounded-xl shadow-md text-slate-700 font-semibold hover:bg-slate-50 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>

          <div className="bg-white rounded-[2rem] shadow-2xl p-10 border-2 border-green-200">
            <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <CheckCircle size={80} className="text-white" strokeWidth={3} />
            </div>

            <div className="text-center mb-8">
              <h2 className="text-4xl font-black text-slate-900 mb-3">Project Complete!</h2>
              <p className="text-xl text-slate-600">Completed by {selectedWorker?.name}</p>
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-6 mb-6 space-y-4">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Project Details</div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Project</div>
                  <div className="font-bold text-slate-900">#{selectedProject.projectNumber} - {selectedProject.projectClient}</div>
                </div>
                <div className="h-px bg-slate-200" />
                <div>
                  <div className="text-xs text-slate-500 mb-1">Tasks Completed</div>
                  <div className="font-bold text-slate-900">{(selectedProject.tasks || []).length} tasks</div>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Total Hours</span>
                  <span className="font-black text-green-600 text-2xl">{selectedProject.totalHours}h</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setSelectedProject(null)}
                className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-black py-4 rounded-2xl transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard view - show project-grouped overview with calendar
  if (phase === 'dashboard') {
    const assignedProjects = projectGroups.filter(p => p.status === 'assigned');
    const confirmedProjects = projectGroups.filter(p => p.status === 'confirmed');
    const activeProjects = projectGroups.filter(p => p.status === 'active');
    const completedProjects = projectGroups.filter(p => p.status === 'completed');

    // Get upcoming jobs for the calendar widget - flatten to individual tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Flatten all tasks from all projects and show them individually in calendar
    const allScheduledTasks = projectGroups.flatMap(project =>
      project.tasks
        .filter(task => task.scheduledDate)
        .map(task => ({
          ...task,
          projectId: project.projectId,
          projectNumber: project.projectNumber,
          projectClient: project.projectClient,
          projectAddress: project.projectAddress,
          projectColor: project.projectColor,
          projectStatus: project.status
        }))
    ).sort((a, b) => {
      const dateA = new Date(a.scheduledDate!);
      const dateB = new Date(b.scheduledDate!);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      // Sort by time if same date
      if (a.scheduledTime && b.scheduledTime) {
        return a.scheduledTime.localeCompare(b.scheduledTime);
      }
      return 0;
    });

    // Keep project groups for backward compatibility (for jobs without task-level scheduling)
    const allScheduledJobs = [...confirmedProjects, ...activeProjects]
      .filter(p => p.scheduledDate)
      .sort((a, b) => {
        if (!a.scheduledDate || !b.scheduledDate) return 0;
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      });

    // Group by time period
    const todayJobs = allScheduledJobs.filter(p => {
      const jobDate = new Date(p.scheduledDate!);
      jobDate.setHours(0, 0, 0, 0);
      return jobDate.getTime() === today.getTime();
    });

    const thisWeekJobs = allScheduledJobs.filter(p => {
      const jobDate = new Date(p.scheduledDate!);
      jobDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((jobDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff >= 0 && daysDiff <= 7;
    });

    const thisMonthJobs = allScheduledJobs.filter(p => {
      const jobDate = new Date(p.scheduledDate!);
      return jobDate.getMonth() === today.getMonth() && jobDate.getFullYear() === today.getFullYear();
    });

    const upcomingJobs = allScheduledJobs.slice(0, 5);

    const colorClasses: Record<string, string> = {
      blue: 'border-blue-500',
      green: 'border-green-500',
      purple: 'border-purple-500',
      orange: 'border-orange-500',
      red: 'border-red-500',
      yellow: 'border-yellow-500',
      gray: 'border-gray-500',
      cyan: 'border-cyan-500'
    };

    const statusColors: Record<string, string> = {
      assigned: 'border-yellow-500',
      confirmed: 'border-orange-500',
      active: 'border-blue-500',
      completed: 'border-emerald-500'
    };

    const ProjectCard = ({ project, statusColor }: { project: ProjectGroup; statusColor: string }) => {
      const unreadMessages = project.tasks.flatMap(t => t.messages || [])
        .filter((m: any) => !m.read && m.sender !== selectedWorker?.name).length;

      const projectKey = `${project.projectId}-${project.status}`;
      const isExpanded = expandedProjects.includes(projectKey);

      // Use project's actual color instead of status color
      const projectBorderColor = colorClasses[project.projectColor] || statusColor;

      // Background color classes matching Projects and Tasks views
      const backgroundColorClasses: Record<string, string> = {
        blue: 'bg-blue-50',
        green: 'bg-green-50',
        purple: 'bg-purple-50',
        orange: 'bg-orange-50',
        red: 'bg-red-50',
        yellow: 'bg-yellow-50',
        gray: 'bg-gray-50',
        cyan: 'bg-cyan-50'
      };

      const projectBackgroundColor = backgroundColorClasses[project.projectColor] || 'bg-blue-50';

      const toggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedProjects(isExpanded
          ? expandedProjects.filter(id => id !== projectKey)
          : [...expandedProjects, projectKey]
        );
      };

      const handleProjectClick = () => {
        setSelectedProject(project);
        setSelectedProjectKey(`${project.projectId}-${project.status}`);
        setSelectedTask(null);
        setSelectedTaskIds([]);
        setPhase('project-overview');
      };

      const handleTaskClick = (task: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedProject(project);
        setSelectedProjectKey(`${project.projectId}-${project.status}`);
        setSelectedTask(task);
        setSelectedTaskIds([task.id]); // Select only this task
        // Route based on TASK status, not project status
        if (task.status === 'pending_acceptance') setPhase('review');
        else if (task.status === 'accepted' || task.status === 'confirmed') setPhase('prep-overview');
        else if (task.status === 'in_progress') setPhase('active');
        else setPhase('review'); // fallback
      };

      return (
        <div
          onClick={handleProjectClick}
          className={`${projectBackgroundColor} rounded-lg shadow-sm hover:shadow-md transition-all border-l-4 cursor-pointer ${projectBorderColor}`}
        >
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-xs text-gray-500 font-semibold">PROJECT #{project.projectNumber}</div>
                  {/* Phase Badge */}
                  <div className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    project.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                    project.status === 'confirmed' ? 'bg-orange-100 text-orange-800' :
                    project.status === 'active' ? 'bg-blue-100 text-blue-800' :
                    project.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status.toUpperCase()}
                  </div>
                  {/* Date Badge for Confirmed projects */}
                  {project.status === 'confirmed' && project.scheduledDate && (
                    <div className="flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                      <Calendar size={10} />
                      <span>{getRelativeDate(project.scheduledDate)}</span>
                    </div>
                  )}
                  {unreadMessages > 0 && (
                    <div className="flex items-center gap-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      <MessageSquare size={10} />
                      <span className="font-bold">{unreadMessages}</span>
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{project.projectClient}</h3>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.projectAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm mb-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MapPin size={14} />
                  <span className="hover:underline">{project.projectAddress}</span>
                </a>
                <div className="flex gap-3 text-xs text-gray-600 mb-2">
                  {project.scheduledDate && (
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{project.scheduledDate}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span className="font-semibold">{project.totalHours}h total</span>
                  </div>
                </div>
              </div>
              <button
                onClick={toggleExpand}
                className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                />
              </button>
            </div>

            {/* Expanded task list - clickable individual tasks */}
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs font-semibold text-gray-500 mb-2">SELECT TASK TO START:</div>
                <div className="space-y-2">
                  {project.tasks.map(task => {
                    const taskStatus = task.status === 'completed' ? 'text-green-600 bg-green-50' :
                                      task.status === 'active' ? 'text-blue-600 bg-blue-50' :
                                      'text-gray-600 bg-gray-50';
                    return (
                      <button
                        key={task.id}
                        onClick={(e) => handleTaskClick(task, e)}
                        className={`w-full flex items-start gap-3 text-sm hover:bg-blue-50 p-3 rounded border border-gray-200 hover:border-blue-400 transition-all text-left ${taskStatus}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 mb-1 line-clamp-2" title={task.description}>{task.description}</div>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                            {task.scheduledDate && (
                              <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                <Calendar size={10} />
                                <span>{task.scheduledDate}</span>
                              </div>
                            )}
                            {task.scheduledTime && (
                              <div className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                <Clock size={10} />
                                <span>{task.scheduledTime}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock size={10} />
                              <span>{task.duration || task.estimatedHours || 0}h</span>
                            </div>
                            {task.status === 'completed' && (
                              <div className="flex items-center gap-1 text-green-600 font-semibold">
                                <CheckCircle size={10} />
                                <span>DONE</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-md p-3 mb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h1 className="text-lg font-bold text-gray-900">Hi, {selectedWorker?.name}</h1>
                <p className="text-xs text-gray-600">{projectGroups.length} project{projectGroups.length !== 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={() => setSelectedWorkerId('')}
                className="px-2 py-1.5 border-2 border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50"
              >
                Switch
              </button>
            </div>
          </div>

          {/* Calendar Widget - Collapsible */}
          <div className="bg-white rounded-xl shadow-md mb-3">
            <button
              onClick={() => setCalendarCollapsed(!calendarCollapsed)}
              className="w-full flex items-center gap-2 p-3 hover:bg-gray-50 transition-colors"
            >
              <Calendar className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-gray-900 flex-1 text-left">Schedule</h2>
              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${calendarCollapsed ? '-rotate-90' : ''}`} />
            </button>

            {!calendarCollapsed && (
              <div className="px-4 pb-4">
                {/* Month View - Apple Calendar Style */}
                <div className="text-center mb-4 text-2xl font-bold text-gray-900">
                  {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                    <div key={idx} className="text-center text-xs font-semibold text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                  {(() => {
                    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    const startPadding = firstDay.getDay();
                    const days = [];

                    // Padding days
                    for (let i = 0; i < startPadding; i++) {
                      days.push(<div key={`pad-${i}`} className="min-h-[100px]"></div>);
                    }

                    // Month days
                    for (let d = 1; d <= lastDay.getDate(); d++) {
                      const dayDate = new Date(today.getFullYear(), today.getMonth(), d);
                      dayDate.setHours(0, 0, 0, 0);

                      // Get individual tasks for this day
                      const dayTasks = allScheduledTasks.filter(task => {
                        const taskDate = new Date(task.scheduledDate!);
                        taskDate.setHours(0, 0, 0, 0);
                        return taskDate.getTime() === dayDate.getTime();
                      });

                      const isToday = dayDate.getTime() === today.getTime();
                      const dateKey = dayDate.toISOString().split('T')[0];
                      const isExpanded = selectedCalendarDate === dateKey;

                      days.push(
                        <button
                          key={d}
                          onClick={() => setSelectedCalendarDate(isExpanded ? null : dateKey)}
                          className="min-h-[100px] flex flex-col items-start justify-start p-2 hover:bg-gray-50 transition-colors relative border border-gray-100 rounded-lg"
                        >
                          {/* Day number - Apple style */}
                          <div className={`text-base font-semibold mb-2 ${
                            isToday
                              ? 'w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center text-sm'
                              : 'text-gray-800'
                          }`}>
                            {d}
                          </div>

                          {/* Task indicators with text - Apple style */}
                          {dayTasks.length > 0 && (
                            <div className="w-full space-y-1">
                              {dayTasks.slice(0, 3).map((task, idx) => {
                                const projectColor = task.projectColor || 'blue';
                                const textColors = {
                                  blue: 'text-blue-600',
                                  green: 'text-green-600',
                                  purple: 'text-purple-600',
                                  orange: 'text-orange-600',
                                  red: 'text-red-600',
                                  yellow: 'text-yellow-600',
                                  cyan: 'text-cyan-600',
                                  gray: 'text-gray-600'
                                };
                                const bgColors = {
                                  blue: 'bg-blue-100',
                                  green: 'bg-green-100',
                                  purple: 'bg-purple-100',
                                  orange: 'bg-orange-100',
                                  red: 'bg-red-100',
                                  yellow: 'bg-yellow-100',
                                  cyan: 'bg-cyan-100',
                                  gray: 'bg-gray-100'
                                };
                                const textColor = textColors[projectColor as keyof typeof textColors] || textColors.blue;
                                const bgColor = bgColors[projectColor as keyof typeof bgColors] || bgColors.blue;

                                return (
                                  <div
                                    key={idx}
                                    className={`${bgColor} ${textColor} px-1.5 py-0.5 rounded text-[9px] font-semibold truncate`}
                                    title={`${task.projectNumber}: ${task.description}`}
                                  >
                                    {task.scheduledTime && `${task.scheduledTime} `}#{task.projectNumber}
                                  </div>
                                );
                              })}
                              {dayTasks.length > 3 && (
                                <div className="text-[9px] text-gray-500 font-semibold">+{dayTasks.length - 3} more</div>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    }

                    return days;
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Project Categories - Mobile-first vertical stack */}
          <div className="flex flex-col gap-4">
            {/* Assigned (Pending Confirmation) */}
            <div className="bg-white rounded-lg shadow-md">
              <button
                onClick={() => setCollapsedSections(
                  collapsedSections.includes('assigned')
                    ? collapsedSections.filter(s => s !== 'assigned')
                    : [...collapsedSections, 'assigned']
                )}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Bell className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-sm font-bold text-gray-900">Assigned</h2>
                    <p className="text-xs text-gray-600">{assignedProjects.length} new</p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${collapsedSections.includes('assigned') ? '-rotate-90' : ''}`} />
              </button>
              {!collapsedSections.includes('assigned') && (
                <div className="px-4 pb-4 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {assignedProjects.length === 0 ? (
                    <p className="text-center text-gray-400 py-6 text-xs">None</p>
                  ) : (
                    assignedProjects.map(project => <ProjectCard key={project.projectId} project={project} statusColor="border-yellow-500" />)
                  )}
                </div>
              )}
            </div>

            {/* Confirmed */}
            <div className="bg-white rounded-lg shadow-md">
              <button
                onClick={() => setCollapsedSections(
                  collapsedSections.includes('confirmed')
                    ? collapsedSections.filter(s => s !== 'confirmed')
                    : [...collapsedSections, 'confirmed']
                )}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-sm font-bold text-gray-900">Confirmed</h2>
                    <p className="text-xs text-gray-600">{confirmedProjects.length} ready</p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${collapsedSections.includes('confirmed') ? '-rotate-90' : ''}`} />
              </button>
              {!collapsedSections.includes('confirmed') && (
                <div className="px-4 pb-4 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {confirmedProjects.length === 0 ? (
                    <p className="text-center text-gray-400 py-6 text-xs">None</p>
                  ) : (
                    confirmedProjects.map(project => <ProjectCard key={project.projectId} project={project} statusColor="border-orange-500" />)
                  )}
                </div>
              )}
            </div>

            {/* Active */}
            <div className="bg-white rounded-lg shadow-md">
              <button
                onClick={() => setCollapsedSections(
                  collapsedSections.includes('active')
                    ? collapsedSections.filter(s => s !== 'active')
                    : [...collapsedSections, 'active']
                )}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-sm font-bold text-gray-900">Active</h2>
                    <p className="text-xs text-gray-600">{activeProjects.length} in progress</p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${collapsedSections.includes('active') ? '-rotate-90' : ''}`} />
              </button>
              {!collapsedSections.includes('active') && (
                <div className="px-4 pb-4 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {activeProjects.length === 0 ? (
                    <p className="text-center text-gray-400 py-6 text-xs">None</p>
                  ) : (
                    activeProjects.map(project => <ProjectCard key={project.projectId} project={project} statusColor="border-blue-500" />)
                  )}
                </div>
              )}
            </div>

            {/* Completed */}
            <div className="bg-white rounded-lg shadow-md">
              <button
                onClick={() => setCollapsedSections(
                  collapsedSections.includes('completed')
                    ? collapsedSections.filter(s => s !== 'completed')
                    : [...collapsedSections, 'completed']
                )}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-sm font-bold text-gray-900">Completed</h2>
                    <p className="text-xs text-gray-600">{completedProjects.length} done</p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${collapsedSections.includes('completed') ? '-rotate-90' : ''}`} />
              </button>
              {!collapsedSections.includes('completed') && (
                <div className="px-4 pb-4 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {completedProjects.length === 0 ? (
                    <p className="text-center text-gray-400 py-6 text-xs">None</p>
                  ) : (
                    completedProjects.map(project => <ProjectCard key={project.projectId} project={project} statusColor="border-emerald-500" />)
                  )}
                </div>
              )}
            </div>
          </div>

          {projectGroups.length === 0 && (
            <div className="text-center py-20">
              <Bell size={64} className="mx-auto mb-4 text-gray-300" />
              <div className="text-xl font-bold text-gray-500">No assignments yet</div>
              <div className="text-sm text-gray-400 mt-2">Check back later for new projects</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // PROJECT OVERVIEW - See all tasks for this project before selecting one
  if (phase === 'project-overview') {
    if (!selectedProject) return null;

    const colorClasses: Record<string, string> = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600',
      red: 'from-red-500 to-red-600',
      yellow: 'from-yellow-500 to-yellow-600',
      gray: 'from-gray-500 to-gray-600',
      cyan: 'from-cyan-500 to-cyan-600'
    };

    const gradientClass = colorClasses[selectedProject.projectColor] || 'from-blue-500 to-blue-600';

    const handleTaskSelect = (task: any) => {
      setSelectedTask(task);
      setSelectedTaskIds([task.id]);
      // Route based on TASK status, not project status
      if (task.status === 'pending_acceptance') setPhase('review');
      else if (task.status === 'accepted' || task.status === 'confirmed') setPhase('prep-overview');
      else if (task.status === 'in_progress') setPhase('active');
      else setPhase('review'); // fallback
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={returnToDashboard}
              className="px-4 py-2 bg-white rounded-xl shadow-md text-slate-700 font-semibold hover:bg-slate-50 flex items-center gap-2 transition-all"
            >
              ← Back to Dashboard
            </button>
          </div>

          {/* Project Header Card */}
          <div className={`bg-gradient-to-r ${gradientClass} rounded-3xl shadow-2xl overflow-hidden`}>
            <div className="p-8 text-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold opacity-90 mb-2">PROJECT #{selectedProject.projectNumber}</div>
                  <h1 className="text-4xl font-black mb-3">{selectedProject.projectClient}</h1>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedProject.projectAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MapPin size={18} />
                    <span className="text-lg">{selectedProject.projectAddress}</span>
                  </a>
                </div>
                <div className="text-right">
                  <div className="text-6xl font-black">{selectedProject.tasks.length}</div>
                  <div className="text-sm opacity-90 uppercase tracking-wide">Tasks</div>
                </div>
              </div>
              <div className="flex gap-6 mt-6 text-white/90">
                <div className="flex items-center gap-2">
                  <Clock size={20} />
                  <span className="text-lg font-semibold">{selectedProject.totalHours}h total</span>
                </div>
                {selectedProject.scheduledDate && (
                  <div className="flex items-center gap-2">
                    <Calendar size={20} />
                    <span className="text-lg font-semibold">{selectedProject.scheduledDate}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tasks Grid */}
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-4">Select a Task to Begin</h2>
            <div className="grid gap-4">
              {selectedProject.tasks.map((task, idx) => {
                const isCompleted = task.status === 'completed';
                const isActive = task.status === 'in_progress';

                return (
                  <div
                    key={task.id}
                    className={`w-full bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border-2 ${
                      isCompleted ? 'opacity-50 border-gray-200' :
                      isActive ? 'border-blue-500 ring-4 ring-blue-100' :
                      'border-gray-200 hover:border-blue-400'
                    }`}
                  >
                    {/* Task Number Badge */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0 ${
                        isCompleted ? 'bg-green-500 text-white' :
                        isActive ? 'bg-blue-500 text-white' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {isCompleted ? '✓' : idx + 1}
                      </div>

                      {/* Task Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-black text-slate-900 mb-2">{task.description}</h3>

                        {/* Task Meta */}
                        <div className="flex flex-wrap gap-3 mb-3">
                          {task.scheduledDate && (
                            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-semibold">
                              <Calendar size={14} />
                              <span>{task.scheduledDate}</span>
                            </div>
                          )}
                          {task.scheduledTime && (
                            <div className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-semibold">
                              <Clock size={14} />
                              <span>{task.scheduledTime}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-semibold">
                            <Clock size={14} />
                            <span>{task.duration || task.estimatedHours || 0}h</span>
                          </div>
                          {task.type && (
                            <div className="flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg text-sm font-semibold uppercase">
                              {task.type}
                            </div>
                          )}
                        </div>

                        {/* Materials & Tools Prep */}
                        {((task.materials && task.materials.length > 0) || (task.tools && task.tools.length > 0)) && (
                          <div className="mt-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                            <div className="flex items-center gap-2 mb-3">
                              <Package size={18} className="text-blue-600" />
                              <span className="font-black text-blue-900 text-sm uppercase tracking-wide">Materials & Tools</span>
                            </div>
                            <div className="space-y-1.5">
                              {/* Materials */}
                              {task.materials && task.materials.slice(0, 5).map((material: any, idx: number) => (
                                <div key={`mat-${idx}`} className="flex items-center justify-between bg-white/80 rounded-lg px-3 py-2 text-xs">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                                      {idx + 1}
                                    </div>
                                    <span className="font-semibold text-slate-800">{material.name}</span>
                                  </div>
                                  <span className="text-slate-600">
                                    {material.quantity} {material.unit}
                                  </span>
                                </div>
                              ))}
                              {/* Tools */}
                              {task.tools && task.tools.slice(0, 5).map((tool: any, idx: number) => (
                                <div key={`tool-${idx}`} className="flex items-center justify-between bg-white/80 rounded-lg px-3 py-2 text-xs">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-xs">
                                      🔧
                                    </div>
                                    <span className="font-semibold text-slate-800">{tool.name || tool}</span>
                                  </div>
                                  {tool.quantity && (
                                    <span className="text-slate-600">
                                      {tool.quantity}
                                    </span>
                                  )}
                                </div>
                              ))}
                              {/* More items indicator */}
                              {(task.materials?.length > 5 || task.tools?.length > 5) && (
                                <div className="text-xs text-blue-600 font-semibold pl-3 pt-1">
                                  +{(task.materials?.length || 0) + (task.tools?.length || 0) - 5} more items...
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {task.notes && (
                          <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <div className="text-xs font-bold text-amber-800 uppercase mb-1">Notes</div>
                            <div className="text-sm text-amber-900">{task.notes}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    {!isCompleted && (
                      <button
                        onClick={() => handleTaskSelect(task)}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <span>{isActive ? 'Continue Task' : 'Start Task'}</span>
                        <ChevronRight size={20} />
                      </button>
                    )}
                    {isCompleted && (
                      <div className="flex items-center justify-center gap-2 text-green-600 font-bold py-3">
                        <CheckCircle size={24} className="fill-current" />
                        <span>COMPLETED</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PHASE 1: REVIEW - Confirm project availability
  if (phase === 'review') {
    const allSelected = selectedProject.tasks && selectedTaskIds.length === selectedProject.tasks.length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <button
            onClick={returnToDashboard}
            className="px-4 py-2 bg-white rounded-xl shadow-md text-slate-700 font-semibold hover:bg-slate-50 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>

          {renderMessagesSection()}

          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bell size={24} />
              </div>
              <div>
                <div className="text-2xl font-black mb-1">New Project Assigned</div>
                <div className="text-yellow-100">Confirm your availability for this job</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-slate-400 font-medium">PROJECT #{selectedProject.projectNumber}</div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full">
                  <User size={14} />
                  <span className="text-sm font-medium">{selectedWorker?.name}</span>
                </div>
              </div>
              <h1 className="text-3xl font-black mb-2">{selectedProject.projectClient}</h1>
              <div className="text-lg text-slate-300 mb-6">Multiple tasks • {selectedProject.totalHours}h total</div>
              <div className="flex flex-wrap gap-4">
                {selectedProject.scheduledDate && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar size={18} />
                    <span className="font-medium">{selectedProject.scheduledDate}</span>
                  </div>
                )}
                {selectedProject.scheduledTime && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock size={18} />
                    <span className="font-medium">{selectedProject.scheduledTime}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 border-b border-blue-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <MapPin size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Location</div>
                  <div className="text-xl font-bold text-slate-900 mb-3">{selectedProject.projectAddress}</div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedProject.projectAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:scale-95 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all inline-flex"
                  >
                    Open in Maps
                    <ChevronRight size={18} />
                  </a>
                </div>
              </div>
            </div>

            {/* Task Selection */}
            <div className="p-6 bg-slate-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-slate-900">Select Tasks to Confirm</h3>
                <button
                  onClick={() => setSelectedTaskIds(allSelected ? [] : (selectedProject.tasks || []).map(t => t.id))}
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                >
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="space-y-2">
                {(selectedProject.tasks || []).map(task => {
                  const isSelected = selectedTaskIds.includes(task.id);
                  return (
                    <div
                      key={task.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTaskIds(selectedTaskIds.filter(id => id !== task.id));
                        } else {
                          setSelectedTaskIds([...selectedTaskIds, task.id]);
                        }
                      }}
                      className={`rounded-2xl p-4 border-2 cursor-pointer transition-all active:scale-[0.98] ${
                        isSelected
                          ? 'bg-blue-50 border-blue-400 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <CheckCircle size={18} className="text-white" strokeWidth={3} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-900">{task.description}</div>
                          <div className="text-sm text-slate-600 mt-0.5">{task.duration || task.estimatedHours || 0}h estimated</div>
                          {task.notes && (
                            <div className="text-xs text-amber-600 mt-2 flex items-start gap-1">
                              <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                              <span>{task.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 space-y-3">
              <button
                onClick={handleConfirmProject}
                disabled={selectedTaskIds.length === 0}
                className={`w-full font-black py-5 rounded-2xl shadow-xl transition-all text-lg flex items-center justify-center gap-3 ${
                  selectedTaskIds.length > 0
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:scale-[0.98] text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle size={24} />
                Confirm I'll Be There {selectedProject.tasks && selectedTaskIds.length < selectedProject.tasks.length ? `(${selectedTaskIds.length} task${selectedTaskIds.length !== 1 ? 's' : ''})` : ''}
              </button>
              <button
                onClick={() => setShowCantConfirm(true)}
                className="w-full border-2 border-slate-300 hover:border-slate-400 active:scale-[0.98] text-slate-700 font-bold py-4 rounded-2xl transition-all"
              >
                Can't Confirm Yet
              </button>
            </div>
          </div>
        </div>

        {/* Can't Confirm Modal */}
        {showCantConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-slate-900">Can't Confirm Yet</h3>
                <button
                  onClick={() => setShowCantConfirm(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-sm text-slate-600 mb-6">Let the office know what you need</p>
              <div className="space-y-3">
                {[
                  { value: 'Waiting on materials', icon: Package },
                  { value: 'Missing tools', icon: Wrench },
                  { value: 'Need clarification', icon: AlertCircle },
                  { value: 'Other', icon: MessageSquare }
                ].map(reason => (
                  <button
                    key={reason.value}
                    onClick={() => handleCantConfirm(reason.value)}
                    className="w-full p-4 bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 hover:border-slate-300 rounded-2xl transition-all active:scale-[0.98] text-left flex items-center gap-3"
                  >
                    <reason.icon className="w-5 h-5 text-slate-600" />
                    <span className="font-bold text-slate-900">{reason.value}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // PHASE 2: CALENDAR
  if (phase === 'calendar') {
    const reminderLabels = {
      '30min': '30 minutes before',
      '1hr': '1 hour before',
      '2hr': '2 hours before',
      '1day': '1 day before'
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <button
            onClick={returnToDashboard}
            className="mb-4 px-4 py-2 bg-white rounded-xl shadow-md text-slate-700 font-semibold hover:bg-slate-50 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex items-center gap-3 mb-3">
                <Calendar size={32} />
                <h2 className="text-2xl font-black">Add to Calendar</h2>
              </div>
              <p className="text-blue-100">Get reminded before the job starts</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Project</div>
                  <div className="font-black text-slate-900">#{selectedProject.projectNumber} - {selectedProject.projectClient}</div>
                  <div className="text-sm text-slate-600">{(selectedProject.tasks || []).length} task{(selectedProject.tasks || []).length !== 1 ? 's' : ''}</div>
                </div>

                <div className="h-px bg-slate-200" />

                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">When</div>
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Calendar size={16} />
                    {selectedProject.scheduledDate} at {selectedProject.scheduledTime}
                  </div>
                  <div className="text-sm text-slate-600">Duration: {selectedProject.totalHours} hours</div>
                </div>

                <div className="h-px bg-slate-200" />

                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Location</div>
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <MapPin size={16} />
                    {selectedProject.projectAddress}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-900 mb-3 block">
                  📱 Remind me:
                </label>
                <div className="space-y-2">
                  {Object.entries(reminderLabels).map(([value, label]) => (
                    <div
                      key={value}
                      onClick={() => setReminderTime(value)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all active:scale-[0.98] ${
                        reminderTime === value
                          ? 'bg-blue-50 border-blue-500 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          reminderTime === value
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-slate-300'
                        }`}>
                          {reminderTime === value && (
                            <div className="w-3 h-3 bg-white rounded-full" />
                          )}
                        </div>
                        <span className={`font-bold ${reminderTime === value ? 'text-blue-900' : 'text-slate-700'}`}>
                          {label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    downloadCalendar();
                    setTimeout(() => setPhase('prep'), 500);
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] text-white font-black py-5 rounded-2xl shadow-xl transition-all text-lg flex items-center justify-center gap-3"
                >
                  <Calendar size={24} />
                  Add to Calendar
                </button>
                <button
                  onClick={() => setPhase('prep')}
                  className="w-full border-2 border-slate-300 hover:border-slate-400 active:scale-[0.98] text-slate-700 font-bold py-4 rounded-2xl transition-all"
                >
                  Skip for Now
                </button>
              </div>
            </div>
          </div>

          {renderMessagesSection()}
        </div>
      </div>
    );
  }

  // PHASE 3: PREP OVERVIEW - Shows project summary before materials
  if (phase === 'prep-overview') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <button
            onClick={returnToDashboard}
            className="mb-4 px-4 py-2 bg-white rounded-xl shadow-md text-slate-700 font-semibold hover:bg-slate-50 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>

          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle size={32} />
                <h2 className="text-2xl font-black">Start Preparation</h2>
              </div>
              <p className="text-green-100">Review your tasks and load materials</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Project</div>
                  <div className="font-black text-slate-900">#{selectedProject.projectNumber} - {selectedProject.projectClient}</div>
                </div>

                <div className="h-px bg-slate-200" />

                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Location</div>
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-slate-600 mt-0.5 flex-shrink-0" />
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedProject.projectAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                    >
                      {selectedProject.projectAddress}
                    </a>
                  </div>
                </div>
              </div>

              {/* Show ONLY selected task */}
              {selectedTask ? (
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">Your Task</div>
                  <div className="bg-white p-4 rounded-lg space-y-3">
                    <div>
                      <div className="font-black text-slate-900 text-lg mb-2">{selectedTask.description}</div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {selectedTask.scheduledDate && (
                          <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            <Calendar size={12} />
                            <span className="font-semibold">{selectedTask.scheduledDate}</span>
                          </div>
                        )}
                        {selectedTask.scheduledTime && (
                          <div className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            <Clock size={12} />
                            <span className="font-semibold">{selectedTask.scheduledTime}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-1 rounded">
                          <Clock size={12} />
                          <span className="font-semibold">{selectedTask.duration || selectedTask.estimatedHours || 0}h</span>
                        </div>
                      </div>
                    </div>
                    {selectedTask.notes && (
                      <div className="pt-2 border-t border-slate-100">
                        <div className="text-xs font-bold text-slate-500 uppercase mb-1">Notes</div>
                        <div className="text-sm text-slate-700">{selectedTask.notes}</div>
                      </div>
                    )}
                    {selectedTask.materials && selectedTask.materials.length > 0 && (
                      <div className="pt-2 border-t border-slate-100">
                        <div className="text-xs font-bold text-slate-500 uppercase mb-1">Materials Needed</div>
                        <div className="text-xs text-slate-600">
                          {selectedTask.materials.length} item{selectedTask.materials.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">All Tasks</div>
                  <div className="space-y-2">
                    {(selectedProject.tasks || []).map((task, idx) => (
                      <div key={task.id} className="flex items-start gap-2 bg-white p-3 rounded-lg">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-900 text-sm">{task.description}</div>
                          <div className="text-xs text-slate-600 mt-0.5">
                            {task.duration || task.estimatedHours || 0}h
                            {task.notes && ` • ${task.notes}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-4 border border-amber-200">
                <div className="flex gap-3">
                  <div className="text-2xl">📋</div>
                  <div>
                    <div className="font-black text-amber-900 text-sm mb-1">Next: Load Your Truck</div>
                    <div className="text-xs text-amber-800">
                      You'll verify materials and tools before heading to the site
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => setPhase('prep')}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] text-white font-black py-5 rounded-2xl shadow-xl transition-all text-lg flex items-center justify-center gap-3"
                >
                  <Package size={24} />
                  Start Loading Materials
                </button>
                <button
                  onClick={returnToDashboard}
                  className="w-full border-2 border-slate-300 hover:border-slate-400 active:scale-[0.98] text-slate-700 font-bold py-4 rounded-2xl transition-all"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>

          {renderMessagesSection()}
        </div>
      </div>
    );
  }

  // PHASE 4: PREP - Load materials for selected task only
  if (phase === 'prep') {
    // Get materials and tools from selected task
    const taskMaterials = selectedTask ? (selectedTask.materials || []) :
                          (selectedProject.tasks || []).flatMap(t => t.materials || []);

    const taskTools = selectedTask ? (selectedTask.tools || []) :
                      (selectedProject.tasks || []).flatMap(t => t.tools || []);

    const mockMaterials = taskMaterials.length > 0 ? taskMaterials : [
      { name: "Material 1", quantity: 1, unit: "pcs" },
      { name: "Material 2", quantity: 2, unit: "pcs" }
    ];

    const mockTools = taskTools.length > 0 ? taskTools : [
      { name: "Power drill" },
      { name: "Ladder" },
      { name: "Screwdriver set" }
    ];

    const allMat = checkedMat.length === mockMaterials.length;
    const allTool = checkedTools.length === mockTools.length;
    const ready = allMat && allTool;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <button
            onClick={returnToDashboard}
            className="px-4 py-2 bg-white rounded-xl shadow-md text-slate-700 font-semibold hover:bg-slate-50 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <CheckCircle size={28} />
              </div>
              <div>
                <div className="text-2xl font-black">Project Confirmed ✓</div>
                <div className="text-green-100">Ready to load your truck</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="text-sm text-slate-500 mb-1">PROJECT #{selectedProject.projectNumber}</div>
            <h2 className="text-2xl font-black text-slate-900">{selectedProject.projectClient}</h2>
            {selectedTask ? (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xs font-bold text-blue-600 uppercase mb-1">Loading for this task:</div>
                <div className="font-bold text-slate-900">{selectedTask.description}</div>
                <div className="flex gap-2 mt-2 text-xs">
                  {selectedTask.scheduledDate && (
                    <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      <Calendar size={10} />
                      <span>{selectedTask.scheduledDate}</span>
                    </div>
                  )}
                  {selectedTask.scheduledTime && (
                    <div className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                      <Clock size={10} />
                      <span>{selectedTask.scheduledTime}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-600 mt-1">{(selectedProject.tasks || []).length} tasks • {selectedProject.totalHours}h total</div>
            )}
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-5 border border-blue-200">
            <div className="flex gap-3">
              <div className="text-3xl">📋</div>
              <div>
                <div className="font-black text-blue-900 mb-1">Load Your Truck</div>
                <div className="text-sm text-blue-800">Check items as you load them. This catches missing stuff before you leave.</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package size={22} className="text-white" />
                <span className="font-black text-white text-lg">Materials</span>
              </div>
              <div className="bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                <span className="text-sm font-black text-white">{checkedMat.length}/{mockMaterials.length}</span>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {mockMaterials.map((m: any, i: number) => {
                const checked = checkedMat.includes(i);
                return (
                  <div
                    key={i}
                    onClick={() => checked ? setCheckedMat(checkedMat.filter(x => x !== i)) : setCheckedMat([...checkedMat, i])}
                    className={`rounded-2xl p-4 border-2 cursor-pointer transition-all active:scale-[0.98] ${
                      checked
                        ? 'bg-green-50 border-green-400 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        checked
                          ? 'bg-green-500 border-green-500'
                          : 'border-slate-300 bg-white'
                      }`}>
                        {checked && <CheckCircle size={18} className="text-white" strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900">{m.name}</div>
                        <div className="text-sm text-slate-600 mt-0.5">{m.quantity} {m.unit}</div>
                        {m.location && <div className="text-xs text-blue-600 font-bold mt-1">📍 {m.location}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wrench size={22} className="text-white" />
                <span className="font-black text-white text-lg">Tools</span>
              </div>
              <div className="bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                <span className="text-sm font-black text-white">{checkedTools.length}/{mockTools.length}</span>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {mockTools.map((t: any, i: number) => {
                const checked = checkedTools.includes(i);
                return (
                  <div
                    key={i}
                    onClick={() => checked ? setCheckedTools(checkedTools.filter(x => x !== i)) : setCheckedTools([...checkedTools, i])}
                    className={`rounded-2xl p-4 border-2 cursor-pointer transition-all active:scale-[0.98] ${
                      checked
                        ? 'bg-blue-50 border-blue-400 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        checked
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-slate-300 bg-white'
                      }`}>
                        {checked && <CheckCircle size={18} className="text-white" strokeWidth={3} />}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-slate-900">{t.name}</div>
                        {t.note && <div className="text-sm text-slate-600 mt-0.5">{t.note}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {!ready && (
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-5 border border-amber-200 text-center">
              <AlertCircle className="inline text-amber-600 mb-2" size={28} />
              <div className="font-black text-amber-900 text-lg">Not Ready Yet</div>
              <div className="text-amber-800">Check off all items first</div>
            </div>
          )}

          <button
            onClick={() => {
              if (ready && selectedProject) {
                const worker = workers.find(w => w.id === selectedWorkerId);
                if (worker) {
                  // Start all confirmed tasks
                  selectedTaskIds.forEach(taskId => {
                    const task = selectedProject.tasks.find(t => t.id === taskId);
                    storage.startTask(selectedProject.projectId, taskId, worker.name);

                    // Log activity
                    if (task) {
                      logActivity(
                        'task_started',
                        `${worker.name} started task: ${task.description}`,
                        {
                          workerId: worker.id,
                          workerName: worker.name,
                          projectId: selectedProject.projectId,
                          projectNumber: selectedProject.projectNumber,
                          taskId: task.id,
                          taskDescription: task.description
                        }
                      );
                    }
                  });
                  setStartTime(new Date());
                  setPhase('active');
                  loadData();
                }
              }
            }}
            disabled={!ready}
            className={`w-full font-black py-6 rounded-2xl text-xl shadow-xl transition-all ${
              ready
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {ready ? '🚀 All Loaded - Head to Site' : 'Check All Items First'}
          </button>

          {renderMessagesSection()}
        </div>
      </div>
    );
  }

  // PHASE 4: ACTIVE - On-site work with steps
  if (phase === 'active') {
    const progress = (doneSteps.length / steps.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-24">
        <div className="max-w-2xl mx-auto p-4 pt-4">
          <button
            onClick={returnToDashboard}
            className="px-4 py-2 bg-white rounded-xl shadow-md text-slate-700 font-semibold hover:bg-slate-50 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
        </div>
        <div className="sticky top-0 bg-white/80 backdrop-blur-xl shadow-lg z-30 border-b border-slate-200">
          <div className="max-w-2xl mx-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">PROJECT #{selectedProject.projectNumber} • On-Site</div>
                <h2 className="text-xl font-black text-slate-900">{selectedProject.projectClient}</h2>
                {selectedTask && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200 inline-block">
                    <div className="text-xs font-bold text-blue-600 uppercase">Working on:</div>
                    <div className="text-sm font-bold text-slate-900">{selectedTask.description}</div>
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                  {doneSteps.length}/{steps.length}
                </div>
                <div className="text-xs text-slate-500 font-bold">STEPS</div>
              </div>
            </div>
            <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${progress}%` }}
              >
                {progress > 15 && (
                  <span className="text-white text-xs font-black drop-shadow">{Math.round(progress)}%</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-4 space-y-3 mt-4">
          {/* Materials & Tools Reference */}
          {selectedTask && (selectedTask.materials?.length > 0 || selectedTask.tools?.length > 0) && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Package size={20} className="text-blue-600" />
                <h3 className="font-black text-blue-900 uppercase tracking-wide">Materials & Tools for This Task</h3>
              </div>
              <div className="space-y-2">
                {selectedTask.materials?.map((material: any, idx: number) => (
                  <div key={`mat-${idx}`} className="flex items-center justify-between bg-white/80 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                        {idx + 1}
                      </div>
                      <span className="font-semibold text-slate-800">{material.name}</span>
                    </div>
                    <span className="text-slate-600 text-sm">
                      {material.quantity} {material.unit}
                    </span>
                  </div>
                ))}
                {selectedTask.tools?.map((tool: any, idx: number) => (
                  <div key={`tool-${idx}`} className="flex items-center justify-between bg-white/80 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-xs">
                        🔧
                      </div>
                      <span className="font-semibold text-slate-800">{tool.name || tool}</span>
                    </div>
                    {tool.quantity && (
                      <span className="text-slate-600 text-sm">{tool.quantity}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {steps.map((step) => {
            const done = doneSteps.includes(step.id);
            const exp = expandStep === step.id;
            const photos = stepPhotos[step.id] || [];
            const canDo = canComplete(step);

            return (
              <div
                key={step.id}
                className={`bg-white rounded-3xl shadow-xl overflow-hidden border-2 transition-all ${
                  done ? 'opacity-50 border-slate-200' : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div
                  onClick={() => !done && setExpandStep(exp ? null : step.id)}
                  className={`p-6 flex items-start gap-4 cursor-pointer ${done ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex-shrink-0">
                    {done ? (
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <CheckCircle size={28} className="text-white" strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="w-12 h-12 border-4 border-blue-500 bg-white rounded-2xl flex items-center justify-center text-blue-600 font-black text-xl shadow-lg">
                        {step.id}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className={`text-xl font-black mb-2 ${done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                      {step.title}
                    </h3>
                    <p className={`text-sm leading-relaxed ${done ? 'text-slate-400' : 'text-slate-600'}`}>
                      {step.action}
                    </p>
                    {photos.length > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <Image size={18} className="text-green-600" />
                        <span className="text-sm font-bold text-green-600">{photos.length} photo{photos.length > 1 ? 's' : ''} ✓</span>
                      </div>
                    )}
                    {step.minPhotos && photos.length < step.minPhotos && !done && (
                      <div className="mt-2 text-xs font-bold text-amber-600">
                        📸 Need {step.minPhotos - photos.length} more photo{step.minPhotos - photos.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>

                {exp && !done && (
                  <div className="px-6 pb-6 space-y-3 border-t-2 border-slate-100 pt-4">
                    {photos.length > 0 && (
                      <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                        {photos.map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-2">
                              <Image size={16} className="text-blue-600" />
                              <span className="text-sm font-bold text-slate-700">Photo {photos.indexOf(p) + 1}</span>
                              <span className="text-xs text-slate-500">{new Date(p.ts).toLocaleTimeString()}</span>
                            </div>
                            <button onClick={() => rmPhoto(step.id, p.id)} className="text-red-500 hover:text-red-600 active:scale-90 transition-all">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => addPhoto(step.id)}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg transition-all"
                    >
                      <Camera size={24} />
                      {photos.length > 0 ? 'Add Another Photo' : 'Take Photo'}
                    </button>

                    <button
                      onClick={() => canDo && (setDoneSteps([...doneSteps, step.id]), setExpandStep(null))}
                      disabled={!canDo}
                      className={`w-full font-bold py-4 rounded-2xl shadow-lg transition-all ${
                        canDo
                          ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:scale-[0.98] text-white'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {!canDo ? `Need ${step.minPhotos! - photos.length} More Photo${step.minPhotos! - photos.length > 1 ? 's' : ''}` : '✓ Mark Complete'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {doneSteps.length === steps.length && (
          <div className="fixed bottom-0 inset-x-0 bg-gradient-to-t from-white via-white to-transparent p-6 border-t-4 border-orange-500 shadow-2xl">
            <div className="max-w-2xl mx-auto">
              <button
                onClick={() => setPhase('cleanup')}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] text-white font-black py-6 rounded-2xl flex items-center justify-center gap-3 text-xl shadow-2xl transition-all"
              >
                Work Done - Start Cleanup 🧹
              </button>
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto px-4 pb-4">
          {renderMessagesSection()}
        </div>
      </div>
    );
  }

  // PHASE 5: CLEANUP
  if (phase === 'cleanup') {
    const cleanTasks = [
      { id: 'debris', label: 'All debris removed' },
      { id: 'wipe', label: 'Surfaces wiped clean' },
      { id: 'tools', label: 'All tools packed' },
      { id: 'sweep', label: 'Floor swept/vacuumed' }
    ];
    const allDone = cleanTasks.every(t => cleanChecks.includes(t.id)) && cleanPhotos.length > 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <button
            onClick={returnToDashboard}
            className="px-4 py-2 bg-white rounded-xl shadow-md text-slate-700 font-semibold hover:bg-slate-50 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-3xl p-8 shadow-xl">
            <div className="text-5xl mb-4">🧹</div>
            <div className="text-3xl font-black mb-2">Cleanup Time</div>
            <div className="text-orange-100 text-lg">Leave the site better than you found it</div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6 space-y-3">
            <h3 className="text-xl font-black text-slate-900 mb-4">Cleanup Checklist</h3>
            {cleanTasks.map((task) => {
              const checked = cleanChecks.includes(task.id);
              return (
                <div
                  key={task.id}
                  onClick={() => checked ? setCleanChecks(cleanChecks.filter(x => x !== task.id)) : setCleanChecks([...cleanChecks, task.id])}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.98] ${
                    checked ? 'bg-green-50 border-green-400' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center ${
                      checked ? 'bg-green-500 border-green-500' : 'border-slate-300'
                    }`}>
                      {checked && <CheckCircle size={20} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className="font-bold text-slate-900">{task.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6">
            <h3 className="text-xl font-black text-slate-900 mb-4">Cleanup Photos</h3>
            {cleanPhotos.length > 0 && (
              <div className="space-y-2 mb-4">
                {cleanPhotos.map((p: any) => (
                  <div key={p.id} className="flex justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="flex gap-2"><Image size={18} className="text-blue-600" /><span className="font-bold">Photo {cleanPhotos.indexOf(p) + 1}</span></div>
                    <button onClick={() => setCleanPhotos(cleanPhotos.filter(x => x.id !== p.id))} className="text-red-500"><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setCleanPhotos([...cleanPhotos, { id: Date.now(), ts: new Date().toISOString() }])} className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all">
              <Camera size={20} />Take Cleanup Photo
            </button>
          </div>

          {!allDone && (
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-5 border border-amber-200 text-center">
              <AlertCircle className="inline text-amber-600 mb-2" size={28} />
              <div className="font-black text-amber-900">Complete all tasks + take photo</div>
            </div>
          )}

          <button onClick={() => allDone && setPhase('inspection')} disabled={!allDone} className={`w-full font-black py-6 rounded-2xl text-xl shadow-xl transition-all ${allDone ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
            {allDone ? 'Done - Customer Walkthrough 👀' : 'Complete Cleanup First'}
          </button>

          {renderMessagesSection()}
        </div>
      </div>
    );
  }

  // PHASE 6: INSPECTION
  if (phase === 'inspection') {
    const canSubmit = inspectDone && customerOK && finalPhotos.length >= 2;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <button
            onClick={returnToDashboard}
            className="px-4 py-2 bg-white rounded-xl shadow-md text-slate-700 font-semibold hover:bg-slate-50 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-3xl p-8 shadow-xl">
            <div className="text-5xl mb-4">👀</div>
            <div className="text-3xl font-black mb-2">Final Inspection</div>
            <div className="text-purple-100 text-lg">Walk through with {selectedProject.projectClient}</div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6 space-y-3">
            <div onClick={() => setInspectDone(!inspectDone)} className={`p-5 rounded-2xl border-2 cursor-pointer active:scale-[0.98] transition-all ${inspectDone ? 'bg-green-50 border-green-400' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex gap-3">
                <div className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center ${inspectDone ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                  {inspectDone && <CheckCircle size={22} className="text-white" strokeWidth={3} />}
                </div>
                <div><div className="font-bold text-slate-900 text-lg">Customer Walkthrough Done</div><div className="text-sm text-slate-600">Showed all work, tested together</div></div>
              </div>
            </div>
            <div onClick={() => setCustomerOK(!customerOK)} className={`p-5 rounded-2xl border-2 cursor-pointer active:scale-[0.98] transition-all ${customerOK ? 'bg-green-50 border-green-400' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex gap-3">
                <div className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center ${customerOK ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                  {customerOK && <CheckCircle size={22} className="text-white" strokeWidth={3} />}
                </div>
                <div><div className="font-bold text-slate-900 text-lg">Customer Approval</div><div className="text-sm text-slate-600">Customer satisfied with quality</div></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6">
            <h3 className="text-xl font-black text-slate-900 mb-2">Final Photos</h3>
            <div className="text-sm text-slate-600 mb-4">Multiple angles (min 2)</div>
            {finalPhotos.length > 0 && (
              <div className="space-y-2 mb-4">
                {finalPhotos.map((p: any) => (
                  <div key={p.id} className="flex justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="flex gap-2"><Image size={18} className="text-green-600" /><span className="font-bold">Photo {finalPhotos.indexOf(p) + 1}</span></div>
                    <button onClick={() => setFinalPhotos(finalPhotos.filter(x => x.id !== p.id))} className="text-red-500"><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setFinalPhotos([...finalPhotos, { id: Date.now(), ts: new Date().toISOString() }])} className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all">
              <Camera size={20} />Take Final Photo
            </button>
          </div>

          {!canSubmit && (
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-5 border border-amber-200 text-center">
              <AlertCircle className="inline text-amber-600 mb-2" size={28} />
              <div className="font-black text-amber-900">Complete all steps</div>
            </div>
          )}

          <button
            onClick={() => {
              if (canSubmit && selectedProject) {
                const worker = workers.find(w => w.id === selectedWorkerId);
                if (worker) {
                  // Mark all tasks as completed
                  selectedTaskIds.forEach(taskId => {
                    const task = selectedProject.tasks.find(t => t.id === taskId);
                    storage.completeTask(selectedProject.projectId, taskId, worker.name);

                    // Log activity
                    if (task) {
                      logActivity(
                        'task_completed',
                        `${worker.name} completed task: ${task.description}`,
                        {
                          workerId: worker.id,
                          workerName: worker.name,
                          projectId: selectedProject.projectId,
                          projectNumber: selectedProject.projectNumber,
                          taskId: task.id,
                          taskDescription: task.description,
                          duration: startTime ? Math.round((new Date().getTime() - startTime.getTime()) / 60000) : null
                        }
                      );
                    }
                  });
                  setPhase('done');
                  loadData();
                }
              }
            }}
            disabled={!canSubmit}
            className={`w-full font-black py-6 rounded-2xl text-xl shadow-xl transition-all ${canSubmit ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:scale-[0.98] text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
            {canSubmit ? '✅ Submit Project Complete' : 'Complete All Steps'}
          </button>

          {renderMessagesSection()}
        </div>
      </div>
    );
  }

  // PHASE 7: DONE
  if (phase === 'done') {
    const mins = startTime ? Math.round((new Date().getTime() - startTime.getTime()) / 60000) : 0;
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    const totalPhotos = Object.values(stepPhotos).reduce((s: number, p) => s + p.length, 0) + cleanPhotos.length + finalPhotos.length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-emerald-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-[2rem] shadow-2xl p-10 border-2 border-green-200">
            <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <CheckCircle size={80} className="text-white" strokeWidth={3} />
            </div>

            <div className="text-center mb-8">
              <h2 className="text-4xl font-black text-slate-900 mb-3">
                {selectedTask ? 'Task Complete!' : 'Project Complete!'}
              </h2>
              <p className="text-xl text-slate-600">Excellent work, {selectedWorker?.name}</p>
              {selectedTask && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 text-left">
                  <div className="text-xs font-bold text-blue-600 uppercase mb-1">Completed Task:</div>
                  <div className="text-sm font-bold text-slate-900">{selectedTask.description}</div>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-6 mb-8 space-y-4">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Summary</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Duration</span>
                  <span className="font-black text-slate-900 text-xl">{hrs > 0 ? `${hrs}h ` : ''}{m}m</span>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Work Steps</span>
                  <span className="font-black text-green-600 text-lg">{steps.length} ✓</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Cleanup</span>
                  <span className="font-black text-green-600 text-lg">Complete ✓</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Customer</span>
                  <span className="font-black text-green-600 text-lg">Approved ✓</span>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Total Photos</span>
                  <span className="font-black text-blue-600 text-xl">{totalPhotos} 📸</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setPhase('dashboard');
                setCheckedMat([]);
                setCheckedTools([]);
                setDoneSteps([]);
                setStepPhotos({});
                setExpandStep(null);
                setCleanChecks([]);
                setCleanPhotos([]);
                setInspectDone(false);
                setCustomerOK(false);
                setFinalPhotos([]);
                setStartTime(null);
                setReminderTime('1hr');
                setSelectedProject(null);
                setSelectedTask(null);
                setSelectedTaskIds([]);
                loadData();
              }}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] text-white font-black py-5 rounded-2xl shadow-xl transition-all text-lg"
            >
              🔄 Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
