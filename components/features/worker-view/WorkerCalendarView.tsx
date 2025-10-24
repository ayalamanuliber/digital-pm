'use client';

import React, { useState, useEffect, useRef } from 'react';
import { storage, Worker } from '@/lib/localStorage';
import {
  Bell, Calendar, Clock, MapPin, ChevronUp, ChevronDown,
  CheckSquare, MessageSquare, User, X, CheckCircle, AlertCircle,
  ChevronRight, Package, Image, Trash2, Wrench, Sparkles, Eye, PartyPopper, Camera,
  UserCheck, Send
} from 'lucide-react';

// FIX: useInterval hook - prevents stale closure bug (Dan Abramov pattern from React docs)
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>();

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current?.(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

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

// Format time helper
const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  const [hour] = timeStr.split(':');
  const h = parseInt(hour);
  if (h === 0) return '12 AM';
  if (h === 12) return '12 PM';
  if (h > 12) return `${h - 12} PM`;
  return `${h} AM`;
};

// Calculate time remaining until task
const getTimeUntil = (dateString: string, timeString?: string): string => {
  if (!dateString) return '';

  try {
    let taskDateTime: Date;

    // Try to parse different date formats
    if (dateString.includes('/')) {
      // Format: MM/DD/YYYY or M/D/YYYY
      const dateParts = dateString.split('/');
      const [month, day, year] = dateParts;
      taskDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else if (dateString.includes('-')) {
      // Format: YYYY-MM-DD (ISO format)
      taskDateTime = new Date(dateString + 'T00:00:00');
    } else {
      // Try generic parsing
      taskDateTime = new Date(dateString);
    }

    // Validate date
    if (isNaN(taskDateTime.getTime())) {
      console.error('Invalid date:', dateString);
      return '';
    }

    // Add time if provided (format: HH:MM)
    if (timeString) {
      const [hours, minutes] = timeString.split(':').map(Number);
      taskDateTime.setHours(hours || 0, minutes || 0, 0, 0);
    } else {
      taskDateTime.setHours(9, 0, 0, 0); // Default to 9 AM if no time
    }

    const now = new Date();
    const diffMs = taskDateTime.getTime() - now.getTime();

    // If in the past
    if (diffMs < 0) {
      const pastHours = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)));
      if (pastHours < 24) {
        return `${pastHours}h ago`;
      } else {
        const pastDays = Math.floor(pastHours / 24);
        return `${pastDays}d ago`;
      }
    }

    // If in the future
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `in ${diffMinutes}m`;
    } else if (diffHours < 24) {
      return `in ${diffHours}h`;
    } else if (diffDays === 1) {
      return remainingHours > 0 ? `in 1d ${remainingHours}h` : 'in 1 day';
    } else {
      return remainingHours > 0 ? `in ${diffDays}d ${remainingHours}h` : `in ${diffDays} days`;
    }
  } catch (error) {
    console.error('Error calculating time until:', error);
    return '';
  }
};

// Get relative date label with status
const getRelativeDateInfo = (dateString: string): { label: string; isPastDue: boolean } => {
  if (!dateString) return { label: '', isPastDue: false };

  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const taskDate = new Date(date);
  taskDate.setHours(0, 0, 0, 0);

  const isPastDue = taskDate.getTime() < today.getTime();

  if (taskDate.getTime() === today.getTime()) {
    return { label: 'Today', isPastDue: false };
  } else if (taskDate.getTime() === tomorrow.getTime()) {
    return { label: 'Tomorrow', isPastDue: false };
  } else if (isPastDue) {
    return { label: taskDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isPastDue: true };
  } else {
    return { label: taskDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isPastDue: false };
  }
};

