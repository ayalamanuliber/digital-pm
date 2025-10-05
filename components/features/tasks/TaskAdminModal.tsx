'use client';

import React, { useState } from 'react';
import {
  X, Calendar, Clock, Users, AlertTriangle, DollarSign,
  Package, Wrench, CheckCircle, Image as ImageIcon, MapPin,
  Edit, Trash2, Copy, Play, Pause, CheckSquare, Square,
  ChevronDown, ChevronRight, MessageSquare, Phone, Mail,
  Camera, Upload, FileText, ExternalLink, Plus, Minus
} from 'lucide-react';
import type { Task } from '@/types';

interface TaskAdminModalProps {
  task: Task;
  onClose: () => void;
  onSave?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

export default function TaskAdminModal({ task, onClose, onSave, onDelete }: TaskAdminModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'steps' | 'materials' | 'photos' | 'timeline'>('overview');
  const [editedTask, setEditedTask] = useState<Task>(task);

  // Mock crew members
  const crewMembers = [
    { id: 'w1', name: 'Carlos Rodriguez', role: 'Lead Installer', phone: '(720) 555-0101', avatar: '👷' },
    { id: 'w2', name: 'Mike Johnson', role: 'Tile Specialist', phone: '(720) 555-0102', avatar: '🔨' },
    { id: 'w3', name: 'David Chen', role: 'Carpenter', phone: '(720) 555-0103', avatar: '🪚' },
    { id: 'w4', name: 'Sarah Williams', role: 'Painter', phone: '(720) 555-0104', avatar: '🎨' }
  ];

  const allCrewMembers = crewMembers;
  const assignedCrew = crewMembers.filter(m => task.assignedTo.includes(m.id));

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
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const completedSteps = task.steps?.filter(s => s.completed).length || 0;
  const totalSteps = task.steps?.length || 0;
  const stepProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const handleSave = () => {
    onSave?.(editedTask);
    setIsEditing(false);
  };

  const handleToggleStep = (stepId: string) => {
    if (!isEditing) return;
    setEditedTask({
      ...editedTask,
      steps: editedTask.steps?.map(step =>
        step.id === stepId ? { ...step, completed: !step.completed } : step
      )
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {isEditing ? (
                <input
                  type="text"
                  value={editedTask.title}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                  className="bg-white/20 text-white placeholder-white/60 border border-white/30 rounded-lg px-3 py-1.5 font-black text-xl focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              ) : (
                <h2 className="text-2xl font-black text-white">{task.title}</h2>
              )}
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(task.status)}`}>
                {task.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            {isEditing ? (
              <textarea
                value={editedTask.description}
                onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                className="bg-white/20 text-white placeholder-white/60 border border-white/30 rounded-lg px-3 py-1.5 font-medium text-sm w-full focus:outline-none focus:ring-2 focus:ring-white/50"
                rows={2}
              />
            ) : (
              <p className="text-blue-100 font-medium">{task.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-50 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-white/20 text-white px-4 py-2 rounded-lg font-bold hover:bg-white/30 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <Edit size={20} className="text-white" />
                </button>
                <button className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                  <Copy size={20} className="text-white" />
                </button>
                <button
                  onClick={() => onDelete?.(task.id)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <Trash2 size={20} className="text-white" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-6 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Calendar size={18} className="text-white" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-500">SCHEDULED</div>
                <div className="text-sm font-black text-gray-900">
                  {task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Not set'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Clock size={18} className="text-white" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-500">HOURS</div>
                <div className="text-sm font-black text-gray-900">
                  {task.actualHours || 0} / {task.estimatedHours}h
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <CheckCircle size={18} className="text-white" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-500">PROGRESS</div>
                <div className="text-sm font-black text-gray-900">{stepProgress}%</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <ImageIcon size={18} className="text-white" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-500">PHOTOS</div>
                <div className="text-sm font-black text-gray-900">
                  {task.photosUploaded}/{task.photosRequired}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
                <Users size={18} className="text-white" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-500">CREW</div>
                <div className="text-sm font-black text-gray-900">{assignedCrew.length}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${
                task.priority === 'high' ? 'from-red-500 to-red-600' :
                task.priority === 'medium' ? 'from-amber-500 to-amber-600' :
                'from-gray-500 to-gray-600'
              } flex items-center justify-center`}>
                <AlertTriangle size={18} className="text-white" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-500">PRIORITY</div>
                <div className="text-sm font-black text-gray-900">{task.priority?.toUpperCase() || 'MEDIUM'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 font-bold text-sm transition-all border-b-2 ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('steps')}
              className={`px-4 py-3 font-bold text-sm transition-all border-b-2 ${
                activeTab === 'steps'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Steps ({completedSteps}/{totalSteps})
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`px-4 py-3 font-bold text-sm transition-all border-b-2 ${
                activeTab === 'materials'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Materials ({task.materials?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`px-4 py-3 font-bold text-sm transition-all border-b-2 ${
                activeTab === 'photos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Photos ({task.photosUploaded}/{task.photosRequired})
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-3 font-bold text-sm transition-all border-b-2 ${
                activeTab === 'timeline'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Timeline
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Assigned Crew */}
              <div>
                <h3 className="text-sm font-black text-gray-500 uppercase tracking-wide mb-3">Assigned Crew</h3>
                <div className="grid grid-cols-2 gap-3">
                  {assignedCrew.map(member => (
                    <div key={member.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl">
                        {member.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="font-black text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-600 font-medium">{member.role}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Phone size={16} className="text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <MessageSquare size={16} className="text-gray-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {isEditing && (
                  <div className="mt-3">
                    <button className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      <Plus size={16} />
                      Add Crew Member
                    </button>
                  </div>
                )}
              </div>

              {/* Task Details */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-black text-gray-500 uppercase tracking-wide mb-3">Task Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm font-bold text-gray-600">Priority</span>
                      {isEditing ? (
                        <select
                          value={editedTask.priority}
                          onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value as Task['priority'] })}
                          className="px-3 py-1 rounded-lg border border-gray-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${getPriorityColor(task.priority)}`}>
                          {task.priority?.toUpperCase() || 'MEDIUM'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm font-bold text-gray-600">Status</span>
                      {isEditing ? (
                        <select
                          value={editedTask.status}
                          onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value as Task['status'] })}
                          className="px-3 py-1 rounded-lg border border-gray-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ').toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm font-bold text-gray-600">Estimated Hours</span>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editedTask.estimatedHours}
                          onChange={(e) => setEditedTask({ ...editedTask, estimatedHours: parseFloat(e.target.value) })}
                          className="w-20 px-3 py-1 rounded-lg border border-gray-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm font-black text-gray-900">{task.estimatedHours}h</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm font-bold text-gray-600">Actual Hours</span>
                      <span className="text-sm font-black text-gray-900">{task.actualHours || 0}h</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm font-bold text-gray-600">Scheduled Date</span>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editedTask.scheduledDate}
                          onChange={(e) => setEditedTask({ ...editedTask, scheduledDate: e.target.value })}
                          className="px-3 py-1 rounded-lg border border-gray-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm font-black text-gray-900">
                          {task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-gray-500 uppercase tracking-wide mb-3">Progress</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-600">Steps Completed</span>
                        <span className="text-sm font-black text-gray-900">{completedSteps}/{totalSteps} ({stepProgress}%)</span>
                      </div>
                      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all"
                          style={{ width: `${stepProgress}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-600">Photos</span>
                        <span className="text-sm font-black text-gray-900">{task.photosUploaded}/{task.photosRequired} uploaded</span>
                      </div>
                      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                          style={{ width: `${task.photosRequired > 0 ? (task.photosUploaded / task.photosRequired) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-600">Time Progress</span>
                        <span className="text-sm font-black text-gray-900">
                          {task.estimatedHours > 0 ? Math.round(((task.actualHours || 0) / task.estimatedHours) * 100) : 0}%
                        </span>
                      </div>
                      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                            (task.actualHours || 0) > task.estimatedHours
                              ? 'bg-gradient-to-r from-red-500 to-red-600'
                              : 'bg-gradient-to-r from-purple-500 to-purple-600'
                          }`}
                          style={{ width: `${Math.min(task.estimatedHours > 0 ? ((task.actualHours || 0) / task.estimatedHours) * 100 : 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-sm font-black text-gray-500 uppercase tracking-wide mb-3">Notes</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-600 font-medium">No notes added yet.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'steps' && (
            <div className="space-y-3">
              {task.steps && task.steps.length > 0 ? (
                task.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`bg-white border rounded-xl p-4 transition-all ${
                      step.completed ? 'border-green-200 bg-green-50/50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleStep(step.id)}
                        disabled={!isEditing}
                        className={`flex-shrink-0 mt-0.5 ${isEditing ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                      >
                        {step.completed ? (
                          <CheckSquare size={20} className="text-green-600" />
                        ) : (
                          <Square size={20} className="text-gray-400" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-black text-gray-400">STEP {index + 1}</span>
                          {step.photosRequired > 0 && (
                            <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                              <Camera size={12} />
                              {step.photosUploaded}/{step.photosRequired}
                            </span>
                          )}
                        </div>
                        <p className={`font-bold ${step.completed ? 'text-green-900' : 'text-gray-900'}`}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                  <CheckSquare size={32} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-gray-600">No steps defined for this task</p>
                </div>
              )}
              {isEditing && (
                <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-bold text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                  <Plus size={16} />
                  Add Step
                </button>
              )}
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="space-y-3">
              {task.materials && task.materials.length > 0 ? (
                task.materials.map((material, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <Package size={18} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-gray-900">{material}</p>
                    </div>
                    {isEditing && (
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                  <Package size={32} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-gray-600">No materials listed</p>
                </div>
              )}
              {isEditing && (
                <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-bold text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                  <Plus size={16} />
                  Add Material
                </button>
              )}
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: task.photosUploaded }).map((_, i) => (
                  <div key={i} className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center border-2 border-gray-200">
                    <ImageIcon size={32} className="text-gray-400" />
                  </div>
                ))}
                {Array.from({ length: task.photosRequired - task.photosUploaded }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-video bg-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <Camera size={24} className="text-gray-400 mx-auto mb-1" />
                      <p className="text-xs font-bold text-gray-500">Required</p>
                    </div>
                  </div>
                ))}
              </div>
              {isEditing && (
                <button className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-sm font-bold text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                  <Upload size={16} />
                  Upload Photos
                </button>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {task.completedDate && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                        <CheckCircle size={18} className="text-white" />
                      </div>
                      <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="text-sm font-bold text-gray-500">
                        {new Date(task.completedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="font-black text-gray-900 mt-1">Task Completed</div>
                      <div className="text-sm text-gray-600 font-medium mt-1">All steps finished and photos uploaded</div>
                    </div>
                  </div>
                )}
                {task.scheduledDate && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <Calendar size={18} className="text-white" />
                      </div>
                      <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="text-sm font-bold text-gray-500">
                        {new Date(task.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="font-black text-gray-900 mt-1">Task Scheduled</div>
                      <div className="text-sm text-gray-600 font-medium mt-1">Assigned to crew members</div>
                    </div>
                  </div>
                )}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                      <Plus size={18} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-500">Earlier</div>
                    <div className="font-black text-gray-900 mt-1">Task Created</div>
                    <div className="text-sm text-gray-600 font-medium mt-1">Initial task setup</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {task.status === 'scheduled' && (
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors">
                <Play size={16} />
                Start Task
              </button>
            )}
            {task.status === 'in_progress' && (
              <>
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors">
                  <CheckCircle size={16} />
                  Complete Task
                </button>
                <button className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors">
                  <Pause size={16} />
                  Pause
                </button>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
