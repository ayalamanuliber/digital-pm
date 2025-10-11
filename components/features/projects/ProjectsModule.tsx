'use client';

import React, { useState, useEffect } from 'react';
import { FolderOpen, Plus, Search, DollarSign, MapPin, Calendar, User, CheckCircle, Clock, AlertTriangle, ArrowLeft, Edit2, Trash2, X, Upload, FileText, ChevronRight, ChevronDown, ChevronUp, UserCheck, ExternalLink, Table2, Save, Phone } from 'lucide-react';
import { storage, getTaskPhase, getPhaseLabel, getPhaseColor } from '@/lib/localStorage';
import UnifiedTaskModal from '@/components/features/tasks/UnifiedTaskModal';

// ============================================================================
// TYPES
// ============================================================================

type TaskType = 'hvac' | 'carpentry' | 'electrical' | 'plumbing' | 'roofing' | 'painting' | 'flooring' | 'other';

interface Task {
  id: string;
  description: string;
  price: number;
  quantity: number;
  amount: number;
  category?: string;
  type?: TaskType;
  estimatedHours?: number;
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo?: string; // worker ID
  scheduledDate?: string;
  materials?: Material[];
  tools?: any[];
}

interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
  status: 'needed' | 'ordered' | 'received';
  orderedDate?: string;
  receivedDate?: string;
}

