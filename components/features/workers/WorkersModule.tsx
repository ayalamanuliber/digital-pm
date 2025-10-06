'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, CheckCircle, Clock, AlertTriangle, Award, Briefcase, CalendarDays, TrendingUp, MapPin, Phone, Mail, ArrowLeft, MessageSquare, X } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type SkillType = 'HVAC' | 'Electrical' | 'Plumbing' | 'Carpentry' | 'Masonry' | 'Painting' | 'Roofing' | 'Drywall' | 'Flooring' | 'Landscaping';

interface Worker {
  id: string;
  name: string;
  phone: string;
  email: string;
  skills: SkillType[];
  status: 'available' | 'busy' | 'at-capacity' | 'off';
  efficiency: number;
  completedTasks: number;
  location: string;
  hourlyRate: number;
  hoursThisWeek: number;
  hoursNextWeek: number;
  createdAt: string;
  updatedAt: string;
}

const SKILL_COLORS: Record<SkillType, string> = {
  'HVAC': 'bg-blue-100 text-blue-700 border-blue-200',
  'Electrical': 'bg-amber-100 text-amber-700 border-amber-200',
  'Plumbing': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Carpentry': 'bg-orange-100 text-orange-700 border-orange-200',
  'Masonry': 'bg-stone-100 text-stone-700 border-stone-200',
  'Painting': 'bg-purple-100 text-purple-700 border-purple-200',
  'Roofing': 'bg-red-100 text-red-700 border-red-200',
  'Drywall': 'bg-gray-100 text-gray-700 border-gray-200',
  'Flooring': 'bg-orange-100 text-orange-700 border-orange-200',
  'Landscaping': 'bg-green-100 text-green-700 border-green-200'
};

// ============================================================================
// MAIN WORKERS VIEW
// ============================================================================

