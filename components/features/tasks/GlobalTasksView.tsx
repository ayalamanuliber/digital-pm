'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, AlertCircle, User, Calendar, Package, ChevronDown, ChevronRight, UserCheck, X, CheckCircle, ExternalLink, Table2, DollarSign, FileText, Clock, Activity } from 'lucide-react';
import { storage, Task, Worker, TaskStatus, getTaskPhase, getPhaseLabel, getPhaseColor } from '@/lib/localStorage';
import UnifiedTaskModal from '@/components/features/tasks/UnifiedTaskModal';

interface TaskWithProject extends Task {
  projectId: string;
  projectNumber: string;
  projectClient: string;
  projectAddress: string;
  projectColor: string;
}

export default function GlobalTasksView() {
  const [projects, setProjects] = useState<any[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterProjects, setFilterProjects] = useState<string[]>([]);
  const [filterSkills, setFilterSkills] = useState<string[]>([]);
  const [filterWorkers, setFilterWorkers] = useState<string[]>([]);
  const [filterProfessions, setFilterProfessions] = useState<string[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskWithProject | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Assign Mode states
  const [isAssignMode, setIsAssignMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadData();

    // Listen for project updates and reload
    const handleProjectsUpdate = () => {
      loadData();
    };

    window.addEventListener('projectsUpdated', handleProjectsUpdate);

    return () => {
      window.removeEventListener('projectsUpdated', handleProjectsUpdate);
    };
  }, []);

  const loadData = () => {
    setProjects(storage.getProjects());
    setWorkers(storage.getWorkers());
  };

  const openTaskDetail = (task: TaskWithProject) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  // Assign Mode handlers
  const toggleAssignMode = () => {
    setIsAssignMode(!isAssignMode);
    setSelectedTaskIds(new Set());
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
    setFilterProjects([]);
    setFilterSkills([]);
    setFilterWorkers([]);
    setFilterProfessions([]);
    setSearchQuery('');
  };

  const hasActiveFilters = filterStatus.length > 0 || filterProjects.length > 0 ||
    filterSkills.length > 0 || filterWorkers.length > 0 || filterProfessions.length > 0 || searchQuery !== '';

  const handleBulkAssign = (assignments: { taskId: string; projectId: string; workerId: string; date: string; time: string; hours: number }[]) => {
    // Update all tasks with their individual assignments (cross-project)
    assignments.forEach(({ taskId, projectId, workerId, date, time, hours }) => {
      storage.assignTask(projectId, taskId, workerId, date, time, hours);
    });

    // Show toast
    const workerNames = [...new Set(assignments.map(a => workers.find(w => w.id === a.workerId)?.name))];
    const workerText = workerNames.length === 1 ? workerNames[0] : `${workerNames.length} workers`;
    setToastMessage(`✔️ Assigned ${assignments.length} task${assignments.length > 1 ? 's' : ''} to ${workerText}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);

    // Refresh data
    loadData();

    // Close modal and clear selection
    setShowBulkAssignModal(false);
    setSelectedTaskIds(new Set());
    setIsAssignMode(false);

    // Trigger global update
    window.dispatchEvent(new Event('projectsUpdated'));
  };

  // Flatten all tasks from all projects
  const allTasks: TaskWithProject[] = projects.flatMap(project =>
    project.tasks.map(task => ({
      ...task,
      projectId: project.id,
      projectNumber: project.number,
      projectClient: project.clientName,
      projectAddress: project.clientAddress,
      projectColor: project.color || 'blue'
    }))
  );

  // Apply filters with OR logic for multiple selections
  const filteredTasks = allTasks.filter(task => {
    // Search query
    if (searchQuery && !task.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !task.projectClient.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !task.projectAddress.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Status filter (OR mode - match any selected status)
    if (filterStatus.length > 0 && !filterStatus.includes(task.status)) return false;

    // Project filter (OR mode - match any selected project)
    if (filterProjects.length > 0 && !filterProjects.includes(task.projectId)) return false;

    // Skill filter (OR mode - match any selected skill)
    if (filterSkills.length > 0 && (!task.skills || !task.skills.some(s => filterSkills.includes(s)))) return false;

    // Worker filter (OR mode - match any selected worker)
    if (filterWorkers.length > 0 && !filterWorkers.includes(task.assignedTo || '')) return false;

    // Profession filter (OR mode - match any selected profession)
    if (filterProfessions.length > 0 && !filterProfessions.includes(task.type || '')) return false;

    return true;
  });

  // Group by status
  const tasksByStatus = {
    unassigned: filteredTasks.filter(t => t.status === 'unassigned' || t.status === 'rejected' || t.status === 'pending'),
    pending_acceptance: filteredTasks.filter(t => t.status === 'pending_acceptance'),
    accepted: filteredTasks.filter(t => t.status === 'accepted'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    completed: filteredTasks.filter(t => t.status === 'completed')
  };

  const stats = {
    total: allTasks.length,
    unassigned: tasksByStatus.unassigned.length,
    pending: tasksByStatus.pending_acceptance.length,
    active: tasksByStatus.in_progress.length,
    completed: tasksByStatus.completed.length
  };

  // Get unique skills for filter
  const allSkills = Array.from(new Set(allTasks.flatMap(t => t.skills || [])));

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
            <p className="text-sm text-gray-500">Manage and assign tasks across all projects</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleAssignMode}
              className={`px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-all ${
                isAssignMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              <UserCheck className="w-5 h-5" />
              {isAssignMode ? 'Exit Assign Mode' : 'Assign Mode'}
            </button>
            <button className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all font-semibold">
              <Plus className="w-5 h-5" />
              New Task
            </button>
          </div>
        </div>

        {/* Toolbar - Stats + Search + Filters */}
        <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
          {/* Stats Badges */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200">
              <FileText className="w-4 h-4 text-slate-600" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-gray-500 uppercase">Total</span>
                <span className="text-sm font-bold text-gray-900">{stats.total}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-gray-500 uppercase">Unassigned</span>
                <span className="text-sm font-bold text-amber-900">{stats.unassigned}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-lg border border-amber-200">
              <Clock className="w-4 h-4 text-amber-600" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-gray-500 uppercase">Pending</span>
                <span className="text-sm font-bold text-amber-900">{stats.pending}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-lg border border-blue-200">
              <Activity className="w-4 h-4 text-blue-600" />
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
          </div>

          <div className="h-6 w-px bg-gray-200"></div>

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

          {/* Filters - Inline */}
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
            label="Project"
            options={projects.map(p => ({ value: p.id, label: `#${p.number}` }))}
            selected={filterProjects}
            onToggle={(value) => toggleFilterItem(filterProjects, setFilterProjects, value)}
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
        </div>
      </div>

      {/* Filters Section - Below Toolbar */}
      <div className="mb-6">
        {isAssignMode && (
          <div className="mb-4 flex items-center gap-2.5 text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="text-sm">
              <strong>Tip:</strong> Use filters below to narrow down tasks, then click <strong>"Select All"</strong> to select only filtered tasks!
            </div>
          </div>
        )}

        {/* Active Filter Chips */}
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
            {filterProjects.map(projectId => {
              const project = projects.find(p => p.id === projectId);
              return (
                <FilterChip
                  key={projectId}
                  label={`Project: #${project?.number}`}
                  onRemove={() => toggleFilterItem(filterProjects, setFilterProjects, projectId)}
                />
              );
            })}
            {filterProfessions.map(profession => (
              <FilterChip
                key={profession}
                label={`Profession: ${profession.toUpperCase()}`}
                onRemove={() => toggleFilterItem(filterProfessions, setFilterProfessions, profession)}
              />
            ))}
            {filterSkills.map(skill => (
              <FilterChip
                key={skill}
                label={`Skill: ${skill}`}
                onRemove={() => toggleFilterItem(filterSkills, setFilterSkills, skill)}
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
      </div>

      {/* Kanban Board - Full Width */}
      <div className="grid grid-cols-5 gap-3 pb-4">
        <KanbanColumn
          title="UNASSIGNED"
          tasks={tasksByStatus.unassigned}
          color="gray"
          workers={workers}
          onOpenTask={openTaskDetail}
          isAssignMode={isAssignMode}
          selectedTaskIds={selectedTaskIds}
          onToggleSelection={toggleTaskSelection}
        />
        <KanbanColumn
          title="PENDING"
          tasks={tasksByStatus.pending_acceptance}
          color="amber"
          workers={workers}
          onOpenTask={openTaskDetail}
          isAssignMode={isAssignMode}
          selectedTaskIds={selectedTaskIds}
          onToggleSelection={toggleTaskSelection}
        />
        <KanbanColumn
          title="ACCEPTED"
          tasks={tasksByStatus.accepted}
          color="cyan"
          workers={workers}
          onOpenTask={openTaskDetail}
          isAssignMode={isAssignMode}
          selectedTaskIds={selectedTaskIds}
          onToggleSelection={toggleTaskSelection}
        />
        <KanbanColumn
          title="IN PROGRESS"
          tasks={tasksByStatus.in_progress}
          color="purple"
          workers={workers}
          onOpenTask={openTaskDetail}
          isAssignMode={isAssignMode}
          selectedTaskIds={selectedTaskIds}
          onToggleSelection={toggleTaskSelection}
        />
        <KanbanColumn
          title="COMPLETED"
          tasks={tasksByStatus.completed}
          color="green"
          workers={workers}
          onOpenTask={openTaskDetail}
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
                <div className="text-xs text-gray-500">
                  {(() => {
                    const selectedTasks = allTasks.filter(t => selectedTaskIds.has(t.id));
                    const professions = new Set(selectedTasks.map(t => t.type).filter(Boolean));
                    const projects = new Set(selectedTasks.map(t => t.projectId));
                    const parts = [];
                    if (professions.size > 0) parts.push(`${professions.size} profession${professions.size > 1 ? 's' : ''}`);
                    if (projects.size > 0) parts.push(`${projects.size} project${projects.size > 1 ? 's' : ''}`);
                    return parts.length > 0 ? `across ${parts.join(' • ')}` : 'Ready to assign';
                  })()}
                </div>
              </div>
            </div>

            <div className="h-8 w-px bg-gray-300" />

            <button
              onClick={selectAllTasks}
              className="flex items-center gap-2 border border-purple-300 bg-purple-50 text-purple-700 px-4 py-2 rounded-lg font-medium hover:bg-purple-100 transition-colors text-sm"
            >
              Select All ({filteredTasks.length})
            </button>

            <button
              onClick={deselectAllTasks}
              className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              Clear Selection
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

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            {toastMessage}
          </div>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {showBulkAssignModal && (
        <CrossProjectBulkAssignModal
          tasks={filteredTasks.filter(t => selectedTaskIds.has(t.id))}
          workers={workers}
          onClose={() => setShowBulkAssignModal(false)}
          onAssign={handleBulkAssign}
        />
      )}

      {/* Task Detail Modal */}
      {showTaskModal && selectedTask && (
        <UnifiedTaskModal
          task={selectedTask}
          projectId={selectedTask.projectId}
          projectNumber={selectedTask.projectNumber}
          projectClient={selectedTask.projectClient}
          workers={workers}
          onClose={() => setShowTaskModal(false)}
          onUpdate={() => {
            loadData();
            setShowTaskModal(false);
          }}
        />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color = 'gray' }: { icon: any; label: string; value: number; color?: string }) {
  const colorClasses = {
    gray: 'border-slate-100 bg-slate-50',
    amber: 'border-amber-100 bg-amber-50',
    blue: 'border-blue-100 bg-blue-50',
    green: 'border-green-100 bg-green-50'
  };

  const iconColorClasses = {
    gray: 'text-slate-600',
    amber: 'text-amber-600',
    blue: 'text-blue-600',
    green: 'text-green-600'
  };

  return (
    <div className={`rounded-xl px-3 py-2 border shadow-sm flex items-center gap-3 ${colorClasses[color]}`}>
      <Icon className={`w-5 h-5 ${iconColorClasses[color]}`} />
      <div>
        <div className="text-xs font-bold uppercase tracking-wide text-gray-600">{label}</div>
        <div className="text-xl font-black text-gray-900">{value}</div>
      </div>
    </div>
  );
}

function KanbanColumn({
  title,
  tasks,
  color,
  workers,
  onOpenTask,
  isAssignMode,
  selectedTaskIds,
  onToggleSelection
}: {
  title: string;
  tasks: TaskWithProject[];
  color: string;
  workers: Worker[];
  onOpenTask: (task: TaskWithProject) => void;
  isAssignMode?: boolean;
  selectedTaskIds?: Set<string>;
  onToggleSelection?: (taskId: string) => void;
}) {
  const badgeColors = {
    gray: 'bg-gray-600 text-white',
    amber: 'bg-amber-600 text-white',
    cyan: 'bg-cyan-600 text-white',
    purple: 'bg-purple-600 text-white',
    green: 'bg-green-600 text-white'
  };

  const borderTopColors = {
    gray: 'border-t-gray-400',
    amber: 'border-t-amber-400',
    cyan: 'border-t-cyan-400',
    purple: 'border-t-purple-400',
    green: 'border-t-green-400'
  };

  const titleColors = {
    gray: 'text-gray-600',
    amber: 'text-amber-600',
    cyan: 'text-cyan-600',
    purple: 'text-purple-600',
    green: 'text-green-600'
  };

  return (
    <div className={`bg-white rounded-xl p-6 transition-all border border-gray-200 border-t-4 ${borderTopColors[color]} flex-1 min-w-0 shadow-sm`}>
      <div className="flex items-center justify-between mb-5">
        <h3 className={`text-xs font-black uppercase tracking-wide ${titleColors[color]}`}>{title}</h3>
        <span className={`${badgeColors[color]} text-xs font-bold px-2.5 py-1 rounded-full`}>{tasks.length}</span>
      </div>
      <div className="space-y-3 min-h-[calc(100vh-350px)] max-h-[calc(100vh-350px)] overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">No tasks</div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              workers={workers}
              onClick={() => onOpenTask(task)}
              isAssignMode={isAssignMode}
              isSelected={selectedTaskIds?.has(task.id) || false}
              onToggleSelection={onToggleSelection}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  workers,
  onClick,
  isAssignMode,
  isSelected,
  onToggleSelection
}: {
  task: TaskWithProject;
  workers: Worker[];
  onClick: () => void;
  isAssignMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (taskId: string) => void;
}) {
  const worker = workers.find(w => w.id === task.assignedTo);
  const phase = getTaskPhase(task.status);
  const phaseLabel = getPhaseLabel(phase);
  const phaseColor = getPhaseColor(phase);

  const colorClasses = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    purple: 'border-purple-500',
    orange: 'border-orange-500',
    red: 'border-red-500',
    yellow: 'border-yellow-500',
    gray: 'border-gray-500',
    cyan: 'border-cyan-500'
  };

  const backgroundColorClasses = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    purple: 'bg-purple-50',
    orange: 'bg-orange-50',
    red: 'bg-red-50',
    yellow: 'bg-yellow-50',
    gray: 'bg-gray-50',
    cyan: 'bg-cyan-50'
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

  const taskTypeColors: Record<string, string> = {
    hvac: 'bg-blue-100 text-blue-700',
    carpentry: 'bg-amber-100 text-amber-700',
    electrical: 'bg-yellow-100 text-yellow-700',
    plumbing: 'bg-cyan-100 text-cyan-700',
    roofing: 'bg-slate-100 text-slate-700',
    painting: 'bg-purple-100 text-purple-700',
    flooring: 'bg-orange-100 text-orange-700',
    other: 'bg-gray-100 text-gray-700',
  };

  const handleClick = () => {
    if (isAssignMode && onToggleSelection) {
      onToggleSelection(task.id);
    } else {
      onClick();
    }
  };

  const cardBgColor = isAssignMode && isSelected
    ? 'bg-purple-50'
    : backgroundColorClasses[task.projectColor] || 'bg-white';

  return (
    <div
      onClick={handleClick}
      className={`${cardBgColor} rounded-2xl p-5 shadow-sm border-2 transition-all duration-200 group relative ${
        isAssignMode
          ? isSelected
            ? 'border-purple-500 ring-4 ring-purple-100 cursor-pointer shadow-lg'
            : 'border-gray-200 hover:border-purple-300 cursor-pointer hover:shadow-md'
          : 'border-gray-200 hover:shadow-lg hover:border-blue-300 cursor-pointer hover:-translate-y-0.5'
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

        {/* Project Info + Profession & Phase - One Row */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(new CustomEvent('navigateToProject', { detail: { projectId: task.projectId } }));
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold border ${backgroundColorClasses[task.projectColor] || backgroundColorClasses.blue} ${textColorClasses[task.projectColor] || textColorClasses.blue} hover:opacity-80 transition-opacity`}
          >
            #{task.projectNumber}
          </button>
          {task.type && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${taskTypeColors[task.type]}`}>
              {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
            </span>
          )}
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${phaseColor}`}>
            {phaseLabel}
          </span>
        </div>
        <p className="text-sm text-gray-600">{task.projectClient}</p>
      </div>
      <div className="flex items-center justify-between text-sm mb-4 pb-4 border-b-2 border-gray-100">
        <span className="text-gray-500 font-medium">Qty: <span className="text-gray-900 font-bold">{task.quantity || 1}</span></span>
        <span className="text-xl font-black text-blue-600">${task.price}</span>
      </div>

      {worker ? (
        <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-md">
            {worker.name ? worker.name.split(' ').map(n => n[0]).join('').slice(0, 2) : '??'}
          </div>
          <div className="flex flex-col flex-1">
            <span className="text-sm text-gray-900 font-bold">{worker.name}</span>
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
                <AlertCircle className="w-3 h-3" />
                <span>Rejected</span>
              </div>
              {(() => {
                // Find the rejection activity to get worker name
                const rejectionActivity = task.activity?.find(a =>
                  a.action.includes('Rejected by') || a.action.includes('declined')
                );
                if (rejectionActivity) {
                  // Extract worker name from activity.user field
                  const workerName = rejectionActivity.user;
                  return (
                    <div className="text-xs text-gray-600 font-medium ml-1">
                      by {workerName}
                    </div>
                  );
                }
                return null;
              })()}
              {task.rejectionReason && (
                <div className="text-xs text-red-700 font-medium bg-red-50 p-2 rounded-lg border border-red-100 italic">
                  "{task.rejectionReason}"
                </div>
              )}
            </>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 w-fit">
              <AlertCircle className="w-3 h-3" />
              <span>Unassigned</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Cross-Project Bulk Assign Modal
function CrossProjectBulkAssignModal({ tasks, workers, onClose, onAssign }: {
  tasks: TaskWithProject[];
  workers: Worker[];
  onClose: () => void;
  onAssign: (assignments: { taskId: string; projectId: string; workerId: string; date: string; time: string; hours: number }[]) => void;
}) {
  const [isSimpleMode, setIsSimpleMode] = useState(true);
  const [expandedProjectId, setExpandedProjectId] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState('');
  const [taskForDetailView, setTaskForDetailView] = useState<TaskWithProject | null>(null);

  // Initialize task assignments
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

  // Group tasks by project
  const tasksByProject = tasks.reduce((acc, task) => {
    if (!acc[task.projectId]) {
      acc[task.projectId] = {
        projectNumber: task.projectNumber,
        projectClient: task.projectClient,
        projectColor: task.projectColor,
        tasks: []
      };
    }
    acc[task.projectId].tasks.push(task);
    return acc;
  }, {} as Record<string, { projectNumber: string; projectClient: string; projectColor: string; tasks: TaskWithProject[] }>);

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
      projectId: task.projectId,
      workerId: taskAssignments[task.id].workerId,
      date: taskAssignments[task.id].date,
      time: taskAssignments[task.id].time,
      hours: taskAssignments[task.id].hours
    }));

    const missingWorker = assignments.find(a => !a.workerId);
    if (missingWorker) {
      alert('Please assign a worker to all tasks');
      return;
    }

    onAssign(assignments);
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjectId(expandedProjectId === projectId ? '' : projectId);
    if (expandedProjectId !== projectId) {
      const firstTask = tasksByProject[projectId].tasks[0];
      setExpandedTaskId(firstTask?.id || '');
    }
  };

  const toggleTask = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? '' : taskId);
  };

  const projectCount = Object.keys(tasksByProject).length;
  const isSingleProject = projectCount === 1;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-xl shadow-2xl ${isSimpleMode ? 'max-w-md' : 'max-w-5xl'} w-full max-h-[90vh] flex flex-col overflow-hidden transition-all`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Batch Assign Tasks</h2>
              <p className="text-purple-100 text-sm mt-1">
                Assigning {tasks.length} task{tasks.length > 1 ? 's' : ''}{!isSingleProject && ` from ${projectCount} projects`}
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

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: Simple Mode */}
          <div className={`${isSimpleMode ? 'w-full' : 'w-96'} border-r border-gray-200 p-6 flex flex-col`}>
            <h3 className="font-semibold text-gray-900 mb-4">Assign to All Tasks</h3>
            
            <div className="space-y-4 flex-1">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Worker</label>
                <select
                  value={globalWorker}
                  onChange={(e) => setGlobalWorker(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Select worker...</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>{w.name} - {w.profession}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={globalDate}
                  onChange={(e) => setGlobalDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <button
                onClick={applyToAll}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Apply to All Tasks
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleSubmit}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Assign {tasks.length} Task{tasks.length > 1 ? 's' : ''}
              </button>
            </div>
          </div>

          {/* RIGHT SIDE: Advanced Mode - Task List (Only when Advanced) */}
          {!isSimpleMode && (
            <div className="flex-1 overflow-y-auto">
              <div className={isSingleProject ? 'divide-y divide-gray-200' : 'space-y-4 p-6'}>
                {Object.entries(tasksByProject).map(([projectId, projectData]) => {
                  const isProjectExpanded = expandedProjectId === projectId;
                  const colorClasses = {
                    blue: 'border-blue-500 bg-blue-50',
                    green: 'border-green-500 bg-green-50',
                    purple: 'border-purple-500 bg-purple-50',
                    orange: 'border-orange-500 bg-orange-50',
                    red: 'border-red-500 bg-red-50',
                    yellow: 'border-yellow-500 bg-yellow-50',
                    gray: 'border-gray-500 bg-gray-50',
                    cyan: 'border-cyan-500 bg-cyan-50'
                  };

                  // For single project: render tasks directly without project wrapper
                  if (isSingleProject) {
                    return projectData.tasks.map(task => {
                      const isTaskExpanded = expandedTaskId === task.id;
                      const assignment = taskAssignments[task.id];
                      const assignedWorker = workers.find(w => w.id === assignment.workerId);
                      const materialsCount = task.materials?.length || 0;

                      return (
                        <div key={task.id} className="bg-white hover:bg-gray-50 transition-colors">
                          {/* Task Header - Collapsed */}
                          <div
                            className="flex items-center justify-between px-6 py-4 cursor-pointer"
                            onClick={() => toggleTask(task.id)}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <button className="text-gray-400 hover:text-gray-600">
                                {isTaskExpanded ? (
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
                                  {materialsCount > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="text-gray-600">{materialsCount} materials required</span>
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
                                  setTaskForDetailView(task);
                                }}
                                className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium px-3 py-1.5 hover:bg-purple-50 rounded-lg transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                View Full
                              </button>
                            </div>
                          </div>

                          {/* Task Details - Expanded */}
                          {isTaskExpanded && (
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
                                        {worker.name} - {worker.skills?.join(', ') || 'No skills'}
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
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">Time</label>
                                  <input
                                    type="time"
                                    value={assignment.time}
                                    onChange={(e) => handleTaskUpdate(task.id, 'time', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                                  />
                                </div>

                                {/* Hours */}
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">Estimated Hours</label>
                                  <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    value={assignment.hours}
                                    onChange={(e) => handleTaskUpdate(task.id, 'hours', parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    });
                  }

                  const caretColorClasses = {
                    blue: 'text-blue-600',
                    green: 'text-green-600',
                    purple: 'text-purple-600',
                    orange: 'text-orange-600',
                    red: 'text-red-600',
                    yellow: 'text-yellow-600',
                    gray: 'text-gray-600',
                    cyan: 'text-cyan-600'
                  };

                  // For multiple projects: render with project headers
                  return (
                    <div key={projectId} className={`border-l-4 ${colorClasses[projectData.projectColor] || colorClasses.blue} rounded-lg overflow-hidden`}>
                      {/* Project Header */}
                      <div
                        onClick={() => toggleProject(projectId)}
                        className="p-4 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          {isProjectExpanded ? (
                            <ChevronDown className={`w-6 h-6 ${caretColorClasses[projectData.projectColor] || caretColorClasses.blue} font-bold flex-shrink-0`} strokeWidth={3} />
                          ) : (
                            <ChevronRight className={`w-6 h-6 ${caretColorClasses[projectData.projectColor] || caretColorClasses.blue} font-bold flex-shrink-0`} strokeWidth={3} />
                          )}
                          <div>
                            <div className="font-semibold text-gray-900">
                              Project #{projectData.projectNumber} - {projectData.projectClient}
                            </div>
                            <div className="text-sm text-gray-600">
                              {projectData.tasks.length} task{projectData.tasks.length > 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tasks in Project */}
                      {isProjectExpanded && (
                        <div className="border-t border-gray-200 bg-white">
                          {projectData.tasks.map(task => {
                            const isTaskExpanded = expandedTaskId === task.id;
                            const assignment = taskAssignments[task.id];
                            const assignedWorker = workers.find(w => w.id === assignment.workerId);
                            const materialsCount = task.materials?.length || 0;

                            return (
                              <div key={task.id} className="bg-white hover:bg-gray-50 transition-colors">
                                {/* Task Header - Collapsed */}
                                <div
                                  className="flex items-center justify-between px-6 py-4 cursor-pointer border-b border-gray-100 last:border-b-0"
                                  onClick={() => toggleTask(task.id)}
                                >
                                  <div className="flex items-center gap-3 flex-1">
                                    <button className="text-gray-400 hover:text-gray-600">
                                      {isTaskExpanded ? (
                                        <ChevronDown className="w-5 h-5" />
                                      ) : (
                                        <ChevronRight className="w-5 h-5" />
                                      )}
                                    </button>
                                    <div className="flex-1">
                                      <div className="font-semibold text-gray-900">{task.description}</div>
                                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                        <span className="flex items-center gap-1">
                                          <span>$</span>
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
                                        {materialsCount > 0 && (
                                          <>
                                            <span>•</span>
                                            <span className="text-gray-600">{materialsCount} materials required</span>
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
                                        setTaskForDetailView(task);
                                      }}
                                      className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium px-3 py-1.5 hover:bg-purple-50 rounded-lg transition-colors"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      View Full
                                    </button>
                                  </div>
                                </div>

                                {/* Task Details - Expanded */}
                                {isTaskExpanded && (
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
                                              {worker.name} - {worker.skills?.join(', ') || 'No skills'}
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
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Time</label>
                                        <input
                                          type="time"
                                          value={assignment.time}
                                          onChange={(e) => handleTaskUpdate(task.id, 'time', e.target.value)}
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                                        />
                                      </div>

                                      {/* Hours */}
                                      <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Estimated Hours</label>
                                        <input
                                          type="number"
                                          step="0.5"
                                          min="0"
                                          value={assignment.hours}
                                          onChange={(e) => handleTaskUpdate(task.id, 'hours', parseFloat(e.target.value))}
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Modal */}
      {taskForDetailView && (
        <UnifiedTaskModal
          task={taskForDetailView}
          projectId={taskForDetailView.projectId}
          projectNumber={taskForDetailView.projectNumber}
          projectClient={taskForDetailView.projectClient}
          workers={workers}
          onClose={() => setTaskForDetailView(null)}
          onUpdate={() => {
            setTaskForDetailView(null);
            // Note: We don't reload data here to preserve bulk assign state
            // The parent component will reload when bulk assign is complete
          }}
        />
      )}
    </div>
  );
}

// Filter Chip Component
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-blue-200">
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="hover:bg-blue-200 rounded-full p-0.5 transition-all"
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
        className={`w-full px-4 py-2.5 border rounded-xl text-left flex items-center justify-between transition-all shadow-sm ${
          selected.length > 0
            ? 'border-blue-300 bg-blue-50 text-blue-700 font-semibold'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300'
        }`}
      >
        <span className="text-sm">
          {label}: {selected.length > 0 ? `${selected.length} selected` : 'All'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
          {options.map(option => (
            <label
              key={option.value}
              className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => onToggle(option.value)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 font-medium">{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
