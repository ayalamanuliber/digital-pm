'use client';

import React, { useState } from 'react';
import {
  Calendar, Clock, DollarSign, Users, MapPin, CheckCircle,
  AlertTriangle, MoreVertical, Plus, Filter, Search,
  ChevronDown, FileText, Package, Wrench, Image as ImageIcon,
  TrendingUp, Edit, Trash2, Copy, Play, Pause, Archive
} from 'lucide-react';
import type { Project, Task } from '@/types';
import Breadcrumb, { BreadcrumbPath } from './Breadcrumb';

interface ProjectDetailViewProps {
  project: Project;
  onNavigate: (path: Partial<BreadcrumbPath>) => void;
  onTaskClick?: (task: Task) => void;
}

export default function ProjectDetailView({ project, onNavigate, onTaskClick }: ProjectDetailViewProps) {
  const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'materials' | 'budget' | 'documents'>('list');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'in_progress' | 'scheduled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock tasks - in production comes from API
  const tasks: Task[] = [
    {
      id: 't1',
      projectId: project.id,
      title: 'Install Kitchen Cabinets',
      description: 'Upper and lower cabinets installation',
      status: 'completed',
      priority: 'high',
      assignedTo: ['w1', 'w2'],
      estimatedHours: 8,
      actualHours: 7.5,
      scheduledDate: '2025-10-08',
      completedDate: '2025-10-08',
      photosRequired: 3,
      photosUploaded: 3,
      materials: ['Cabinets', 'Screws', 'Level'],
      steps: [
        { id: 's1', description: 'Remove old cabinets', completed: true, photosRequired: 1, photosUploaded: 1 },
        { id: 's2', description: 'Install upper cabinets', completed: true, photosRequired: 1, photosUploaded: 1 },
        { id: 's3', description: 'Install lower cabinets', completed: true, photosRequired: 1, photosUploaded: 1 }
      ]
    },
    {
      id: 't2',
      projectId: project.id,
      title: 'Countertop Installation',
      description: 'Granite countertop measurement and installation',
      status: 'in_progress',
      priority: 'high',
      assignedTo: ['w3'],
      estimatedHours: 6,
      actualHours: 3,
      scheduledDate: '2025-10-09',
      photosRequired: 2,
      photosUploaded: 1,
      materials: ['Granite slab', 'Adhesive', 'Sealant'],
      steps: [
        { id: 's1', description: 'Measure and template', completed: true, photosRequired: 1, photosUploaded: 1 },
        { id: 's2', description: 'Cut granite to size', completed: false, photosRequired: 1, photosUploaded: 0 },
        { id: 's3', description: 'Install and seal', completed: false, photosRequired: 0, photosUploaded: 0 }
      ]
    },
    {
      id: 't3',
      projectId: project.id,
      title: 'Backsplash Tile Work',
      description: 'Install subway tile backsplash',
      status: 'scheduled',
      priority: 'medium',
      assignedTo: ['w2'],
      estimatedHours: 5,
      scheduledDate: '2025-10-10',
      photosRequired: 2,
      photosUploaded: 0,
      materials: ['Subway tiles', 'Grout', 'Thin-set'],
      steps: [
        { id: 's1', description: 'Prep wall surface', completed: false, photosRequired: 1, photosUploaded: 0 },
        { id: 's2', description: 'Install tiles', completed: false, photosRequired: 1, photosUploaded: 0 },
        { id: 's3', description: 'Grout and seal', completed: false, photosRequired: 0, photosUploaded: 0 }
      ]
    },
    {
      id: 't4',
      projectId: project.id,
      title: 'Plumbing Fixture Installation',
      description: 'Install sink and faucet',
      status: 'scheduled',
      priority: 'medium',
      assignedTo: ['w1'],
      estimatedHours: 3,
      scheduledDate: '2025-10-11',
      photosRequired: 2,
      photosUploaded: 0,
      materials: ['Sink', 'Faucet', 'Plumbing supplies'],
      steps: [
        { id: 's1', description: 'Install sink', completed: false, photosRequired: 1, photosUploaded: 0 },
        { id: 's2', description: 'Connect plumbing', completed: false, photosRequired: 1, photosUploaded: 0 }
      ]
    }
  ];

  // Mock crew members
  const crewMembers = [
    { id: 'w1', name: 'Carlos Rodriguez', role: 'Lead Installer', avatar: '👷' },
    { id: 'w2', name: 'Mike Johnson', role: 'Tile Specialist', avatar: '🔨' },
    { id: 'w3', name: 'David Chen', role: 'Carpenter', avatar: '🪚' }
  ];

  const getCompletionPercentage = () => {
    return Math.round((project.completedTasks / project.totalTasks) * 100);
  };

  const getBudgetPercentage = () => {
    return Math.round((project.spent / project.budget) * 100);
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-amber-600';
      case 'low':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || task.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const groupedTasks = {
    completed: filteredTasks.filter(t => t.status === 'completed'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    scheduled: filteredTasks.filter(t => t.status === 'scheduled')
  };

  const totalEstimatedHours = tasks.reduce((sum, task) => sum + task.estimatedHours, 0);
  const totalActualHours = tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        path={{
          view: 'projects',
          project: {
            id: project.id,
            name: project.client,
            number: project.number
          }
        }}
        onNavigate={onNavigate}
      />

      {/* Project Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-black text-gray-900">{project.client}</h1>
              <span className="text-xl font-bold text-gray-400">#{project.number}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 mb-4">
              <MapPin size={16} />
              <span className="font-medium">{project.address}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${
                project.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                project.priority === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-gray-50 text-gray-700 border-gray-200'
              }`}>
                {project.priority === 'high' && <AlertTriangle size={12} className="mr-1.5" />}
                {project.priority.toUpperCase()} PRIORITY
              </span>
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                {project.status.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Edit size={20} className="text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Copy size={20} className="text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Archive size={20} className="text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200">
            <div className="text-xs font-bold text-blue-600 mb-1">TOTAL TASKS</div>
            <div className="text-2xl font-black text-blue-900">{project.totalTasks}</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200">
            <div className="text-xs font-bold text-green-600 mb-1">COMPLETED</div>
            <div className="text-2xl font-black text-green-900">{project.completedTasks}</div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-200">
            <div className="text-xs font-bold text-amber-600 mb-1">IN PROGRESS</div>
            <div className="text-2xl font-black text-amber-900">{groupedTasks.in_progress.length}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200">
            <div className="text-xs font-bold text-purple-600 mb-1">SCHEDULED</div>
            <div className="text-2xl font-black text-purple-900">{groupedTasks.scheduled.length}</div>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-200">
            <div className="text-xs font-bold text-gray-600 mb-1">EST. TIME</div>
            <div className="text-2xl font-black text-gray-900">{totalEstimatedHours}h</div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="grid grid-cols-2 gap-6 mt-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-600">Task Progress</span>
              <span className="text-sm font-black text-gray-900">
                {project.completedTasks}/{project.totalTasks} ({getCompletionPercentage()}%)
              </span>
            </div>
            <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all"
                style={{ width: `${getCompletionPercentage()}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-600">Budget</span>
              <span className="text-sm font-black text-gray-900">
                ${project.spent.toLocaleString()} / ${project.budget.toLocaleString()} ({getBudgetPercentage()}%)
              </span>
            </div>
            <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                  getBudgetPercentage() > 90 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                  getBudgetPercentage() > 75 ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                  'bg-gradient-to-r from-blue-500 to-blue-600'
                }`}
                style={{ width: `${Math.min(getBudgetPercentage(), 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-500" />
            <span className="text-sm font-bold text-gray-600">Started:</span>
            <span className="text-sm font-black text-gray-900">
              {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-500" />
            <span className="text-sm font-bold text-gray-600">Est. Completion:</span>
            <span className="text-sm font-black text-gray-900">
              {new Date(project.estimatedCompletion).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-500" />
            <span className="text-sm font-bold text-gray-600">Crew:</span>
            <div className="flex items-center -space-x-2">
              {crewMembers.map(member => (
                <div
                  key={member.id}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white border-2 border-white font-bold text-sm"
                  title={member.name}
                >
                  {member.avatar}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar - Stats + Search + Filters (Only in List View) */}
      {viewMode === 'list' && (
        <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
          {/* Stats Badges */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200">
              <FileText className="w-4 h-4 text-slate-600" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Total</span>
                <span className="text-sm font-bold text-gray-900">{project.totalTasks}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Done</span>
                <span className="text-sm font-bold text-green-900">{project.completedTasks}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-lg border border-blue-200">
              <Play className="w-4 h-4 text-blue-600" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Active</span>
                <span className="text-sm font-bold text-blue-900">{groupedTasks.in_progress.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-lg border border-amber-200">
              <Calendar className="w-4 h-4 text-amber-600" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Scheduled</span>
                <span className="text-sm font-bold text-amber-900">{groupedTasks.scheduled.length}</span>
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

          {/* Filter Dropdown */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="pl-3 pr-8 py-1.5 border-0 bg-transparent focus:outline-none text-sm font-medium text-gray-700 cursor-pointer appearance-none"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="scheduled">Scheduled</option>
            </select>
            <ChevronDown className="absolute right-1 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <div className="h-6 w-px bg-gray-200"></div>

          {/* Add Task Button */}
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-sm transition-all text-sm">
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      )}

      {/* View Mode Tabs (Only shown when NOT in list view) */}
      {viewMode !== 'list' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setViewMode('list')}
              className="px-4 py-2 rounded-lg font-bold text-sm transition-all text-gray-600 hover:bg-gray-100"
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                viewMode === 'timeline'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode('materials')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                viewMode === 'materials'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Materials
            </button>
            <button
              onClick={() => setViewMode('budget')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                viewMode === 'budget'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Budget
            </button>
            <button
              onClick={() => setViewMode('documents')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                viewMode === 'documents'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Documents
            </button>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all">
            <Plus size={20} />
            Add Task
          </button>
        </div>
      )}

      {/* Tasks List - Only shown in list view */}
      {viewMode === 'list' && (
        <>

          {/* Tasks List */}
          <div className="space-y-6">
            {/* Completed Tasks */}
            {groupedTasks.completed.length > 0 && (
              <div>
                <h3 className="text-sm font-black text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  Completed ({groupedTasks.completed.length})
                </h3>
                <div className="space-y-2">
                  {groupedTasks.completed.map(task => (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick?.(task)}
                      className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                              {task.title}
                            </h4>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(task.status)}`}>
                              {task.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <AlertTriangle size={14} className={getPriorityColor(task.priority)} />
                          </div>
                          <p className="text-sm text-gray-600 font-medium mb-3">{task.description}</p>
                          <div className="flex items-center gap-6 text-xs flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <Users size={14} className="text-gray-400" />
                              <span className="font-bold text-gray-700">
                                {task.assignedTo.map(id => crewMembers.find(m => m.id === id)?.name.split(' ')[0]).join(', ')}
                              </span>
                            </div>
                            {/* Status Badge */}
                            {task.status === 'accepted' || task.status === 'confirmed' ? (
                              <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-300">
                                ✓ Confirmed
                              </span>
                            ) : task.status === 'rejected' ? (
                              <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
                                ✗ Rejected
                              </span>
                            ) : task.status === 'pending_acceptance' ? (
                              <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-300">
                                ⏳ Waiting
                              </span>
                            ) : null}
                            <div className="flex items-center gap-1.5">
                              <Clock size={14} className="text-gray-400" />
                              <span className="font-bold text-gray-700">{task.actualHours || task.estimatedHours}h</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <ImageIcon size={14} className="text-gray-400" />
                              <span className="font-bold text-gray-700">{task.photosUploaded}/{task.photosRequired}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar size={14} className="text-gray-400" />
                              <span className="font-bold text-gray-700">
                                {new Date(task.completedDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <CheckCircle size={24} className="text-green-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* In Progress Tasks */}
            {groupedTasks.in_progress.length > 0 && (
              <div>
                <h3 className="text-sm font-black text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Play size={16} className="text-blue-600" />
                  In Progress ({groupedTasks.in_progress.length})
                </h3>
                <div className="space-y-2">
                  {groupedTasks.in_progress.map(task => {
                    const completedSteps = task.steps?.filter(s => s.completed).length || 0;
                    const totalSteps = task.steps?.length || 0;
                    const stepProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

                    return (
                      <div
                        key={task.id}
                        onClick={() => onTaskClick?.(task)}
                        className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                                {task.title}
                              </h4>
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(task.status)}`}>
                                {task.status.replace('_', ' ').toUpperCase()}
                              </span>
                              <AlertTriangle size={14} className={getPriorityColor(task.priority)} />
                            </div>
                            <p className="text-sm text-gray-600 font-medium mb-3">{task.description}</p>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-gray-600">Progress</span>
                              <span className="text-xs font-black text-gray-900">{completedSteps}/{totalSteps} steps ({stepProgress}%)</span>
                            </div>
                            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                              <div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                                style={{ width: `${stepProgress}%` }}
                              />
                            </div>
                            <div className="flex items-center gap-6 text-xs">
                              <div className="flex items-center gap-1.5">
                                <Users size={14} className="text-gray-400" />
                                <span className="font-bold text-gray-700">
                                  {task.assignedTo.map(id => crewMembers.find(m => m.id === id)?.name.split(' ')[0]).join(', ')}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock size={14} className="text-gray-400" />
                                <span className="font-bold text-gray-700">{task.actualHours || 0}h / {task.estimatedHours}h</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <ImageIcon size={14} className="text-gray-400" />
                                <span className="font-bold text-gray-700">{task.photosUploaded}/{task.photosRequired}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar size={14} className="text-gray-400" />
                                <span className="font-bold text-gray-700">
                                  {new Date(task.scheduledDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Scheduled Tasks */}
            {groupedTasks.scheduled.length > 0 && (
              <div>
                <h3 className="text-sm font-black text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Calendar size={16} className="text-amber-600" />
                  Scheduled ({groupedTasks.scheduled.length})
                </h3>
                <div className="space-y-2">
                  {groupedTasks.scheduled.map(task => (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick?.(task)}
                      className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                              {task.title}
                            </h4>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(task.status)}`}>
                              {task.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <AlertTriangle size={14} className={getPriorityColor(task.priority)} />
                          </div>
                          <p className="text-sm text-gray-600 font-medium mb-3">{task.description}</p>
                          <div className="flex items-center gap-6 text-xs flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <Users size={14} className="text-gray-400" />
                              <span className="font-bold text-gray-700">
                                {task.assignedTo.map(id => crewMembers.find(m => m.id === id)?.name.split(' ')[0]).join(', ')}
                              </span>
                            </div>
                            {/* Status Badge */}
                            {task.status === 'accepted' || task.status === 'confirmed' ? (
                              <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-300">
                                ✓ Confirmed
                              </span>
                            ) : task.status === 'rejected' ? (
                              <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
                                ✗ Rejected
                              </span>
                            ) : task.status === 'pending_acceptance' ? (
                              <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-300">
                                ⏳ Waiting
                              </span>
                            ) : null}
                            <div className="flex items-center gap-1.5">
                              <Clock size={14} className="text-gray-400" />
                              <span className="font-bold text-gray-700">{task.estimatedHours}h</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Package size={14} className="text-gray-400" />
                              <span className="font-bold text-gray-700">{task.materials?.length || 0} items</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar size={14} className="text-gray-400" />
                              <span className="font-bold text-gray-700">
                                {new Date(task.scheduledDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Clock size={24} className="text-amber-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {filteredTasks.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-black text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      )}

      {/* Other view modes placeholder */}
      {viewMode !== 'list' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">🚧</div>
          <h3 className="text-xl font-black text-gray-900 mb-2">
            {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View
          </h3>
          <p className="text-gray-600">Coming soon...</p>
        </div>
      )}
    </div>
  );
}
