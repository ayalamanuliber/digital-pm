'use client';

import React, { useState } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, Filter, User, Briefcase,
  Clock, MapPin, CheckCircle, AlertTriangle, Sparkles,
  ThumbsUp, ThumbsDown, Users, TrendingUp, MessageSquare,
  Phone, Mail, Award, X, ChevronDown, Bot
} from 'lucide-react';
import type {
  CrewMember, Project, Task, AISuggestion, ActivityLog,
  CalendarConflict
} from '@/types';

type ViewMode = 'crew' | 'project' | 'day';
type FilterMode = 'all' | 'crew' | 'project' | 'conflicts';

export default function MultiViewCalendar() {
  const [viewMode, setViewMode] = useState<ViewMode>('crew');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedCrewId, setSelectedCrewId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showAISuggestions, setShowAISuggestions] = useState(true);

  // Mock data - in production this comes from API/database
  const crewMembers: CrewMember[] = [
    {
      id: '1',
      name: 'Juan Rodriguez',
      role: 'Electrician',
      skills: ['Electrical', 'GFCI', 'Wiring'],
      phone: '555-0101',
      email: 'juan@example.com',
      status: 'assigned',
      preferences: {
        optimalStartTime: '8:00 AM',
        avoidPairWith: ['3'],
        preferredTaskTypes: ['Electrical']
      },
      performance: {
        avgCompletionSpeed: 115,
        qualityScore: 4.8,
        reliabilityScore: 98
      }
    },
    {
      id: '2',
      name: 'David Chen',
      role: 'Framing Specialist',
      skills: ['Framing', 'Carpentry', 'Structural'],
      phone: '555-0102',
      email: 'david@example.com',
      status: 'assigned',
      performance: {
        avgCompletionSpeed: 105,
        qualityScore: 4.5,
        reliabilityScore: 95
      }
    },
    {
      id: '3',
      name: 'Carlos Martinez',
      role: 'General Labor',
      skills: ['Installation', 'Finishing', 'Inspection'],
      phone: '555-0103',
      email: 'carlos@example.com',
      status: 'on_site',
      performance: {
        avgCompletionSpeed: 110,
        qualityScore: 4.6,
        reliabilityScore: 97
      }
    },
    {
      id: '4',
      name: 'Miguel Santos',
      role: 'Plumbing',
      skills: ['Plumbing', 'Fixtures', 'Drainage'],
      phone: '555-0104',
      email: 'miguel@example.com',
      status: 'available'
    }
  ];

  const projects: Project[] = [
    {
      id: 'p1',
      number: '2037',
      client: 'Maddie Thompson',
      address: '123 Oak Street, Denver CO',
      totalTasks: 12,
      completedTasks: 3,
      budget: 45000,
      spent: 12000,
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
    }
  ];

  const tasks: Task[] = [
    // TODO: Replace with real data from API
    /* // MONDAY - Oct 6
    { id: 't1', projectId: 'p1', projectNumber: '2037', title: 'Install GFCI outlets', assignedTo: '1', assignedBy: 'manual_robert', assignedByName: 'Robert', date: '2025-10-06', startTime: '07:00', endTime: '12:00', duration: 5, status: 'assigned', skillRequired: 'Electrical', estimatedHours: 5, location: '123 Oak St' },
    { id: 't2', projectId: 'p2', projectNumber: '2027', title: 'Deck framing start', assignedTo: '2', assignedBy: 'manual_erick', assignedByName: 'Erick', date: '2025-10-06', startTime: '08:00', endTime: '16:00', duration: 8, status: 'assigned', skillRequired: 'Framing', estimatedHours: 8, location: '456 Maple Ave' },
    { id: 't3', projectId: 'p1', projectNumber: '2037', title: 'Install smoke alarms', assignedTo: '3', assignedBy: 'ai_approved', assignedByName: 'AI', date: '2025-10-06', startTime: '08:00', endTime: '12:00', duration: 4, status: 'assigned', aiConfidence: 92 },
    { id: 't4', projectId: 'p2', projectNumber: '2027', title: 'Plumbing rough-in', assignedTo: '4', assignedBy: 'manual_robert', assignedByName: 'Robert', date: '2025-10-06', startTime: '09:00', endTime: '15:00', duration: 6, status: 'assigned' },

    // TUESDAY - Oct 7
    { id: 't5', projectId: 'p1', projectNumber: '2037', title: 'Bathroom exhaust fan', assignedTo: '1', assignedBy: 'ai_approved', assignedByName: 'AI', date: '2025-10-07', startTime: '07:00', endTime: '11:00', duration: 4, status: 'assigned', aiConfidence: 95 },
    { id: 't6', projectId: 'p2', projectNumber: '2027', title: 'Continue deck framing', assignedTo: '2', assignedBy: 'manual_robert', assignedByName: 'Robert', date: '2025-10-07', startTime: '07:00', endTime: '15:00', duration: 8, status: 'assigned' },
    { id: 't7', projectId: 'p1', projectNumber: '2037', title: 'Install kitchen lighting', assignedTo: '3', assignedBy: 'ai_auto', assignedByName: 'AI', date: '2025-10-07', startTime: '08:00', endTime: '13:00', duration: 5, status: 'assigned', aiConfidence: 88 },
    { id: 't8', projectId: 'p2', projectNumber: '2027', title: 'Install shower fixtures', assignedTo: '4', assignedBy: 'manual_erick', assignedByName: 'Erick', date: '2025-10-07', startTime: '10:00', endTime: '16:00', duration: 6, status: 'assigned' },

    // WEDNESDAY - Oct 8 (CONFLICTS!)
    { id: 't9', projectId: 'p1', projectNumber: '2037', title: 'Kitchen panel upgrade', assignedTo: '1', assignedBy: 'manual_robert', assignedByName: 'Robert', date: '2025-10-08', startTime: '08:00', endTime: '12:00', duration: 4, status: 'assigned' },
    { id: 't10', projectId: 'p2', projectNumber: '2027', title: 'Emergency electrical fix', assignedTo: '1', assignedBy: 'ai_auto', assignedByName: 'AI', date: '2025-10-08', startTime: '10:00', endTime: '14:00', duration: 4, status: 'assigned', hasConflict: true, conflictReason: 'Juan double-booked 10AM-12PM', aiConfidence: 75 },
    { id: 't11', projectId: 'p1', projectNumber: '2037', title: 'Attic junction box', assignedTo: '3', assignedBy: 'ai_approved', assignedByName: 'AI', date: '2025-10-08', startTime: '07:00', endTime: '11:00', duration: 4, status: 'assigned', aiConfidence: 90 },
    { id: 't12', projectId: 'p2', projectNumber: '2027', title: 'Deck footings pour', assignedTo: '2', assignedBy: 'manual_erick', assignedByName: 'Erick', date: '2025-10-08', startTime: '08:00', endTime: '16:00', duration: 8, status: 'assigned' },
    { id: 't13', projectId: 'p1', projectNumber: '2037', title: 'Basement wiring', assignedTo: '3', assignedBy: 'manual_robert', assignedByName: 'Robert', date: '2025-10-08', startTime: '13:00', endTime: '17:00', duration: 4, status: 'assigned' },

    // THURSDAY - Oct 9 (HEAVY DAY!)
    { id: 't14', projectId: 'p1', projectNumber: '2037', title: 'Install GFCI protection', assignedTo: '1', assignedBy: 'manual_robert', assignedByName: 'Robert', date: '2025-10-09', startTime: '08:00', endTime: '11:00', duration: 3, status: 'assigned', photosRequired: true },
    { id: 't15', projectId: 'p1', projectNumber: '2037', title: 'Replace smoke alarms', assignedTo: '3', assignedBy: 'ai_approved', assignedByName: 'AI', date: '2025-10-09', startTime: '08:00', endTime: '11:00', duration: 3, status: 'assigned', aiConfidence: 92 },
    { id: 't16', projectId: 'p2', projectNumber: '2027', title: 'Frame new deck', assignedTo: '2', assignedBy: 'manual_erick', assignedByName: 'Erick', date: '2025-10-09', startTime: '09:00', endTime: '15:00', duration: 6, status: 'assigned' },
    { id: 't17', projectId: 'p2', projectNumber: '2027', title: 'Install deck footings', assignedTo: '2', assignedBy: 'ai_auto', assignedByName: 'AI', date: '2025-10-09', startTime: '13:00', endTime: '16:00', duration: 3, status: 'assigned', hasConflict: true, conflictReason: 'David double-booked 1PM-3PM', aiConfidence: 88 },
    { id: 't18', projectId: 'p1', projectNumber: '2037', title: 'Outdoor outlet install', assignedTo: '1', assignedBy: 'ai_approved', assignedByName: 'AI', date: '2025-10-09', startTime: '13:00', endTime: '16:00', duration: 3, status: 'assigned', aiConfidence: 87 },
    { id: 't19', projectId: 'p2', projectNumber: '2027', title: 'Kitchen sink plumbing', assignedTo: '4', assignedBy: 'manual_robert', assignedByName: 'Robert', date: '2025-10-09', startTime: '08:00', endTime: '13:00', duration: 5, status: 'assigned' },

    // FRIDAY - Oct 10
    { id: 't20', projectId: 'p1', projectNumber: '2037', title: 'Install bathroom fan', assignedTo: '1', assignedBy: 'ai_approved', assignedByName: 'AI', date: '2025-10-10', startTime: '08:00', endTime: '11:00', duration: 3, status: 'assigned', aiConfidence: 95 },
    { id: 't21', projectId: 'p2', projectNumber: '2027', title: 'Deck railing install', assignedTo: '2', assignedBy: 'manual_robert', assignedByName: 'Robert', date: '2025-10-10', startTime: '08:00', endTime: '15:00', duration: 7, status: 'assigned' },
    { id: 't22', projectId: 'p1', projectNumber: '2037', title: 'Final electrical inspection', assignedTo: '1', assignedBy: 'manual_erick', assignedByName: 'Erick', date: '2025-10-10', startTime: '14:00', endTime: '16:00', duration: 2, status: 'assigned' },
    { id: 't23', projectId: 'p1', projectNumber: '2037', title: 'Install ceiling fans', assignedTo: '3', assignedBy: 'ai_auto', assignedByName: 'AI', date: '2025-10-10', startTime: '09:00', endTime: '14:00', duration: 5, status: 'assigned', aiConfidence: 85 },

    // SATURDAY - Oct 11
    { id: 't24', projectId: 'p2', projectNumber: '2027', title: 'Weekend deck finishing', assignedTo: '2', assignedBy: 'manual_robert', assignedByName: 'Robert', date: '2025-10-11', startTime: '08:00', endTime: '14:00', duration: 6, status: 'assigned' },
    { id: 't25', projectId: 'p1', projectNumber: '2037', title: 'Final walkthrough prep', assignedTo: '3', assignedBy: 'manual_erick', assignedByName: 'Erick', date: '2025-10-11', startTime: '09:00', endTime: '12:00', duration: 3, status: 'assigned' } */
  ];

  const aiSuggestions: AISuggestion[] = [
    {
      id: 's1',
      type: 'conflict_resolution',
      taskId: 't4',
      suggestedCrewId: '3',
      suggestedCrewName: 'Carlos Martinez',
      confidence: 89,
      reason: 'David has conflicting task. Carlos available and has structural skills.',
      alternativeOptions: [
        { crewId: '4', crewName: 'Miguel Santos', confidence: 72 }
      ],
      timestamp: '2025-10-09T07:15:00Z',
      status: 'pending'
    },
    {
      id: 's2',
      type: 'optimization',
      taskId: 't5',
      suggestedCrewId: '1',
      suggestedCrewName: 'Juan Rodriguez',
      confidence: 95,
      reason: 'Juan has 95% completion rate on electrical tasks, optimal morning schedule.',
      timestamp: '2025-10-09T07:20:00Z',
      status: 'pending'
    }
  ];

  const activityLogs: ActivityLog[] = [
    {
      id: 'a1',
      timestamp: '2025-10-09T07:26:00Z',
      actor: 'robert',
      actorName: 'Robert',
      action: 'manual_assignment',
      target: 'Juan Rodriguez',
      details: 'Assigned Juan to Install GFCI protection in kitchen',
      context: { taskId: 't1', projectId: 'p1' }
    },
    {
      id: 'a2',
      timestamp: '2025-10-09T07:24:00Z',
      actor: 'ai',
      actorName: 'AI Assistant',
      action: 'ai_assignment',
      target: 'Carlos Martinez',
      details: 'Auto-assigned Carlos to Replace smoke alarms throughout',
      context: { taskId: 't2', projectId: 'p1' }
    },
    {
      id: 'a3',
      timestamp: '2025-10-09T07:20:00Z',
      actor: 'erick',
      actorName: 'Erick',
      action: 'approval',
      target: 'David Chen',
      details: 'Approved AI suggestion to assign David to deck framing',
      context: { taskId: 't3', projectId: 'p2' }
    }
  ];

  // Helper functions
  const getCrewById = (id: string) => crewMembers.find(c => c.id === id);
  const getProjectById = (id: string) => projects.find(p => p.id === id);
  const getTaskById = (id: string) => tasks.find(t => t.id === id);

  const getWeekDates = () => {
    const week = [];
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      week.push(date);
    }
    return week;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDay = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getTasksForDateAndCrew = (date: Date, crewId: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(t => t.date === dateStr && t.assignedTo === crewId);
  };

  const getTasksForDateAndProject = (date: Date, projectId: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(t => t.date === dateStr && t.projectId === projectId);
  };

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(t => t.date === dateStr);
  };

  // Calculate daily capacity for a crew member
  const getDailyCapacity = (crewId: string, date: Date) => {
    const dayTasks = getTasksForDateAndCrew(date, crewId);
    const totalHours = dayTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
    const maxHours = 8; // Standard workday
    const hasConflicts = dayTasks.some(t => t.hasConflict);
    return { totalHours, maxHours, hasConflicts, available: maxHours - totalHours };
  };

  // Get overall crew availability for a day
  const getCrewAvailability = (crewId: string, date: Date) => {
    const { totalHours, maxHours, hasConflicts } = getDailyCapacity(crewId, date);
    if (hasConflicts) return 'conflict';
    if (totalHours === 0) return 'available';
    if (totalHours >= maxHours) return 'full';
    if (totalHours >= 6) return 'busy';
    return 'partial';
  };

  const getAssignmentBadgeColor = (source?: string) => {
    switch(source) {
      case 'manual_robert': return 'bg-blue-100 text-blue-800';
      case 'manual_erick': return 'bg-purple-100 text-purple-800';
      case 'ai_auto': return 'bg-cyan-100 text-cyan-800';
      case 'ai_approved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssignmentIcon = (source?: string) => {
    if (source?.includes('ai')) return <Bot className="w-3 h-3" />;
    return <User className="w-3 h-3" />;
  };

  const handleAcceptSuggestion = (suggestionId: string) => {
    console.log('Accepted suggestion:', suggestionId);
    // In production: update task assignment, log activity
  };

  const handleRejectSuggestion = (suggestionId: string) => {
    console.log('Rejected suggestion:', suggestionId);
    // In production: log rejection, AI learns from it
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleCrewClick = (crewId: string) => {
    setSelectedCrewId(crewId);
  };

  const handleProjectClick = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const weekDates = getWeekDates();
  const selectedTask = selectedTaskId ? getTaskById(selectedTaskId) : null;
  const selectedCrew = selectedCrewId ? getCrewById(selectedCrewId) : null;
  const selectedProject = selectedProjectId ? getProjectById(selectedProjectId) : null;

  return (
    <div className="space-y-4">
      {/* Compact Header: View Selector + Week Nav */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* View Mode Tabs - Compact */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('crew')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                viewMode === 'crew'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Crew</span>
            </button>

            <button
              onClick={() => setViewMode('project')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                viewMode === 'project'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Project</span>
            </button>

            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                viewMode === 'day'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Day</span>
            </button>
          </div>

          {/* Week Navigation - Inline */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() - 7);
                setSelectedDate(newDate);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            <div className="text-center min-w-[200px]">
              <div className="font-bold text-gray-900 text-sm sm:text-base">
                {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
              </div>
              <div className="text-xs text-gray-500">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>

            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() + 7);
                setSelectedDate(newDate);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>

            {/* AI Suggestions Indicator */}
            {aiSuggestions.filter(s => s.status === 'pending').length > 0 && (
              <button
                onClick={() => setShowAISuggestions(!showAISuggestions)}
                className="ml-2 px-3 py-2 bg-cyan-50 border border-cyan-200 rounded-lg text-sm font-medium text-cyan-700 hover:bg-cyan-100 transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">{aiSuggestions.filter(s => s.status === 'pending').length} AI Tips</span>
                <span className="sm:hidden">{aiSuggestions.filter(s => s.status === 'pending').length}</span>
              </button>
            )}
          </div>
        </div>

        {/* AI Suggestions Dropdown - Compact */}
        {showAISuggestions && aiSuggestions.filter(s => s.status === 'pending').length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-2">
              {aiSuggestions.filter(s => s.status === 'pending').map(suggestion => {
                const task = getTaskById(suggestion.taskId);
                return (
                  <div key={suggestion.id} className="flex items-center justify-between gap-3 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Bot className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          Assign {suggestion.suggestedCrewName} to {task?.title}
                        </div>
                        <div className="text-xs text-gray-600">{suggestion.confidence}% confident</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleAcceptSuggestion(suggestion.id)}
                        className="px-3 py-1 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 transition-colors"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleRejectSuggestion(suggestion.id)}
                        className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50 transition-colors"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* CREW VIEW - Weekly Schedule per Worker */}
      {viewMode === 'crew' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Desktop Grid */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 border-b-2 border-gray-300">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase w-48 border-r border-gray-300">
                    Crew Member
                  </th>
                  {weekDates.map((date, idx) => (
                    <th key={idx} className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase border-r border-gray-300 last:border-r-0">
                      <div>{formatDay(date)}</div>
                      <div className="text-gray-500 font-normal mt-1">{formatDate(date)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* Daily Summary Row */}
                <tr className="bg-blue-50 border-b-2 border-blue-300">
                  <td className="px-4 py-3 border-r border-blue-200">
                    <div className="font-bold text-blue-900 text-sm">Daily Summary</div>
                    <div className="text-xs text-blue-700">Crew capacity & availability</div>
                  </td>
                  {weekDates.map((date, idx) => {
                    const dayTasks = getTasksForDate(date);
                    const totalHours = dayTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
                    const uniqueCrew = [...new Set(dayTasks.map(t => t.assignedTo).filter(Boolean))];
                    const hasConflicts = dayTasks.some(t => t.hasConflict);
                    const availableCrew = crewMembers.filter(c => {
                      const crewTasks = getTasksForDateAndCrew(date, c.id);
                      return crewTasks.length === 0;
                    });

                    return (
                      <td key={idx} className="px-2 py-3 border-r border-blue-200 last:border-r-0 text-center">
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-blue-900">{totalHours}h total</div>
                          <div className="text-xs text-blue-700">{uniqueCrew.length}/{crewMembers.length} crew</div>
                          {availableCrew.length > 0 && (
                            <div className="text-xs font-semibold text-green-700">{availableCrew.length} available</div>
                          )}
                          {hasConflicts && (
                            <div className="text-xs font-semibold text-red-700">⚠ Conflicts</div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {crewMembers.map(crew => (
                  <tr key={crew.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 border-r border-gray-200 bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                          {crew.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 text-sm">{crew.name}</div>
                          <div className="text-xs text-gray-500">{crew.role}</div>
                        </div>
                        {/* Crew availability indicator */}
                        <div className={`w-2 h-2 rounded-full ${
                          crew.status === 'available' ? 'bg-green-500' :
                          crew.status === 'assigned' ? 'bg-blue-500' :
                          crew.status === 'on_site' ? 'bg-amber-500' :
                          'bg-gray-400'
                        }`} title={crew.status} />
                      </div>
                    </td>
                    {weekDates.map((date, idx) => {
                      const dayTasks = getTasksForDateAndCrew(date, crew.id);
                      const capacity = getDailyCapacity(crew.id, date);
                      const availability = getCrewAvailability(crew.id, date);

                      return (
                        <td key={idx} className="px-2 py-4 align-top border-r border-gray-200 last:border-r-0 bg-white">
                          <div className="space-y-1.5">
                            {/* Capacity indicator */}
                            {dayTasks.length > 0 && (
                              <div className={`px-2 py-1 rounded text-xs font-bold text-center mb-2 ${
                                availability === 'conflict' ? 'bg-red-100 text-red-800' :
                                availability === 'full' ? 'bg-amber-100 text-amber-800' :
                                availability === 'busy' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {capacity.totalHours}h/{capacity.maxHours}h
                                {capacity.available > 0 && ` • ${capacity.available}h free`}
                              </div>
                            )}

                            {dayTasks.map(task => (
                              <div
                                key={task.id}
                                className="p-2.5 rounded-lg border-2 hover:shadow-md transition-all cursor-pointer"
                                style={{
                                  borderColor: task.hasConflict ? '#EF4444' : '#D1D5DB',
                                  backgroundColor: task.hasConflict ? '#FEF2F2' : '#F9FAFB'
                                }}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-blue-600">#{task.projectNumber}</span>
                                  <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${getAssignmentBadgeColor(task.assignedBy)}`}>
                                    {getAssignmentIcon(task.assignedBy)}
                                    <span className="text-xs">{task.assignedByName}</span>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-900 font-medium mb-1 line-clamp-2">{task.title}</div>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Clock className="w-3 h-3" />
                                  {task.startTime}-{task.endTime} ({task.duration}h)
                                </div>
                                {task.hasConflict && (
                                  <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Conflict
                                  </div>
                                )}
                              </div>
                            ))}

                            {/* Show availability if crew is free */}
                            {dayTasks.length === 0 && (
                              <div className="px-2 py-3 rounded-lg bg-green-50 border border-green-200 text-center">
                                <div className="text-xs font-bold text-green-700">Available</div>
                                <div className="text-xs text-green-600">8h free</div>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile List */}
          <div className="lg:hidden divide-y divide-gray-100">
            {crewMembers.map(crew => (
              <div key={crew.id} className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                    {crew.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{crew.name}</div>
                    <div className="text-sm text-gray-500">{crew.role}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {weekDates.map((date, idx) => {
                    const dayTasks = getTasksForDateAndCrew(date, crew.id);
                    if (dayTasks.length === 0) return null;
                    return (
                      <div key={idx}>
                        <div className="text-xs font-semibold text-gray-600 uppercase mb-2">
                          {formatDay(date)} {formatDate(date)}
                        </div>
                        <div className="space-y-2">
                          {dayTasks.map(task => (
                            <div
                              key={task.id}
                              className="p-3 rounded-lg border hover:shadow-md transition-all"
                              style={{
                                borderColor: task.hasConflict ? '#EF4444' : '#E5E7EB',
                                backgroundColor: task.hasConflict ? '#FEF2F2' : '#FFFFFF'
                              }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-blue-600">#{task.projectNumber}</span>
                                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${getAssignmentBadgeColor(task.assignedBy)}`}>
                                  {getAssignmentIcon(task.assignedBy)}
                                  <span>{task.assignedByName}</span>
                                </div>
                              </div>
                              <div className="text-sm text-gray-900 font-medium mb-2">{task.title}</div>
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Clock className="w-4 h-4" />
                                {task.startTime}-{task.endTime}
                              </div>
                              {task.hasConflict && (
                                <div className="flex items-center gap-1 text-sm text-red-600 mt-2">
                                  <AlertTriangle className="w-4 h-4" />
                                  Scheduling conflict
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROJECT VIEW - Staffing per Project */}
      {viewMode === 'project' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Desktop Grid */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 border-b-2 border-gray-300">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase w-64 border-r border-gray-300">
                    Project
                  </th>
                  {weekDates.map((date, idx) => (
                    <th key={idx} className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase border-r border-gray-300 last:border-r-0">
                      <div>{formatDay(date)}</div>
                      <div className="text-gray-500 font-normal mt-1">{formatDate(date)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projects.map(project => (
                  <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 border-r border-gray-200 bg-gray-50">
                      <div>
                        <div className="font-semibold text-gray-900">#{project.number}</div>
                        <div className="text-sm text-gray-600">{project.client}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            project.priority === 'high' ? 'bg-red-100 text-red-800' :
                            project.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {project.priority}
                          </span>
                        </div>
                      </div>
                    </td>
                    {weekDates.map((date, idx) => {
                      const dayTasks = getTasksForDateAndProject(date, project.id);
                      const uniqueCrew = [...new Set(dayTasks.map(t => t.assignedTo).filter(Boolean))];
                      const totalHours = dayTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
                      return (
                        <td key={idx} className="px-2 py-4 align-top border-r border-gray-200 last:border-r-0 bg-white">
                          {dayTasks.length > 0 && (
                            <div className="p-3 rounded-lg bg-blue-50 border-2 border-blue-300">
                              <div className="text-xs font-semibold text-gray-700 mb-2">
                                {uniqueCrew.length} crew · {totalHours}h
                              </div>
                              <div className="space-y-1.5">
                                {dayTasks.map(task => {
                                  const assignedId = Array.isArray(task.assignedTo) ? task.assignedTo[0] : task.assignedTo;
                                  const crew = assignedId ? getCrewById(assignedId) : null;
                                  return (
                                    <div
                                      key={task.id}
                                      className="p-2 rounded-lg bg-white border-2 border-blue-400 hover:shadow-md transition-all cursor-pointer"
                                    >
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                          {crew?.name.split(' ').map(n => n[0]).join('') || '?'}
                                        </div>
                                        <span className="text-xs font-medium text-gray-900 flex-1 truncate">{crew?.name || 'Unassigned'}</span>
                                      </div>
                                      <div className="text-xs text-gray-600 line-clamp-1 mb-1">{task.title}</div>
                                      <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Clock className="w-3 h-3" />
                                        {task.startTime}-{task.endTime}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile List */}
          <div className="lg:hidden divide-y divide-gray-100">
            {projects.map(project => (
              <div key={project.id} className="p-4">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-bold text-gray-900">#{project.number}</div>
                      <div className="text-sm text-gray-600">{project.client}</div>
                    </div>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      project.priority === 'high' ? 'bg-red-100 text-red-800' :
                      project.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.priority}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  {weekDates.map((date, idx) => {
                    const dayTasks = getTasksForDateAndProject(date, project.id);
                    if (dayTasks.length === 0) return null;
                    const uniqueCrew = [...new Set(dayTasks.map(t => t.assignedTo).filter(Boolean))];
                    const totalHours = dayTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
                    return (
                      <div key={idx}>
                        <div className="text-xs font-semibold text-gray-600 uppercase mb-2">
                          {formatDay(date)} {formatDate(date)} · {uniqueCrew.length} crew · {totalHours}h
                        </div>
                        <div className="space-y-2">
                          {dayTasks.map(task => {
                            const assignedId = Array.isArray(task.assignedTo) ? task.assignedTo[0] : task.assignedTo;
                            const crew = assignedId ? getCrewById(assignedId) : null;
                            return (
                              <div
                                key={task.id}
                                className="p-3 rounded-lg border border-blue-200 bg-blue-50 hover:shadow-md transition-all"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                                    {crew?.name.split(' ').map(n => n[0]).join('') || '?'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">{crew?.name || 'Unassigned'}</div>
                                    <div className="text-xs text-gray-500">{crew?.role}</div>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-900 font-medium mb-2">{task.title}</div>
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <Clock className="w-4 h-4" />
                                  {task.startTime}-{task.endTime}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DAY VIEW - Hourly Timeline */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-300 overflow-hidden">
          <div className="p-4 border-b-2 border-gray-300 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <p className="text-sm text-gray-600">Hourly crew schedule</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setDate(newDate.getDate() - 1);
                    setSelectedDate(newDate);
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setDate(newDate.getDate() + 1);
                    setSelectedDate(newDate);
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Timeline Grid */}
          <div className="p-4 overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Hour Headers */}
              <div className="flex mb-2">
                <div className="w-32 flex-shrink-0"></div>
                <div className="flex-1 flex border-b-2 border-gray-300">
                  {[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map(hour => (
                    <div key={hour} className="flex-1 text-center text-xs font-semibold text-gray-700 pb-2 border-r border-gray-300 last:border-r-0">
                      {hour > 12 ? `${hour - 12}PM` : hour === 12 ? '12PM' : `${hour}AM`}
                    </div>
                  ))}
                </div>
              </div>

              {/* Crew Timeline Rows */}
              <div className="space-y-0 divide-y divide-gray-200">
                {crewMembers.map(crew => {
                  const crewTasks = getTasksForDateAndCrew(selectedDate, crew.id);
                  return (
                    <div key={crew.id} className="flex items-center py-3">
                      <div className="w-32 flex-shrink-0 flex items-center gap-2 pr-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                          {crew.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm font-medium text-gray-900 truncate">{crew.name.split(' ')[0]}</span>
                      </div>
                      <div className="flex-1 relative h-12 bg-gray-50 rounded border-2 border-gray-300">
                        {/* Hour grid lines */}
                        <div className="absolute inset-0 flex">
                          {[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map(hour => (
                            <div key={hour} className="flex-1 border-r border-gray-300 last:border-r-0"></div>
                          ))}
                        </div>
                        {/* Task bars */}
                        {crewTasks.map(task => {
                          if (!task.startTime || !task.endTime) return null;
                          const startHour = parseInt(task.startTime.split(':')[0]);
                          const endHour = parseInt(task.endTime.split(':')[0]);
                          const left = ((startHour - 7) / 11) * 100;
                          const width = ((endHour - startHour) / 11) * 100;
                          const project = getProjectById(task.projectId);

                          return (
                            <div
                              key={task.id}
                              className={`absolute top-1 bottom-1 rounded-lg px-2 text-xs font-bold text-white flex items-center justify-center hover:shadow-xl transition-all cursor-pointer border-2 ${
                                task.hasConflict ? 'bg-red-500 border-red-700' : 'bg-blue-600 border-blue-800'
                              }`}
                              style={{ left: `${left}%`, width: `${width}%` }}
                              title={`${task.title} (${task.startTime}-${task.endTime})`}
                            >
                              <span className="truncate">#{project?.number}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Crew Load Indicator */}
              <div className="mt-6 pt-4 border-t-2 border-gray-300 flex items-center">
                <div className="w-32 flex-shrink-0 pr-3">
                  <span className="text-xs font-semibold text-gray-700 uppercase">Crew Load</span>
                </div>
                <div className="flex-1 flex gap-px">
                  {[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map(hour => {
                    const hourTasks = tasks.filter(t => {
                      const startHour = parseInt(t.startTime.split(':')[0]);
                      const endHour = parseInt(t.endTime.split(':')[0]);
                      return t.date === selectedDate.toISOString().split('T')[0] &&
                             hour >= startHour && hour < endHour;
                    });
                    const load = hourTasks.length;

                    return (
                      <div key={hour} className="flex-1 text-center">
                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                          load === 0 ? 'bg-gray-100 text-gray-400' :
                          load <= 2 ? 'bg-green-100 text-green-700' :
                          load <= 3 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {load}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crew Availability Panel - Shows who has capacity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Crew Availability This Week
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {crewMembers.map(crew => {
            const weekCapacity = weekDates.map(date => getDailyCapacity(crew.id, date));
            const totalBooked = weekCapacity.reduce((sum, c) => sum + c.totalHours, 0);
            const totalAvailable = weekCapacity.reduce((sum, c) => sum + c.available, 0);
            const daysWithConflicts = weekCapacity.filter(c => c.hasConflicts).length;
            const utilizationPercent = Math.round((totalBooked / (weekDates.length * 8)) * 100);

            return (
              <div
                key={crew.id}
                className={`p-3 rounded-lg border-2 ${
                  daysWithConflicts > 0 ? 'bg-red-50 border-red-300' :
                  utilizationPercent >= 90 ? 'bg-amber-50 border-amber-300' :
                  utilizationPercent >= 60 ? 'bg-blue-50 border-blue-300' :
                  'bg-green-50 border-green-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {crew.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">{crew.name}</div>
                    <div className="text-xs text-gray-600">{crew.role}</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Booked:</span>
                    <span className="text-xs font-bold text-gray-900">{totalBooked}h / {weekDates.length * 8}h</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        daysWithConflicts > 0 ? 'bg-red-500' :
                        utilizationPercent >= 90 ? 'bg-amber-500' :
                        utilizationPercent >= 60 ? 'bg-blue-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Available:</span>
                    <span className={`text-xs font-bold ${totalAvailable > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                      {totalAvailable}h free
                    </span>
                  </div>
                  {daysWithConflicts > 0 && (
                    <div className="flex items-center gap-1 text-xs text-red-700 font-semibold mt-1">
                      <AlertTriangle className="w-3 h-3" />
                      {daysWithConflicts} day{daysWithConflicts > 1 ? 's' : ''} with conflicts
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Log - Collapsible */}
      <details className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <summary className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">Recent Activity</h3>
            <p className="text-sm text-gray-600">Track all scheduling changes</p>
          </div>
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </summary>
        <div className="border-t border-gray-200 p-4 max-h-80 overflow-y-auto">
          <div className="space-y-2">
            {activityLogs.map(log => (
              <div key={log.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  log.actor === 'robert' ? 'bg-blue-100' :
                  log.actor === 'erick' ? 'bg-purple-100' :
                  log.actor === 'ai' ? 'bg-cyan-100' :
                  'bg-green-100'
                }`}>
                  {log.actor === 'ai' ? (
                    <Bot className={`w-3 h-3 ${log.actor === 'ai' ? 'text-cyan-600' : ''}`} />
                  ) : (
                    <User className={`w-3 h-3 ${
                      log.actor === 'robert' ? 'text-blue-600' :
                      log.actor === 'erick' ? 'text-purple-600' :
                      'text-green-600'
                    }`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900">{log.details}</div>
                  <div className="text-xs text-gray-500">
                    {log.actorName} · {new Date(log.timestamp).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}
