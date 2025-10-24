'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Phone, Clock, AlertCircle, CheckCircle, Users, Briefcase, Filter, Star } from 'lucide-react';
import { storage } from '@/lib/localStorage';
import UnifiedTaskModal from '@/components/features/tasks/UnifiedTaskModal';

interface Worker {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: 'active' | 'inactive';
}

interface Project {
  id: string;
  number: string;
  clientName: string;
  clientAddress: string;
  clientPhone?: string;
  total: number;
  status: 'active' | 'completed' | 'on-hold';
  color?: string;
  tasks: Task[];
}

interface Task {
  id: string;
  description: string;
  price: number;
  quantity: number;
  amount: number;
  type?: string;
  estimatedHours?: number;
  status: string;
  assignedTo?: string;
  scheduledDate?: string;
  projectId?: string;
}

interface CalendarTask extends Task {
  projectId: string;
  projectNumber: string;
  projectColor: string;
  workerName: string;
  clientName: string;
  clientAddress: string;
  day: number;
}

export default function CalendarView() {
  const [view, setView] = useState<'crew' | 'project'>('crew');
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);
  const [filterProject, setFilterProject] = useState('all');
  const [filterWorker, setFilterWorker] = useState('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  function getMonday(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('projectsUpdated', handleUpdate);
    window.addEventListener('workersUpdated', handleUpdate);

    return () => {
      window.removeEventListener('projectsUpdated', handleUpdate);
      window.removeEventListener('workersUpdated', handleUpdate);
    };
  }, []);

  const loadData = () => {
    try {
      const projectsData = storage.getProjects();
      const workersData = storage.getWorkers();
      setProjects(projectsData);
      setWorkers(workersData);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDays = (startDate: Date) => {
    const days = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const weekDays = getWeekDays(currentWeekStart);
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

  const nextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const prevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  // Build calendar tasks from projects
  const buildCalendarTasks = (): CalendarTask[] => {
    const calendarTasks: CalendarTask[] = [];

    projects.forEach(project => {
      project.tasks.forEach(task => {
        // Include ALL tasks that have a worker assigned (with or without date)
        if (!task.assignedTo) return;

        const worker = workers.find(w => w.id === task.assignedTo);

        let dayDiff = -1; // -1 means unscheduled

        if (task.scheduledDate) {
          const taskDate = new Date(task.scheduledDate);
          dayDiff = Math.floor((taskDate.getTime() - currentWeekStart.getTime()) / (1000 * 60 * 60 * 24));
        }

        // Include tasks in current week OR unscheduled tasks
        if (dayDiff === -1 || (dayDiff >= 0 && dayDiff < 5)) {
          calendarTasks.push({
            ...task,
            projectId: project.id,
            projectNumber: project.number,
            projectColor: project.color || 'blue',
            workerName: worker?.name || 'Unassigned',
            clientName: project.clientName,
            clientAddress: project.clientAddress,
            day: dayDiff
          });
        }
      });
    });

    return calendarTasks;
  };

  const allTasks = buildCalendarTasks();

  // Debug logging
  React.useEffect(() => {
    console.log('📅 CALENDAR DEBUG:');
    console.log('  Current week start:', currentWeekStart.toDateString());
    console.log('  Total projects:', projects.length);
    console.log('  Total workers:', workers.length);
    console.log('  Tasks with scheduledDate:', projects.flatMap(p => p.tasks.filter(t => t.scheduledDate)).length);
    console.log('  Tasks in calendar view:', allTasks.length);

    if (allTasks.length > 0) {
      console.log('  Sample tasks:', allTasks.slice(0, 3).map(t => ({
        project: t.projectNumber,
        description: t.description.substring(0, 40),
        date: t.scheduledDate,
        worker: t.workerName,
        day: t.day
      })));
    }
  }, [allTasks, currentWeekStart, projects.length]);

  // Filter tasks
  const getFilteredTasks = () => {
    let filtered = allTasks;

    if (filterProject !== 'all') {
      filtered = filtered.filter(t => t.projectId === filterProject);
    }

    if (filterWorker !== 'all') {
      filtered = filtered.filter(t => t.assignedTo === filterWorker);
    }

    return filtered;
  };

  const filteredTasks = getFilteredTasks();

  // Get tasks for specific worker and day
  const getWorkerDayTasks = (workerId: string, dayIdx: number) => {
    return filteredTasks.filter(t => t.assignedTo === workerId && t.day === dayIdx);
  };

  // Get tasks for specific project and day
  const getProjectDayTasks = (projectId: string, dayIdx: number) => {
    return filteredTasks.filter(t => t.projectId === projectId && t.day === dayIdx);
  };

  // Get unscheduled tasks for worker
  const getWorkerUnscheduledTasks = (workerId: string) => {
    return filteredTasks.filter(t => t.assignedTo === workerId && t.day === -1);
  };

  // Get unscheduled tasks for project
  const getProjectUnscheduledTasks = (projectId: string) => {
    return filteredTasks.filter(t => t.projectId === projectId && t.day === -1);
  };

  // Schedule a task to a specific day
  const scheduleTask = (taskId: string, projectId: string, dayIdx: number) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const taskIndex = project.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    // Calculate the date for this day
    const scheduleDate = new Date(currentWeekStart);
    scheduleDate.setDate(scheduleDate.getDate() + dayIdx);

    const updatedTask = {
      ...project.tasks[taskIndex],
      scheduledDate: scheduleDate.toISOString().split('T')[0]
    };

    storage.updateTask(projectId, taskId, updatedTask);
    loadData(); // Reload to reflect changes
  };

  const getTaskColor = (projectColor: string, status: string) => {
    if (status === 'completed') return 'bg-gray-100 border-gray-400 text-gray-600';

    const colors: Record<string, string> = {
      'blue': 'bg-blue-50 border-blue-400 text-blue-900',
      'green': 'bg-green-50 border-green-400 text-green-900',
      'purple': 'bg-purple-50 border-purple-400 text-purple-900',
      'orange': 'bg-orange-50 border-orange-400 text-orange-900',
      'red': 'bg-red-50 border-red-400 text-red-900',
      'yellow': 'bg-yellow-50 border-yellow-400 text-yellow-900',
      'cyan': 'bg-cyan-50 border-cyan-400 text-cyan-900',
      'gray': 'bg-gray-50 border-gray-400 text-gray-900'
    };
    return colors[projectColor] || colors.blue;
  };

  const getWorkerColor = (workerId: string) => {
    const colors = ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-orange-600', 'bg-red-600', 'bg-cyan-600'];
    const index = workers.findIndex(w => w.id === workerId);
    return colors[index % colors.length];
  };

  const getWorkerInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Calendar View</h1>
              <p className="text-sm text-gray-600">Comprehensive crew scheduling and project timeline management</p>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setView('crew')}
                className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
                  view === 'crew'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-4 h-4" />
                Crew View
              </button>
              <button
                onClick={() => setView('project')}
                className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
                  view === 'project'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Project View
              </button>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between">
            {/* Week Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={prevWeek}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="px-4 py-2 bg-gray-100 rounded-lg font-semibold text-gray-900 min-w-[240px] text-center">
                {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDays[4].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <button
                onClick={nextWeek}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-gray-500" />

              {view === 'crew' && (
                <select
                  value={filterWorker}
                  onChange={(e) => setFilterWorker(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Workers</option>
                  {workers.map(worker => (
                    <option key={worker.id} value={worker.id}>{worker.name}</option>
                  ))}
                </select>
              )}

              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>#{project.number} - {project.clientName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto p-6">
        {/* CREW VIEW */}
        {view === 'crew' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
              <div className="p-4 font-semibold text-gray-700 border-r border-gray-200">CREW MEMBER</div>
              <div className="p-4 text-center border-r border-gray-200">
                <div className="font-bold text-amber-700">UNSCHEDULED</div>
                <div className="text-xs text-amber-600">Needs Date</div>
              </div>
              {weekDays.map((day, idx) => (
                <div key={idx} className="p-4 text-center border-r border-gray-200 last:border-r-0">
                  <div className="font-bold text-gray-900">{dayNames[idx]}</div>
                  <div className="text-sm text-gray-600">{day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                </div>
              ))}
            </div>

            {/* Worker Rows */}
            {workers.map(worker => {
              if (filterWorker !== 'all' && filterWorker !== worker.id) return null;

              const workerTasksThisWeek = filteredTasks.filter(t => t.assignedTo === worker.id).length;

              const unscheduledTasks = getWorkerUnscheduledTasks(worker.id);

              return (
                <div key={worker.id} className="grid grid-cols-7 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                  {/* Worker Info */}
                  <div className="p-4 bg-white border-r border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 ${getWorkerColor(worker.id)} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                        {getWorkerInitials(worker.name)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{worker.name}</div>
                        <div className="text-xs text-gray-500">{worker.role}</div>
                      </div>
                    </div>
                    {worker.phone && (
                      <div className="flex items-center gap-2 text-gray-600 text-xs mb-2">
                        <Phone className="w-3 h-3" />
                        <span>{worker.phone}</span>
                      </div>
                    )}
                    <div className="pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500">This Week</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {workerTasksThisWeek} tasks
                      </div>
                      {unscheduledTasks.length > 0 && (
                        <div className="text-xs text-amber-600 font-medium mt-1">
                          {unscheduledTasks.length} unscheduled
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Unscheduled Tasks Column */}
                  <div className="p-3 border-r border-gray-200 min-h-[180px] bg-amber-50/30">
                    {unscheduledTasks.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-gray-400 text-sm">All scheduled</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {unscheduledTasks.map(task => (
                          <div
                            key={task.id}
                            onClick={() => setSelectedTask(task)}
                            className={`p-2 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-all ${getTaskColor(task.projectColor, task.status)} border-amber-500`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span className="font-bold text-xs">#{task.projectNumber}</span>
                            </div>
                            <div className="font-semibold text-xs mb-1 leading-tight line-clamp-2">{task.description}</div>
                            <div className="flex items-center justify-between text-xs text-gray-600">
                              <span className="font-medium">${task.amount.toLocaleString()}</span>
                              {task.estimatedHours && <span className="font-bold">{task.estimatedHours}h</span>}
                            </div>
                            {task.type && <div className="text-xs text-gray-500 mt-1 capitalize">{task.type}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Day Columns */}
                  {[0, 1, 2, 3, 4].map(dayIdx => {
                    const dayTasks = getWorkerDayTasks(worker.id, dayIdx);
                    const totalHours = dayTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
                    const isOverloaded = totalHours > 8;
                    const hasMultipleTasks = dayTasks.length > 1;
                    const dayHasConflict = hasMultipleTasks && totalHours > 8;

                    return (
                      <div
                        key={dayIdx}
                        className={`p-3 border-r border-gray-200 last:border-r-0 min-h-[180px] ${dayHasConflict ? 'bg-red-50/50' : hasMultipleTasks ? 'bg-yellow-50/30' : ''}`}
                      >
                        {dayTasks.length === 0 ? (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-gray-400 text-sm font-medium">Available</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {dayTasks.map(task => (
                              <div
                                key={task.id}
                                onClick={() => setSelectedTask(task)}
                                className={`p-2 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-all ${getTaskColor(task.projectColor, task.status)}`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                  <span className="font-bold text-xs">#{task.projectNumber}</span>
                                </div>
                                <div className="font-semibold text-xs mb-1 leading-tight line-clamp-2">{task.description}</div>
                                <div className="flex items-center justify-between text-xs text-gray-600">
                                  <span className="font-medium">${task.amount.toLocaleString()}</span>
                                  {task.estimatedHours && <span className="font-bold">{task.estimatedHours}h</span>}
                                </div>
                                {task.type && <div className="text-xs text-gray-500 mt-1 capitalize">{task.type}</div>}
                              </div>
                            ))}

                            {totalHours > 0 && (
                              <div className={`mt-2 pt-2 border-t text-xs font-semibold ${
                                isOverloaded ? 'text-red-600 border-red-300' : 'text-gray-500 border-gray-200'
                              }`}>
                                {totalHours}h total {isOverloaded && '⚠️'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* PROJECT VIEW */}
        {view === 'project' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
              <div className="p-4 font-semibold text-gray-700 border-r border-gray-200">PROJECT</div>
              <div className="p-4 text-center border-r border-gray-200">
                <div className="font-bold text-amber-700">UNSCHEDULED</div>
                <div className="text-xs text-amber-600">Needs Date</div>
              </div>
              {weekDays.map((day, idx) => (
                <div key={idx} className="p-4 text-center border-r border-gray-200 last:border-r-0">
                  <div className="font-bold text-gray-900">{dayNames[idx]}</div>
                  <div className="text-sm text-gray-600">{day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                </div>
              ))}
            </div>

            {/* Project Rows */}
            {projects.map(project => {
              if (filterProject !== 'all' && filterProject !== project.id) return null;

              const projectTasksThisWeek = filteredTasks.filter(t => t.projectId === project.id).length;
              const completedTasks = project.tasks.filter(t => t.status === 'completed').length;
              const projectProgress = project.tasks.length > 0 ? Math.round((completedTasks / project.tasks.length) * 100) : 0;
              const unscheduledTasks = getProjectUnscheduledTasks(project.id);

              return (
                <div key={project.id} className="grid grid-cols-7 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                  {/* Project Info */}
                  <div className="p-4 bg-white border-r border-gray-200">
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-3 h-3 rounded-full bg-${project.color || 'blue'}-500`}></span>
                        <span className="font-bold text-gray-900">#{project.number}</span>
                      </div>
                      <div className="font-semibold text-gray-900 mb-1">{project.clientName}</div>
                      <div className="text-xs text-gray-500 capitalize">{project.status}</div>
                    </div>

                    <div className="flex items-start gap-2 text-gray-600 text-xs mb-3">
                      <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span className="leading-tight line-clamp-2">{project.clientAddress}</span>
                    </div>

                    <div className="text-sm font-bold text-gray-900 mb-1">${project.total.toLocaleString()}</div>

                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-semibold text-gray-900">{projectProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`bg-${project.color || 'blue'}-500 h-2 rounded-full transition-all`}
                          style={{ width: `${projectProgress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">{projectTasksThisWeek} tasks this week</div>
                      {unscheduledTasks.length > 0 && (
                        <div className="text-xs text-amber-600 font-medium mt-1">
                          {unscheduledTasks.length} unscheduled
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Unscheduled Tasks Column */}
                  <div className="p-3 border-r border-gray-200 min-h-[180px] bg-amber-50/30">
                    {unscheduledTasks.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-gray-400 text-sm">All scheduled</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {unscheduledTasks.map(task => {
                          const worker = workers.find(w => w.id === task.assignedTo);

                          return (
                            <div
                              key={task.id}
                              onClick={() => setSelectedTask(task)}
                              className={`p-2 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-all ${getTaskColor(task.projectColor, task.status)} border-amber-500`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-3 h-3 text-amber-600" />
                                {worker && (
                                  <div className={`w-6 h-6 ${getWorkerColor(worker.id)} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                                    {getWorkerInitials(worker.name)}
                                  </div>
                                )}
                              </div>
                              <div className="font-semibold text-xs mb-1 leading-tight line-clamp-2">{task.description}</div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-600 font-medium">{worker?.name || 'Unassigned'}</span>
                                {task.estimatedHours && <span className="font-bold text-gray-700">{task.estimatedHours}h</span>}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">${task.amount.toLocaleString()}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Day Columns */}
                  {[0, 1, 2, 3, 4].map(dayIdx => {
                    const dayTasks = getProjectDayTasks(project.id, dayIdx);

                    return (
                      <div
                        key={dayIdx}
                        className="p-3 border-r border-gray-200 last:border-r-0 min-h-[180px]"
                      >
                        {dayTasks.length === 0 ? (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-gray-400 text-sm">—</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {dayTasks.map(task => {
                              const worker = workers.find(w => w.id === task.assignedTo);

                              return (
                                <div
                                  key={task.id}
                                  onClick={() => setSelectedTask(task)}
                                  className={`p-2 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-all ${getTaskColor(task.projectColor, task.status)}`}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                    {worker && (
                                      <div className={`w-6 h-6 ${getWorkerColor(worker.id)} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                                        {getWorkerInitials(worker.name)}
                                      </div>
                                    )}
                                  </div>
                                  <div className="font-semibold text-xs mb-1 leading-tight line-clamp-2">{task.description}</div>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600 font-medium">{worker?.name || 'Unassigned'}</span>
                                    {task.estimatedHours && <span className="font-bold text-gray-700">{task.estimatedHours}h</span>}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">${task.amount.toLocaleString()}</div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Modal */}
      {selectedTask && (() => {
        const project = projects.find(p => p.id === selectedTask.projectId);
        if (!project) return null;

        return (
          <UnifiedTaskModal
            task={selectedTask}
            projectId={project.id}
            projectNumber={project.number}
            projectClient={project.clientName}
            workers={workers}
            onClose={() => setSelectedTask(null)}
            onUpdate={() => {
              loadData();
              setSelectedTask(null);
            }}
          />
        );
      })()}
    </div>
  );
}
