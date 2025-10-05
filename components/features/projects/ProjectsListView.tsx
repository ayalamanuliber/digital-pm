'use client';

import React, { useState } from 'react';
import {
  Search, Filter, Plus, TrendingUp, CheckCircle, Clock,
  DollarSign, Calendar, MapPin, Users, ChevronRight,
  MoreVertical, AlertTriangle
} from 'lucide-react';
import type { Project } from '@/types';
import Breadcrumb, { BreadcrumbPath } from './Breadcrumb';

interface ProjectsListViewProps {
  onNavigate: (path: Partial<BreadcrumbPath>) => void;
}

export default function ProjectsListView({ onNavigate }: ProjectsListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'on_hold'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'value' | 'completion'>('date');

  // Mock data - in production this comes from API
  const projects: Project[] = [
    {
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
    },
    {
      id: 'p2',
      number: '2027',
      client: 'Johnson Residence',
      address: '456 Maple Ave, Denver CO',
      totalTasks: 8,
      completedTasks: 2,
      budget: 32000,
      spent: 8000,
      startDate: '2025-10-07',
      estimatedCompletion: '2025-10-12',
      priority: 'medium',
      status: 'active'
    },
    {
      id: 'p3',
      number: '2011',
      client: 'Jack Shippee',
      address: '2690 Stuart St, Denver CO 80212',
      totalTasks: 12,
      completedTasks: 2,
      budget: 3953,
      spent: 475,
      startDate: '2025-09-04',
      estimatedCompletion: '2025-10-20',
      priority: 'medium',
      status: 'active'
    }
  ];

  const getCompletionPercentage = (project: Project) => {
    return Math.round((project.completedTasks / project.totalTasks) * 100);
  };

  const getBudgetPercentage = (project: Project) => {
    return Math.round((project.spent / project.budget) * 100);
  };

  const handleProjectClick = (project: Project) => {
    onNavigate({
      view: 'projects',
      project: {
        id: project.id,
        name: project.client,
        number: project.number
      }
    });
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.number.includes(searchQuery);
    const matchesFilter = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        path={{ view: 'projects' }}
        onNavigate={onNavigate}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Projects</h1>
          <p className="text-sm text-gray-600 mt-1">Manage all active and completed projects</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all">
          <Plus size={20} />
          New Project
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-gray-900">{projects.filter(p => p.status === 'active').length}</div>
              <div className="text-xs text-gray-500">of {projects.length}</div>
            </div>
          </div>
          <div className="text-xs font-medium text-gray-600">Active Projects</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-gray-900">
                {projects.reduce((sum, p) => sum + p.completedTasks, 0)}
              </div>
              <div className="text-xs text-gray-500">total tasks</div>
            </div>
          </div>
          <div className="text-xs font-medium text-gray-600">Tasks Completed</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-gray-900">
                ${(projects.reduce((sum, p) => sum + p.budget, 0) / 1000).toFixed(0)}K
              </div>
              <div className="text-xs text-gray-500">total value</div>
            </div>
          </div>
          <div className="text-xs font-medium text-gray-600">Total Budget</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-gray-900">
                {projects.reduce((sum, p) => sum + (p.totalTasks - p.completedTasks), 0)}
              </div>
              <div className="text-xs text-gray-500">pending</div>
            </div>
          </div>
          <div className="text-xs font-medium text-gray-600">Tasks Remaining</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by client name or project number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-4 py-3 border border-gray-300 rounded-xl font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On Hold</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-3 border border-gray-300 rounded-xl font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="date">Sort by Date</option>
          <option value="value">Sort by Value</option>
          <option value="completion">Sort by Progress</option>
        </select>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredProjects.map((project) => {
          const completionPercent = getCompletionPercentage(project);
          const budgetPercent = getBudgetPercentage(project);
          const pendingTasks = project.totalTasks - project.completedTasks;

          return (
            <div
              key={project.id}
              onClick={() => handleProjectClick(project)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
            >
              {/* Header */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm font-bold text-gray-500 mb-1">#{project.number}</div>
                    <h3 className="text-xl font-black text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {project.client}
                    </h3>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <MapPin size={14} />
                      <span>{project.address}</span>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical size={20} />
                  </button>
                </div>

                {/* Priority Badge */}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    project.priority === 'high' ? 'bg-red-100 text-red-800' :
                    project.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {project.priority === 'high' && <AlertTriangle size={12} className="mr-1" />}
                    {project.priority.toUpperCase()}
                  </span>
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {project.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="p-5">
                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-600">Task Progress</span>
                    <span className="text-xs font-black text-gray-900">
                      {project.completedTasks}/{project.totalTasks} ({completionPercent}%)
                    </span>
                  </div>
                  <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                </div>

                {/* Budget */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-600">Budget</span>
                    <span className="text-xs font-black text-gray-900">
                      ${project.spent.toLocaleString()} / ${project.budget.toLocaleString()}
                    </span>
                  </div>
                  <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full ${
                        budgetPercent > 90 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                        budgetPercent > 75 ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                        'bg-gradient-to-r from-blue-500 to-blue-600'
                      }`}
                      style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <div className="text-gray-500 font-bold mb-0.5">Started</div>
                    <div className="font-black text-gray-900">
                      {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-500 font-bold mb-0.5">Est. Complete</div>
                    <div className="font-black text-gray-900">
                      {new Date(project.estimatedCompletion).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <CheckCircle size={14} className="text-green-600" />
                    <span className="font-bold">{project.completedTasks}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock size={14} className="text-amber-600" />
                    <span className="font-bold">{pendingTasks}</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-xl font-black text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold">
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
