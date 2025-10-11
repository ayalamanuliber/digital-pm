'use client';

import React, { useState, useEffect } from 'react';
import { Home, FolderOpen, Users, Calendar, Package, ChevronDown, ChevronRight, ListTodo, Plus, UserCheck } from 'lucide-react';
import { storage } from '@/lib/localStorage';

interface SidebarProps {
  currentModule: 'dashboard' | 'projects' | 'tasks' | 'workers' | 'calendar' | 'materials' | 'worker-view';
  onNavigate: (module: 'dashboard' | 'projects' | 'tasks' | 'workers' | 'calendar' | 'materials' | 'worker-view', projectId?: string) => void;
}

export default function Sidebar({ currentModule, onNavigate }: SidebarProps) {
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const loadedProjects = storage.getProjects();
    setProjects(loadedProjects);
  }, []);

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'projects', icon: FolderOpen, label: 'Projects' },
    { id: 'tasks', icon: ListTodo, label: 'Tasks' },
    { id: 'workers', icon: Users, label: 'Workers' },
    { id: 'worker-view', icon: UserCheck, label: 'Worker View' },
    { id: 'calendar', icon: Calendar, label: 'Calendar' },
    { id: 'materials', icon: Package, label: 'Materials' },
  ] as const;

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Digital PM</h1>
        <p className="text-xs text-gray-500 mt-1">Construction Management</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentModule === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">v1.0.0</p>
      </div>
    </div>
  );
}
