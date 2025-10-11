'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, DollarSign, User, Package, Camera, Clock, MessageSquare, CheckCircle, XCircle, UserPlus, Play, AlertCircle, Image as ImageIcon, Edit2, Save, ExternalLink, Plus } from 'lucide-react';
import { storage, Task, Worker } from '@/lib/localStorage';
import { playNotificationSound } from '@/lib/notificationSounds';

interface UnifiedTaskModalProps {
  task: Task;
  projectId: string;
  projectNumber: string;
  projectClient: string;
  workers: Worker[];
  onClose: () => void;
  onUpdate: () => void;
  initialTab?: 'details' | 'activity' | 'messages';
}

export default function UnifiedTaskModal({
  task,
  projectId,
  projectNumber,
  projectClient,
  workers,
  onClose,
  onUpdate,
  initialTab = 'details'
}: UnifiedTaskModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'messages' | 'assign'>(initialTab);
  const [selectedWorker, setSelectedWorker] = useState(task.assignedTo || '');
  const [assignDate, setAssignDate] = useState(task.assignedDate || '');
  const [assignTime, setAssignTime] = useState(task.time || '09:00');
  const [duration, setDuration] = useState(task.duration || 4);
  const [messageText, setMessageText] = useState('');
  const [currentTask, setCurrentTask] = useState(task);
  const previousMessageCount = useRef(-1); // Initialize to -1 to allow first message sound
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedDescription, setEditedDescription] = useState(task.description);
  const [editedQuantity, setEditedQuantity] = useState(task.quantity);
  const [editedPrice, setEditedPrice] = useState(task.price);
  const [editedMaterials, setEditedMaterials] = useState<any[]>(task.materials || []);
  const [newMaterial, setNewMaterial] = useState('');
  const [newMaterialQty, setNewMaterialQty] = useState('');
  const [newMaterialUnit, setNewMaterialUnit] = useState('pcs');
  const [newMaterialCost, setNewMaterialCost] = useState('');
  const [editedProfession, setEditedProfession] = useState(task.type || 'other');
  const [showReassignWarning, setShowReassignWarning] = useState(false);
  const [editingMaterialIndex, setEditingMaterialIndex] = useState<number | null>(null);
  const [editMaterialName, setEditMaterialName] = useState('');
  const [editMaterialQty, setEditMaterialQty] = useState('');
  const [editMaterialUnit, setEditMaterialUnit] = useState('pcs');
  const [editMaterialCost, setEditMaterialCost] = useState('');

  useEffect(() => {
    // Set initial message count after a delay to avoid sound on modal open
    const initialTimeout = setTimeout(() => {
      if (previousMessageCount.current === -1) {
        previousMessageCount.current = task.messages?.length || 0;
      }
    }, 500);

    // Poll for updates every 2 seconds to catch new messages
    const pollInterval = setInterval(() => {
      const projects = storage.getProjects();
      const project = projects.find(p => p.id === projectId);
      if (project) {
        const updatedTask = project.tasks.find(t => t.id === task.id);
        if (updatedTask) {
          // Check if new messages arrived (skip initial -1 state)
          const newMessageCount = updatedTask.messages?.length || 0;
          if (newMessageCount > previousMessageCount.current && previousMessageCount.current >= 0) {
            // Play chat sound for new messages
            playNotificationSound('chat');
          }
          previousMessageCount.current = newMessageCount;
          setCurrentTask(updatedTask);
        }
      }
    }, 2000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(pollInterval);
    };
  }, [projectId, task.id]);

  const handleAssign = () => {
    if (!selectedWorker || !assignDate || !assignTime) {
      alert('Please select worker, date and time');
      return;
    }

    storage.assignTask(projectId, task.id, selectedWorker, assignDate, assignTime, duration);
    onUpdate();
    onClose();
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    storage.sendMessage(projectId, task.id, messageText, 'Office');
    setMessageText('');

    // Trigger projectsUpdated event for worker views
    window.dispatchEvent(new Event('projectsUpdated'));

    onUpdate();
  };

  const handleSaveEdit = () => {
    // Track what changed for activity log
    const changes = [];
    if (editedDescription !== task.description) {
      changes.push(`Changed description from "${task.description}" to "${editedDescription}"`);
    }
    if (editedQuantity !== task.quantity) {
      changes.push(`Changed quantity from ${task.quantity} to ${editedQuantity}`);
    }
    if (editedPrice !== task.price) {
      changes.push(`Changed price from $${task.price} to $${editedPrice}`);
    }
    if (editedProfession !== task.type) {
      changes.push(`Changed profession from ${task.type} to ${editedProfession}`);
    }

    // Update task with edited values
    storage.updateTask(projectId, task.id, {
      description: editedDescription,
      quantity: editedQuantity,
      price: editedPrice,
      amount: editedQuantity * editedPrice,
      materials: editedMaterials,
      type: editedProfession
    });

    // Log activity for changes
    changes.forEach(change => {
      storage.addActivity(projectId, task.id, change, 'Robert');
    });

    setIsEditMode(false);
    onUpdate();

    // Refresh current task to show saved changes
    const projects = storage.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const updatedTask = project.tasks.find(t => t.id === task.id);
      if (updatedTask) {
        setCurrentTask(updatedTask);
      }
    }
  };

  const handleAddMaterial = () => {
    if (!newMaterial.trim()) return;

    const newMaterialObj: any = { name: newMaterial.trim() };
    const qty = newMaterialQty ? parseFloat(newMaterialQty) : null;
    const cost = newMaterialCost ? parseFloat(newMaterialCost) : null;

    if (qty) newMaterialObj.quantity = qty;
    if (newMaterialUnit) newMaterialObj.unit = newMaterialUnit;
    if (cost) newMaterialObj.estimatedCost = cost;

    // Auto-calculate total if both quantity and unit cost are provided
    if (qty && cost) {
      newMaterialObj.totalCost = qty * cost;
    }

    const updatedMaterials = [...editedMaterials, newMaterialObj];
    setEditedMaterials(updatedMaterials);

    // Save immediately to task
    storage.updateTask(projectId, task.id, {
      materials: updatedMaterials
    });

    // Log activity
    storage.addActivity(projectId, task.id, `Added material: ${newMaterial.trim()}`, 'Robert');

    // Clear inputs
    setNewMaterial('');
    setNewMaterialQty('');
    setNewMaterialUnit('pcs');
    setNewMaterialCost('');

    // Refresh task to show new material
    const projects = storage.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const updatedTask = project.tasks.find(t => t.id === task.id);
      if (updatedTask) {
        setCurrentTask(updatedTask);
      }
    }
  };

  const handleEditMaterial = (index: number) => {
    const material = editedMaterials[index];
    const materialName = typeof material === 'string' ? material : material.name;
    const materialQty = typeof material === 'object' ? material.quantity : null;
    const materialUnit = typeof material === 'object' ? material.unit : 'pcs';
    const materialCost = typeof material === 'object' ? material.estimatedCost : null;

    setEditingMaterialIndex(index);
    setEditMaterialName(materialName || '');
    setEditMaterialQty(materialQty ? String(materialQty) : '');
    setEditMaterialUnit(materialUnit || 'pcs');
    setEditMaterialCost(materialCost ? String(materialCost) : '');
  };

  const handleSaveMaterialEdit = () => {
    if (editingMaterialIndex === null || !editMaterialName.trim()) return;

    const updatedMaterialObj: any = { name: editMaterialName.trim() };
    const qty = editMaterialQty ? parseFloat(editMaterialQty) : null;
    const cost = editMaterialCost ? parseFloat(editMaterialCost) : null;

    if (qty) updatedMaterialObj.quantity = qty;
    if (editMaterialUnit) updatedMaterialObj.unit = editMaterialUnit;
    if (cost) updatedMaterialObj.estimatedCost = cost;

    // Auto-calculate total
    if (qty && cost) {
      updatedMaterialObj.totalCost = qty * cost;
    }

    const updatedMaterials = [...editedMaterials];
    updatedMaterials[editingMaterialIndex] = updatedMaterialObj;
    setEditedMaterials(updatedMaterials);

    // Save to task
    storage.updateTask(projectId, task.id, {
      materials: updatedMaterials
    });

    // Log activity
    storage.addActivity(projectId, task.id, `Updated material: ${editMaterialName.trim()}`, 'Robert');

    // Clear edit state
    setEditingMaterialIndex(null);
    setEditMaterialName('');
    setEditMaterialQty('');
    setEditMaterialUnit('pcs');
    setEditMaterialCost('');

    // Refresh task
    const projects = storage.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const updatedTask = project.tasks.find(t => t.id === task.id);
      if (updatedTask) {
        setCurrentTask(updatedTask);
      }
    }
  };

  const handleRemoveMaterial = (index: number) => {
    const materialName = typeof editedMaterials[index] === 'string'
      ? editedMaterials[index]
      : editedMaterials[index].name;

    const updatedMaterials = editedMaterials.filter((_, i) => i !== index);
    setEditedMaterials(updatedMaterials);

    // Save immediately to task
    storage.updateTask(projectId, task.id, {
      materials: updatedMaterials
    });

    // Log activity
    storage.addActivity(projectId, task.id, `Removed material: ${materialName}`, 'Robert');

    // Refresh task
    const projects = storage.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const updatedTask = project.tasks.find(t => t.id === task.id);
      if (updatedTask) {
        setCurrentTask(updatedTask);
      }
    }
  };

  const handleReassign = () => {
    if (!selectedWorker || !assignDate || !assignTime) {
      alert('Please select worker, date and time');
      return;
    }

    // Reset task to pending_acceptance state
    storage.updateTask(projectId, task.id, {
      status: 'pending_acceptance',
      assignedTo: selectedWorker,
      assignedDate: assignDate,
      time: assignTime,
      duration: duration
    });

    const worker = workers.find(w => w.id === selectedWorker);
    if (worker) {
      storage.addActivity(projectId, task.id, `Reassigned to ${worker.name}`, 'Robert');
    }

    setShowReassignWarning(false);
    onUpdate();
  };

  const getStatusInfo = () => {
    switch (task.status) {
      case 'unassigned':
      case 'rejected':
      case 'pending':
        return { label: 'Unassigned', color: 'bg-gray-100 text-gray-700' };
      case 'pending_acceptance':
        return { label: 'Assigned - Pending Acceptance', color: 'bg-amber-100 text-amber-700' };
      case 'accepted':
        return { label: 'Confirmed - Ready to Start', color: 'bg-green-100 text-green-700' };
      case 'in_progress':
        return { label: 'Confirmed - In Progress', color: 'bg-blue-100 text-blue-700' };
      case 'completed':
        return { label: 'Completed', color: 'bg-green-100 text-green-700' };
      default:
        return { label: task.status, color: 'bg-gray-100 text-gray-700' };
    }
  };

  const statusInfo = getStatusInfo();
  const assignedWorker = workers.find(w => w.id === task.assignedTo);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Clean Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              {isEditMode ? (
                <input
                  type="text"
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="text-lg font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none bg-transparent w-full"
                  placeholder="Task description..."
                />
              ) : (
                <h2 className="text-lg font-bold text-gray-900 leading-tight">{task.description}</h2>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              {isEditMode ? (
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-all font-semibold text-sm"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              ) : (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 transition-all font-semibold text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('navigateToProject', { detail: { projectId } }));
                onClose();
              }}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              #{projectNumber} • {projectClient}
            </button>
            <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            {isEditMode ? (
              <select
                value={editedProfession}
                onChange={(e) => setEditedProfession(e.target.value as any)}
                className="px-3 py-1 text-sm font-semibold bg-gray-100 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="hvac">HVAC</option>
                <option value="carpentry">Carpentry</option>
                <option value="electrical">Electrical</option>
                <option value="plumbing">Plumbing</option>
                <option value="roofing">Roofing</option>
                <option value="painting">Painting</option>
                <option value="flooring">Flooring</option>
                <option value="other">Other</option>
              </select>
            ) : currentTask.type ? (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold">
                {currentTask.type.charAt(0).toUpperCase() + currentTask.type.slice(1)}
              </span>
            ) : null}
            <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-bold">
              ${isEditMode ? editedPrice : task.price}
            </span>
          </div>
        </div>

        {/* Tabs - Below Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-6">

          {/* Tabs */}
          <div className="flex gap-6 pt-4">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-4 px-2 font-bold transition-all relative ${
                activeTab === 'details'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Details
              {activeTab === 'details' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('assign')}
              className={`pb-4 px-2 font-bold transition-all relative ${
                activeTab === 'assign'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Assign Worker
              {activeTab === 'assign' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`pb-4 px-2 font-bold transition-all relative ${
                activeTab === 'messages'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Messages
              {currentTask.messages && currentTask.messages.length > 0 && (
                <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {currentTask.messages.length}
                </span>
              )}
              {activeTab === 'messages' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`pb-4 px-2 font-bold transition-all relative ${
                activeTab === 'activity'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Activity Log
              {activeTab === 'activity' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t" />
              )}
            </button>
          </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'assign' ? (
            <div className="max-w-2xl mx-auto">
              {(task.status === 'unassigned' || task.status === 'rejected' || task.status === 'pending') ? (
                <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
                  <h3 className="font-black text-gray-900 mb-6 text-lg uppercase tracking-wide flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Assign Worker
                  </h3>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Worker</label>
                      <select
                        value={selectedWorker}
                        onChange={(e) => setSelectedWorker(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-semibold"
                      >
                        <option value="">Select worker...</option>
                        {workers.map(w => (
                          <option key={w.id} value={w.id}>
                            {w.name} ({w.skills.join(', ')})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Date</label>
                      <input
                        type="date"
                        value={assignDate}
                        onChange={(e) => setAssignDate(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Time</label>
                      <input
                        type="time"
                        value={assignTime}
                        onChange={(e) => setAssignTime(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Duration (hours)</label>
                      <input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        min="1"
                        max="24"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-semibold"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAssign}
                    className="mt-6 w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all text-lg"
                  >
                    Assign Worker
                  </button>
                </div>
              ) : (task.status === 'accepted' || task.status === 'in_progress' || task.status === 'pending_acceptance') && assignedWorker ? (
                <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
                  <h3 className="font-black text-gray-900 mb-6 text-lg uppercase tracking-wide flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Reassign Worker
                  </h3>

                  {!showReassignWarning ? (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6">
                      <p className="text-sm text-amber-900 mb-4 font-semibold">
                        Current assignment: <strong className="font-black">{assignedWorker.name}</strong> on {task.assignedDate} at {task.time}
                      </p>
                      <button
                        onClick={() => setShowReassignWarning(true)}
                        className="w-full px-6 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-black hover:from-amber-700 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all text-lg"
                      >
                        Change Assignment
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-5 mb-6">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-black text-red-900 mb-1">Warning: Task Status Will Reset</p>
                            <p className="text-sm text-red-800 font-semibold">
                              Reassigning this task will change its status back to "Pending Acceptance". The new worker will need to accept the task again.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">New Worker</label>
                          <select
                            value={selectedWorker}
                            onChange={(e) => setSelectedWorker(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-semibold"
                          >
                            <option value="">Select worker...</option>
                            {workers.map(w => (
                              <option key={w.id} value={w.id}>
                                {w.name} ({w.skills.join(', ')})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Date</label>
                          <input
                            type="date"
                            value={assignDate}
                            onChange={(e) => setAssignDate(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Time</label>
                          <input
                            type="time"
                            value={assignTime}
                            onChange={(e) => setAssignTime(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Duration (hours)</label>
                          <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            min="1"
                            max="24"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-semibold"
                          />
                        </div>
                      </div>

                      <div className="flex gap-4 mt-6">
                        <button
                          onClick={() => setShowReassignWarning(false)}
                          className="flex-1 px-6 py-4 border-2 border-gray-300 bg-white text-gray-700 rounded-xl font-black hover:bg-gray-50 shadow-sm hover:shadow-md transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleReassign}
                          className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all"
                        >
                          Confirm Reassignment
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          ) : activeTab === 'messages' ? (
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
                {currentTask.messages && currentTask.messages.length > 0 ? (
                  currentTask.messages.map((msg: any) => {
                    const isOffice = msg.sender === 'Office' || msg.sender === 'admin';
                    return (
                      <div key={msg.id} className={`flex ${isOffice ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[70%] rounded-xl p-4 ${
                          isOffice
                            ? 'bg-gray-100 text-gray-900'
                            : 'bg-blue-600 text-white'
                        }`}>
                          <div className="text-xs opacity-75 mb-1 font-medium">{msg.sender}</div>
                          <div className="text-sm">{msg.text}</div>
                          <div className="text-xs opacity-60 mt-1">
                            {new Date(msg.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <div className="text-gray-500 font-medium">No messages yet</div>
                    <div className="text-sm text-gray-400 mt-1">Start a conversation with the worker</div>
                  </div>
                )}
              </div>

              {/* Message input */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="space-y-2">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your message to the worker..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 bg-white placeholder:text-gray-400"
                    rows={3}
                    style={{ color: '#111827' }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    Send Message
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === 'details' ? (
            <div className="space-y-6">
              {/* Current Assignment - Luxury Style */}
              {assignedWorker && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-100 shadow-sm">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-md">
                      {assignedWorker.name ? assignedWorker.name.split(' ').map(n => n[0]).join('').slice(0, 2) : '??'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-gray-900 text-lg">{assignedWorker.name}</h3>
                      <div className="flex gap-2 flex-wrap mt-1">
                        {assignedWorker.skills.map(skill => (
                          <span key={skill} className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold border border-blue-200">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-blue-100">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        Date & Time
                      </div>
                      <div className="font-bold text-gray-900">{task.assignedDate} at {task.time}</div>
                    </div>
                    <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-blue-100">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        Duration
                      </div>
                      <div className="font-bold text-gray-900">{task.duration} hours</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Task Details - Simple */}
              <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Quantity</div>
                    {isEditMode ? (
                      <input
                        type="number"
                        value={editedQuantity}
                        onChange={(e) => setEditedQuantity(Number(e.target.value))}
                        className="text-lg font-bold text-gray-900 w-20 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    ) : (
                      <div className="text-lg font-bold text-gray-900">{task.quantity}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Unit Price</div>
                    {isEditMode ? (
                      <input
                        type="number"
                        value={editedPrice}
                        onChange={(e) => setEditedPrice(Number(e.target.value))}
                        className="text-lg font-bold text-gray-900 w-24 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      <div className="text-lg font-bold text-gray-900">${task.price}</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-1">Total</div>
                  <div className="text-2xl font-black text-blue-600">${isEditMode ? (editedQuantity * editedPrice).toFixed(2) : task.amount}</div>
                </div>
              </div>

              {/* Required Skills */}
              {task.skills && task.skills.length > 0 && (
                <div className="bg-white rounded-2xl p-5 border-2 border-gray-200 shadow-sm">
                  <h3 className="font-black text-gray-900 mb-4 text-sm uppercase tracking-wide">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {task.skills.map(skill => (
                      <span key={skill} className="px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 rounded-full text-sm font-bold border border-gray-300 shadow-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Materials Section */}
              <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-900">Materials</h3>
                  {editedMaterials.length > 0 && (
                    <span className="text-sm text-gray-500">{editedMaterials.length} items</span>
                  )}
                </div>

                {/* Add Material Form - Simple */}
                <div className="mb-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      value={newMaterial}
                      onChange={(e) => setNewMaterial(e.target.value)}
                      placeholder="Material name..."
                      className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <input
                      type="number"
                      value={newMaterialQty}
                      onChange={(e) => setNewMaterialQty(e.target.value)}
                      placeholder="Qty"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      step="0.01"
                    />
                    <select
                      value={newMaterialUnit}
                      onChange={(e) => setNewMaterialUnit(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="pcs">pcs</option>
                      <option value="ft">ft</option>
                      <option value="sqft">sqft</option>
                      <option value="lbs">lbs</option>
                      <option value="gal">gal</option>
                      <option value="box">box</option>
                      <option value="roll">roll</option>
                      <option value="bag">bag</option>
                    </select>
                    <input
                      type="number"
                      value={newMaterialCost}
                      onChange={(e) => setNewMaterialCost(e.target.value)}
                      placeholder="Cost ($)"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      step="0.01"
                    />
                  </div>
                  <button
                    onClick={handleAddMaterial}
                    disabled={!newMaterial.trim()}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Material
                  </button>
                </div>

                {editedMaterials.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {editedMaterials.map((material, index) => {
                      // Handle both string and object format
                      const materialName = typeof material === 'string' ? material : material.name;
                      const materialQty = typeof material === 'object' ? material.quantity : null;
                      const materialUnit = typeof material === 'object' ? material.unit : null;
                      const materialCost = typeof material === 'object' ? material.estimatedCost : null;

                      // Calculate total: quantity × unit cost
                      const calculatedTotal = materialQty && materialCost ? materialQty * materialCost : null;

                      // Check if this material is being edited
                      const isEditing = editingMaterialIndex === index;

                      return (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                          {isEditing ? (
                            // Edit mode - show input fields
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  value={editMaterialName}
                                  onChange={(e) => setEditMaterialName(e.target.value)}
                                  placeholder="Material name"
                                  className="col-span-2 px-4 py-3 border-2 border-blue-500 rounded-xl focus:ring-4 focus:ring-blue-100 text-sm font-semibold"
                                />
                                <input
                                  type="number"
                                  value={editMaterialQty}
                                  onChange={(e) => setEditMaterialQty(e.target.value)}
                                  placeholder="Quantity"
                                  className="px-4 py-3 border-2 border-blue-500 rounded-xl focus:ring-4 focus:ring-blue-100 text-sm font-semibold"
                                  step="0.01"
                                />
                                <select
                                  value={editMaterialUnit}
                                  onChange={(e) => setEditMaterialUnit(e.target.value)}
                                  className="px-4 py-3 border-2 border-blue-500 rounded-xl focus:ring-4 focus:ring-blue-100 text-sm font-semibold"
                                >
                                  <option value="pcs">pcs</option>
                                  <option value="ft">ft</option>
                                  <option value="sqft">sqft</option>
                                  <option value="lbs">lbs</option>
                                  <option value="gal">gal</option>
                                  <option value="box">box</option>
                                  <option value="roll">roll</option>
                                  <option value="bag">bag</option>
                                </select>
                                <input
                                  type="number"
                                  value={editMaterialCost}
                                  onChange={(e) => setEditMaterialCost(e.target.value)}
                                  placeholder="Est. cost ($)"
                                  className="col-span-2 px-4 py-3 border-2 border-blue-500 rounded-xl focus:ring-4 focus:ring-blue-100 text-sm font-semibold"
                                  step="0.01"
                                />
                              </div>
                              <div className="flex gap-3">
                                <button
                                  onClick={handleSaveMaterialEdit}
                                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-bold shadow-md hover:shadow-lg transition-all"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingMaterialIndex(null)}
                                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 text-sm font-bold transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            // Display mode - show material info
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-900 text-sm truncate">{materialName}</div>
                                  {(materialQty || materialCost) && (
                                    <div className="text-xs text-gray-500 mt-0.5">
                                      {materialQty && materialUnit && <span>{materialQty} {materialUnit}</span>}
                                      {materialQty && materialUnit && materialCost && <span className="mx-1">•</span>}
                                      {materialCost && <span>${materialCost.toFixed(2)}/unit</span>}
                                      {calculatedTotal && (
                                        <>
                                          <span className="mx-1">•</span>
                                          <span className="font-semibold text-blue-600">${calculatedTotal.toFixed(2)}</span>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <button
                                  onClick={() => handleEditMaterial(index)}
                                  className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs font-medium transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleRemoveMaterial(index)}
                                  className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs font-medium transition-colors"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <div className="text-sm text-gray-500">No materials listed</div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="space-y-4">
              {task.activity && task.activity.length > 0 ? (
                // Sort activity by date descending (latest first)
                [...task.activity].sort((a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
                ).map((activity) => {
                  // Determine icon and color based on action
                  let icon, bgColor, iconColor;
                  const action = activity.action.toLowerCase();

                  if (action.includes('assigned')) {
                    icon = <UserPlus className="w-5 h-5" />;
                    bgColor = 'bg-blue-100';
                    iconColor = 'text-blue-600';
                  } else if (action.includes('accepted')) {
                    icon = <CheckCircle className="w-5 h-5" />;
                    bgColor = 'bg-green-100';
                    iconColor = 'text-green-600';
                  } else if (action.includes('rejected')) {
                    icon = <XCircle className="w-5 h-5" />;
                    bgColor = 'bg-red-100';
                    iconColor = 'text-red-600';
                  } else if (action.includes('started')) {
                    icon = <Play className="w-5 h-5" />;
                    bgColor = 'bg-purple-100';
                    iconColor = 'text-purple-600';
                  } else if (action.includes('completed')) {
                    icon = <CheckCircle className="w-5 h-5" />;
                    bgColor = 'bg-emerald-100';
                    iconColor = 'text-emerald-600';
                  } else if (action.includes('photo') || action.includes('uploaded')) {
                    icon = <ImageIcon className="w-5 h-5" />;
                    bgColor = 'bg-indigo-100';
                    iconColor = 'text-indigo-600';
                  } else if (action.includes('message')) {
                    icon = <MessageSquare className="w-5 h-5" />;
                    bgColor = 'bg-amber-100';
                    iconColor = 'text-amber-600';
                  } else {
                    icon = <AlertCircle className="w-5 h-5" />;
                    bgColor = 'bg-gray-100';
                    iconColor = 'text-gray-600';
                  }

                  return (
                    <div key={activity.id} className="flex gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                      <div className={`w-11 h-11 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-base">{activity.action}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">{activity.user}</span>
                          <span className="mx-2">•</span>
                          <span>{new Date(activity.date).toLocaleString()}</span>
                        </div>
                        {activity.details && (
                          <div className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded-lg">
                            {activity.details}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <div className="text-gray-500 font-medium">No activity yet</div>
                  <div className="text-sm text-gray-400 mt-1">Task activity will appear here</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 border border-gray-300 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
