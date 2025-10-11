// Simple localStorage wrapper for client-side data persistence
// TODO: Replace with real API calls when database is connected

// ============================================================================
// TYPES
// ============================================================================

export type TaskStatus = 'unassigned' | 'pending_acceptance' | 'confirmed' | 'accepted' | 'in_progress' | 'completed' | 'rejected';
export type TaskType = 'hvac' | 'carpentry' | 'electrical' | 'plumbing' | 'roofing' | 'painting' | 'flooring' | 'other';

export interface Activity {
  id: string;
  date: string;
  action: string;
  user: string;
  details?: string;
}

export interface Message {
  id: string;
  text: string;
  sender: string; // 'admin' or worker name
  timestamp: string;
  read: boolean;
}

export interface Notification {
  id: string;
  type: 'task_accepted' | 'task_rejected' | 'task_completed' | 'task_started' | 'message_received' | 'task_assigned';
  title: string;
  message: string;
  projectId: string;
  taskId: string;
  workerId?: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface Material {
  id?: string;
  name: string;
  quantity?: number;
  unit?: string;
  estimatedCost?: number;
}

export interface Photo {
  id: string;
  type: 'before' | 'during' | 'after';
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Task {
  id: string;
  description: string;
  price: number;
  quantity: number;
  amount: number;
  type?: TaskType;
  estimatedHours?: number;
  status: TaskStatus;
  skills: string[];
  assignedTo?: string; // worker ID
  assignedDate?: string;
  scheduledDate?: string; // YYYY-MM-DD format for the day this task should be done
  scheduledTime?: string; // HH:MM format for start time
  time?: string;
  duration?: number; // hours
  materials?: Material[];
  photos?: Photo[];
  notes?: string;
  activity: Activity[];
  messages?: Message[];
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Job Session - represents work for a specific worker on a specific day
export interface JobSession {
  id: string;
  projectId: string;
  projectNumber: string;
  workerId: string;
  workerName: string;
  sessionDate: string; // YYYY-MM-DD
  taskIds: string[]; // tasks scheduled for this day
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  startTime?: string;
  endTime?: string;
  totalHours: number;
  progress: number; // 0-100, calculated from task completion
  createdAt: string;
  updatedAt: string;
}

export interface Worker {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  skills: string[];
  availability: 'available' | 'busy' | 'off';
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  number: string;
  clientName: string;
  clientAddress: string;
  estimateDate: string;
  subtotal: number;
  tax: number;
  total: number;
  status: 'active' | 'completed' | 'on-hold';
  color: string;
  tasks: Task[];
  materials?: Material[];
  estimatePreview?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SEED DATA
// ============================================================================

const SEED_WORKERS: Omit<Worker, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Carlos Martinez', phone: '(303) 555-0123', email: 'carlos@mddc.com', skills: ['HVAC', 'Carpentry', 'Handyman'], availability: 'available' },
  { name: 'Juan Rodriguez', phone: '(303) 555-0124', email: 'juan@mddc.com', skills: ['Electrical', 'Plumbing'], availability: 'available' },
  { name: 'David Smith', phone: '(303) 555-0125', email: 'david@mddc.com', skills: ['Painting', 'Flooring'], availability: 'available' },
  { name: 'Miguel Torres', phone: '(303) 555-0126', email: 'miguel@mddc.com', skills: ['Carpentry', 'Roofing'], availability: 'busy' }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const getTaskPhase = (status: TaskStatus): 1 | 2 | 3 => {
  // Phase 1: Assignment & Confirmation (unassigned → pending_acceptance)
  if (status === 'unassigned' || status === 'rejected' || status === 'pending_acceptance') {
    return 1;
  }
  // Phase 2: Execution (confirmed → accepted → in_progress)
  if (status === 'confirmed' || status === 'accepted' || status === 'in_progress') {
    return 2;
  }
  // Phase 3: Analytics (completed tasks for data collection)
  if (status === 'completed') {
    return 3;
  }
  return 1;
};

export const getPhaseLabel = (phase: 1 | 2 | 3): string => {
  switch (phase) {
    case 1: return 'Assignment';
    case 2: return 'Execution';
    case 3: return 'Complete';
    default: return 'Unknown';
  }
};

export const getPhaseColor = (phase: 1 | 2 | 3): string => {
  switch (phase) {
    case 1: return 'bg-amber-100 text-amber-700 border-amber-300';
    case 2: return 'bg-blue-100 text-blue-700 border-blue-300';
    case 3: return 'bg-green-100 text-green-700 border-green-300';
    default: return 'bg-gray-100 text-gray-700 border-gray-300';
  }
};

// ============================================================================
// STORAGE
// ============================================================================

export const storage = {
  // Initialize with seed data if empty
  init: () => {
    if (typeof window === 'undefined') return;

    const workers = storage.getWorkers();
    if (workers.length === 0) {
      // Seed workers
      SEED_WORKERS.forEach(worker => {
        storage.addWorker(worker);
      });
    }

    // MIGRATION: Add default profession type and materials to existing tasks
    const projects = storage.getProjects();
    let needsUpdate = false;

    // Color palette for projects
    const colors = ['blue', 'green', 'purple', 'orange', 'red', 'yellow', 'cyan', 'gray'];

    projects.forEach((project, index) => {
      // Add color if missing
      if (!project.color) {
        project.color = colors[index % colors.length];
        needsUpdate = true;
      }

      project.tasks.forEach((task: any) => {
        // Add default profession if missing
        if (!task.type) {
          // Try to infer from description
          const desc = task.description?.toLowerCase() || '';
          if (desc.includes('hvac') || desc.includes('ac') || desc.includes('heat') || desc.includes('ventil') || desc.includes('radon') || desc.includes('fan')) {
            task.type = 'hvac';
          } else if (desc.includes('electric') || desc.includes('wiring') || desc.includes('outlet')) {
            task.type = 'electrical';
          } else if (desc.includes('plumb') || desc.includes('pipe') || desc.includes('water') || desc.includes('drain')) {
            task.type = 'plumbing';
          } else if (desc.includes('carpen') || desc.includes('wood') || desc.includes('frame') || desc.includes('door') || desc.includes('window') || desc.includes('reseal')) {
            task.type = 'carpentry';
          } else if (desc.includes('roof')) {
            task.type = 'roofing';
          } else if (desc.includes('paint')) {
            task.type = 'painting';
          } else if (desc.includes('floor') || desc.includes('tile')) {
            task.type = 'flooring';
          } else if (desc.includes('drill')) {
            task.type = 'other';
          } else {
            task.type = 'other';
          }
          needsUpdate = true;
        }

        // Add materials array if missing
        if (!task.materials) {
          task.materials = [];
          needsUpdate = true;
        }
      });
    });

    if (needsUpdate) {
      storage.saveProjects(projects);
      console.log('✅ Migrated existing tasks with profession types, materials, and project colors');
    }
  },

  getWorkers: (): Worker[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('digital-pm-workers');
    return data ? JSON.parse(data) : [];
  },

  saveWorkers: (workers: any[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('digital-pm-workers', JSON.stringify(workers));
  },

  addWorker: (worker: any) => {
    const workers = storage.getWorkers();
    const newWorker = {
      ...worker,
      id: `w-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    workers.push(newWorker);
    storage.saveWorkers(workers);
    return newWorker;
  },

  updateWorker: (id: string, updates: any) => {
    const workers = storage.getWorkers();
    const index = workers.findIndex(w => w.id === id);
    if (index !== -1) {
      workers[index] = {
        ...workers[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      storage.saveWorkers(workers);
      return workers[index];
    }
    return null;
  },

  deleteWorker: (id: string) => {
    const workers = storage.getWorkers();
    const filtered = workers.filter(w => w.id !== id);
    storage.saveWorkers(filtered);
    return true;
  },

  clearAllWorkers: () => {
    if (typeof window === 'undefined') return;
    storage.saveWorkers([]);
    return true;
  },

  // Projects
  getProjects: (): any[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('digital-pm-projects');
    return data ? JSON.parse(data) : [];
  },

  saveProjects: (projects: any[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('digital-pm-projects', JSON.stringify(projects));
  },

  addProject: (project: any) => {
    const projects = storage.getProjects();

    // Auto-assign color if not provided - avoid duplicates
    const colors = ['blue', 'green', 'purple', 'orange', 'red', 'yellow', 'cyan', 'gray'];
    const usedColors = new Set(projects.map(p => p.color));
    const availableColors = colors.filter(c => !usedColors.has(c));
    const projectColor = project.color || (availableColors.length > 0 ? availableColors[0] : colors[projects.length % colors.length]);

    const newProject = {
      ...project,
      id: `p-${Date.now()}`,
      color: projectColor,
      tasks: project.tasks.map((t: any, idx: number) => ({
        ...t,
        id: `t-${Date.now()}-${idx}`
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    projects.push(newProject);
    storage.saveProjects(projects);
    // Dispatch event to notify all views of the update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('projectsUpdated'));
    }
    return newProject;
  },

  updateProject: (id: string, updates: any) => {
    const projects = storage.getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index] = {
        ...projects[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      storage.saveProjects(projects);
      // Dispatch event to notify all views of the update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('projectsUpdated'));
      }
      return projects[index];
    }
    return null;
  },

  deleteProject: (id: string) => {
    const projects = storage.getProjects();
    const filtered = projects.filter(p => p.id !== id);
    storage.saveProjects(filtered);
    // Dispatch event to notify all views of the update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('projectsUpdated'));
    }
    return true;
  },

  // Task operations
  updateTask: (projectId: string, taskId: string, updates: Partial<Task>) => {
    const projects = storage.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;

    const taskIndex = project.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return null;

    project.tasks[taskIndex] = {
      ...project.tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    storage.updateProject(projectId, { tasks: project.tasks });
    return project.tasks[taskIndex];
  },

  addActivity: (projectId: string, taskId: string, action: string, user: string, details?: string) => {
    const projects = storage.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;

    const task = project.tasks.find(t => t.id === taskId);
    if (!task) return null;

    const activity: Activity = {
      id: `a-${Date.now()}`,
      date: new Date().toISOString(),
      action,
      user,
      details
    };

    task.activity = [...(task.activity || []), activity];
    storage.updateProject(projectId, { tasks: project.tasks });
    return activity;
  },

  assignTask: (projectId: string, taskId: string, workerId: string, date: string, time: string, duration: number, user: string = 'Robert') => {
    const worker = storage.getWorkers().find(w => w.id === workerId);
    if (!worker) return null;

    const updates = {
      status: 'pending_acceptance' as TaskStatus,
      assignedTo: workerId,
      assignedDate: date,
      time,
      duration
    };

    const task = storage.updateTask(projectId, taskId, updates);
    if (task) {
      storage.addActivity(projectId, taskId, `Assigned to ${worker.name}`, user);
    }
    return task;
  },

  acceptTask: (projectId: string, taskId: string, workerName: string) => {
    const task = storage.updateTask(projectId, taskId, { status: 'accepted' as TaskStatus });
    if (task) {
      storage.addActivity(projectId, taskId, `Accepted by ${workerName}`, workerName);

      // Create notification for admin
      const projects = storage.getProjects();
      const project = projects.find(p => p.id === projectId);
      if (project) {
        storage.addNotification({
          type: 'task_accepted',
          title: 'Task Accepted',
          message: `${workerName} accepted "${task.description}"`,
          projectId,
          taskId,
          workerId: task.assignedTo,
          priority: 'medium'
        });
      }
    }
    return task;
  },

  confirmTask: (projectId: string, taskId: string, workerName: string) => {
    const task = storage.updateTask(projectId, taskId, { status: 'confirmed' as TaskStatus });
    if (task) {
      storage.addActivity(projectId, taskId, `Confirmed availability by ${workerName}`, workerName);

      // Create notification for admin
      const projects = storage.getProjects();
      const project = projects.find(p => p.id === projectId);
      if (project) {
        storage.addNotification({
          type: 'task_accepted',
          title: 'Task Confirmed',
          message: `${workerName} confirmed availability for "${task.description}"`,
          projectId,
          taskId,
          workerId: task.assignedTo,
          priority: 'medium'
        });
      }
    }
    return task;
  },

  rejectTask: (projectId: string, taskId: string, workerName: string, reason: string) => {
    const task = storage.updateTask(projectId, taskId, {
      status: 'rejected' as TaskStatus,
      assignedTo: undefined,
      assignedDate: undefined,
      time: undefined,
      duration: undefined,
      rejectionReason: reason
    });
    if (task) {
      storage.addActivity(projectId, taskId, `Rejected by ${workerName}: "${reason}"`, workerName, reason);

      // Create HIGH priority notification for admin
      const projects = storage.getProjects();
      const project = projects.find(p => p.id === projectId);
      if (project) {
        storage.addNotification({
          type: 'task_rejected',
          title: 'Task Rejected!',
          message: `${workerName} rejected "${task.description}": ${reason}`,
          projectId,
          taskId,
          priority: 'high'
        });
      }
    }
    return task;
  },

  startTask: (projectId: string, taskId: string, workerName: string) => {
    const task = storage.updateTask(projectId, taskId, { status: 'in_progress' as TaskStatus });
    if (task) {
      storage.addActivity(projectId, taskId, `Started work`, workerName);

      // Create notification for admin
      const projects = storage.getProjects();
      const project = projects.find(p => p.id === projectId);
      if (project) {
        storage.addNotification({
          type: 'task_started',
          title: 'Task Started',
          message: `${workerName} started working on "${task.description}"`,
          projectId,
          taskId,
          workerId: task.assignedTo,
          priority: 'low'
        });
      }
    }
    return task;
  },

  completeTask: (projectId: string, taskId: string, workerName: string) => {
    const task = storage.updateTask(projectId, taskId, { status: 'completed' as TaskStatus });
    if (task) {
      storage.addActivity(projectId, taskId, `Completed task`, workerName);

      // Create notification for admin
      const projects = storage.getProjects();
      const project = projects.find(p => p.id === projectId);
      if (project) {
        storage.addNotification({
          type: 'task_completed',
          title: 'Task Completed!',
          message: `${workerName} completed "${task.description}"`,
          projectId,
          taskId,
          workerId: task.assignedTo,
          priority: 'medium'
        });
      }
    }
    return task;
  },

  addPhoto: (projectId: string, taskId: string, type: 'before' | 'during' | 'after', url: string, user: string) => {
    const projects = storage.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;

    const task = project.tasks.find(t => t.id === taskId);
    if (!task) return null;

    const photo: Photo = {
      id: `ph-${Date.now()}`,
      type,
      url,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user
    };

    task.photos = [...(task.photos || []), photo];
    storage.updateProject(projectId, { tasks: project.tasks });
    storage.addActivity(projectId, taskId, `Uploaded ${type} photo`, user);
    return photo;
  },

  sendMessage: (projectId: string, taskId: string, text: string, sender: string) => {
    const projects = storage.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;

    const task = project.tasks.find(t => t.id === taskId);
    if (!task) return null;

    const message: Message = {
      id: `m-${Date.now()}`,
      text,
      sender,
      timestamp: new Date().toISOString(),
      read: false
    };

    task.messages = [...(task.messages || []), message];
    storage.updateProject(projectId, { tasks: project.tasks });
    storage.addActivity(projectId, taskId, `Sent message`, sender, text.substring(0, 50));

    // Create notification if message from worker to admin
    if (sender !== 'admin') {
      storage.addNotification({
        type: 'message_received',
        title: 'New Message',
        message: `${sender}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
        projectId,
        taskId,
        workerId: task.assignedTo,
        priority: 'medium'
      });
    }

    return message;
  },

  markMessagesAsRead: (projectId: string, taskId: string, reader: string) => {
    const projects = storage.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;

    const task = project.tasks.find(t => t.id === taskId);
    if (!task || !task.messages) return null;

    // Mark all messages not sent by the reader as read
    task.messages = task.messages.map(m =>
      m.sender !== reader ? { ...m, read: true } : m
    );

    storage.updateProject(projectId, { tasks: project.tasks });
    return task.messages;
  },

  // Notifications
  getNotifications: (): Notification[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('digital-pm-notifications');
    return data ? JSON.parse(data) : [];
  },

  saveNotifications: (notifications: Notification[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('digital-pm-notifications', JSON.stringify(notifications));
  },

  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const notifications = storage.getNotifications();
    const newNotification: Notification = {
      ...notification,
      id: `n-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    notifications.unshift(newNotification); // Add to beginning
    storage.saveNotifications(notifications);

    // Dispatch event for real-time updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    }

    return newNotification;
  },

  markNotificationAsRead: (id: string) => {
    const notifications = storage.getNotifications();
    const updated = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    storage.saveNotifications(updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    }
  },

  markAllNotificationsAsRead: () => {
    const notifications = storage.getNotifications();
    const updated = notifications.map(n => ({ ...n, read: true }));
    storage.saveNotifications(updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    }
  },

  getUnreadNotificationCount: (): number => {
    return storage.getNotifications().filter(n => !n.read).length;
  },

  getAllMessages: (): Array<{ projectId: string; taskId: string; projectNumber: string; taskDescription: string; messages: Message[] }> => {
    const projects = storage.getProjects();
    const allMessages: Array<{ projectId: string; taskId: string; projectNumber: string; taskDescription: string; messages: Message[] }> = [];

    projects.forEach(project => {
      project.tasks.forEach(task => {
        if (task.messages && task.messages.length > 0) {
          allMessages.push({
            projectId: project.id,
            taskId: task.id,
            projectNumber: project.number,
            taskDescription: task.description,
            messages: task.messages
          });
        }
      });
    });

    return allMessages;
  },

  getUnreadMessageCount: (): number => {
    const projects = storage.getProjects();
    let count = 0;

    projects.forEach(project => {
      project.tasks.forEach(task => {
        if (task.messages) {
          count += task.messages.filter(m => !m.read && m.sender !== 'admin').length;
        }
      });
    });

    return count;
  }
};
