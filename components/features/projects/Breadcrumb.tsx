'use client';

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbPath {
  view: 'dashboard' | 'projects' | 'workers' | 'calendar' | 'task';
  project?: {
    id: string;
    name: string;
    number: string;
  };
  worker?: {
    id: string;
    name: string;
  };
  task?: {
    id: string;
    name: string;
  };
}

interface BreadcrumbProps {
  path: BreadcrumbPath;
  onNavigate: (newPath: Partial<BreadcrumbPath>) => void;
}

export default function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
  return (
    <div className="flex items-center gap-2 text-sm mb-6">
      {/* Dashboard */}
      <button
        onClick={() => onNavigate({ view: 'dashboard' })}
        className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors font-medium text-gray-600 hover:text-gray-900"
      >
        <Home size={14} />
        <span>Dashboard</span>
      </button>

      {/* View Level (Projects/Workers/Calendar) */}
      {path.view !== 'dashboard' && (
        <>
          <ChevronRight size={14} className="text-gray-400" />
          <button
            onClick={() => onNavigate({ view: path.view, project: undefined, worker: undefined, task: undefined })}
            className={`px-3 py-1.5 rounded-lg transition-colors font-bold ${
              !path.project && !path.worker && !path.task
                ? 'bg-blue-500 text-white'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {path.view.charAt(0).toUpperCase() + path.view.slice(1)}
          </button>
        </>
      )}

      {/* Project Level */}
      {path.project && (
        <>
          <ChevronRight size={14} className="text-gray-400" />
          <button
            onClick={() => onNavigate({ view: path.view, project: path.project, worker: undefined, task: undefined })}
            className={`px-3 py-1.5 rounded-lg transition-colors font-bold ${
              !path.worker && !path.task
                ? 'bg-blue-500 text-white'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            #{path.project.number} {path.project.name}
          </button>
        </>
      )}

      {/* Worker Level */}
      {path.worker && (
        <>
          <ChevronRight size={14} className="text-gray-400" />
          <button
            onClick={() => onNavigate({ ...path, task: undefined })}
            className={`px-3 py-1.5 rounded-lg transition-colors font-bold ${
              !path.task
                ? 'bg-blue-500 text-white'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {path.worker.name}
          </button>
        </>
      )}

      {/* Task Level */}
      {path.task && (
        <>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="px-3 py-1.5 rounded-lg bg-blue-500 text-white font-black">
            {path.task.name}
          </span>
        </>
      )}
    </div>
  );
}