export default function WorkerCalendarView({ workerId, workerName }: { workerId?: string; workerName?: string }) {
  // Core state
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState(workerId || '');
  const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>([]);
  const [isCloudMode, setIsCloudMode] = useState(!!workerId); // Cloud mode when workerId is provided

  // Navigation state
  const [activeTab, setActiveTab] = useState<'schedule' | 'jobs' | 'messages'>('schedule');
  const [calendarView, setCalendarView] = useState<'month' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Messages state
  const [messageThreads, setMessageThreads] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [threadMessageText, setThreadMessageText] = useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [showThreadList, setShowThreadList] = useState(true);

  // Task detail state
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectGroup | null>(null);

  // Jobs tab state
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);

  // Workflow phase state
  const [phase, setPhase] = useState<'task-detail' | 'review' | 'calendar' | 'prep' | 'active' | 'cleanup' | 'inspection' | 'done'>('task-detail');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [checkedMat, setCheckedMat] = useState<number[]>([]);
  const [checkedTools, setCheckedTools] = useState<number[]>([]);
  const [expandStep, setExpandStep] = useState<number | null>(null);
  const [doneSteps, setDoneSteps] = useState<number[]>([]);
  const [stepPhotos, setStepPhotos] = useState<Record<number, any[]>>({});
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [messageText, setMessageText] = useState('');
  const [reminderTime, setReminderTime] = useState('1hr');
  const [cleanChecks, setCleanChecks] = useState<string[]>([]);
  const [cleanPhotos, setCleanPhotos] = useState<any[]>([]);
  const [inspectDone, setInspectDone] = useState(false);
  const [customerOK, setCustomerOK] = useState(false);
  const [finalPhotos, setFinalPhotos] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedWorkerId) {
      loadData();
    }
  }, [selectedWorkerId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (selectedThread && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedThread?.messages]);

  // FIX: Use useInterval instead of useEffect+setInterval to prevent stale closures
  useInterval(async () => {
    if (!isCloudMode || !selectedWorkerId) return;
    console.log('🔄 Worker: Polling for updates...');
    await loadData();
    await loadMessageThreads();
  }, isCloudMode && selectedWorkerId ? 2000 : null);

  // Listen for projectsUpdated event in admin mode (when messages sync from cloud)
  useEffect(() => {
    if (isCloudMode || !selectedWorkerId) return; // Only for admin mode with worker selected

    const handleProjectsUpdated = () => {
      console.log('📨 Admin: Projects updated, reloading messages...');
      // Force reload by fetching fresh data
      const projects = storage.getProjects();
      const projectMap = new Map<string, ProjectGroup>();

      projects.forEach(project => {
        const workerTasks = project.tasks.filter(t => t.assignedTo === selectedWorkerId);

        if (workerTasks.length > 0) {
          const tasksByPhase = {
            assigned: workerTasks.filter(t => t.status === 'pending_acceptance' || t.status === 'rejected'),
            confirmed: workerTasks.filter(t => t.status === 'accepted' || t.status === 'confirmed'),
            active: workerTasks.filter(t => t.status === 'in_progress'),
            completed: workerTasks.filter(t => t.status === 'completed')
          };

          Object.entries(tasksByPhase).forEach(([phase, phaseTasks]) => {
            if (phaseTasks.length === 0) return;

            const totalHours = phaseTasks.reduce((sum, task) => {
              return sum + (task.duration || task.estimatedHours || 0);
            }, 0);

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
              })),
              totalHours,
              phase
            });
          });
        }
      });

      setProjectGroups(Array.from(projectMap.values()));

      // Reload message threads
      const allMessages = storage.getAllMessages();
      const workerThreads = allMessages
        .filter(item => {
          const project = projects.find(p => p.id === item.projectId);
          if (!project) return false;
          const task = project.tasks.find((t: any) => t.id === item.taskId);
          return task && task.assignedTo === selectedWorkerId;
        })
        .map(item => {
          const worker = workers.find(w => w.id === selectedWorkerId);
          const unreadCount = item.messages.filter(m => !m.read && m.sender !== (worker?.name || 'admin')).length;
          const lastMessage = item.messages[item.messages.length - 1];

          return {
            ...item,
            lastMessage,
            unreadCount
          };
        });

      workerThreads.sort((a, b) =>
        new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
      );

      setMessageThreads(workerThreads);
      console.log('✅ Admin: Messages reloaded, found', workerThreads.length, 'threads');

      // Update selected thread if it exists
      if (selectedThread) {
        const updated = workerThreads.find(t =>
          t.projectId === selectedThread.projectId && t.taskId === selectedThread.taskId
        );
        if (updated) {
          setSelectedThread(updated);
          console.log('✅ Admin: Selected thread updated with new messages');
        }
      }
    };

    window.addEventListener('projectsUpdated', handleProjectsUpdated);

    return () => {
      window.removeEventListener('projectsUpdated', handleProjectsUpdated);
    };
  }, [isCloudMode, selectedWorkerId, workers, selectedThread]);

  const loadData = async () => {
    // Cloud mode: fetch from API
    if (isCloudMode && selectedWorkerId) {
      try {
        // Fetch tasks for this worker from cloud
        const response = await fetch(`/api/worker/tasks?workerId=${selectedWorkerId}`);
        const data = await response.json();

        if (data.success) {
          // Create a worker object with provided name
          const cloudWorker: Worker = {
            id: selectedWorkerId,
            name: workerName || 'Worker',
            phone: '',
            hourlyRate: 0,
            skills: [],
            pin: ''
          };
          setWorkers([cloudWorker]);

          // Group tasks by project
          const projectMap = new Map<string, ProjectGroup>();

          data.tasks.forEach((task: any) => {
            const pid = task.projectId;

            if (!projectMap.has(pid)) {
              projectMap.set(pid, {
                projectId: pid,
                projectNumber: task.projectNumber,
                projectClient: task.projectClient,
                projectAddress: task.projectAddress,
                projectColor: task.projectColor,
                scheduledDate: task.scheduledDate || task.assignedDate,
                scheduledTime: task.scheduledTime || task.time,
                tasks: [],
                totalHours: 0,
                status: 'assigned'
              });
            }

            const group = projectMap.get(pid)!;
            // Ensure task has all required fields including scheduledDate
            group.tasks.push({
              ...task,
              scheduledDate: task.scheduledDate || task.assignedDate,
              scheduledTime: task.scheduledTime || task.time
            });
            group.totalHours += task.estimatedHours || 0;

            // Update group status based on task statuses
            if (task.status === 'completed') {
              if (group.status !== 'active') group.status = 'completed';
            } else if (task.status === 'in_progress') {
              group.status = 'active';
            } else if (task.status === 'confirmed' || task.status === 'accepted') {
              if (group.status === 'assigned') group.status = 'confirmed';
            }
          });

          const projectGroupsArray = Array.from(projectMap.values());
          setProjectGroups(projectGroupsArray);

          // Debug: Log task data to check scheduledDate
          console.log('🔍 Worker Tasks Debug:', {
            totalTasks: data.tasks.length,
            tasks: data.tasks.map((t: any) => ({
              description: t.description,
              scheduledDate: t.scheduledDate,
              scheduledTime: t.scheduledTime,
              hasDate: !!t.scheduledDate
            })),
            projectGroups: projectGroupsArray.map(pg => ({
              projectNumber: pg.projectNumber,
              taskCount: pg.tasks.length,
              tasksWithDates: pg.tasks.filter((t: any) => t.scheduledDate).length
            }))
          });

          // Load notifications
          const notifsResponse = await fetch(`/api/worker/notifications?workerId=${selectedWorkerId}`);
          const notifsData = await notifsResponse.json();
          if (notifsData.success) {
            setNotifications(notifsData.notifications);
            setNotificationCount(notifsData.notifications.length);
          }

          // Load messages for unread count
          await loadMessageThreads();
        }
      } catch (error) {
        console.error('Failed to load cloud data:', error);
      }
      return;
    }

    // Admin mode: use localStorage
    const allWorkers = storage.getWorkers();
    setWorkers(allWorkers);

    if (selectedWorkerId) {
      const projects = storage.getProjects();
      const projectMap = new Map<string, ProjectGroup>();

      projects.forEach(project => {
        const workerTasks = project.tasks.filter(t => t.assignedTo === selectedWorkerId);

        if (workerTasks.length > 0) {
          const tasksByPhase = {
            assigned: workerTasks.filter(t => t.status === 'pending_acceptance' || t.status === 'rejected'),
            confirmed: workerTasks.filter(t => t.status === 'accepted' || t.status === 'confirmed'),
            active: workerTasks.filter(t => t.status === 'in_progress'),
            completed: workerTasks.filter(t => t.status === 'completed')
          };

          Object.entries(tasksByPhase).forEach(([phase, phaseTasks]) => {
            if (phaseTasks.length === 0) return;

            const totalHours = phaseTasks.reduce((sum, task) => {
              return sum + (task.duration || task.estimatedHours || 0);
            }, 0);

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

      // Update unread message count
      const worker = allWorkers.find(w => w.id === selectedWorkerId);
      if (worker) {
        const allMessages = storage.getAllMessages();
        const workerThreads = allMessages.filter(item => {
          const project = projects.find(p => p.id === item.projectId);
          if (!project) return false;
          const task = project.tasks.find((t: any) => t.id === item.taskId);
          return task && task.assignedTo === selectedWorkerId;
        });

        const totalUnread = workerThreads.reduce((acc, thread) => {
          const unread = thread.messages.filter(m => !m.read && m.sender !== worker.name).length;
          return acc + unread;
        }, 0);

        setUnreadMessageCount(totalUnread);
      }

      // Update notification count for worker
      const workerNotifications = storage.getNotifications().filter(n => {
        // Get notifications related to this worker's tasks from office/admin only
        // Exclude notifications triggered by the worker themselves
        if (n.projectId && n.taskId) {
          const project = projects.find(p => p.id === n.projectId);
          if (project) {
            const task = project.tasks.find((t: any) => t.id === n.taskId);
            // Only show unread notifications for tasks assigned to this worker
            // Exclude task_rejected (worker's own action) - only show task_assigned and other admin actions
            const isRelevant = task && task.assignedTo === selectedWorkerId && !n.read;
            const isFromOffice = n.type !== 'task_rejected'; // Exclude worker's own rejections
            return isRelevant && isFromOffice;
          }
        }
        return false;
      });

      setNotificationCount(workerNotifications.length);

      // Load message threads for worker
      loadMessageThreads();
    }
  };

  const loadMessageThreads = async () => {
    const worker = workers.find(w => w.id === selectedWorkerId);
    if (!worker) return;

    // Cloud mode: fetch from API
    if (isCloudMode) {
      try {
        const response = await fetch(`/api/worker/messages?workerId=${selectedWorkerId}`);
        const data = await response.json();

        if (data.success) {
          const workerThreads = data.messages.map((item: any) => {
            const unreadCount = item.messages.filter((m: any) => !m.read && m.sender !== worker.name).length;
            const lastMessage = item.messages[item.messages.length - 1];

            return {
              ...item,
              lastMessage,
              unreadCount
            };
          });

          workerThreads.sort((a: any, b: any) =>
            new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
          );

          setMessageThreads(workerThreads);

          // FIX: Update selected thread with new messages (real-time updates)
          setSelectedThread(prevThread => {
            if (!prevThread) return prevThread;

            const updated = workerThreads.find((t: any) =>
              t.projectId === prevThread.projectId && t.taskId === prevThread.taskId
            );

            if (!updated) return prevThread;

            const oldCount = prevThread.messages?.length || 0;
            const newCount = updated.messages?.length || 0;

            if (newCount !== oldCount) {
              console.log('🔄 Worker: NEW MESSAGES!', oldCount, '→', newCount);
            }

            // Return new object to force re-render with updated messages
            return { ...updated };
          });
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
      return;
    }

    // Admin mode: use localStorage
    const allMessages = storage.getAllMessages();
    const projects = storage.getProjects();

    // Filter threads for this worker's tasks - each task gets its own thread
    const workerThreads = allMessages
      .filter(item => {
        // Check if this task is assigned to the current worker
        const project = projects.find(p => p.id === item.projectId);
        if (!project) return false;

        const task = project.tasks.find((t: any) => t.id === item.taskId);
        return task && task.assignedTo === selectedWorkerId;
      })
      .map(item => {
        // Calculate unread count (messages from admin/office, not from this worker)
        const unreadCount = item.messages.filter(m => !m.read && m.sender !== worker.name).length;
        const lastMessage = item.messages[item.messages.length - 1];

        return {
          ...item,
          lastMessage,
          unreadCount
        };
      });

    // Sort by last message time (most recent first)
    workerThreads.sort((a, b) =>
      new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
    );

    setMessageThreads(workerThreads);

    // FIX: Use functional state update to avoid stale closure
    setSelectedThread(prevThread => {
      if (!prevThread) return prevThread;

      const updated = workerThreads.find(t =>
        t.projectId === prevThread.projectId && t.taskId === prevThread.taskId
      );

      if (!updated) return prevThread;

      const oldCount = prevThread.messages?.length || 0;
      const newCount = updated.messages?.length || 0;

      if (newCount !== oldCount) {
        console.log('🔄 Worker: NEW MESSAGES!', oldCount, '→', newCount);
      }

      // Return new object to force re-render
      return { ...updated };
    });
  };

  // Activity logging
  const logActivity = async (type: string, description: string, metadata?: any) => {
    try {
      await fetch('/api/activity-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, description, metadata }),
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  // Get selected worker
  const selectedWorker = workers.find(w => w.id === selectedWorkerId);

  // Workflow handlers
  const handleConfirmProject = () => {
    if (!selectedProject || !selectedProject.tasks || selectedTaskIds.length === 0) return;

    const worker = workers.find(w => w.id === selectedWorkerId);
    if (worker) {
      selectedTaskIds.forEach(taskId => {
        const task = selectedProject.tasks.find(t => t.id === taskId);
        if (task) {
          storage.confirmTask(selectedProject.projectId, taskId, worker.name);
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
      setPhase('task-detail');
      setSelectedTask(null);
      setSelectedProject(null);
      loadData();
    }
  };

  const handleCantConfirm = (reason: string) => {
    if (!selectedProject || !selectedTaskIds.length) return;

    const worker = workers.find(w => w.id === selectedWorkerId);
    if (worker) {
      // Reject all selected tasks
      selectedTaskIds.forEach(taskId => {
        const task = selectedProject.tasks.find(t => t.id === taskId);
        if (task) {
          storage.rejectTask(selectedProject.projectId, taskId, worker.name, reason);
          storage.sendMessage(
            selectedProject.projectId,
            taskId,
            `Can't confirm: ${reason}`,
            worker.name
          );
          logActivity(
            'task_declined',
            `${worker.name} declined task: ${task.description} - ${reason}`,
            {
              workerId: worker.id,
              workerName: worker.name,
              projectId: selectedProject.projectId,
              projectNumber: selectedProject.projectNumber,
              taskId: task.id,
              taskDescription: task.description,
              reason
            }
          );
        }
      });
      setSelectedTask(null);
      setSelectedProject(null);
      setSelectedTaskIds([]);
      setPhase('task-detail');
      loadData();
    }
  };

  const handleSendMessage = (projectId?: string, taskId?: string) => {
    if (!messageText.trim()) return;

    const worker = workers.find(w => w.id === selectedWorkerId);
    if (worker) {
      const pid = projectId || selectedProject?.projectId;
      const tid = taskId || selectedTask?.id;

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

  const handleStartPrep = () => {
    setPhase('prep');
    setCheckedMat([]);
    setCheckedTools([]);
  };

  const handleStartWork = () => {
    setStartTime(new Date()); // Set start time when work begins
    const worker = workers.find(w => w.id === selectedWorkerId);
    if (worker && selectedProject && selectedTaskIds.length > 0) {
      selectedTaskIds.forEach(taskId => {
        const task = selectedProject.tasks.find(t => t.id === taskId);
        storage.startTask(selectedProject.projectId, taskId, worker.name);

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
  };

  const addPhoto = (stepId: number) => {
    const newPhoto = {
      id: Date.now().toString(),
      ts: new Date().toISOString(),
      url: `photo-${stepId}-${Date.now()}.jpg`
    };
    setStepPhotos(prev => ({
      ...prev,
      [stepId]: [...(prev[stepId] || []), newPhoto]
    }));
  };

  const rmPhoto = (stepId: number, photoId: string) => {
    setStepPhotos(prev => ({
      ...prev,
      [stepId]: (prev[stepId] || []).filter(p => p.id !== photoId)
    }));
  };

  const canComplete = (step: any) => {
    if (step.minPhotos) {
      const photos = stepPhotos[step.id] || [];
      return photos.length >= step.minPhotos;
    }
    return true;
  };

  const allScheduledTasks = projectGroups.flatMap(pg => pg.tasks).filter(t => t.scheduledDate);

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return allScheduledTasks.filter(task => {
      const taskDate = new Date(task.scheduledDate!);
      return taskDate.toISOString().split('T')[0] === dateStr;
    });
  };

  const statusBorders = {
    assigned: 'border-l-4 border-yellow-500',
    confirmed: 'border-l-4 border-orange-500',
    active: 'border-l-4 border-blue-600',
    completed: 'border-l-4 border-green-600',
  };

  const statusColors = {
    assigned: 'bg-yellow-500',
    confirmed: 'bg-orange-500',
    active: 'bg-blue-600',
    completed: 'bg-green-600',
  };

  const projectColorClasses = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-700' },
    green: { bg: 'bg-green-100', text: 'text-green-700' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-700' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-700' },
    red: { bg: 'bg-red-100', text: 'text-red-700' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    cyan: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
    gray: { bg: 'bg-gray-100', text: 'text-gray-700' }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isToday = (date: Date) => {
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate.getTime() === today.getTime();
  };

  const generateMonthDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    // Add next month preview days to fill the grid (6 rows total = 42 cells)
    const totalCells = 42;
    const remainingCells = totalCells - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      days.push(new Date(year, month + 1, day));
    }

    return days;
  };

  const getWeekStrip = () => {
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const date = new Date(selectedDate);
      date.setDate(selectedDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getVisibleDays = () => {
    const days = [];
    for (let i = 0; i < 2; i++) {
      const date = new Date(selectedDate);
      date.setDate(selectedDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const monthDays = generateMonthDays();
  const weekStrip = getWeekStrip();
  const visibleDays = getVisibleDays();
  const timeSlots = Array.from({ length: 17 }, (_, i) => i + 6);

  const assignedProjects = projectGroups.filter(p => p.status === 'assigned');
  const confirmedProjects = projectGroups.filter(p => p.status === 'confirmed');
  const activeProjects = projectGroups.filter(p => p.status === 'active');
  const completedProjects = projectGroups.filter(p => p.status === 'completed');

  // RENDER: Month View
  const renderMonthView = () => (
    <div className="bg-white">
      <div className="px-4 py-4 flex items-center justify-between border-b border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900">
          {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={() => {
            setSelectedDate(new Date());
            setCalendarView('day');
          }}
          className="text-blue-600 text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Today
        </button>
      </div>

      <div className="grid grid-cols-7 px-2 py-2 border-b border-gray-200">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-xs font-bold text-gray-500">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-fr">
        {monthDays.map((date, index) => {
          const tasks = date ? getTasksForDate(date) : [];
          const displayTasks = tasks.slice(0, 3);
          const overflowCount = tasks.length - 3;

          return (
            <div
              key={index}
              className={`aspect-[1/1.4] border-b border-r border-gray-200 overflow-hidden ${
                date ? 'bg-white hover:bg-gray-50 cursor-pointer transition-colors' : 'bg-gray-50'
              } ${index % 7 === 0 ? 'border-l' : ''}`}
              onClick={() => date && (setSelectedDate(date), setCalendarView('day'))}
            >
              {date ? (
                <div className="w-full h-full p-1.5 flex flex-col">
                  <div className="flex-shrink-0 mb-1">
                    <div className={`text-sm text-center ${
                      isToday(date)
                        ? 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold mx-auto'
                        : date.getMonth() !== selectedDate.getMonth()
                        ? 'text-gray-400'
                        : 'text-gray-900 font-semibold'
                    }`}>
                      {date.getDate()}
                    </div>
                  </div>

                  <div className="space-y-0.5 overflow-hidden flex-1">
                    {displayTasks.map((task) => {
                      const color = projectColorClasses[task.projectColor as keyof typeof projectColorClasses] || projectColorClasses.blue;
                      return (
                        <div
                          key={task.id}
                          className={`text-[9px] px-1.5 py-0.5 rounded ${color.bg} ${color.text} font-bold leading-tight truncate`}
                          title={`${task.projectNumber}: ${task.description}`}
                        >
                          {task.scheduledTime && <span>{task.scheduledTime} </span>}
                          <span>#{task.projectNumber}</span>
                        </div>
                      );
                    })}
                    {overflowCount > 0 && (
                      <div className="text-[9px] text-gray-500 px-1 font-semibold">
                        +{overflowCount} more
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );

  // RENDER: Day View
  const renderDayView = () => {
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();
    const showTimeLine = isToday(selectedDate);
    const timeLinePosition = ((currentHour - 6) * 50 + (currentMinute / 60) * 50);

    return (
      <div className="bg-white">
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200">
          <button
            onClick={() => setCalendarView('month')}
            className="text-blue-600 text-base font-bold flex items-center gap-1 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            ← {selectedDate.toLocaleDateString('en-US', { month: 'long' })}
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="text-blue-600 text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center justify-center gap-4 py-3 border-b border-gray-200 bg-gray-50">
          {weekStrip.map((date, idx) => {
            const isTodayDate = isToday(date);
            const isSelected = date.toDateString() === selectedDate.toDateString();

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(date)}
                className="flex flex-col items-center min-w-[40px]"
              >
                <div className="text-xs text-gray-500 mb-1 font-bold">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })[0]}
                </div>
                <div className={`text-2xl font-bold ${
                  isTodayDate
                    ? 'bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center'
                    : isSelected
                    ? 'text-gray-900'
                    : 'text-gray-400'
                }`}>
                  {date.getDate()}
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-[60px_1fr_1fr] border-b border-gray-200 bg-gray-50">
          <div></div>
          {visibleDays.map((date, idx) => (
            <div key={idx} className="text-center py-2 border-l border-gray-200">
              <div className="text-sm font-bold text-gray-900">
                {date.toLocaleDateString('en-US', { weekday: 'short' })} {date.getDate()}
              </div>
            </div>
          ))}
        </div>

        <div className="relative overflow-visible">
          {showTimeLine && currentHour >= 6 && currentHour <= 22 && (
            <div
              className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
              style={{ top: `${timeLinePosition}px` }}
            >
              <div className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded ml-1">
                {formatTime(`${currentHour}:${currentMinute.toString().padStart(2, '0')}`)}
              </div>
              <div className="flex-1 h-0.5 bg-red-500"></div>
            </div>
          )}

          <div className="grid grid-cols-[60px_1fr_1fr] overflow-visible">
            {timeSlots.map((hour) => {
              return (
                <React.Fragment key={hour}>
                  <div className="text-xs text-gray-500 text-right pr-2 pt-1 border-b border-gray-200 h-[50px] font-medium">
                    {formatTime(`${hour}:00`)}
                  </div>

                  {visibleDays.map((date, dayIdx) => {
                    const dayTasks = getTasksForDate(date);
                    const tasksStartingHere = dayTasks.filter(task => {
                      const taskStartHour = task.scheduledTime ? parseInt(task.scheduledTime.split(':')[0]) : 6;
                      return hour === taskStartHour;
                    });

                    return (
                      <div
                        key={dayIdx}
                        className="h-[50px] border-b border-l border-gray-200 relative p-1 overflow-visible"
                      >
                        {tasksStartingHere.map((task, taskIdx) => {
                          const startHour = task.scheduledTime ? parseInt(task.scheduledTime.split(':')[0]) : 6;
                          const startMinute = task.scheduledTime ? parseInt(task.scheduledTime.split(':')[1]) : 0;
                          const duration = task.duration || task.estimatedHours || 1;
                          const durationMinutes = duration * 60;

                          // Calculate vertical position and height
                          const blockHeight = (durationMinutes / 60) * 50;
                          const topOffset = (startMinute / 60) * 50;

                          // Calculate horizontal positioning for overlapping tasks
                          const totalTasksAtSameTime = tasksStartingHere.length;
                          const taskWidth = totalTasksAtSameTime > 1 ? `${100 / totalTasksAtSameTime}%` : 'calc(100% - 8px)';
                          const leftPosition = totalTasksAtSameTime > 1 ? `${(taskIdx * 100) / totalTasksAtSameTime}%` : '4px';

                          const color = projectColorClasses[task.projectColor as keyof typeof projectColorClasses] || projectColorClasses.blue;

                          // Determine status for border
                          let taskStatus = 'assigned';
                          if (task.status === 'in_progress') taskStatus = 'active';
                          else if (task.status === 'completed') taskStatus = 'completed';
                          else if (task.status === 'accepted' || task.status === 'confirmed') taskStatus = 'confirmed';

                          const statusBorder = statusBorders[taskStatus as keyof typeof statusBorders] || statusBorders.assigned;

                          return (
                            <div
                              key={task.id}
                              className={`absolute ${color.bg} ${statusBorder} rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity`}
                              style={{
                                height: `${blockHeight}px`,
                                top: `${topOffset}px`,
                                left: leftPosition,
                                width: taskWidth,
                                zIndex: 10 + taskIdx
                              }}
                              onClick={() => {
                                setSelectedTask(task);
                                const project = projectGroups.find(p =>
                                  p.projectId === task.projectId &&
                                  p.status === taskStatus
                                );
                                setSelectedProject(project || null);
                              }}
                            >
                              <div className="p-1 h-full flex flex-col">
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                  <div className={`${color.text} text-[11px] font-semibold leading-none truncate flex-1`}>
                                    {task.projectClient.split(' ')[0]}
                                  </div>
                                </div>

                                <div className={`${color.text} text-[10px] leading-none font-semibold opacity-80`}>
                                  {task.scheduledTime || ''}
                                </div>

                                {durationMinutes > 60 && (
                                  <div className={`${color.text} text-[9px] mt-0.5 line-clamp-1 leading-tight opacity-60`}>
                                    {task.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // RENDER: Schedule Tab
  const renderScheduleTab = () => (
    <>
      <div className="bg-white border-b border-gray-200">
        <button
          onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900">Schedule</h2>
          </div>
          {isCalendarExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {!isCalendarExpanded && (
          <div className="px-4 pb-3 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-600"></div>
              <span className="text-gray-600 font-medium">{activeProjects.length} Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <span className="text-gray-600 font-medium">{assignedProjects.length + confirmedProjects.length} Upcoming</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-600"></div>
              <span className="text-gray-600 font-medium">{completedProjects.length} Done</span>
            </div>
          </div>
        )}
      </div>

      {isCalendarExpanded && (
        <div className="transition-all duration-300">
          {calendarView === 'month' && renderMonthView()}
          {calendarView === 'day' && renderDayView()}
        </div>
      )}
    </>
  );

  // RENDER: Jobs Tab
  const renderJobsTab = () => {
    const ProjectCard = ({ project }: { project: ProjectGroup }) => {
      const projectKey = `${project.projectId}-${project.status}`;
      const isExpanded = expandedProjects.includes(projectKey);
      const color = projectColorClasses[project.projectColor as keyof typeof projectColorClasses] || projectColorClasses.blue;

      return (
        <div className={`${color.bg} rounded-lg overflow-hidden ${statusBorders[project.status]}`}>
          <button
            onClick={() => setExpandedProjects(isExpanded
              ? expandedProjects.filter(id => id !== projectKey)
              : [...expandedProjects, projectKey]
            )}
            className="w-full p-3 text-left hover:opacity-90 transition-opacity"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className={`${color.text} font-bold text-base mb-1`}>{project.projectClient}</div>
                <div className="text-gray-600 text-xs font-semibold">#{project.projectNumber}</div>
              </div>
            </div>
            <div className={`${color.text} text-sm font-semibold mb-1`}>{project.tasks[0]?.description}</div>
            <div className="flex items-center gap-3 text-xs font-medium text-gray-600">
              <span>⏱ {project.totalHours}h total</span>
              {project.tasks.length > 1 && (
                <span>• {project.tasks.length} tasks</span>
              )}
            </div>
          </button>

          {isExpanded && (
            <div className="px-3 pb-3 space-y-2 border-t border-gray-200 pt-2">
              {project.tasks.map(task => {
                const timeUntil = task.scheduledDate ? getTimeUntil(task.scheduledDate, task.scheduledTime) : '';
                const isPast = timeUntil.includes('ago');

                // Format date as "Oct 8" or "Oct 10"
                let formattedDate = '';
                if (task.scheduledDate) {
                  try {
                    let dateObj: Date;
                    if (task.scheduledDate.includes('/')) {
                      const [month, day, year] = task.scheduledDate.split('/');
                      dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    } else if (task.scheduledDate.includes('-')) {
                      dateObj = new Date(task.scheduledDate + 'T00:00:00');
                    } else {
                      dateObj = new Date(task.scheduledDate);
                    }
                    formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  } catch (e) {
                    formattedDate = task.scheduledDate;
                  }
                }

                return (
                  <button
                    key={task.id}
                    onClick={() => {
                      setSelectedTask(task);
                      setSelectedProject(project);
                    }}
                    className="w-full text-left bg-white rounded-lg p-2.5 hover:shadow-md transition-shadow border border-gray-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className={`${color.text} text-sm font-semibold flex-1`}>{task.description}</div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {formattedDate && (
                          <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                            isPast ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
                          }`}>
                            {formattedDate}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 font-medium">
                      {task.scheduledTime && (
                        <span>{task.scheduledTime}</span>
                      )}
                      <span>• {task.duration || task.estimatedHours || 0}h</span>
                      {timeUntil && (
                        <>
                          <span>•</span>
                          <span className={isPast ? 'text-red-600' : 'text-green-600'}>
                            {timeUntil}
                          </span>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="p-4 space-y-6 pb-24 bg-gray-50">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900">Assigned</h3>
            <span className="text-sm font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{assignedProjects.length}</span>
          </div>
          <div className="space-y-2">
            {assignedProjects.length === 0 ? (
              <p className="text-center text-gray-400 py-6 text-sm font-medium">No assigned tasks</p>
            ) : (
              assignedProjects.map(project => <ProjectCard key={`${project.projectId}-${project.status}`} project={project} />)
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900">Confirmed</h3>
            <span className="text-sm font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{confirmedProjects.length}</span>
          </div>
          <div className="space-y-2">
            {confirmedProjects.length === 0 ? (
              <p className="text-center text-gray-400 py-6 text-sm font-medium">No confirmed tasks</p>
            ) : (
              confirmedProjects.map(project => <ProjectCard key={`${project.projectId}-${project.status}`} project={project} />)
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900">Active</h3>
            <span className="text-sm font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{activeProjects.length}</span>
          </div>
          <div className="space-y-2">
            {activeProjects.length === 0 ? (
              <p className="text-center text-gray-400 py-6 text-sm font-medium">No active tasks</p>
            ) : (
              activeProjects.map(project => <ProjectCard key={`${project.projectId}-${project.status}`} project={project} />)
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900">Completed</h3>
            <span className="text-sm font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{completedProjects.slice(0, 5).length}</span>
          </div>
          <div className="space-y-2">
            {completedProjects.length === 0 ? (
              <p className="text-center text-gray-400 py-6 text-sm font-medium">No completed tasks</p>
            ) : (
              completedProjects.slice(0, 5).map(project => <ProjectCard key={`${project.projectId}-${project.status}`} project={project} />)
            )}
          </div>
        </div>
      </div>
    );
  };

  // Message handlers
  const handleSelectThread = async (thread: any) => {
    const worker = workers.find(w => w.id === selectedWorkerId);
    if (!worker) return;

    setSelectedThread(thread);
    setShowThreadList(false);

    // Mark messages as read
    if (isCloudMode) {
      try {
        await fetch('/api/worker/messages', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: thread.projectId,
            taskId: thread.taskId,
            workerId: selectedWorkerId,
          }),
        });
      } catch (error) {
        console.error('Failed to mark messages as read:', error);
      }
    } else {
      storage.markMessagesAsRead(thread.projectId, thread.taskId, worker.name);
    }

    await loadMessageThreads();
    await loadData(); // Reload to update counts
  };

  const handleSendThreadMessage = async () => {
    const worker = workers.find(w => w.id === selectedWorkerId);
    if (!selectedThread || !threadMessageText.trim() || !worker) return;

    const messageTextToSend = threadMessageText;

    // Cloud mode: send via API
    if (isCloudMode) {
      // OPTIMISTIC UPDATE: Add message to UI immediately
      const optimisticMessage = {
        id: `temp_${Date.now()}`,
        sender: worker.name,
        text: messageTextToSend,
        timestamp: new Date().toISOString(),
        read: false,
      };

      setSelectedThread({
        ...selectedThread,
        messages: [...(selectedThread.messages || []), optimisticMessage],
      });
      setThreadMessageText('');

      try {
        console.log('📤 Sending message:', {
          projectId: selectedThread.projectId,
          taskId: selectedThread.taskId,
          text: messageTextToSend,
          sender: worker.name
        });

        const response = await fetch('/api/worker/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: selectedThread.projectId,
            taskId: selectedThread.taskId,
            text: messageTextToSend,
            sender: worker.name,
            workerId: selectedWorkerId,
          }),
        });

        const data = await response.json();
        console.log('📨 Message send response:', data);

        if (data.success) {
          // Reload messages to get the confirmed version from server
          await loadMessageThreads();

          // Refetch the thread to get actual message IDs
          const threadResponse = await fetch(`/api/worker/messages?workerId=${selectedWorkerId}`);
          const threadData = await threadResponse.json();

          if (threadData.success) {
            const updatedThread = threadData.messages.find((m: any) =>
              m.projectId === selectedThread.projectId && m.taskId === selectedThread.taskId
            );

            if (updatedThread) {
              setSelectedThread({
                ...updatedThread,
                projectNumber: selectedThread.projectNumber,
                taskDescription: selectedThread.taskDescription
              });
              console.log('✅ Message sent and thread updated with server data');
            }
          }
        } else {
          // Revert optimistic update on failure
          console.error('❌ Message send failed:', data.error);
          setSelectedThread({
            ...selectedThread,
            messages: selectedThread.messages.filter((m: any) => m.id !== optimisticMessage.id),
          });
          setThreadMessageText(messageTextToSend);
          alert('Failed to send message: ' + data.error);
        }
      } catch (error) {
        // Revert optimistic update on error
        console.error('Failed to send message:', error);
        setSelectedThread({
          ...selectedThread,
          messages: selectedThread.messages.filter((m: any) => m.id !== optimisticMessage.id),
        });
        setThreadMessageText(messageTextToSend);
        alert('Error sending message. Check console.');
      }
      return;
    }

    // Admin mode: use localStorage
    storage.sendMessage(selectedThread.projectId, selectedThread.taskId, threadMessageText, worker.name);
    setThreadMessageText('');
    loadMessageThreads();
  };

  const handleBackToThreads = () => {
    setShowThreadList(true);
    setSelectedThread(null);
  };

  // RENDER: Messages Tab
  const renderMessagesTab = () => {

    // Mobile view: either show threads list or conversation
    if (!showThreadList && selectedThread) {
      return (
        <div className="h-full bg-white relative">
          {/* Thread Header - Fixed at top of conversation */}
          <div className="fixed top-[44px] left-0 right-0 bg-white border-b border-gray-200 p-2.5 flex items-center gap-2 shadow-sm z-30">
            <div className="max-w-md mx-auto w-full flex items-center gap-2">
              <button
                onClick={handleBackToThreads}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <ChevronDown className="w-5 h-5 text-gray-600 transform rotate-90" />
              </button>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm leading-tight">#{selectedThread.projectNumber}</h3>
                <p className="text-[10px] text-gray-600 truncate">{selectedThread.taskDescription}</p>
              </div>
            </div>
          </div>

          {/* Messages - Scrollable area with proper padding */}
          <div className="h-full overflow-y-auto overscroll-none p-4 space-y-3 bg-gray-50" style={{ paddingTop: '60px', paddingBottom: '160px', WebkitOverflowScrolling: 'touch' }}>
            {selectedThread.messages && selectedThread.messages.length > 0 ? (
              <>
                {selectedThread.messages.map((message: any) => {
                  const worker = workers.find(w => w.id === selectedWorkerId);
                  const isMe = message.sender === worker?.name;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                          isMe
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <div className={`text-xs mb-1 font-semibold ${isMe ? 'text-blue-200' : 'text-gray-500'}`}>
                          {message.sender}
                        </div>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</div>
                        <div className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Start a conversation</h3>
                  <p className="text-gray-500 text-sm">Send the first message about this task</p>
                </div>
              </div>
            )}
          </div>

          {/* Message Input - Fixed at bottom of screen */}
          <div className="fixed bottom-14 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-lg z-30">
            <div className="max-w-md mx-auto flex gap-2 items-end">
              <textarea
                value={threadMessageText}
                onChange={(e) => setThreadMessageText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendThreadMessage();
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500 resize-none"
                style={{ fontSize: '16px' }}
                rows={2}
              />
              <button
                onClick={handleSendThreadMessage}
                disabled={!threadMessageText.trim()}
                className="bg-blue-600 text-white p-2.5 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors shadow-lg flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Threads list view
    return (
      <div className="h-full bg-gray-50 flex flex-col">
        <div className="flex-shrink-0 p-4 bg-gray-50 flex items-center justify-between border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Messages</h2>
            <p className="text-sm text-gray-500">
              {messageThreads.reduce((acc, t) => acc + t.unreadCount, 0)} unread
            </p>
          </div>
          {!isCloudMode && (
            <button
              onClick={async () => {
                console.log('🔄 MANUAL SYNC TRIGGERED BY USER');
                const { syncDataToCloud } = await import('@/lib/syncToCloud');
                await syncDataToCloud();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
            >
              🔄 Sync
            </button>
          )}
        </div>

        {messageThreads.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-16 px-4">
              <MessageSquare className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Messages</h3>
              <p className="text-gray-500 text-sm font-medium">Messages from your admin will appear here</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-gray-200 bg-white" style={{ overscrollBehavior: 'none', WebkitOverflowScrolling: 'touch' }}>
            {messageThreads.map(thread => (
              <div
                key={`${thread.projectId}-${thread.taskId}`}
                onClick={() => handleSelectThread(thread)}
                className="bg-white p-4 active:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900 text-base">
                    #{thread.projectNumber}
                  </h3>
                  {thread.unreadCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full min-w-[24px] text-center">
                      {thread.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 line-clamp-1 mb-2 font-medium">{thread.taskDescription}</p>
                <p className="text-sm text-gray-500 line-clamp-2">
                  <span className="font-semibold">{thread.lastMessage.sender}:</span> {thread.lastMessage.text}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(thread.lastMessage.timestamp).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // RENDER: Task Detail Bottom Sheet
  const renderTaskDetailSheet = () => {
    if (!selectedTask || !selectedProject) return null;

    const color = projectColorClasses[selectedProject.projectColor as keyof typeof projectColorClasses] || projectColorClasses.blue;

    const closeSheet = () => {
      setSelectedTask(null);
      setSelectedProject(null);
      setPhase('task-detail');
      setSelectedTaskIds([]);
      setCheckedMat([]);
      setCheckedTools([]);
      setDoneSteps([]);
      setStepPhotos({});
      setReminderTime('1hr');
      setCleanChecks([]);
      setCleanPhotos([]);
      setInspectDone(false);
      setCustomerOK(false);
      setFinalPhotos([]);
      setStartTime(null);
    };

    const handleOpenFullDetails = () => {
      // Route to appropriate phase based on task status
      if (selectedTask.status === 'pending_acceptance') {
        setPhase('review');
        setSelectedTaskIds([selectedTask.id]);
      } else if (selectedTask.status === 'accepted' || selectedTask.status === 'confirmed') {
        setPhase('prep');
        setSelectedTaskIds([selectedTask.id]);
      } else if (selectedTask.status === 'in_progress') {
        setPhase('active');
        setSelectedTaskIds([selectedTask.id]);
        // Initialize steps if they exist
        if (selectedTask.steps && selectedTask.steps.length > 0) {
          // Steps already handled
        }
      }
    };

    // PHASE: REVIEW - Accept/Reject task
    if (phase === 'review') {
      return (
        <div
          className="fixed inset-0 bg-black/60 flex items-end justify-center z-50"
          onClick={closeSheet}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
            </div>

            <div className="px-6 pb-6 space-y-4">
              {/* Project Color Accent Bar */}
              <div
                className="h-1 rounded-full -mx-6 mb-2"
                style={{
                  backgroundColor: projectColorClasses[selectedProject.projectColor as keyof typeof projectColorClasses]?.text.replace('text-', '') || '#3b82f6'
                }}
              />

              {/* Clean header with project badge */}
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="px-3 py-1.5 rounded-full text-xs font-bold border-2"
                  style={{
                    borderColor: projectColorClasses[selectedProject.projectColor as keyof typeof projectColorClasses]?.text.replace('text-', '') || '#3b82f6',
                    color: projectColorClasses[selectedProject.projectColor as keyof typeof projectColorClasses]?.text.replace('text-', '') || '#3b82f6',
                    backgroundColor: projectColorClasses[selectedProject.projectColor as keyof typeof projectColorClasses]?.bg.replace('bg-', '').replace('-100', '-50') || '#eff6ff'
                  }}
                >
                  #{selectedProject.projectNumber}
                </div>
              </div>

              {/* Phase indicator - neutral with icon */}
              <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white rounded-xl border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                    <Bell size={22} className="text-gray-700" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">New Assignment</div>
                    <div className="text-sm text-gray-600">Review and confirm task</div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedProject.projectClient}</h2>
                <div className="flex items-start gap-2 text-gray-700">
                  <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedProject.projectAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm font-medium"
                  >
                    {selectedProject.projectAddress}
                  </a>
                </div>
              </div>

              {/* Task details card - neutral */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                <div className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wide">Task Details</div>
                <div className="font-bold text-gray-900 mb-3">{selectedTask.description}</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {selectedTask.scheduledDate && (
                    <div className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-lg font-semibold border border-gray-200">
                      <Calendar size={12} />
                      {selectedTask.scheduledDate}
                    </div>
                  )}
                  {selectedTask.scheduledTime && (
                    <div className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-lg font-semibold border border-gray-200">
                      <Clock size={12} />
                      {selectedTask.scheduledTime}
                    </div>
                  )}
                  <div className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-lg font-semibold border border-gray-200">
                    <Clock size={12} />
                    {selectedTask.duration || selectedTask.estimatedHours || 0}h
                  </div>
                </div>
                {selectedTask.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-700">{selectedTask.notes}</div>
                )}
              </div>

              {/* Primary action button - blue */}
              <button
                onClick={() => {
                  // Confirm the task but don't close - go to calendar phase
                  if (selectedProject && selectedProject.tasks && selectedTaskIds.length > 0) {
                    const worker = workers.find(w => w.id === selectedWorkerId);
                    if (worker) {
                      selectedTaskIds.forEach(taskId => {
                        const task = selectedProject.tasks.find(t => t.id === taskId);
                        if (task) {
                          storage.confirmTask(selectedProject.projectId, taskId, worker.name);
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
                      loadData();
                    }
                  }
                  setPhase('calendar');
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <CheckCircle size={20} />
                Accept & Continue
              </button>

              <button
                onClick={() => handleCantConfirm('Not available')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-xl"
              >
                Can't Confirm
              </button>

              <button
                onClick={closeSheet}
                className="w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-bold py-3 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    }

    // PHASE: CALENDAR - Add to calendar with reminder
    if (phase === 'calendar') {
      const reminderLabels = {
        '30min': '30 minutes before',
        '1hr': '1 hour before',
        '2hr': '2 hours before',
        '1day': '1 day before'
      };

      return (
        <div
          className="fixed inset-0 bg-black/60 flex items-end justify-center z-50"
          onClick={closeSheet}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
            </div>

            <div className="px-6 pb-6 space-y-4">
              {/* Project Color Accent Bar */}
              <div
                className="h-1 rounded-full -mx-6 mb-2"
                style={{
                  backgroundColor: projectColorClasses[selectedProject.projectColor as keyof typeof projectColorClasses]?.text.replace('text-', '') || '#3b82f6'
                }}
              />

              {/* Project badge */}
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="px-3 py-1.5 rounded-full text-xs font-bold border-2"
                  style={{
                    borderColor: projectColorClasses[selectedProject.projectColor as keyof typeof projectColorClasses]?.text.replace('text-', '') || '#3b82f6',
                    color: projectColorClasses[selectedProject.projectColor as keyof typeof projectColorClasses]?.text.replace('text-', '') || '#3b82f6',
                    backgroundColor: projectColorClasses[selectedProject.projectColor as keyof typeof projectColorClasses]?.bg.replace('bg-', '').replace('-100', '-50') || '#eff6ff'
                  }}
                >
                  #{selectedProject.projectNumber}
                </div>
              </div>

              {/* Phase indicator - neutral */}
              <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white rounded-xl border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                    <Bell size={22} className="text-gray-700" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">Set Reminder</div>
                    <div className="text-sm text-gray-600">Get notified before the job</div>
                  </div>
                </div>
              </div>

              {/* Event details - white card */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-4 space-y-3">
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase mb-1">Event</div>
                  <div className="font-bold text-gray-900">{selectedTask.description}</div>
                  <div className="text-sm text-gray-600">for {selectedProject.projectClient}</div>
                </div>

                <div className="h-px bg-gray-200"></div>

                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase mb-1">When</div>
                  <div className="flex items-center gap-2 text-gray-900 font-bold">
                    <Calendar size={16} />
                    {selectedTask.scheduledDate ? new Date(selectedTask.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not scheduled'} at {selectedTask.scheduledTime || 'TBD'}
                  </div>
                  <div className="text-sm text-gray-600">{selectedTask.duration || selectedTask.estimatedHours || 0}h estimated</div>
                </div>

                <div className="h-px bg-gray-200"></div>

                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase mb-1">Location</div>
                  <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                    <MapPin size={16} />
                    {selectedProject.projectAddress}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Bell size={18} className="text-gray-700" />
                  <label className="text-sm font-bold text-gray-900">Reminder time:</label>
                </div>
                <div className="space-y-2">
                  {Object.entries(reminderLabels).map(([value, label]) => (
                    <div
                      key={value}
                      onClick={() => setReminderTime(value)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        reminderTime === value
                          ? 'bg-blue-50 border-blue-500 shadow-sm'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          reminderTime === value
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {reminderTime === value && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <span className={`font-semibold text-sm ${reminderTime === value ? 'text-gray-900' : 'text-gray-700'}`}>
                          {label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Primary action button - blue */}
              <button
                onClick={() => setPhase('prep')}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <CheckCircle size={20} />
                Continue to Prep
              </button>

              <button
                onClick={() => setPhase('prep')}
                className="w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-bold py-3 rounded-xl"
              >
                Skip for Now
              </button>
            </div>
          </div>
        </div>
      );
    }

    // PHASE: PREP - Materials and Tools checklist
    if (phase === 'prep') {
      // Collect all materials and tools from selected tasks
      const allSelectedTasks = selectedTaskIds.map(taskId =>
        selectedProject.tasks.find(t => t.id === taskId)
      ).filter(Boolean);

      // Group materials by task
      const taskMaterialGroups = allSelectedTasks.map((task: any) => ({
        taskId: task.id,
        taskDescription: task.description,
        materials: task.materials || []
      })).filter(group => group.materials.length > 0);

      // Group tools by task
      const taskToolGroups = allSelectedTasks.map((task: any) => ({
        taskId: task.id,
        taskDescription: task.description,
        tools: task.tools || []
      })).filter(group => group.tools.length > 0);

      // Count total items
      const totalMaterials = taskMaterialGroups.reduce((sum, group) => sum + group.materials.length, 0);
      const totalTools = taskToolGroups.reduce((sum, group) => sum + group.tools.length, 0);

      const allMat = totalMaterials === 0 || checkedMat.length === totalMaterials;
      const allTool = totalTools === 0 || checkedTools.length === totalTools;
      const ready = allMat && allTool;

      return (
        <div
          className="fixed inset-0 bg-black/60 flex items-end justify-center z-50"
          onClick={closeSheet}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
            </div>

            <div className="px-6 pb-6 space-y-4">
              {/* Project Color Accent Bar */}
              <div
                className="h-1 rounded-full -mx-6 mb-2"
                style={{
                  backgroundColor: projectColorClasses[selectedProject.projectColor as keyof typeof projectColorClasses]?.text.replace('text-', '') || '#3b82f6'
                }}
              />

              {/* Project badge */}
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="px-3 py-1.5 rounded-full text-xs font-bold border-2"
                  style={{
                    borderColor: projectColorClasses[selectedProject.projectColor as keyof typeof projectColorClasses]?.text.replace('text-', '') || '#3b82f6',
                    color: projectColorClasses[selectedProject.projectColor as keyof typeof projectColorClasses]?.text.replace('text-', '') || '#3b82f6',
                    backgroundColor: projectColorClasses[selectedProject.projectColor as keyof typeof projectColorClasses]?.bg.replace('bg-', '').replace('-100', '-50') || '#eff6ff'
                  }}
                >
                  #{selectedProject.projectNumber}
                </div>
              </div>

              {/* Phase indicator - neutral */}
              <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white rounded-xl border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                    <Package size={22} className="text-gray-700" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">Load Truck</div>
                    <div className="text-sm text-gray-600">Check off items as you load</div>
                  </div>
                </div>
              </div>

              {/* Task info */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-3">
                <div className="text-xs font-bold text-gray-500 uppercase mb-1">Loading for:</div>
                <div className="font-bold text-gray-900 text-sm">{selectedTask.description}</div>
              </div>

              {taskMaterialGroups.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package size={18} className="text-gray-700" />
                      <div className="text-sm font-bold text-gray-900">Materials</div>
                    </div>
                    <div className="px-2 py-1 bg-gray-100 rounded-lg">
                      <span className="text-xs font-bold text-gray-700">
                        {checkedMat.length}/{totalMaterials}
                      </span>
                    </div>
                  </div>

                  {taskMaterialGroups.map((group, groupIdx) => {
                    let currentIndex = taskMaterialGroups.slice(0, groupIdx).reduce((sum, g) => sum + g.materials.length, 0);

                    return (
                      <div key={group.taskId} className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm">
                        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                          <div className="text-xs font-semibold text-gray-600">Task:</div>
                          <div className="text-sm font-bold text-gray-900 line-clamp-1">{group.taskDescription}</div>
                        </div>
                        <div className="p-2 space-y-2">
                          {group.materials.map((mat: any, matIdx: number) => {
                            const globalIdx = currentIndex + matIdx;
                            const isChecked = checkedMat.includes(globalIdx);
                            return (
                              <div
                                key={matIdx}
                                onClick={() => {
                                  if (isChecked) {
                                    setCheckedMat(checkedMat.filter(i => i !== globalIdx));
                                  } else {
                                    setCheckedMat([...checkedMat, globalIdx]);
                                  }
                                }}
                                className={`flex items-center gap-3 p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                                  isChecked
                                    ? 'bg-green-50 border-green-500 shadow-sm'
                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                                  isChecked
                                    ? 'bg-green-600 border-green-600'
                                    : 'border-gray-300'
                                }`}>
                                  {isChecked && <CheckCircle size={12} className="text-white" strokeWidth={3} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={`font-semibold text-sm truncate ${isChecked ? 'text-gray-900' : 'text-gray-700'}`}>{mat.name}</div>
                                  {mat.quantity && <div className="text-xs text-gray-600">{mat.quantity} {mat.unit}</div>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {taskToolGroups.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wrench size={18} className="text-gray-700" />
                      <div className="text-sm font-bold text-gray-900">Tools</div>
                    </div>
                    <div className="px-2 py-1 bg-gray-100 rounded-lg">
                      <span className="text-xs font-bold text-gray-700">
                        {checkedTools.length}/{totalTools}
                      </span>
                    </div>
                  </div>

                  {taskToolGroups.map((group, groupIdx) => {
                    let currentIndex = taskToolGroups.slice(0, groupIdx).reduce((sum, g) => sum + g.tools.length, 0);

                    return (
                      <div key={group.taskId} className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm">
                        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                          <div className="text-xs font-semibold text-gray-600">Task:</div>
                          <div className="text-sm font-bold text-gray-900 line-clamp-1">{group.taskDescription}</div>
                        </div>
                        <div className="p-2 space-y-2">
                          {group.tools.map((tool: any, toolIdx: number) => {
                            const globalIdx = currentIndex + toolIdx;
                            const isChecked = checkedTools.includes(globalIdx);
                            return (
                              <div
                                key={toolIdx}
                                onClick={() => {
                                  if (isChecked) {
                                    setCheckedTools(checkedTools.filter(i => i !== globalIdx));
                                  } else {
                                    setCheckedTools([...checkedTools, globalIdx]);
                                  }
                                }}
                                className={`flex items-center gap-3 p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                                  isChecked
                                    ? 'bg-green-50 border-green-500 shadow-sm'
                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                                  isChecked
                                    ? 'bg-green-600 border-green-600'
                                    : 'border-gray-300'
                                }`}>
                                  {isChecked && <CheckCircle size={12} className="text-white" strokeWidth={3} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={`font-semibold text-sm truncate ${isChecked ? 'text-gray-900' : 'text-gray-700'}`}>{tool.name || tool}</div>
                                  {tool.note && <div className="text-xs text-gray-600">{tool.note}</div>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {totalMaterials === 0 && totalTools === 0 && (
                <div className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200 text-center">
                  <AlertCircle size={28} className="text-gray-400 mx-auto mb-2" />
                  <div className="font-bold text-gray-700 mb-1">No Materials or Tools Listed</div>
                  <div className="text-sm text-gray-600">You can proceed to site</div>
                </div>
              )}

              {/* Primary action - blue */}
              <button
                onClick={handleStartWork}
                disabled={!ready}
                className={`w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  ready
                    ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle size={20} />
                All Loaded - Head to Site
              </button>

              <button
                onClick={closeSheet}
                className="w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-bold py-3 rounded-xl"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    // PHASE: ACTIVE - Step-by-step execution
    if (phase === 'active') {
      const steps = selectedTask.steps || [
        { id: 1, title: 'Step 1', action: 'Complete first step', minPhotos: 1 },
        { id: 2, title: 'Step 2', action: 'Complete second step', minPhotos: 1 }
      ];

      const progress = (doneSteps.length / steps.length) * 100;

      return (
        <div
          className="fixed inset-0 bg-black/60 flex items-end justify-center z-50"
          onClick={closeSheet}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
            </div>

            <div className="px-6 pb-6 space-y-4">
              {/* Project Color Accent Bar */}
              <div
                className="h-1 rounded-full -mx-6 mb-2"
                style={{
                  backgroundColor: projectColorClasses[selectedProject.projectColor as keyof typeof projectColorClasses]?.text.replace('text-', '') || '#3b82f6'
                }}
              />

              {/* Project badge */}
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="px-3 py-1.5 rounded-full text-xs font-bold border-2"
                  style={{
                    borderColor: projectColorClasses[selectedProject.projectColor as keyof typeof projectColorClasses]?.text.replace('text-', '') || '#3b82f6',
                    color: projectColorClasses[selectedProject.projectColor as keyof typeof projectColorClasses]?.text.replace('text-', '') || '#3b82f6',
                    backgroundColor: projectColorClasses[selectedProject.projectColor as keyof typeof projectColorClasses]?.bg.replace('bg-', '').replace('-100', '-50') || '#eff6ff'
                  }}
                >
                  #{selectedProject.projectNumber}
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                  On-Site
                </div>
              </div>

              {/* Progress card - white with project color accent */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1 min-w-0 mr-4">
                    <h2 className="text-lg font-bold text-gray-900 mb-1">{selectedProject.projectClient}</h2>
                    <div className="text-sm text-gray-600 truncate">{selectedTask.description}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-3xl font-black text-gray-900">{doneSteps.length}<span className="text-gray-400">/{steps.length}</span></div>
                    <div className="text-xs text-gray-500 font-semibold">Steps Done</div>
                  </div>
                </div>
                {/* Progress bar with project color */}
                <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: projectColorClasses[selectedProject.projectColor as keyof typeof projectColorClasses]?.text.replace('text-', '') || '#3b82f6'
                    }}
                  />
                </div>
              </div>

              {steps.map((step: any) => {
                const done = doneSteps.includes(step.id);
                const exp = expandStep === step.id;
                const photos = stepPhotos[step.id] || [];
                const canDo = canComplete(step);

                return (
                  <div
                    key={step.id}
                    className={`bg-white rounded-xl overflow-hidden border-2 transition-all ${
                      done ? 'opacity-60 border-gray-200' : 'border-gray-300 shadow-sm'
                    }`}
                  >
                    <div
                      onClick={() => !done && setExpandStep(exp ? null : step.id)}
                      className={`p-4 flex items-start gap-3 cursor-pointer ${done ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex-shrink-0">
                        {done ? (
                          <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center">
                            <CheckCircle size={20} className="text-white" strokeWidth={2.5} />
                          </div>
                        ) : (
                          <div className="w-9 h-9 border-2 border-gray-300 bg-white rounded-lg flex items-center justify-center text-gray-700 font-bold text-sm">
                            {step.id}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold mb-1 ${done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {step.title}
                        </h3>
                        <p className={`text-sm ${done ? 'text-gray-400' : 'text-gray-600'}`}>
                          {step.action}
                        </p>
                        {photos.length > 0 && (
                          <div className="mt-2 flex items-center gap-1.5 text-green-600">
                            <Camera size={14} />
                            <span className="text-xs font-semibold">{photos.length} photo{photos.length > 1 ? 's' : ''} taken</span>
                          </div>
                        )}
                        {step.minPhotos && photos.length < step.minPhotos && !done && (
                          <div className="mt-2 flex items-center gap-1.5 text-amber-600">
                            <Camera size={14} />
                            <span className="text-xs font-semibold">Need {step.minPhotos - photos.length} more photo{step.minPhotos - photos.length > 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {exp && !done && (
                      <div className="px-4 pb-4 space-y-2 border-t border-gray-100 pt-3">
                        {photos.length > 0 && (
                          <div className="space-y-2">
                            {photos.map((p: any) => (
                              <div key={p.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Image size={14} className="text-blue-600" />
                                  <span className="text-xs font-bold text-gray-700">Photo {photos.indexOf(p) + 1}</span>
                                </div>
                                <button onClick={() => rmPhoto(step.id, p.id)} className="text-red-500 hover:text-red-600">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <button
                          onClick={() => addPhoto(step.id)}
                          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 border-2 border-gray-200"
                        >
                          <Camera size={16} />
                          Add Photo
                        </button>

                        {canDo && (
                          <button
                            onClick={() => setDoneSteps([...doneSteps, step.id])}
                            className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all"
                          >
                            <CheckCircle size={16} />
                            Mark Complete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {doneSteps.length === steps.length && (
                <button
                  onClick={() => setPhase('cleanup')}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <CheckCircle size={20} />
                  All Steps Done - Continue
                </button>
              )}

              <button
                onClick={closeSheet}
                className="w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-bold py-3 rounded-xl"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    // PHASE: CLEANUP - Cleanup checklist and photos
    if (phase === 'cleanup') {
      const cleanTasks = [
        { id: 'debris', label: 'All debris removed' },
        { id: 'wipe', label: 'Surfaces wiped clean' },
        { id: 'tools', label: 'All tools packed' },
        { id: 'sweep', label: 'Floor swept/vacuumed' }
      ];
      const allDone = cleanTasks.every(t => cleanChecks.includes(t.id)) && cleanPhotos.length > 0;

      return (
        <div
          className="fixed inset-0 bg-black/60 flex items-end justify-center z-50"
          onClick={closeSheet}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
            </div>

            <div className="px-6 pb-6 space-y-4">
              {/* Project Color Accent Bar */}
              <div
                className="h-1 rounded-full -mx-6 mb-2"
                style={{
                  backgroundColor: projectColorClasses[selectedProject.projectColor as keyof typeof projectColorClasses]?.text.replace('text-', '') || '#3b82f6'
                }}
              />

              {/* Project badge */}
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="px-3 py-1.5 rounded-full text-xs font-bold border-2"
                  style={{
                    borderColor: projectColorClasses[selectedProject.projectColor as keyof typeof projectColorClasses]?.text.replace('text-', '') || '#3b82f6',
                    color: projectColorClasses[selectedProject.projectColor as keyof typeof projectColorClasses]?.text.replace('text-', '') || '#3b82f6',
                    backgroundColor: projectColorClasses[selectedProject.projectColor as keyof typeof projectColorClasses]?.bg.replace('bg-', '').replace('-100', '-50') || '#eff6ff'
                  }}
                >
                  #{selectedProject.projectNumber}
                </div>
              </div>

              {/* Phase indicator - neutral */}
              <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white rounded-xl border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                    <Sparkles size={22} className="text-gray-700" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">Site Cleanup</div>
                    <div className="text-sm text-gray-600">Leave it spotless for the customer</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900">Checklist</h3>
                {cleanTasks.map((task) => {
                  const checked = cleanChecks.includes(task.id);
                  return (
                    <div
                      key={task.id}
                      onClick={() => checked ? setCleanChecks(cleanChecks.filter(x => x !== task.id)) : setCleanChecks([...cleanChecks, task.id])}
                      className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                        checked ? 'bg-green-50 border-green-500 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex gap-3 items-center">
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                          checked ? 'bg-green-600 border-green-600' : 'border-gray-300'
                        }`}>
                          {checked && <CheckCircle size={12} className="text-white" strokeWidth={3} />}
                        </div>
                        <span className={`font-semibold text-sm ${checked ? 'text-gray-900' : 'text-gray-700'}`}>{task.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900">Cleanup Photos</h3>
                {cleanPhotos.length > 0 && (
                  <div className="space-y-2">
                    {cleanPhotos.map((p) => (
                      <div key={p.id} className="flex justify-between bg-white p-3 rounded-lg border-2 border-gray-200">
                        <div className="flex gap-2 items-center">
                          <Camera size={16} className="text-gray-600" />
                          <span className="font-semibold text-sm text-gray-700">Photo {cleanPhotos.indexOf(p) + 1}</span>
                        </div>
                        <button onClick={() => setCleanPhotos(cleanPhotos.filter(x => x.id !== p.id))} className="text-red-500 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setCleanPhotos([...cleanPhotos, { id: Date.now(), ts: new Date().toISOString() }])}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg flex items-center justify-center gap-2 border-2 border-gray-200 transition-all"
                >
                  <Camera size={18} />
                  Take Cleanup Photo
                </button>
              </div>

              {!allDone && (
                <div className="bg-gray-50 rounded-lg p-3 border-2 border-gray-200 text-center">
                  <AlertCircle className="inline text-gray-500 mb-1" size={20} />
                  <div className="font-semibold text-sm text-gray-700">Complete all tasks + take photo to continue</div>
                </div>
              )}

              {/* Primary action - blue */}
              <button
                onClick={() => allDone && setPhase('inspection')}
                disabled={!allDone}
                className={`w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  allDone
                    ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle size={20} />
                {allDone ? 'Continue to Inspection' : 'Complete Cleanup First'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // PHASE: INSPECTION - Customer walkthrough and final photos
    if (phase === 'inspection') {
      const canSubmit = inspectDone && customerOK && finalPhotos.length >= 2;

      return (
        <div
          className="fixed inset-0 bg-black/60 flex items-end justify-center z-50"
          onClick={closeSheet}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
            </div>

            <div className="px-6 pb-6 space-y-4">
              {/* Project Color Accent Bar */}
              <div
                className="h-1 rounded-full -mx-6 mb-2"
                style={{
                  backgroundColor: projectColorClasses[selectedProject.projectColor as keyof typeof projectColorClasses]?.text.replace('text-', '') || '#3b82f6'
                }}
              />

              {/* Project badge */}
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="px-3 py-1.5 rounded-full text-xs font-bold border-2"
                  style={{
                    borderColor: projectColorClasses[selectedProject.projectColor as keyof typeof projectColorClasses]?.text.replace('text-', '') || '#3b82f6',
                    color: projectColorClasses[selectedProject.projectColor as keyof typeof projectColorClasses]?.text.replace('text-', '') || '#3b82f6',
                    backgroundColor: projectColorClasses[selectedProject.projectColor as keyof typeof projectColorClasses]?.bg.replace('bg-', '').replace('-100', '-50') || '#eff6ff'
                  }}
                >
                  #{selectedProject.projectNumber}
                </div>
              </div>

              {/* Phase indicator - neutral */}
              <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white rounded-xl border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                    <Eye size={22} className="text-gray-700" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">Final Inspection</div>
                    <div className="text-sm text-gray-600">Review with {selectedProject.projectClient}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div
                  onClick={() => setInspectDone(!inspectDone)}
                  className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                    inspectDone ? 'bg-green-50 border-green-500 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex gap-3 items-start">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      inspectDone ? 'bg-green-600 border-green-600' : 'border-gray-300'
                    }`}>
                      {inspectDone && <CheckCircle size={12} className="text-white" strokeWidth={3} />}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-900">Customer Walkthrough Done</div>
                      <div className="text-xs text-gray-600 mt-0.5">Showed all work, tested together</div>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setCustomerOK(!customerOK)}
                  className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                    customerOK ? 'bg-green-50 border-green-500 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex gap-3 items-start">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      customerOK ? 'bg-green-600 border-green-600' : 'border-gray-300'
                    }`}>
                      {customerOK && <CheckCircle size={12} className="text-white" strokeWidth={3} />}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-900">Customer Approval</div>
                      <div className="text-xs text-gray-600 mt-0.5">Customer satisfied with quality</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900">Final Photos <span className="text-gray-500 font-normal text-xs">(minimum 2)</span></h3>
                {finalPhotos.length > 0 && (
                  <div className="space-y-2">
                    {finalPhotos.map((p) => (
                      <div key={p.id} className="flex justify-between bg-white p-3 rounded-lg border-2 border-gray-200">
                        <div className="flex gap-2 items-center">
                          <Camera size={16} className="text-gray-600" />
                          <span className="font-semibold text-sm text-gray-700">Photo {finalPhotos.indexOf(p) + 1}</span>
                        </div>
                        <button onClick={() => setFinalPhotos(finalPhotos.filter(x => x.id !== p.id))} className="text-red-500 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setFinalPhotos([...finalPhotos, { id: Date.now(), ts: new Date().toISOString() }])}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg flex items-center justify-center gap-2 border-2 border-gray-200 transition-all"
                >
                  <Camera size={18} />
                  Take Final Photo
                </button>
              </div>

              {!canSubmit && (
                <div className="bg-gray-50 rounded-lg p-3 border-2 border-gray-200 text-center">
                  <AlertCircle className="inline text-gray-500 mb-1" size={20} />
                  <div className="font-semibold text-sm text-gray-700">Complete all steps to submit</div>
                </div>
              )}

              <button
                onClick={() => {
                  if (canSubmit) {
                    // Complete the task and log activity
                    const worker = workers.find(w => w.id === selectedWorkerId);
                    if (worker && selectedProject && selectedTaskIds.length > 0) {
                      selectedTaskIds.forEach(taskId => {
                        const task = selectedProject.tasks.find(t => t.id === taskId);
                        if (task) {
                          storage.completeTask(selectedProject.projectId, taskId, worker.name);
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
                              duration: startTime ? Math.round((new Date().getTime() - startTime.getTime()) / 60000) : 0,
                              photos: Object.values(stepPhotos).reduce((s, p) => s + p.length, 0) + cleanPhotos.length + finalPhotos.length
                            }
                          );
                        }
                      });
                      loadData();
                    }
                    setPhase('done');
                  }
                }}
                disabled={!canSubmit}
                className={`w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  canSubmit
                    ? 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-sm'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle size={20} />
                {canSubmit ? 'Submit Job Complete' : 'Complete All Steps'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // PHASE: DONE - Job completion summary
    if (phase === 'done') {
      const mins = startTime ? Math.round((new Date().getTime() - startTime.getTime()) / 60000) : 0;
      const hrs = Math.floor(mins / 60);
      const m = mins % 60;
      const totalPhotos = Object.values(stepPhotos).reduce((s, p) => s + p.length, 0) + cleanPhotos.length + finalPhotos.length;
      const steps = selectedTask.steps || [];

      return (
        <div
          className="fixed inset-0 bg-black/60 flex items-end justify-center z-50"
          onClick={closeSheet}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
            </div>

            <div className="px-6 pb-6">
              {/* Success icon - clean green checkmark */}
              <div className="relative mb-6 pt-4">
                <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle size={44} className="text-white" strokeWidth={2.5} />
                </div>
              </div>

              {/* Success message */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Job Complete!</h2>
                <p className="text-base text-gray-600">Great work, {selectedWorker?.name}</p>
              </div>

              {/* Summary cards - white background */}
              <div className="space-y-3 mb-6">
                <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-gray-600" />
                      <span className="text-sm font-semibold text-gray-700">Duration</span>
                    </div>
                    <span className="font-bold text-gray-900">{hrs > 0 ? `${hrs}h ` : ''}{m}m</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <CheckSquare size={18} className="text-gray-600" />
                      <span className="text-sm font-semibold text-gray-700">Work Steps</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-green-600">{steps.length}</span>
                      <CheckCircle size={16} className="text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Sparkles size={18} className="text-gray-600" />
                      <span className="text-sm font-semibold text-gray-700">Cleanup</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-green-600">Complete</span>
                      <CheckCircle size={16} className="text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <User size={18} className="text-gray-600" />
                      <span className="text-sm font-semibold text-gray-700">Customer</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-green-600">Approved</span>
                      <CheckCircle size={16} className="text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Camera size={18} className="text-gray-600" />
                      <span className="text-sm font-semibold text-gray-700">Photos Taken</span>
                    </div>
                    <span className="font-bold text-gray-900">{totalPhotos}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={closeSheet}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-4 rounded-xl transition-all shadow-sm"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    // DEFAULT: Basic task detail view
    return (
      <div
        className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 animate-in fade-in duration-200"
        onClick={closeSheet}
      >
        <div
          className="bg-white rounded-t-3xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          </div>

          <div className="px-6 pb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{selectedProject.projectClient}</h3>
                <p className="text-gray-500 text-sm font-bold">PROJECT #{selectedProject.projectNumber}</p>
              </div>
              <div className={`w-4 h-4 rounded-full ${statusColors[selectedProject.status]}`}></div>
            </div>

            <div className={`${color.bg} rounded-xl p-4 mb-4 space-y-3 border border-gray-200`}>
              {/* Date & Time with countdown */}
              {selectedTask.scheduledDate && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border-2 border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-900 text-base font-black">{selectedTask.scheduledDate}</span>
                    {selectedTask.scheduledTime && (
                      <>
                        <span className="text-gray-400">•</span>
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span className="text-gray-700 text-sm font-bold">{selectedTask.scheduledTime}</span>
                      </>
                    )}
                  </div>
                  {(() => {
                    const timeUntil = getTimeUntil(selectedTask.scheduledDate, selectedTask.scheduledTime);
                    if (timeUntil) {
                      const isPast = timeUntil.includes('ago');
                      return (
                        <div className={`text-sm font-bold ${isPast ? 'text-red-600' : 'text-green-600'}`}>
                          {isPast ? '⚠️ ' : '⏱️ '}{timeUntil}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              {/* Duration */}
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="text-gray-600 text-sm font-bold">
                  {selectedTask.duration || selectedTask.estimatedHours || 0}h estimated
                </div>
              </div>

              {/* Address - Always clickable */}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedProject.projectAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 hover:bg-blue-50 -m-2 p-2 rounded-lg transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-blue-600 hover:text-blue-700 text-sm leading-relaxed font-medium hover:underline">
                  {selectedProject.projectAddress}
                </div>
              </a>
            </div>

            <div className="mb-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Task</p>
              <div className="flex items-start gap-3 text-gray-700">
                <div className="w-6 h-6 rounded-lg border-2 border-gray-400 flex-shrink-0 mt-0.5"></div>
                <p className="text-sm leading-relaxed font-semibold">{selectedTask.description}</p>
              </div>
            </div>

            <button
              onClick={handleOpenFullDetails}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-4 rounded-xl transition-colors font-bold text-base shadow-lg mb-2"
            >
              Open Full Task Details
            </button>

            <button
              onClick={() => {
                if (!selectedProject || !selectedTask) return;

                const worker = workers.find(w => w.id === selectedWorkerId);
                if (!worker) return;

                // Find or create the message thread for this task
                let thread = messageThreads.find(t =>
                  t.projectId === selectedProject.projectId &&
                  t.taskId === selectedTask.id
                );

                // If no thread exists yet, create a placeholder thread structure
                if (!thread) {
                  thread = {
                    projectId: selectedProject.projectId,
                    taskId: selectedTask.id,
                    projectNumber: selectedProject.projectNumber,
                    taskDescription: selectedTask.description,
                    messages: [],
                    lastMessage: null as any,
                    unreadCount: 0
                  };
                }

                // Set this as the selected thread and open the conversation view
                setSelectedThread(thread);
                setShowThreadList(false);
                setActiveTab('messages');

                // Close the task detail sheet
                setSelectedTask(null);
                setSelectedProject(null);
              }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-xl transition-colors font-bold text-sm flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Send Message
            </button>
          </div>
        </div>
      </div>
    );
  };

  // MAIN RENDER
  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100" style={{ position: 'fixed', width: '100%', touchAction: 'pan-y' }}>
      <div className="w-full max-w-md mx-auto bg-white h-full relative" style={{ overscrollBehavior: 'none' }}>
        {/* Header - Fixed to top - Compact */}
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-2 border-b border-blue-700 z-50">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-white text-base font-bold leading-tight">
                Hi, {selectedWorker?.name || 'Worker'}
              </h1>
              <p className="text-blue-100 text-[10px] font-semibold">
                {projectGroups.length} projects
              </p>
            </div>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 bg-blue-500/30 rounded-full hover:bg-blue-500/50 transition-colors relative"
            >
              <Bell className="w-4 h-4 text-white" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold px-1 py-0.5 rounded-full min-w-[16px] text-center">
                  {notificationCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Notifications Panel - Below fixed header */}
        {showNotifications && (
          <div className="fixed top-[44px] left-0 right-0 bg-white border-b border-gray-200 shadow-lg max-h-[60vh] overflow-y-auto z-40">
            <div className="max-w-md mx-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Notifications</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {(() => {
              // In cloud mode, use notifications from state. In admin mode, fetch from storage
              let workerNotifications: any[];

              if (isCloudMode) {
                workerNotifications = notifications.sort((a, b) =>
                  new Date(b.createdAt || b.timestamp).getTime() - new Date(a.createdAt || a.timestamp).getTime()
                );
              } else {
                const projects = storage.getProjects();
                workerNotifications = storage.getNotifications().filter(n => {
                  if (n.projectId && n.taskId) {
                    const project = projects.find(p => p.id === n.projectId);
                    if (project) {
                      const task = project.tasks.find((t: any) => t.id === n.taskId);
                      const isRelevant = task && task.assignedTo === selectedWorkerId;
                      const isFromOffice = n.type !== 'task_rejected';
                      return isRelevant && isFromOffice;
                    }
                  }
                  return false;
                }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              }

              if (workerNotifications.length === 0) {
                return (
                  <div className="text-center py-12 px-4">
                    <Bell className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Notifications</h3>
                    <p className="text-gray-500 text-sm">You're all caught up!</p>
                  </div>
                );
              }

              return (
                <div className="divide-y divide-gray-200">
                  {workerNotifications.map(notification => {
                    const priorityColors = {
                      high: 'bg-red-50 border-red-200',
                      medium: 'bg-amber-50 border-amber-200',
                      low: 'bg-blue-50 border-blue-200'
                    };

                    const priorityTextColors = {
                      high: 'text-red-700',
                      medium: 'text-amber-700',
                      low: 'text-blue-700'
                    };

                    const typeIcons = {
                      task_assigned: <UserCheck className="w-5 h-5" />,
                      task_rejected: <X className="w-5 h-5" />,
                      reminder: <Bell className="w-5 h-5" />,
                      default: <AlertCircle className="w-5 h-5" />
                    };

                    return (
                      <div
                        key={notification.id}
                        onClick={async () => {
                          if (isCloudMode) {
                            try {
                              await fetch('/api/worker/notifications', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ notificationId: notification.id }),
                              });
                            } catch (error) {
                              console.error('Failed to mark notification as read:', error);
                            }
                          } else {
                            storage.markNotificationAsRead(notification.id);
                          }
                          await loadData();
                        }}
                        className={`p-4 ${notification.read ? 'bg-white' : priorityColors[notification.priority]} border-l-4 ${notification.read ? 'border-gray-200' : priorityColors[notification.priority]} cursor-pointer hover:bg-gray-50 transition-colors`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`${priorityTextColors[notification.priority]} mt-0.5`}>
                            {typeIcons[notification.type as keyof typeof typeIcons] || typeIcons.default}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 mb-1">{notification.title}</h4>
                            <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                            <p className="text-xs text-gray-500">
                              {notification.createdAt || notification.timestamp ?
                                new Date(notification.createdAt || notification.timestamp).toLocaleString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                                : 'Just now'
                              }
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            </div>
          </div>
        )}

        {!workerId && (
          <div className="fixed top-[44px] left-0 right-0 p-4 bg-white border-b border-gray-200 z-30">
            <div className="max-w-md mx-auto">
              <select
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 font-semibold focus:outline-none focus:border-blue-600 transition-colors"
              >
                <option value="">Select Worker</option>
                {workers.map(worker => (
                  <option key={worker.id} value={worker.id}>{worker.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Content Area - Scrollable with padding for fixed header and nav */}
        <div className="h-full overflow-y-auto pt-[44px] pb-14" style={{ overscrollBehavior: 'none', WebkitOverflowScrolling: 'touch' }}>
          {selectedWorkerId ? (
            <>
              {activeTab === 'schedule' && renderScheduleTab()}
              {activeTab === 'jobs' && renderJobsTab()}
              {activeTab === 'messages' && renderMessagesTab()}
            </>
          ) : (
            <div className="text-center py-20">
              <User size={64} className="mx-auto mb-4 text-gray-300" />
              <div className="text-xl font-bold text-gray-500">Select a worker to continue</div>
            </div>
          )}
        </div>

        {/* Bottom Navigation - Fixed to bottom of screen */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 shadow-2xl z-50">
          <div className="max-w-md mx-auto grid grid-cols-3 h-14">
            <button
              onClick={() => {
                setActiveTab('jobs');
                setShowNotifications(false);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                activeTab === 'jobs' ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <CheckSquare className="w-5 h-5" strokeWidth={2.5} />
              <span className="text-[10px] font-bold">Jobs</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('schedule');
                setShowNotifications(false);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                activeTab === 'schedule' ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <Calendar className="w-5 h-5" strokeWidth={2.5} />
              <span className="text-[10px] font-bold">Schedule</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('messages');
                setShowNotifications(false);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
                activeTab === 'messages' ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <MessageSquare className="w-5 h-5" strokeWidth={2.5} />
              {unreadMessageCount > 0 && (
                <span className="absolute top-0 right-4 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {unreadMessageCount}
                </span>
              )}
              <span className="text-[10px] font-bold">Messages</span>
            </button>
          </div>
        </div>

        {renderTaskDetailSheet()}
      </div>
    </div>
  );
}
