/**
 * Global Type Definitions
 *
 * Add your TypeScript interfaces and types here as sections are integrated.
 */

// Dashboard Types
export interface ActiveProject {
  number: string;
  client: string;
  totalTasks: number;
  assigned: number;
  unassigned: number;
  photosNeeded: number;
}

export interface DashboardStats {
  teamAvailable: number;
  teamTotal: number;
  activeTasks: number;
  needsAction: number;
  performance: number;
}

export type AlertType = 'conflict' | 'warning' | 'info' | 'error';

export interface Alert {
  type: AlertType;
  title: string;
  description: string;
  timestamp: string;
}

export type ActivityType = 'assignment' | 'confirmation' | 'auto' | 'upload' | 'batch' | 'bulk';
export type ActivityStatus = 'completed' | 'pending' | 'failed';

export interface Activity {
  type: ActivityType;
  text: string;
  timestamp: string;
  status: ActivityStatus;
}

// Calendar & Scheduling Types
export type AssignmentSource = 'manual_robert' | 'manual_erick' | 'ai_auto' | 'ai_approved' | 'ai_rejected';
export type WorkerStatus = 'available' | 'assigned' | 'in_transit' | 'on_site' | 'completed' | 'off_duty';
export type TaskStatus = 'unassigned' | 'assigned' | 'in_progress' | 'completed' | 'delayed';

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  skills: string[];
  phone: string;
  email: string;
  status: WorkerStatus;
  avatar?: string;
  preferences?: {
    optimalStartTime?: string;
    avoidPairWith?: string[];
    preferredTaskTypes?: string[];
  };
  performance?: {
    avgCompletionSpeed: number; // percentage vs expected
    qualityScore: number; // 0-5 rating
    reliabilityScore: number; // on-time percentage
  };
}

export interface Project {
  id: string;
  number: string;
  client: string;
  address: string;
  totalTasks: number;
  completedTasks: number;
  budget: number;
  spent: number;
  startDate: string;
  estimatedCompletion: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'planning' | 'active' | 'on_hold' | 'completed';
}

export interface Task {
  id: string;
  projectId: string;
  projectNumber: string;
  title: string;
  description: string;
  assignedTo?: string; // crew member id
  assignedBy?: AssignmentSource;
  assignedByName?: string; // "Robert", "Erick", or "AI"
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // in hours
  status: TaskStatus;
  skillRequired?: string;
  estimatedHours: number;
  actualHours?: number;
  hasConflict?: boolean;
  conflictReason?: string;
  aiConfidence?: number; // 0-100 if AI assigned
  location?: string;
  photosRequired?: boolean;
  notes?: string;
}

export interface AISuggestion {
  id: string;
  type: 'assignment' | 'reassignment' | 'conflict_resolution' | 'optimization';
  taskId: string;
  suggestedCrewId: string;
  suggestedCrewName: string;
  confidence: number; // 0-100
  reason: string;
  alternativeOptions?: {
    crewId: string;
    crewName: string;
    confidence: number;
  }[];
  timestamp: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  actor: 'robert' | 'erick' | 'ai' | 'worker';
  actorName: string;
  action: 'manual_assignment' | 'ai_assignment' | 'approval' | 'rejection' | 'reassignment' | 'completion' | 'message';
  target?: string; // crew member or project affected
  details: string;
  context?: {
    taskId?: string;
    projectId?: string;
    previousAssignment?: string;
    aiSuggestionId?: string;
  };
}

export interface CalendarConflict {
  id: string;
  crewMemberId: string;
  crewMemberName: string;
  date: string;
  conflictingTasks: Task[];
  severity: 'low' | 'medium' | 'high';
  suggestedResolution?: string;
}