interface Project {
  id: string;
  number: string;
  clientName: string;
  clientAddress: string;
  clientPhone?: string;
  clientEmail?: string;
  notes?: string;
  estimateDate: string;
  subtotal: number;
  tax: number;
  total: number;
  status: 'active' | 'completed' | 'on-hold';
  tasks: Task[];
  materials?: Material[];
  estimatePreview?: string; // base64 image of uploaded estimate
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// MAIN PROJECTS VIEW
// ============================================================================

export default function ProjectsModule({ initialView }: { initialView?: 'list' | 'detail' | 'add' | 'edit' | 'upload' }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [view, setView] = useState<'list' | 'detail' | 'add' | 'edit' | 'upload'>(initialView || 'list');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'on-hold'>('all');
  const [loading, setLoading] = useState(true);
  const [pendingTaskNav, setPendingTaskNav] = useState<{taskId: string; tab: 'details' | 'messages' | 'activity'} | null>(null);

  // Update view when initialView changes
  useEffect(() => {
    if (initialView) {
      setView(initialView);
    }
  }, [initialView]);

  useEffect(() => {
    loadProjects();

    // Listen for project updates and reload
    const handleProjectsUpdate = () => {
      loadProjects();
    };

    // Listen for navigation to task from notifications
    const handleNavigateToTask = (event: any) => {
      const { projectId, taskId, tab } = event.detail;

      // Get fresh projects data
      const currentProjects = storage.getProjects();
      const project = currentProjects.find(p => p.id === projectId);
      if (project) {
        setSelectedProject(project);
        setView('detail');
        setPendingTaskNav({ taskId, tab });
      }
    };

    // Listen for navigation to project from tasks view
    const handleNavigateToProject = (event: any) => {
      const { projectId } = event.detail;

      // Get fresh projects data
      const currentProjects = storage.getProjects();
      const project = currentProjects.find(p => p.id === projectId);
      if (project) {
        setSelectedProject(project);
        setView('detail');
      }
    };

    window.addEventListener('projectsUpdated', handleProjectsUpdate);
    window.addEventListener('navigateToTask', handleNavigateToTask);
    window.addEventListener('navigateToProject', handleNavigateToProject);

    return () => {
      window.removeEventListener('projectsUpdated', handleProjectsUpdate);
      window.removeEventListener('navigateToTask', handleNavigateToTask);
      window.removeEventListener('navigateToProject', handleNavigateToProject);
    };
  }, []);

  const loadProjects = () => {
    try {
      const data = storage.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = (id: string) => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        storage.deleteProject(id);
        loadProjects();
        setView('list');
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const handleUpdateProject = (id: string, updates: Partial<Project>) => {
    try {
      storage.updateProject(id, updates);
      loadProjects();
      setView('list');
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch =
      project.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.clientAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    totalRevenue: projects.reduce((acc, p) => acc + p.total, 0),
    avgProjectValue: projects.length > 0 ? projects.reduce((acc, p) => acc + p.total, 0) / projects.length : 0
  };

  if (view === 'detail' && selectedProject) {
    return (
      <ProjectDetailView
        project={selectedProject}
        onBack={() => setView('list')}
        onEdit={() => setView('edit')}
        onDelete={() => handleDeleteProject(selectedProject.id)}
        pendingTaskNav={pendingTaskNav}
        onClearTaskNav={() => setPendingTaskNav(null)}
      />
    );
  }

  if (view === 'edit' && selectedProject) {
    return (
      <EditProjectModal
        project={selectedProject}
        onClose={() => setView('detail')}
        onSave={(updates) => {
          handleUpdateProject(selectedProject.id, updates);
        }}
      />
    );
  }

  if (view === 'upload') {
    return (
      <UploadEstimateModal
        onClose={() => setView('list')}
        onSave={(newProject) => {
          try {
            storage.addProject(newProject);
            loadProjects();
            setView('list');
          } catch (error) {
            console.error('Failed to add project:', error);
          }
        }}
      />
    );
  }

  if (view === 'add') {
    return (
      <AddProjectModal
        onClose={() => setView('list')}
        onSave={(newProject) => {
          try {
            storage.addProject(newProject);
            loadProjects();
            setView('list');
          } catch (error) {
            console.error('Failed to add project:', error);
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
            <p className="text-sm text-gray-500">Track estimates, budgets, and project progress</p>
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                const dropdown = e.currentTarget.nextElementSibling as HTMLElement;
                dropdown.classList.toggle('hidden');
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              New Project
              <ChevronRight className="w-4 h-4 rotate-90" />
            </button>
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 hidden z-10">
              <button
                onClick={() => setView('upload')}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 rounded-t-lg"
              >
                <Upload className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium">Upload Estimate</div>
                  <div className="text-xs text-gray-500">AI will parse the PDF</div>
                </div>
              </button>
              <button
                onClick={() => setView('add')}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 border-t border-gray-100 rounded-b-lg"
              >
                <Plus className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="font-medium">Manual Entry</div>
                  <div className="text-xs text-gray-500">Create from scratch</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar - Stats + Search + Filter */}
        <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
          {/* Stats Badges */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200">
              <FolderOpen className="w-4 h-4 text-slate-600" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-gray-500 uppercase">Total</span>
                <span className="text-sm font-bold text-gray-900">{stats.total}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-lg border border-blue-200">
              <Clock className="w-4 h-4 text-blue-600" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-gray-500 uppercase">Active</span>
                <span className="text-sm font-bold text-blue-900">{stats.active}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-gray-500 uppercase">Done</span>
                <span className="text-sm font-bold text-green-900">{stats.completed}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200">
              <DollarSign className="w-4 h-4 text-slate-600" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-gray-500 uppercase">Revenue</span>
                <span className="text-sm font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200">
              <DollarSign className="w-4 h-4 text-slate-600" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-gray-500 uppercase">Avg</span>
                <span className="text-sm font-bold text-gray-900">${Math.round(stats.avgProjectValue).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-200"></div>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border-0 bg-transparent focus:outline-none text-sm"
            />
          </div>

          <div className="h-6 w-px bg-gray-200"></div>

          {/* Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-1.5 border-0 bg-transparent focus:outline-none text-sm font-medium text-gray-700"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="on-hold">On Hold</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No projects found</p>
          <p className="text-gray-400 text-sm">Create your first project to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => {
                setSelectedProject(project);
                setView('detail');
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PROJECT CARD
// ============================================================================

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const statusConfig = {
    active: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock, label: 'Active' },
    completed: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'Completed' },
    'on-hold': { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle, label: 'On Hold' }
  };

  const config = statusConfig[project.status];
  const StatusIcon = config.icon;

  const completedTasks = project.tasks.filter(t => t.status === 'completed').length;
  const totalTasks = project.tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const colorClasses = {
    blue: 'border-l-blue-500 bg-blue-50',
    green: 'border-l-green-500 bg-green-50',
    purple: 'border-l-purple-500 bg-purple-50',
    orange: 'border-l-orange-500 bg-orange-50',
    red: 'border-l-red-500 bg-red-50',
    yellow: 'border-l-yellow-500 bg-yellow-50',
    gray: 'border-l-gray-500 bg-gray-50',
    cyan: 'border-l-cyan-500 bg-cyan-50'
  };

  const textColorClasses = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    purple: 'text-purple-700',
    orange: 'text-orange-700',
    red: 'text-red-700',
    yellow: 'text-yellow-700',
    gray: 'text-gray-700',
    cyan: 'text-cyan-700'
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-4 shadow-sm border-l-4 border-r border-t border-b border-gray-100 hover:shadow-md transition-shadow cursor-pointer ${colorClasses[project.color] || colorClasses.blue}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h3 className={`font-bold text-lg ${textColorClasses[project.color] || textColorClasses.blue} flex-shrink-0`}>#{project.number}</h3>
          <span className="text-gray-400 flex-shrink-0">•</span>
          <p className={`text-sm font-semibold truncate ${textColorClasses[project.color] || textColorClasses.blue}`}>{project.clientName}</p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1 flex-shrink-0 ${config.color}`}>
          <StatusIcon className="w-3 h-3" />
          {config.label}
        </span>
      </div>

      {/* Client Info - Compact */}
      <div className="mb-3 space-y-1.5">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 line-clamp-2">{project.clientAddress}</p>
        </div>
        {project.clientPhone && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <p className="text-xs text-gray-600">{project.clientPhone}</p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <p className="text-xs text-gray-500">{new Date(project.estimateDate).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Progress - Compact */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Progress</p>
          <p className="text-xs font-bold text-gray-900">{completedTasks}/{totalTasks}</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Total */}
      <div className="pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Total Value</p>
          <p className="text-lg font-black text-gray-900">${project.total.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PROJECT DETAIL VIEW
// ============================================================================

function ProjectDetailView({ project, onBack, onEdit, onDelete, pendingTaskNav, onClearTaskNav }: {
  project: Project;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  pendingTaskNav?: {taskId: string; tab: 'details' | 'messages' | 'activity'} | null;
  onClearTaskNav?: () => void;
}) {
  const [workers, setWorkers] = useState<any[]>([]);
  const [currentProject, setCurrentProject] = useState(project);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterWorkers, setFilterWorkers] = useState<string[]>([]);
  const [filterProfessions, setFilterProfessions] = useState<string[]>([]);
  const [initialTab, setInitialTab] = useState<'details' | 'messages' | 'activity'>('details');

  // Assign Mode states
  const [isAssignMode, setIsAssignMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Client info editing states
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editedClientName, setEditedClientName] = useState(project.clientName);
  const [editedClientAddress, setEditedClientAddress] = useState(project.clientAddress);
  const [editedClientPhone, setEditedClientPhone] = useState(project.clientPhone || '');
  const [editedClientEmail, setEditedClientEmail] = useState(project.clientEmail || '');
  const [editedNotes, setEditedNotes] = useState(project.notes || '');

  // Estimate preview modal
  const [showEstimateModal, setShowEstimateModal] = useState(false);

  // Header collapse state
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);


  useEffect(() => {
    setWorkers(storage.getWorkers());

    // Listen for project updates and reload current project
    const handleProjectsUpdate = () => {
      const updated = storage.getProjects().find(p => p.id === currentProject.id);
      if (updated) {
        setCurrentProject(updated);
      }
    };

    window.addEventListener('projectsUpdated', handleProjectsUpdate);

    return () => {
      window.removeEventListener('projectsUpdated', handleProjectsUpdate);
    };
  }, [currentProject.id]);

  // Handle pending task navigation from notifications
  useEffect(() => {
    if (pendingTaskNav) {
      const task = currentProject.tasks.find(t => t.id === pendingTaskNav.taskId);
      if (task) {
        setSelectedTask(task);
        setInitialTab(pendingTaskNav.tab);
        setShowTaskModal(true);
        if (onClearTaskNav) {
          onClearTaskNav();
        }
      }
    }
  }, [pendingTaskNav, currentProject.tasks, onClearTaskNav]);

  // Apply filters with OR logic for multiple selections
  const filteredTasks = currentProject.tasks.filter(task => {
    // Search query
    if (searchQuery && !task.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Status filter (OR mode - match any selected status)
    if (filterStatus.length > 0 && !filterStatus.includes(task.status)) return false;

    // Worker filter (OR mode - match any selected worker)
    if (filterWorkers.length > 0 && !filterWorkers.includes(task.assignedTo || '')) return false;

    // Profession filter (OR mode - match any selected profession)
    if (filterProfessions.length > 0 && !filterProfessions.includes(task.type || '')) return false;

    return true;
  });

  // Map to 5 columns like GlobalTasksView
  const tasksByStatus = {
    unassigned: filteredTasks.filter(t =>
      t.status === 'pending' || t.status === 'unassigned' || t.status === 'rejected'
    ),
    pending_acceptance: filteredTasks.filter(t => t.status === 'pending_acceptance'),
    accepted: filteredTasks.filter(t => t.status === 'accepted'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    completed: filteredTasks.filter(t => t.status === 'completed')
  };

  const unassignedTasks = tasksByStatus.unassigned.length;
  const pendingTasks = tasksByStatus.pending_acceptance.length;
  const acceptedTasks = tasksByStatus.accepted.length;
  const inProgressTasks = tasksByStatus.in_progress.length;
  const completedTasks = tasksByStatus.completed.length;

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    const updatedTasks = currentProject.tasks.map(t =>
      t.id === taskId ? { ...t, ...updates } : t
    );
    const updated = { ...currentProject, tasks: updatedTasks };
    storage.updateProject(currentProject.id, { tasks: updatedTasks });
    setCurrentProject(updated);
  };

  const openTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  // Assign Mode handlers
  const toggleAssignMode = () => {
    setIsAssignMode(!isAssignMode);
    setSelectedTaskIds(new Set()); // Clear selection when toggling
  };

  const toggleTaskSelection = (taskId: string) => {
    const newSelection = new Set(selectedTaskIds);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    setSelectedTaskIds(newSelection);
  };

  const selectAllTasks = () => {
    const allTaskIds = new Set(filteredTasks.map(t => t.id));
    setSelectedTaskIds(allTaskIds);
  };

  const deselectAllTasks = () => {
    setSelectedTaskIds(new Set());
  };

  // Multi-select filter handlers
  const toggleFilterItem = (filterArray: string[], setFilter: (val: string[]) => void, value: string) => {
    if (filterArray.includes(value)) {
      setFilter(filterArray.filter(v => v !== value));
    } else {
      setFilter([...filterArray, value]);
    }
  };

  const clearAllFilters = () => {
    setFilterStatus([]);
    setFilterWorkers([]);
    setFilterProfessions([]);
    setSearchQuery('');
  };

  const hasActiveFilters = filterStatus.length > 0 || filterWorkers.length > 0 || filterProfessions.length > 0 || searchQuery !== '';

  const handleBulkAssign = (assignments: { taskId: string; workerId: string; date: string; time: string; hours: number }[]) => {
    // Update all tasks with their individual assignments
    assignments.forEach(({ taskId, workerId, date, time, hours }) => {
      storage.assignTask(currentProject.id, taskId, workerId, date, time, hours);
    });

    // Show toast
    const workerNames = [...new Set(assignments.map(a => workers.find(w => w.id === a.workerId)?.name))];
    const workerText = workerNames.length === 1 ? workerNames[0] : `${workerNames.length} workers`;
    setToastMessage(`✔️ Assigned ${assignments.length} task${assignments.length > 1 ? 's' : ''} to ${workerText}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);

    // Refresh project
    const updated = storage.getProjects().find(p => p.id === currentProject.id);
    if (updated) {
      setCurrentProject(updated);
    }

    // Close modal and clear selection
    setShowBulkAssignModal(false);
    setSelectedTaskIds(new Set());
    setIsAssignMode(false);

    // Trigger global update
    window.dispatchEvent(new Event('projectsUpdated'));
  };

  const handleSaveClientInfo = () => {
    const updates = {
      clientName: editedClientName,
      clientAddress: editedClientAddress,
      clientPhone: editedClientPhone,
      clientEmail: editedClientEmail,
      notes: editedNotes
    };

    storage.updateProject(currentProject.id, updates);
    const updated = storage.getProjects().find(p => p.id === currentProject.id);
    if (updated) {
      setCurrentProject(updated);
    }

    setIsEditingClient(false);
    setToastMessage('✔️ Client information updated');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    window.dispatchEvent(new Event('projectsUpdated'));
  };

  const handleCancelEdit = () => {
    setEditedClientName(currentProject.clientName);
    setEditedClientAddress(currentProject.clientAddress);
    setEditedClientPhone(currentProject.clientPhone || '');
    setEditedClientEmail(currentProject.clientEmail || '');
    setEditedNotes(currentProject.notes || '');
    setIsEditingClient(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Projects
      </button>

      {/* Project Header - Data + Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        {/* Header Toggle Bar - Only show when collapsed */}
        {isHeaderCollapsed && (
          <button
            onClick={() => setIsHeaderCollapsed(false)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900">Project #{project.number}</h2>
              <span className="text-sm text-gray-500">{currentProject.clientName}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-blue-600">${currentProject.total.toLocaleString()}</span>
              <ChevronDown className="w-5 h-5 text-gray-400 -rotate-90" />
            </div>
          </button>
        )}

        {/* Collapsible Content */}
        <div className={`transition-all duration-300 ${isHeaderCollapsed ? 'max-h-0' : 'max-h-[800px]'} overflow-hidden`}>
          <div className="p-8 relative">
            {/* Collapse button when expanded */}
            <button
              onClick={() => setIsHeaderCollapsed(true)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronUp className="w-5 h-5 text-gray-400" />
            </button>
            <div className="grid grid-cols-3 gap-8">
          {/* Left: Project Info - 1 col */}
          <div>
            <div className="flex items-baseline justify-between mb-5">
              <h1 className="text-2xl font-bold text-gray-900">Project #{project.number}</h1>
              {!isEditingClient ? (
                <button
                  onClick={() => setIsEditingClient(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveClientInfo}
                    className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" />
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {/* Client Name */}
              {isEditingClient ? (
                <input
                  type="text"
                  value={editedClientName}
                  onChange={(e) => setEditedClientName(e.target.value)}
                  className="w-full text-base font-semibold text-gray-700 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Client Name"
                />
              ) : (
                <p className="text-base font-semibold text-gray-700">{currentProject.clientName}</p>
              )}

              {/* Date */}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600">{new Date(currentProject.estimateDate).toLocaleDateString()}</span>
              </div>

              {/* Address */}
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                {isEditingClient ? (
                  <input
                    type="text"
                    value={editedClientAddress}
                    onChange={(e) => setEditedClientAddress(e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Address"
                  />
                ) : (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentProject.clientAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                  >
                    {currentProject.clientAddress}
                  </a>
                )}
              </div>

              {/* Phone */}
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {isEditingClient ? (
                  <input
                    type="tel"
                    value={editedClientPhone}
                    onChange={(e) => setEditedClientPhone(e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Phone number"
                  />
                ) : currentProject.clientPhone ? (
                  <a href={`tel:${currentProject.clientPhone}`} className="text-blue-600 hover:text-blue-700 hover:underline">
                    {currentProject.clientPhone}
                  </a>
                ) : (
                  <span className="text-gray-400 italic">No phone</span>
                )}
              </div>

              {/* Email */}
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {isEditingClient ? (
                  <input
                    type="email"
                    value={editedClientEmail}
                    onChange={(e) => setEditedClientEmail(e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email address"
                  />
                ) : currentProject.clientEmail ? (
                  <a href={`mailto:${currentProject.clientEmail}`} className="text-blue-600 hover:text-blue-700 hover:underline truncate">
                    {currentProject.clientEmail}
                  </a>
                ) : (
                  <span className="text-gray-400 italic">No email</span>
                )}
              </div>

              {/* Notes */}
              <div className="pt-3 border-t border-gray-200">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-2">Notes</label>
                {isEditingClient ? (
                  <textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px] resize-y"
                    placeholder="Project notes..."
                  />
                ) : currentProject.notes ? (
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{currentProject.notes}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">No notes</p>
                )}
              </div>

              {/* View Estimate */}
              {currentProject.estimatePreview && (
                <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <button
                    type="button"
                    onClick={() => setShowEstimateModal(true)}
                    className="text-blue-600 hover:text-blue-700 hover:underline font-semibold flex items-center gap-1.5 py-1 cursor-pointer"
                  >
                    <span>View Estimate</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Middle: Map - 1 col */}
          <div className="pl-8 border-l border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Location</h2>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentProject.clientAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                Open in Maps
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(currentProject.clientAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                allowFullScreen
              />
            </div>
          </div>

          {/* Right: Stats + Budget - 1 col */}
          <div className="pl-8 border-l border-gray-200">
            {/* Task Status */}
            <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-3">Task Status</h2>
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                <FileText className="w-4 h-4 text-slate-600" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Total</span>
                  <span className="text-sm font-bold text-gray-900">{currentProject.tasks.length}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Unassigned</span>
                  <span className="text-sm font-bold text-amber-900">{unassignedTasks}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
                <Clock className="w-4 h-4 text-amber-600" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Pending</span>
                  <span className="text-sm font-bold text-amber-900">{pendingTasks}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Accepted</span>
                  <span className="text-sm font-bold text-green-900">{acceptedTasks}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Active</span>
                  <span className="text-sm font-bold text-blue-900">{inProgressTasks}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Done</span>
                  <span className="text-sm font-bold text-green-900">{completedTasks}</span>
                </div>
              </div>
            </div>

            {/* Budget */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-3">Budget</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm gap-4">
                  <span className="text-gray-600">Labor:</span>
                  <span className="font-bold text-gray-900">${currentProject.subtotal.toLocaleString()}</span>
                </div>
                {(() => {
                  const totalMaterialsCost = currentProject.tasks.reduce((sum, task) => {
                    const taskMaterialsCost = task.materials?.reduce((matSum, mat) => matSum + (mat.estimatedCost || 0), 0) || 0;
                    return sum + taskMaterialsCost;
                  }, 0);
                  return totalMaterialsCost > 0 ? (
                    <div className="flex justify-between text-sm gap-4 opacity-50">
                      <span className="text-gray-500 flex items-center gap-1">
                        Materials:
                        <span className="text-xs italic">(est.)</span>
                      </span>
                      <span className="font-bold text-gray-600">${totalMaterialsCost.toLocaleString()}</span>
                    </div>
                  ) : null;
                })()}
                <div className="flex justify-between text-sm gap-4">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-bold text-gray-900">${currentProject.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-bold text-gray-800">Total:</span>
                  <span className="text-xl font-black text-blue-600">${currentProject.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar - Search + Filters + Actions Only */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-3">

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border-0 bg-transparent focus:outline-none text-sm"
            />
          </div>

          <div className="h-6 w-px bg-gray-200"></div>

          {/* Filters */}
          <FilterMultiSelect
            label="Status"
            options={[
              { value: 'unassigned', label: 'Unassigned' },
              { value: 'pending_acceptance', label: 'Pending' },
              { value: 'accepted', label: 'Accepted' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'rejected', label: 'Rejected' }
            ]}
            selected={filterStatus}
            onToggle={(value) => toggleFilterItem(filterStatus, setFilterStatus, value)}
          />
          <FilterMultiSelect
            label="Profession"
            options={[
              { value: 'hvac', label: 'HVAC' },
              { value: 'carpentry', label: 'Carpentry' },
              { value: 'electrical', label: 'Electrical' },
              { value: 'plumbing', label: 'Plumbing' },
              { value: 'roofing', label: 'Roofing' },
              { value: 'painting', label: 'Painting' },
              { value: 'flooring', label: 'Flooring' },
              { value: 'other', label: 'Other' }
            ]}
            selected={filterProfessions}
            onToggle={(value) => toggleFilterItem(filterProfessions, setFilterProfessions, value)}
          />

          <div className="h-6 w-px bg-gray-200"></div>

          {/* Actions */}
          <button
            onClick={toggleAssignMode}
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-sm transition-all text-sm flex-shrink-0 ${
              isAssignMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            {isAssignMode ? 'Exit' : 'Assign'}
          </button>
          <button
            onClick={() => setShowNewTaskModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-sm transition-all text-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowActionsDropdown(!showActionsDropdown)}
              className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              Actions
              <ChevronRight className="w-4 h-4 rotate-90" />
            </button>
            {showActionsDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={() => {
                    setShowActionsDropdown(false);
                    onEdit();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 rounded-t-lg"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Project
                </button>
                <button
                  onClick={() => {
                    setShowActionsDropdown(false);
                    onDelete();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100 rounded-b-lg"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Project
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Filter Chips - Below Toolbar */}
      {hasActiveFilters && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-700">Active Filters:</span>
          {searchQuery && (
            <FilterChip label={`Search: "${searchQuery}"`} onRemove={() => setSearchQuery('')} />
          )}
          {filterStatus.map(status => (
            <FilterChip
              key={status}
              label={`Status: ${status.replace('_', ' ')}`}
              onRemove={() => toggleFilterItem(filterStatus, setFilterStatus, status)}
            />
          ))}
          {filterProfessions.map(profession => (
            <FilterChip
              key={profession}
              label={`Profession: ${profession.toUpperCase()}`}
              onRemove={() => toggleFilterItem(filterProfessions, setFilterProfessions, profession)}
            />
          ))}
          {filterWorkers.map(workerId => {
            const worker = workers.find(w => w.id === workerId);
            return (
              <FilterChip
                key={workerId}
                label={`Worker: ${worker?.name || 'Unassigned'}`}
                onRemove={() => toggleFilterItem(filterWorkers, setFilterWorkers, workerId)}
              />
            );
          })}
          <button
            onClick={clearAllFilters}
            className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1 hover:bg-red-50 rounded-lg transition-colors"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Kanban Board - 5 Columns Full Width */}
      <div className="grid grid-cols-5 gap-3 pb-4">
        {/* UNASSIGNED Column */}
        <KanbanColumn
          title="UNASSIGNED"
          status="pending"
          count={unassignedTasks}
          tasks={tasksByStatus.unassigned}
          workers={workers}
          onTaskClick={openTaskDetail}
          onTaskDrop={(taskId) => handleTaskUpdate(taskId, { status: 'unassigned', assignedTo: undefined, assignedDate: undefined, time: undefined, duration: undefined })}
          bgColor="bg-gray-50"
          badgeColor="bg-gray-600 text-white"
          isAssignMode={isAssignMode}
          selectedTaskIds={selectedTaskIds}
          onToggleSelection={toggleTaskSelection}
        />
        {/* PENDING Column */}
        <KanbanColumn
          title="PENDING"
          status="in-progress"
          count={pendingTasks}
          tasks={tasksByStatus.pending_acceptance}
          workers={workers}
          onTaskClick={openTaskDetail}
          onTaskDrop={(taskId) => handleTaskUpdate(taskId, { status: 'pending_acceptance' })}
          bgColor="bg-amber-50"
          badgeColor="bg-amber-600 text-white"
          isAssignMode={isAssignMode}
          selectedTaskIds={selectedTaskIds}
          onToggleSelection={toggleTaskSelection}
        />
        {/* ACCEPTED Column */}
        <KanbanColumn
          title="ACCEPTED"
          status="completed"
          count={acceptedTasks}
          tasks={tasksByStatus.accepted}
          workers={workers}
          onTaskClick={openTaskDetail}
          onTaskDrop={(taskId) => handleTaskUpdate(taskId, { status: 'accepted' })}
          bgColor="bg-cyan-50"
          badgeColor="bg-cyan-600 text-white"
          isAssignMode={isAssignMode}
          selectedTaskIds={selectedTaskIds}
          onToggleSelection={toggleTaskSelection}
        />
        {/* IN PROGRESS Column */}
        <KanbanColumn
          title="IN PROGRESS"
          status="in-progress"
          count={inProgressTasks}
          tasks={tasksByStatus.in_progress}
          workers={workers}
          onTaskClick={openTaskDetail}
          onTaskDrop={(taskId) => handleTaskUpdate(taskId, { status: 'in_progress' })}
          bgColor="bg-purple-50"
          badgeColor="bg-purple-600 text-white"
          isAssignMode={isAssignMode}
          selectedTaskIds={selectedTaskIds}
          onToggleSelection={toggleTaskSelection}
        />
        {/* COMPLETED Column */}
        <KanbanColumn
          title="COMPLETED"
          status="completed"
          count={completedTasks}
          tasks={tasksByStatus.completed}
          workers={workers}
          onTaskClick={openTaskDetail}
          onTaskDrop={(taskId) => handleTaskUpdate(taskId, { status: 'completed' })}
          bgColor="bg-green-50"
          badgeColor="bg-green-600 text-white"
          isAssignMode={isAssignMode}
          selectedTaskIds={selectedTaskIds}
          onToggleSelection={toggleTaskSelection}
        />
      </div>

      {/* Floating Action Bar - Show immediately when in Assign Mode */}
      {isAssignMode && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-purple-500 px-6 py-4 flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                {selectedTaskIds.size}
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  {selectedTaskIds.size} Task{selectedTaskIds.size > 1 ? 's' : ''} Selected
                </div>
                <div className="text-xs text-gray-500">Ready to assign</div>
              </div>
            </div>

            <div className="h-8 w-px bg-gray-300" />

            <button
              onClick={selectAllTasks}
              className="flex items-center gap-2 border border-purple-300 bg-purple-50 text-purple-700 px-4 py-2 rounded-lg font-medium hover:bg-purple-100 transition-colors text-sm"
            >
              Select All
            </button>

            <button
              onClick={deselectAllTasks}
              className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              Deselect All
            </button>

            <div className="h-8 w-px bg-gray-300" />

            <button
              onClick={() => setShowBulkAssignModal(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={selectedTaskIds.size === 0}
            >
              <UserCheck className="w-4 h-4" />
              Assign Worker
            </button>

            <button
              onClick={toggleAssignMode}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 px-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {showTaskModal && selectedTask && (
        <UnifiedTaskModal
          task={selectedTask}
          projectId={currentProject.id}
          projectNumber={currentProject.number}
          projectClient={currentProject.clientName}
          workers={workers}
          onClose={() => {
            setShowTaskModal(false);
            setInitialTab('details'); // Reset for next open
          }}
          onUpdate={() => {
            setCurrentProject(storage.getProjects().find(p => p.id === currentProject.id)!);
            setShowTaskModal(false);
            setInitialTab('details'); // Reset for next open
          }}
          initialTab={initialTab}
        />
      )}

      {/* New Task Modal */}
      {showNewTaskModal && (
        <NewTaskModal
          projectId={currentProject.id}
          onClose={() => setShowNewTaskModal(false)}
          onSave={(newTask) => {
            const updatedTasks = [...currentProject.tasks, { ...newTask, id: Date.now().toString() }];
            storage.updateProject(currentProject.id, { tasks: updatedTasks });
            setCurrentProject(storage.getProjects().find(p => p.id === currentProject.id)!);
            setShowNewTaskModal(false);
            window.dispatchEvent(new Event('projectsUpdated'));
          }}
        />
      )}

      {/* Bulk Assign Modal */}
      {showBulkAssignModal && (
        <BulkAssignModal
          tasks={currentProject.tasks.filter(t => selectedTaskIds.has(t.id))}
          workers={workers}
          project={currentProject}
          onClose={() => setShowBulkAssignModal(false)}
          onAssign={handleBulkAssign}
        />
      )}

      {/* Estimate Preview Modal */}
      {showEstimateModal && currentProject.estimatePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowEstimateModal(false)}>
          <div className="relative max-w-6xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowEstimateModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <div className="bg-white rounded-xl p-4 shadow-2xl overflow-auto max-h-[90vh]">
              <img
                src={currentProject.estimatePreview}
                alt={`Estimate - Project #${currentProject.number}`}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px]">
            <CheckCircle className="w-6 h-6 flex-shrink-0" />
            <p className="font-medium">{toastMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// KANBAN COLUMN
// ============================================================================

function KanbanColumn({ title, status, count, tasks, workers, onTaskClick, onTaskDrop, bgColor, badgeColor, isAssignMode, selectedTaskIds, onToggleSelection }: {
  title: string;
  status: Task['status'];
  count: number;
  tasks: Task[];
  workers: any[];
  onTaskClick: (task: Task) => void;
  onTaskDrop: (taskId: string) => void;
  bgColor: string;
  badgeColor: string;
  isAssignMode?: boolean;
  selectedTaskIds?: Set<string>;
  onToggleSelection?: (taskId: string) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onTaskDrop(taskId);
    }
  };

  const borderTopColors = {
    'bg-gray-600': 'border-t-gray-400',
    'bg-amber-600': 'border-t-amber-400',
    'bg-cyan-600': 'border-t-cyan-400',
    'bg-purple-600': 'border-t-purple-400',
    'bg-green-600': 'border-t-green-400'
  };

  const borderTopColor = borderTopColors[badgeColor.split(' ')[0]] || 'border-t-gray-400';

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-white rounded-xl p-6 transition-all border border-gray-200 border-t-4 ${borderTopColor} flex-1 min-w-0 shadow-sm ${isDragOver ? 'ring-2 ring-blue-500 border-blue-300' : ''}`}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className={`text-xs font-black uppercase tracking-wide ${
          badgeColor.includes('gray-600') ? 'text-gray-600' :
          badgeColor.includes('amber-600') ? 'text-amber-600' :
          badgeColor.includes('cyan-600') ? 'text-cyan-600' :
          badgeColor.includes('purple-600') ? 'text-purple-600' :
          badgeColor.includes('green-600') ? 'text-green-600' :
          'text-gray-700'
        }`}>{title}</h3>
        <span className={`${badgeColor} text-xs font-bold px-2.5 py-1 rounded-full`}>{count}</span>
      </div>
      <div className="space-y-2.5 min-h-[calc(100vh-350px)] max-h-[calc(100vh-350px)] overflow-y-auto pr-1">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            workers={workers}
            onClick={() => !isAssignMode && onTaskClick(task)}
            onStatusChange={() => {}}
            onAssign={() => {}}
            isAssignMode={isAssignMode}
            isSelected={selectedTaskIds?.has(task.id)}
            onToggleSelection={() => onToggleSelection?.(task.id)}
          />
        ))}
        {count === 0 && (
          <p className="text-center text-sm py-8 text-gray-500">
            No {title.toLowerCase()} tasks
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ADD PROJECT MODAL
// ============================================================================

function AddProjectModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void
}) {
  const [formData, setFormData] = useState({
    number: '',
    clientName: '',
    clientAddress: '',
    estimateDate: new Date().toISOString().split('T')[0],
    status: 'active' as Project['status'],
    tasks: [] as Omit<Task, 'id'>[]
  });

  const [currentTask, setCurrentTask] = useState({
    description: '',
    price: '',
    quantity: '1'
  });

  const addTask = () => {
    if (!currentTask.description || !currentTask.price) {
      alert('Please fill in task description and price');
      return;
    }

    const price = parseFloat(currentTask.price);
    const quantity = parseInt(currentTask.quantity) || 1;
    const amount = price * quantity;

    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, {
        description: currentTask.description,
        price,
        quantity,
        amount,
        status: 'pending' as const
      }]
    }));

    setCurrentTask({ description: '', price: '', quantity: '1' });
  };

  const removeTask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    if (!formData.number || !formData.clientName || formData.tasks.length === 0) {
      alert('Please fill in project number, client name, and add at least one task');
      return;
    }

    const subtotal = formData.tasks.reduce((acc, t) => acc + t.amount, 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    onSave({
      ...formData,
      subtotal,
      tax,
      total
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">New Project</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Project Number *</label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="2011"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Estimate Date</label>
                <input
                  type="date"
                  value={formData.estimateDate}
                  onChange={(e) => setFormData({ ...formData, estimateDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Client Name *</label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="Jack Shippee"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Client Address</label>
              <input
                type="text"
                value={formData.clientAddress}
                onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                placeholder="2690 Stuart St, Denver CO 80212"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Project['status'] })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>

            {/* Tasks Section */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Tasks</h3>

              {/* Add Task Form */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6">
                    <input
                      type="text"
                      value={currentTask.description}
                      onChange={(e) => setCurrentTask({ ...currentTask, description: e.target.value })}
                      placeholder="Task description"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      value={currentTask.quantity}
                      onChange={(e) => setCurrentTask({ ...currentTask, quantity: e.target.value })}
                      placeholder="Qty"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      value={currentTask.price}
                      onChange={(e) => setCurrentTask({ ...currentTask, price: e.target.value })}
                      placeholder="Price"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      onClick={addTask}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Tasks List */}
              {formData.tasks.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {formData.tasks.map((task, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{task.description}</p>
                        <p className="text-xs text-gray-500">Qty: {task.quantity} × ${task.price} = ${task.amount.toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => removeTask(index)}
                        className="ml-4 text-red-500 hover:text-red-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No tasks added yet</p>
              )}

              {/* Budget Preview */}
              {formData.tasks.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="font-semibold text-gray-900">
                      ${formData.tasks.reduce((acc, t) => acc + t.amount, 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Tax (5%):</span>
                    <span className="font-semibold text-gray-900">
                      ${(formData.tasks.reduce((acc, t) => acc + t.amount, 0) * 0.05).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-200">
                    <span className="font-bold text-gray-800">Total:</span>
                    <span className="text-xl font-bold text-blue-600">
                      ${(formData.tasks.reduce((acc, t) => acc + t.amount, 0) * 1.05).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// NEW TASK MODAL
// ============================================================================

function NewTaskModal({ projectId, onClose, onSave }: {
  projectId: string;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id'>) => void;
}) {
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [type, setType] = useState<TaskType>('other');

  const taskTypes: { value: TaskType; label: string; color: string }[] = [
    { value: 'hvac', label: 'HVAC', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'carpentry', label: 'Carpentry', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { value: 'electrical', label: 'Electrical', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { value: 'plumbing', label: 'Plumbing', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
    { value: 'roofing', label: 'Roofing', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { value: 'painting', label: 'Painting', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { value: 'flooring', label: 'Flooring', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  ];

  const handleSave = () => {
    if (!description.trim() || price <= 0) {
      alert('Please fill in task description and price');
      return;
    }

    onSave({
      description,
      quantity,
      price,
      amount: quantity * price,
      type,
      status: 'pending'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800">New Task</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                placeholder="Task description..."
              />
            </div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity *</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Unit Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Total</label>
                <div className="flex items-center h-[52px] px-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <span className="text-xl font-bold text-blue-600">${(quantity * price).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Task Type/Profession */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Profession / Trade *</label>
              <div className="grid grid-cols-4 gap-2">
                {taskTypes.map(taskType => (
                  <button
                    key={taskType.value}
                    onClick={() => setType(taskType.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                      type === taskType.value
                        ? taskType.color + ' shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {taskType.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              Create Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EDIT PROJECT MODAL (Simplified - just status/client info, not tasks)
// ============================================================================

function EditProjectModal({ project, onClose, onSave }: {
  project: Project;
  onClose: () => void;
  onSave: (updates: Partial<Project>) => void
}) {
  const [formData, setFormData] = useState({
    clientName: project.clientName,
    clientAddress: project.clientAddress,
    status: project.status
  });

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Edit Project #{project.number}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Client Name</label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Client Address</label>
              <input
                type="text"
                value={formData.clientAddress}
                onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Project['status'] })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// UPLOAD ESTIMATE MODAL
// ============================================================================

function UploadEstimateModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (project: Omit<Project, "id" | "createdAt" | "updatedAt">) => void
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const parseEstimate = async () => {
    if (!file) return;
    setParsing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-estimate', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('API Error:', data);
        throw new Error(data.error || 'Failed to parse estimate');
      }

      console.log('Parsed data:', data);

      // Validate data structure
      if (!data.tasks || !Array.isArray(data.tasks)) {
        throw new Error('Invalid response: missing tasks array');
      }

      // Convert parsed data to project format
      const project = {
        number: data.projectNumber || '',
        clientName: data.clientName || '',
        clientAddress: data.clientAddress || '',
        estimateDate: data.estimateDate || new Date().toISOString().split('T')[0],
        status: 'active' as const,
        tasks: data.tasks.map((task: any) => ({
          description: task.description,
          quantity: task.quantity,
          price: task.price,
          amount: task.amount,
          type: task.type || 'other',
          estimatedHours: task.estimatedHours || 0,
          materials: task.materials || [],
          status: 'pending' as const
        })),
        subtotal: data.subtotal,
        tax: data.tax,
        total: data.total,
        estimatePreview: preview // Save the base64 preview
      };

      onSave(project);
    } catch (error) {
      console.error('Parse error:', error);
      alert(`Failed to parse estimate: ${error instanceof Error ? error.message : 'Unknown error'}. Please try Manual Entry instead.`);
      setParsing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Upload Estimate</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
              <input type="file" id="estimate-upload" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
              <label htmlFor="estimate-upload" className="cursor-pointer block">
                <div className="flex flex-col items-center">
                  {preview ? (
                    <div className="mb-4">
                      <FileText className="w-16 h-16 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">{file?.name}</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-16 h-16 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-700 mb-2">Drop your estimate here</p>
                      <p className="text-sm text-gray-500">or click to browse</p>
                      <p className="text-xs text-gray-400 mt-2">Supports PDF, JPG, PNG</p>
                    </>
                  )}
                </div>
              </label>
            </div>
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <div className="flex gap-3">
                <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 mb-1">AI-Powered Parsing with Gemini</p>
                  <p className="text-sm text-blue-700">
                    Upload your estimate PDF or image, and Gemini AI will automatically extract:
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                    <li>Project number and client information</li>
                    <li>All line items and tasks</li>
                    <li>Costs, quantities, and budget calculations</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button onClick={onClose} className="flex-1 px-6 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={parseEstimate} disabled={!file || parsing} className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">{parsing ? "Parsing..." : "Parse with AI"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TASK CARD (for Kanban)
// ============================================================================

function TaskCard({ task, workers, onClick, onStatusChange, onAssign, isAssignMode, isSelected, onToggleSelection }: {
  task: Task;
  workers: any[];
  onClick: () => void;
  onStatusChange: (status: Task['status']) => void;
  onAssign: (workerId: string) => void;
  isAssignMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}) {
  const assignedWorker = workers.find(w => w.id === task.assignedTo);

  // Map internal status to display label
  const getStatusLabel = (status: string) => {
    if (status === 'pending' || status === 'unassigned' || status === 'rejected') return 'Unassigned';
    if (status === 'pending_acceptance') return 'Assigned';
    if (status === 'accepted' || status === 'in_progress') return 'Confirmed';
    if (status === 'completed') return 'Done';
    return status;
  };

  const taskTypeColors: Record<TaskType, string> = {
    hvac: 'bg-blue-100 text-blue-700',
    carpentry: 'bg-amber-100 text-amber-700',
    electrical: 'bg-yellow-100 text-yellow-700',
    plumbing: 'bg-cyan-100 text-cyan-700',
    roofing: 'bg-slate-100 text-slate-700',
    painting: 'bg-purple-100 text-purple-700',
    flooring: 'bg-orange-100 text-orange-700',
    other: 'bg-gray-100 text-gray-700',
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('taskId', task.id);
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  const statusLabel = getStatusLabel(task.status);
  const statusColors = {
    'Unassigned': 'bg-gray-100 text-gray-700',
    'Assigned': 'bg-amber-100 text-amber-700',
    'Confirmed': 'bg-green-100 text-green-700',
    'Done': 'bg-blue-100 text-blue-700'
  };

  const phase = getTaskPhase(task.status);
  const phaseLabel = getPhaseLabel(phase);
  const phaseColor = getPhaseColor(phase);

  return (
    <div
      draggable={!isAssignMode}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={isAssignMode ? onToggleSelection : onClick}
      className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-all duration-200 group relative ${
        isAssignMode
          ? isSelected
            ? 'border-purple-500 ring-4 ring-purple-100 bg-purple-50 cursor-pointer shadow-lg'
            : 'border-gray-200 hover:border-purple-300 cursor-pointer hover:shadow-md'
          : 'border-gray-200 hover:shadow-lg hover:border-blue-300 cursor-move hover:-translate-y-0.5'
      }`}
    >
      {/* Checkbox in Assign Mode */}
      {isAssignMode && (
        <div className="absolute top-2 left-2 z-10">
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-purple-600 border-purple-600'
              : 'bg-white border-gray-300'
          }`}>
            {isSelected && (
              <CheckCircle className="w-4 h-4 text-white" />
            )}
          </div>
        </div>
      )}

      {/* Task Name - Full Width */}
      <div className={`mb-3 ${isAssignMode ? 'ml-7' : ''}`}>
        <h3 className="font-bold text-gray-900 text-base leading-snug mb-2 line-clamp-2">{task.description}</h3>

        {/* Profession & Status - One Row */}
        <div className="flex items-center gap-2 flex-wrap">
          {task.type && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${taskTypeColors[task.type]}`}>
              {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
            </span>
          )}
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${phaseColor}`}>
            {phaseLabel}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm mb-4 pb-4 border-b-2 border-gray-100">
        <span className="text-gray-500 font-medium">Qty: <span className="text-gray-900 font-bold">{task.quantity}</span></span>
        <span className="text-xl font-black text-blue-600">${task.amount.toFixed(2)}</span>
      </div>

      {assignedWorker ? (
        <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-md">
            {assignedWorker.name ? assignedWorker.name.split(' ').map(n => n[0]).join('').slice(0, 2) : '??'}
          </div>
          <div className="flex flex-col flex-1">
            <span className="text-sm text-gray-900 font-bold">{assignedWorker.name}</span>
            <div className="flex items-center gap-2 mt-0.5">
              {task.status === 'accepted' || task.status === 'confirmed' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-300">
                  <CheckCircle className="w-3 h-3" />
                  Confirmed
                </span>
              ) : task.status === 'rejected' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300">
                  <X className="w-3 h-3" />
                  Rejected
                </span>
              ) : task.status === 'pending_acceptance' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300">
                  <Clock className="w-3 h-3" />
                  Waiting
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 mt-3">
          {task.status === 'rejected' ? (
            <>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 w-fit">
                <AlertTriangle className="w-3 h-3" />
                <span>Rejected</span>
              </div>
              {(() => {
                // Find the rejection activity to get worker name
                const rejectionActivity = (task as any).activity?.find((a: any) =>
                  a.action.includes('Rejected by') || a.action.includes('declined')
                );
                if (rejectionActivity) {
                  const workerName = rejectionActivity.user;
                  return (
                    <div className="text-xs text-gray-600 font-medium ml-1">
                      by {workerName}
                    </div>
                  );
                }
                return null;
              })()}
              {(task as any).rejectionReason && (
                <div className="text-xs text-red-700 font-medium bg-red-50 p-2 rounded-lg border border-red-100 italic">
                  "{(task as any).rejectionReason}"
                </div>
              )}
            </>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="w-full text-xs text-blue-600 hover:text-blue-700 font-semibold text-left hover:bg-blue-50 p-2 rounded-lg transition-colors"
            >
              + Assign worker
            </button>
          )}
        </div>
      )}

      {task.scheduledDate && (
        <div className="inline-flex items-center gap-1.5 mt-3 text-xs text-gray-600 font-medium bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200 w-fit">
          <Calendar className="w-3 h-3" />
          {new Date(task.scheduledDate).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TASK DETAIL MODAL
// ============================================================================

function TaskDetailModal({ task, workers, onClose, onUpdate }: {
  task: Task;
  workers: any[];
  onClose: () => void;
  onUpdate: (updates: Partial<Task>) => void;
}) {
  const [description, setDescription] = useState(task.description);
  const [quantity, setQuantity] = useState(task.quantity);
  const [price, setPrice] = useState(task.price);
  const [type, setType] = useState<TaskType>(task.type || 'other');
  const [status, setStatus] = useState(task.status);
  const [assignedTo, setAssignedTo] = useState(task.assignedTo || '');
  const [scheduledDate, setScheduledDate] = useState(task.scheduledDate || '');

  const taskTypes: { value: TaskType; label: string; color: string }[] = [
    { value: 'hvac', label: 'HVAC', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'carpentry', label: 'Carpentry', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { value: 'electrical', label: 'Electrical', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { value: 'plumbing', label: 'Plumbing', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
    { value: 'roofing', label: 'Roofing', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { value: 'painting', label: 'Painting', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { value: 'flooring', label: 'Flooring', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  ];

  const handleSave = () => {
    onUpdate({
      description,
      quantity,
      price,
      amount: quantity * price,
      type,
      status,
      assignedTo: assignedTo || undefined,
      scheduledDate: scheduledDate || undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-200">
            <h2 className="text-xl font-black text-gray-900">Edit Task</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Task Details */}
          <div className="space-y-6">
            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-700 mb-2">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white shadow-sm transition-all"
                placeholder="Task description..."
              />
            </div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white shadow-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-700 mb-2">Unit Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white shadow-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-700 mb-2">Total</label>
                <div className="flex items-center h-[52px] px-4 bg-blue-50 rounded-xl border border-blue-200">
                  <span className="text-xl font-black text-blue-600">${(quantity * price).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Task Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-700 mb-3">Task Type</label>
              <div className="grid grid-cols-4 gap-2">
                {taskTypes.map(taskType => (
                  <button
                    key={taskType.value}
                    onClick={() => setType(taskType.value)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      type === taskType.value
                        ? taskType.color + ' shadow-sm scale-105'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    {taskType.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-700 mb-3">Status</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setStatus('pending')}
                  className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                    status === 'pending'
                      ? 'bg-gray-600 text-white shadow-md scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  To Do
                </button>
                <button
                  onClick={() => setStatus('in-progress')}
                  className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                    status === 'in-progress'
                      ? 'bg-blue-600 text-white shadow-md scale-105'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  In Progress
                </button>
                <button
                  onClick={() => setStatus('completed')}
                  className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                    status === 'completed'
                      ? 'bg-green-600 text-white shadow-md scale-105'
                      : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                  }`}
                >
                  Done
                </button>
              </div>
            </div>

            {/* Worker Assignment */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-700 mb-3">Assign Worker</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAssignedTo('')}
                  className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all text-left ${
                    !assignedTo
                      ? 'bg-gray-600 text-white shadow-md scale-105'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Unassigned
                </button>
                {workers.map(worker => (
                  <button
                    key={worker.id}
                    onClick={() => setAssignedTo(worker.id)}
                    className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all text-left ${
                      assignedTo === worker.id
                        ? 'bg-blue-600 text-white shadow-md scale-105'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 text-xs font-bold">
                        {worker.name ? worker.name.split(' ').map(n => n[0]).join('').slice(0, 2) : '??'}
                      </div>
                      {worker.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-700 mb-2">Schedule Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white shadow-sm transition-all"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-200 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// BULK ASSIGN MODAL
// ============================================================================

function BulkAssignModal({ tasks, workers, project, onClose, onAssign }: {
  tasks: any[];
  workers: any[];
  project: any;
  onClose: () => void;
  onAssign: (assignments: { taskId: string; workerId: string; date: string; time: string; hours: number }[]) => void;
}) {
  const [isSimpleMode, setIsSimpleMode] = useState(true);
  const [expandedTaskId, setExpandedTaskId] = useState(tasks[0]?.id || '');
  const [viewingTask, setViewingTask] = useState<any | null>(null);

  // Initialize task assignments with defaults
  const [taskAssignments, setTaskAssignments] = useState<Record<string, { workerId: string; date: string; time: string; hours: number }>>(
    tasks.reduce((acc, task) => ({
      ...acc,
      [task.id]: {
        workerId: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        hours: task.estimatedHours || 4
      }
    }), {})
  );

  // Simple mode: apply to all
  const [globalWorker, setGlobalWorker] = useState('');
  const [globalDate, setGlobalDate] = useState(new Date().toISOString().split('T')[0]);

  // Sync Simple mode to Advanced mode
  useEffect(() => {
    if (globalWorker) {
      setTaskAssignments(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(taskId => {
          updated[taskId] = {
            ...updated[taskId],
            workerId: globalWorker,
            date: globalDate
          };
        });
        return updated;
      });
    }
  }, [globalWorker, globalDate]);

  const handleTaskUpdate = (taskId: string, field: string, value: any) => {
    setTaskAssignments(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [field]: value
      }
    }));
  };

  const applyToAll = () => {
    if (!globalWorker || !globalDate) {
      alert('Please select a worker and date');
      return;
    }
    setTaskAssignments(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(taskId => {
        updated[taskId] = {
          ...updated[taskId],
          workerId: globalWorker,
          date: globalDate
        };
      });
      return updated;
    });
  };

  const handleSubmit = () => {
    const assignments = tasks.map(task => ({
      taskId: task.id,
      workerId: taskAssignments[task.id].workerId,
      date: taskAssignments[task.id].date,
      time: taskAssignments[task.id].time,
      hours: taskAssignments[task.id].hours
    }));

    // Validate all tasks have worker assigned
    const missingWorker = assignments.find(a => !a.workerId);
    if (missingWorker) {
      alert('Please assign a worker to all tasks');
      return;
    }

    onAssign(assignments);
  };

  const toggleTask = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? '' : taskId);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-xl shadow-2xl ${isSimpleMode ? 'max-w-md' : 'max-w-5xl'} w-full max-h-[90vh] flex flex-col overflow-hidden transition-all`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Batch Assign Tasks</h2>
              <p className="text-purple-100 text-sm mt-1">
                Assigning {tasks.length} task{tasks.length > 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSimpleMode(!isSimpleMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
                  !isSimpleMode
                    ? 'bg-white text-purple-700'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <Table2 className="w-4 h-4" />
                {isSimpleMode ? 'Show Details' : 'Hide Details'}
              </button>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content: Side by Side Layout */}
        <div className="flex-1 overflow-hidden flex">
          {/* LEFT SIDE: Simple Mode - Always Visible */}
          <div className={`${isSimpleMode ? 'w-full' : 'w-96 border-r border-gray-200'} flex flex-col`}>
            <div className="p-6 space-y-5">
              {/* Worker Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Worker <span className="text-red-500">*</span>
                </label>
                <select
                  value={globalWorker}
                  onChange={(e) => setGlobalWorker(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900"
                >
                  <option value="">Choose a worker...</option>
                  {workers.map(worker => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name} - {worker.skills.join(', ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Work Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Work Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={globalDate}
                  onChange={(e) => setGlobalDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900"
                />
              </div>

              {/* Apply to All Button */}
              <button
                onClick={applyToAll}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Apply to All Tasks
              </button>

              {/* Info Box */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {tasks.length}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-900">Batch Assignment</p>
                    <p className="text-xs text-purple-700 mt-1">
                      {isSimpleMode
                        ? 'All tasks will be assigned to the same worker with the same schedule'
                        : 'Click "Show Details" to customize each task individually'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Advanced Mode - Task List (Only when Advanced) */}
          {!isSimpleMode && (
            <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-gray-200">
            {tasks.map((task) => {
              const isExpanded = expandedTaskId === task.id;
              const assignment = taskAssignments[task.id];
              const assignedWorker = workers.find(w => w.id === assignment.workerId);

              return (
                <div key={task.id} className="bg-white hover:bg-gray-50 transition-colors">
                  {/* Task Header - Collapsed */}
                  <div
                    className="flex items-center justify-between px-6 py-4 cursor-pointer"
                    onClick={() => toggleTask(task.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <button className="text-gray-400 hover:text-gray-600">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{task.description}</div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {task.price.toLocaleString()}
                          </span>
                          <span>•</span>
                          <span>{assignment.hours}hrs</span>
                          {task.type && (
                            <>
                              <span>•</span>
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                                {task.type.toUpperCase()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-600">
                        {assignedWorker ? (
                          <span className="text-purple-700 font-medium">✓ {assignedWorker.name}</span>
                        ) : (
                          <span className="text-amber-600">Not assigned</span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingTask(task);
                        }}
                        className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium px-3 py-1.5 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Full
                      </button>
                    </div>
                  </div>

                  {/* Task Details - Expanded */}
                  {isExpanded && (
                    <div className="px-6 pb-4 pl-14 bg-gray-50 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4 pt-4">
                        {/* Worker */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Worker <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={assignment.workerId}
                            onChange={(e) => handleTaskUpdate(task.id, 'workerId', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                          >
                            <option value="">Choose worker...</option>
                            {workers.map(worker => (
                              <option key={worker.id} value={worker.id}>
                                {worker.name} - {worker.skills.join(', ')}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Date */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={assignment.date}
                            onChange={(e) => handleTaskUpdate(task.id, 'date', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                          />
                        </div>

                        {/* Time */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Time
                          </label>
                          <input
                            type="time"
                            value={assignment.time}
                            onChange={(e) => handleTaskUpdate(task.id, 'time', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                          />
                        </div>

                        {/* Hours */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Estimated Hours
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={assignment.hours}
                            onChange={(e) => handleTaskUpdate(task.id, 'hours', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                          />
                        </div>
                      </div>

                      {/* Materials Info */}
                      {task.materials && task.materials.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-xs text-gray-600">
                            {task.materials.length} material{task.materials.length !== 1 ? 's' : ''} required
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {tasks.filter(t => taskAssignments[t.id].workerId).length} of {tasks.length} tasks assigned
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Confirm {tasks.length} Assignment{tasks.length > 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>

      {/* Full Task Modal */}
      {viewingTask && (
        <UnifiedTaskModal
          task={viewingTask}
          projectId={project.id}
          projectNumber={project.number}
          projectClient={project.clientName}
          workers={workers}
          onClose={() => setViewingTask(null)}
          onUpdate={(updatedTask) => {
            setViewingTask(null);
          }}
        />
      )}
    </div>
  );
}

// Filter Chip Component
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// Multi-Select Filter Component
function FilterMultiSelect({
  label,
  options,
  selected,
  onToggle
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2 border rounded-lg text-left flex items-center justify-between transition-colors text-sm ${
          selected.length > 0
            ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        <span>
          {label}: {selected.length > 0 ? `${selected.length} selected` : 'All'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {options.map(option => (
            <label
              key={option.value}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => onToggle(option.value)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