export default function WorkersModule() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [view, setView] = useState<'list' | 'detail' | 'add'>('list');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSkill, setFilterSkill] = useState<SkillType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'busy' | 'at-capacity' | 'off'>('all');
  const [loading, setLoading] = useState(true);

  // Fetch workers on mount
  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const response = await fetch('/api/workers');
      if (response.ok) {
        const data = await response.json();
        setWorkers(data);
      }
    } catch (error) {
      console.error('Failed to fetch workers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         worker.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSkill = filterSkill === 'all' || worker.skills.includes(filterSkill);
    const matchesStatus = filterStatus === 'all' || worker.status === filterStatus;
    return matchesSearch && matchesSkill && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: workers.length,
    available: workers.filter(w => w.status === 'available').length,
    busy: workers.filter(w => w.status === 'busy').length,
    atCapacity: workers.filter(w => w.status === 'at-capacity').length,
    avgEfficiency: workers.length > 0 ? Math.round(workers.reduce((acc, w) => acc + w.efficiency, 0) / workers.length) : 0,
    totalHoursThisWeek: workers.reduce((acc, w) => acc + w.hoursThisWeek, 0),
    availableHoursThisWeek: workers.reduce((acc, w) => acc + Math.max(0, 40 - w.hoursThisWeek), 0)
  };

  if (view === 'detail' && selectedWorker) {
    return <WorkerDetailView worker={selectedWorker} onBack={() => setView('list')} />;
  }

  if (view === 'add') {
    return (
      <AddWorkerModal
        onClose={() => setView('list')}
        onSave={async (newWorker) => {
          try {
            const response = await fetch('/api/workers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newWorker)
            });
            if (response.ok) {
              await fetchWorkers();
              setView('list');
            }
          } catch (error) {
            console.error('Failed to add worker:', error);
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Workforce Management</h1>
            <p className="text-gray-600">Team capacity, assignments, and performance tracking</p>
          </div>
          <button
            onClick={() => setView('add')}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add Worker
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-xs font-semibold">TOTAL TEAM</p>
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-green-700 text-xs font-semibold">AVAILABLE</p>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-700">{stats.available}</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-amber-700 text-xs font-semibold">BUSY</p>
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-700">{stats.busy}</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-red-700 text-xs font-semibold">AT CAPACITY</p>
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-700">{stats.atCapacity}</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-xs font-semibold">THIS WEEK</p>
              <CalendarDays className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalHoursThisWeek}h</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-xs font-semibold">AVG EFFICIENCY</p>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.avgEfficiency}%</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search workers or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={filterSkill}
              onChange={(e) => setFilterSkill(e.target.value as SkillType | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Skills</option>
              {Object.keys(SKILL_COLORS).map(skill => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="at-capacity">At Capacity</option>
              <option value="off">Off Duty</option>
            </select>
          </div>
        </div>
      </div>

      {/* Workers Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workers...</p>
        </div>
      ) : filteredWorkers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-800 text-lg font-semibold mb-2">
            {workers.length === 0 ? 'No workers yet' : 'No workers found'}
          </p>
          <p className="text-gray-600 mb-6">
            {workers.length === 0 ? 'Add your first worker to get started' : 'Try adjusting your filters'}
          </p>
          {workers.length === 0 && (
            <button
              onClick={() => setView('add')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5 inline mr-2" />
              Add First Worker
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkers.map(worker => (
            <WorkerCard
              key={worker.id}
              worker={worker}
              onClick={() => {
                setSelectedWorker(worker);
                setView('detail');
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// WORKER CARD
// ============================================================================

function WorkerCard({ worker, onClick }: { worker: Worker; onClick: () => void }) {
  const statusConfig = {
    available: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'Available' },
    busy: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, label: 'Busy' },
    'at-capacity': { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle, label: 'At Capacity' },
    off: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Clock, label: 'Off Duty' }
  };

  const config = statusConfig[worker.status];
  const StatusIcon = config.icon;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-600/30">
            {worker.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h3 className="font-bold text-gray-800">{worker.name}</h3>
            <p className="text-xs text-gray-500">{worker.location}</p>
          </div>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${config.color}`}>
          <StatusIcon className="w-3 h-3" />
          {config.label}
        </span>
      </div>

      {/* Skills */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-1">
          {worker.skills.slice(0, 3).map(skill => (
            <span
              key={skill}
              className={`px-2 py-0.5 rounded text-xs font-medium border ${SKILL_COLORS[skill]}`}
            >
              {skill}
            </span>
          ))}
          {worker.skills.length > 3 && (
            <span className="px-2 py-0.5 rounded text-xs text-gray-500">
              +{worker.skills.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 text-xs">
        <div className="flex items-center gap-1">
          <Award className="w-4 h-4 text-blue-600" />
          <span className="text-gray-600 font-medium">{worker.efficiency}%</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-amber-600" />
          <span className="text-gray-600 font-medium">{worker.hoursThisWeek}h/wk</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-gray-600 font-medium">{worker.completedTasks} done</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// WORKER DETAIL VIEW
// ============================================================================

function WorkerDetailView({ worker, onBack }: { worker: Worker; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Team
      </button>

      {/* Worker Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-600/30">
              {worker.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{worker.name}</h1>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{worker.location}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{worker.phone}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{worker.email}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <MessageSquare className="w-4 h-4" />
              Message
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-5 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">${worker.hourlyRate}</p>
            <p className="text-xs text-gray-500">Hourly Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{worker.efficiency}%</p>
            <p className="text-xs text-gray-500">Efficiency</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{worker.hoursThisWeek}h</p>
            <p className="text-xs text-gray-500">This Week</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{worker.hoursNextWeek}h</p>
            <p className="text-xs text-gray-500">Next Week</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">{worker.completedTasks}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
        </div>

        {/* Skills */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm font-semibold text-gray-600 mb-3">SKILLS & TRADES</p>
          <div className="flex flex-wrap gap-2">
            {worker.skills.map(skill => (
              <span
                key={skill}
                className={`px-3 py-1 rounded-lg text-sm font-medium border ${SKILL_COLORS[skill]}`}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Placeholder for future tabs */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
        <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">Task assignments and performance tracking coming soon</p>
      </div>
    </div>
  );
}

// ============================================================================
// ADD WORKER MODAL
// ============================================================================

function AddWorkerModal({ onClose, onSave }: { onClose: () => void; onSave: (worker: Omit<Worker, 'id' | 'createdAt' | 'updatedAt'>) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    hourlyRate: '',
    skills: [] as SkillType[],
    status: 'available' as Worker['status'],
    efficiency: 100,
    completedTasks: 0,
    hoursThisWeek: 0,
    hoursNextWeek: 0
  });

  const toggleSkill = (skill: SkillType) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.phone || formData.skills.length === 0) {
      alert('Please fill in required fields (Name, Phone, and at least one Skill)');
      return;
    }

    onSave({
      ...formData,
      hourlyRate: parseFloat(formData.hourlyRate) || 0
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Add New Worker</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(720) 555-0123"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Denver, CO"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hourly Rate ($)</label>
                <input
                  type="number"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  placeholder="55"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Skills & Trades *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.keys(SKILL_COLORS).map(skill => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill as SkillType)}
                    className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                      formData.skills.includes(skill as SkillType)
                        ? `${SKILL_COLORS[skill as SkillType]} border-current`
                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
              >
                Add Worker
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
