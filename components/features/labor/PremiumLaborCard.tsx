'use client';

import React, { useState } from 'react';
import { MapPin, Calendar, Clock, CheckCircle, Camera, Phone, MessageSquare, Package, Wrench, Image, Trash2, Bell, AlertCircle, ChevronRight, User } from 'lucide-react';

interface TaskData {
  id: string;
  taskName: string;
  clientName: string;
  address: string;
  date: string;
  time: string;
  duration: string;
  assignedTo: string;
  projectId?: string;
  projectNumber?: string;
  materials?: Array<{ name: string; specs: string; qty: string; location: string }>;
  tools?: Array<{ name: string; note: string }>;
  steps?: Array<{ id: number; title: string; action: string; minPhotos?: number }>;
  notes?: string[];
  contacts: { office: string };
}

interface PremiumLaborCardProps {
  taskData?: TaskData;
  workerId?: string;
  onComplete?: () => void;
}

export default function PremiumLaborCard({ taskData: propTaskData, workerId, onComplete }: PremiumLaborCardProps) {
  // Default demo data for when no props are passed
  const DEFAULT_TASK_DATA: TaskData = {
    id: "T-2011-003",
    taskName: "Install bathroom fan",
    clientName: "Jack Shippee",
    address: "2690 Stuart St, Denver CO 80212",
    date: "Oct 8, 2025",
    time: "9:00 AM",
    duration: "2-3 hours",
    assignedTo: "Carlos",
    materials: [
      { name: "Bathroom exhaust fan kit", specs: "Broan 688 - 50 CFM", qty: "1 unit", location: "Shop - Shelf B3" },
      { name: "4\" flexible duct", specs: "Aluminum, insulated", qty: "8 feet", location: "Truck" },
      { name: "Exterior vent cap", specs: "4\" white", qty: "1 unit", location: "Shop - Shelf B3" },
      { name: "Wire nuts", specs: "Yellow (14-16 AWG)", qty: "4 pcs", location: "Truck" },
      { name: "Mounting screws", specs: "1.5\" wood", qty: "8 pcs", location: "Truck" }
    ],
    tools: [
      { name: "Power drill", note: "3/8\" and 1/8\" bits" },
      { name: "Reciprocating saw", note: "For duct routing" },
      { name: "Wire stripper", note: "" },
      { name: "Screwdriver set", note: "Phillips + flat" },
      { name: "Ladder", note: "6ft minimum" },
      { name: "Voltage tester", note: "Safety" }
    ],
    steps: [
      { id: 1, title: "Document Before", action: "Take photos showing current condition from multiple angles.", minPhotos: 2 },
      { id: 2, title: "Cut Opening", action: "Mark location between joists. Check for wiring/pipes first. Cut per template." },
      { id: 3, title: "Run Ductwork", action: "Route duct to exterior with downward slope. Secure every 4ft.", minPhotos: 2 },
      { id: 4, title: "Wire It Up", action: "⚡ POWER OFF - Match colors: black→black, white→white, ground→ground." },
      { id: 5, title: "Mount & Test", action: "Secure housing. Power ON. Test with customer - should be quiet + strong.", minPhotos: 1 }
    ],
    notes: [
      "Jack will be home - knock first",
      "Park on street (RV in driveway)",
      "2 friendly dogs - they're loud",
      "Upstairs bathroom, 2nd door left"
    ],
    contacts: { office: "(303) 555-0199" }
  };

  const TASK_DATA = propTaskData || DEFAULT_TASK_DATA;
  const [phase, setPhase] = useState<'review' | 'calendar' | 'prep' | 'active' | 'cleanup' | 'inspection' | 'done'>('review');
  const [reminderTime, setReminderTime] = useState('1hr');
  const [checkedMat, setCheckedMat] = useState<number[]>([]);
  const [checkedTools, setCheckedTools] = useState<number[]>([]);
  const [doneSteps, setDoneSteps] = useState<number[]>([]);
  const [stepPhotos, setStepPhotos] = useState<Record<number, Array<{id: number, ts: string}>>>({});
  const [expandStep, setExpandStep] = useState<number | null>(null);
  const [cleanChecks, setCleanChecks] = useState<string[]>([]);
  const [cleanPhotos, setCleanPhotos] = useState<Array<{id: number, ts: string}>>([]);
  const [inspectDone, setInspectDone] = useState(false);
  const [customerOK, setCustomerOK] = useState(false);
  const [finalPhotos, setFinalPhotos] = useState<Array<{id: number, ts: string}>>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showComm, setShowComm] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  const formatDateForCalendar = (dateStr: string, timeStr: string, reminder: string) => {
    const date = new Date(`${dateStr} ${timeStr}`);
    const startDate = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
    const endDateFormatted = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    let reminderTrigger;
    switch(reminder) {
      case '30min': reminderTrigger = '-PT30M'; break;
      case '1hr': reminderTrigger = '-PT1H'; break;
      case '2hr': reminderTrigger = '-PT2H'; break;
      case '1day': reminderTrigger = '-P1D'; break;
      default: reminderTrigger = '-PT1H';
    }

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Modern Design & Development//Job Card//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `DTSTART:${startDate}`,
      `DTEND:${endDateFormatted}`,
      `SUMMARY:${TASK_DATA.taskName} - ${TASK_DATA.clientName}`,
      `DESCRIPTION:Task: ${TASK_DATA.taskName}\\nClient: ${TASK_DATA.clientName}\\nEstimated Duration: ${TASK_DATA.duration}\\n\\nNotes:\\n${TASK_DATA.notes.join('\\n')}`,
      `LOCATION:${TASK_DATA.address}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      `TRIGGER:${reminderTrigger}`,
      'ACTION:DISPLAY',
      `DESCRIPTION:Job starting soon - ${TASK_DATA.taskName}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return icsContent;
  };

  const downloadCalendar = () => {
    const icsContent = formatDateForCalendar(TASK_DATA.date, TASK_DATA.time, reminderTime);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `job-${TASK_DATA.id}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const addPhoto = (stepId: number) => {
    const curr = stepPhotos[stepId] || [];
    setStepPhotos({ ...stepPhotos, [stepId]: [...curr, { id: Date.now(), ts: new Date().toISOString() }] });
  };

  const rmPhoto = (stepId: number, photoId: number) => {
    setStepPhotos({ ...stepPhotos, [stepId]: (stepPhotos[stepId] || []).filter(p => p.id !== photoId) });
  };

  const canComplete = (step: typeof TASK_DATA.steps[0]) => !step.minPhotos || (stepPhotos[step.id] || []).length >= step.minPhotos;

  React.useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const CommFloater = () => (
    <>
      {showTooltip && !showComm && (
        <div className="fixed bottom-24 left-6 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl z-50">
          <div className="text-sm font-bold mb-1">Need Help?</div>
          <div className="text-xs opacity-90">Tap to contact office anytime</div>
          <div className="absolute -bottom-2 left-8 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-900" />
        </div>
      )}

      <button
        onClick={() => { setShowComm(!showComm); setShowTooltip(false); }}
        className="fixed bottom-6 left-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-transform relative"
      >
        {showTooltip && (
          <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75" />
        )}
        <MessageSquare size={24} strokeWidth={2.5} />
      </button>

      {showComm && (
        <div className="fixed bottom-24 left-6 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 w-72">
          <div className="text-center mb-3">
            <div className="text-sm font-black text-slate-900">Contact Office</div>
            <div className="text-xs text-slate-500">Messages logged in system</div>
          </div>
          <div className="space-y-2">
            <a
              href={`tel:${TASK_DATA.contacts.office}`}
              onClick={() => setShowComm(false)}
              className="w-full flex items-center gap-3 bg-green-500 hover:bg-green-600 active:scale-95 text-white p-3 rounded-xl transition-all font-medium"
            >
              <Phone size={20} />
              <div className="text-left">
                <div className="font-bold text-sm">Call Office</div>
                <div className="text-xs opacity-90">{TASK_DATA.contacts.office}</div>
              </div>
            </a>
            <a
              href={`sms:${TASK_DATA.contacts.office}?body=Hi, this is ${TASK_DATA.assignedTo} on job ${TASK_DATA.id} (${TASK_DATA.taskName}). `}
              onClick={() => setShowComm(false)}
              className="w-full flex items-center gap-3 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white p-3 rounded-xl transition-all font-medium"
            >
              <MessageSquare size={20} />
              <div className="text-left">
                <div className="font-bold text-sm">Text Office</div>
                <div className="text-xs opacity-90">Response in 15 min avg</div>
              </div>
            </a>
          </div>
        </div>
      )}
    </>
  );

  if (phase === 'review') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bell size={24} />
              </div>
              <div>
                <div className="text-2xl font-black mb-1">New Job Assigned</div>
                <div className="text-orange-100">Review the details and accept when ready</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-slate-400 font-medium">#{TASK_DATA.id}</div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full">
                  <User size={14} />
                  <span className="text-sm font-medium">{TASK_DATA.assignedTo}</span>
                </div>
              </div>
              <h1 className="text-3xl font-black mb-2">{TASK_DATA.taskName}</h1>
              <div className="text-lg text-slate-300 mb-6">for {TASK_DATA.clientName}</div>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-slate-300">
                  <Calendar size={18} />
                  <span className="font-medium">{TASK_DATA.date}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock size={18} />
                  <span className="font-medium">{TASK_DATA.time}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 border-b border-blue-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <MapPin size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Location</div>
                  <div className="text-xl font-bold text-slate-900 mb-3">{TASK_DATA.address}</div>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(TASK_DATA.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:scale-95 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all inline-flex"
                  >
                    Open in Maps
                    <ChevronRight size={18} />
                  </a>
                </div>
              </div>
            </div>

            {((TASK_DATA.materials && TASK_DATA.materials.length > 0) || (TASK_DATA.tools && TASK_DATA.tools.length > 0)) && (
              <div className="grid grid-cols-2 gap-4 p-6 bg-slate-50">
                {TASK_DATA.materials && TASK_DATA.materials.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                        <Package size={20} className="text-green-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-black text-slate-900">{TASK_DATA.materials.length}</div>
                        <div className="text-xs font-medium text-slate-500">Materials</div>
                      </div>
                    </div>
                  </div>
                )}
                {TASK_DATA.tools && TASK_DATA.tools.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Wrench size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-black text-slate-900">{TASK_DATA.tools.length}</div>
                        <div className="text-xs font-medium text-slate-500">Tools</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {TASK_DATA.notes && TASK_DATA.notes.length > 0 && (
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 border-t border-amber-200">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-amber-900 uppercase tracking-wider mb-3">Important Notes</div>
                    <div className="space-y-2">
                      {TASK_DATA.notes.map((note, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-amber-900 font-medium leading-relaxed">{note}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="p-6 space-y-3">
              <button
                onClick={() => setPhase('calendar')}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:scale-[0.98] text-white font-black py-5 rounded-2xl shadow-xl transition-all text-lg flex items-center justify-center gap-3"
              >
                <CheckCircle size={24} />
                Accept Job
              </button>
              <button className="w-full border-2 border-slate-300 hover:border-slate-400 active:scale-[0.98] text-slate-700 font-bold py-4 rounded-2xl transition-all">
                I&apos;m Missing Something
              </button>
            </div>
          </div>
        </div>
        <CommFloater />
      </div>
    );
  }

  if (phase === 'calendar') {
    const reminderLabels: Record<string, string> = {
      '30min': '30 minutes before',
      '1hr': '1 hour before',
      '2hr': '2 hours before',
      '1day': '1 day before'
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex items-center gap-3 mb-3">
                <Calendar size={32} />
                <h2 className="text-2xl font-black">Add to Calendar</h2>
              </div>
              <p className="text-blue-100">Get reminded before the job starts</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Event</div>
                  <div className="font-black text-slate-900">{TASK_DATA.taskName}</div>
                  <div className="text-sm text-slate-600">for {TASK_DATA.clientName}</div>
                </div>

                <div className="h-px bg-slate-200" />

                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">When</div>
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Calendar size={16} />
                    {TASK_DATA.date} at {TASK_DATA.time}
                  </div>
                  <div className="text-sm text-slate-600">Duration: {TASK_DATA.duration}</div>
                </div>

                <div className="h-px bg-slate-200" />

                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Location</div>
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <MapPin size={16} />
                    {TASK_DATA.address}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-900 mb-3 block">
                  Remind me:
                </label>
                <div className="space-y-2">
                  {Object.entries(reminderLabels).map(([value, label]) => (
                    <div
                      key={value}
                      onClick={() => setReminderTime(value)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all active:scale-[0.98] ${
                        reminderTime === value
                          ? 'bg-blue-50 border-blue-500 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          reminderTime === value
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-slate-300'
                        }`}>
                          {reminderTime === value && (
                            <div className="w-3 h-3 bg-white rounded-full" />
                          )}
                        </div>
                        <span className={`font-bold ${reminderTime === value ? 'text-blue-900' : 'text-slate-700'}`}>
                          {label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    downloadCalendar();
                    setTimeout(() => setPhase('prep'), 1000);
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] text-white font-black py-5 rounded-2xl shadow-xl transition-all text-lg flex items-center justify-center gap-3"
                >
                  <Calendar size={24} />
                  Add to Calendar
                </button>
                <button
                  onClick={() => setPhase('prep')}
                  className="w-full border-2 border-slate-300 hover:border-slate-400 active:scale-[0.98] text-slate-700 font-bold py-4 rounded-2xl transition-all"
                >
                  Skip for Now
                </button>
              </div>
            </div>
          </div>
        </div>
        <CommFloater />
      </div>
    );
  }

  if (phase === 'prep') {
    const materials = TASK_DATA.materials || [];
    const tools = TASK_DATA.tools || [];
    const allMat = materials.length === 0 || checkedMat.length === materials.length;
    const allTool = tools.length === 0 || checkedTools.length === tools.length;
    const ready = allMat && allTool;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <CheckCircle size={28} />
              </div>
              <div>
                <div className="text-2xl font-black">Job Accepted ✓</div>
                <div className="text-green-100">Load your truck before heading out</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="text-sm text-slate-500 mb-1">#{TASK_DATA.id}</div>
            <h2 className="text-2xl font-black text-slate-900">{TASK_DATA.taskName}</h2>
          </div>

          {materials.length > 0 && (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package size={22} className="text-white" />
                  <span className="font-black text-white text-lg">Materials</span>
                </div>
                <div className="bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                  <span className="text-sm font-black text-white">{checkedMat.length}/{materials.length}</span>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {materials.map((m, i) => {
                const checked = checkedMat.includes(i);
                return (
                  <div
                    key={i}
                    onClick={() => checked ? setCheckedMat(checkedMat.filter(x => x !== i)) : setCheckedMat([...checkedMat, i])}
                    className={`rounded-2xl p-4 border-2 cursor-pointer transition-all active:scale-[0.98] ${
                      checked
                        ? 'bg-green-50 border-green-400 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        checked
                          ? 'bg-green-500 border-green-500'
                          : 'border-slate-300 bg-white'
                      }`}>
                        {checked && <CheckCircle size={18} className="text-white" strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900">{m.name}</div>
                        <div className="text-sm text-slate-600 mt-0.5">{m.qty} • {m.specs}</div>
                        <div className="text-xs text-blue-600 font-bold mt-1">📍 {m.location}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}

          {tools.length > 0 && (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wrench size={22} className="text-white" />
                  <span className="font-black text-white text-lg">Tools</span>
                </div>
                <div className="bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                  <span className="text-sm font-black text-white">{checkedTools.length}/{tools.length}</span>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {tools.map((t, i) => {
                const checked = checkedTools.includes(i);
                return (
                  <div
                    key={i}
                    onClick={() => checked ? setCheckedTools(checkedTools.filter(x => x !== i)) : setCheckedTools([...checkedTools, i])}
                    className={`rounded-2xl p-4 border-2 cursor-pointer transition-all active:scale-[0.98] ${
                      checked
                        ? 'bg-blue-50 border-blue-400 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        checked
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-slate-300 bg-white'
                      }`}>
                        {checked && <CheckCircle size={18} className="text-white" strokeWidth={3} />}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-slate-900">{t.name}</div>
                        {t.note && <div className="text-sm text-slate-600 mt-0.5">{t.note}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}

          <button
            onClick={() => ready && (setStartTime(new Date()), setPhase('active'))}
            disabled={!ready}
            className={`w-full font-black py-6 rounded-2xl text-xl shadow-xl transition-all ${
              ready
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {ready ? (materials.length > 0 || tools.length > 0 ? '🚀 All Loaded - Head to Site' : '🚀 Head to Site') : 'Check All Items First'}
          </button>
        </div>
        <CommFloater />
      </div>
    );
  }

  if (phase === 'active') {
    const steps = TASK_DATA.steps || [];
    const progress = steps.length > 0 ? (doneSteps.length / steps.length) * 100 : 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-24">
        <div className="sticky top-0 bg-white/80 backdrop-blur-xl shadow-lg z-30 border-b border-slate-200">
          <div className="max-w-2xl mx-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">#{TASK_DATA.id} • On-Site</div>
                <h2 className="text-xl font-black text-slate-900">{TASK_DATA.taskName}</h2>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                  {doneSteps.length}/{steps.length}
                </div>
                <div className="text-xs text-slate-500 font-bold">STEPS</div>
              </div>
            </div>
            <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${progress}%` }}
              >
                {progress > 15 && (
                  <span className="text-white text-xs font-black drop-shadow">{Math.round(progress)}%</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-4 space-y-3 mt-4">
          {steps.length === 0 && (
            <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
              <p className="text-lg text-slate-600 mb-4">No specific work steps defined for this task.</p>
              <button
                onClick={() => setPhase('cleanup')}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] text-white font-bold py-4 px-8 rounded-2xl shadow-lg transition-all"
              >
                Skip to Cleanup →
              </button>
            </div>
          )}
          {steps.map((step) => {
            const done = doneSteps.includes(step.id);
            const exp = expandStep === step.id;
            const photos = stepPhotos[step.id] || [];
            const canDo = canComplete(step);

            return (
              <div
                key={step.id}
                className={`bg-white rounded-3xl shadow-xl overflow-hidden border-2 transition-all ${
                  done ? 'opacity-50 border-slate-200' : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div
                  onClick={() => !done && setExpandStep(exp ? null : step.id)}
                  className={`p-6 flex items-start gap-4 cursor-pointer ${done ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex-shrink-0">
                    {done ? (
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <CheckCircle size={28} className="text-white" strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="w-12 h-12 border-4 border-blue-500 bg-white rounded-2xl flex items-center justify-center text-blue-600 font-black text-xl shadow-lg">
                        {step.id}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className={`text-xl font-black mb-2 ${done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                      {step.title}
                    </h3>
                    <p className={`text-sm leading-relaxed ${done ? 'text-slate-400' : 'text-slate-600'}`}>
                      {step.action}
                    </p>
                    {photos.length > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <Image size={18} className="text-green-600" />
                        <span className="text-sm font-bold text-green-600">{photos.length} photo{photos.length > 1 ? 's' : ''} ✓</span>
                      </div>
                    )}
                    {step.minPhotos && photos.length < step.minPhotos && (
                      <div className="mt-2 text-xs font-bold text-amber-600">
                        📸 Need {step.minPhotos - photos.length} more photo{step.minPhotos - photos.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>

                {exp && !done && (
                  <div className="px-6 pb-6 space-y-3 border-t-2 border-slate-100 pt-4">
                    {photos.length > 0 && (
                      <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                        {photos.map((p) => (
                          <div key={p.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-2">
                              <Image size={16} className="text-blue-600" />
                              <span className="text-sm font-bold text-slate-700">Photo {photos.indexOf(p) + 1}</span>
                              <span className="text-xs text-slate-500">{new Date(p.ts).toLocaleTimeString()}</span>
                            </div>
                            <button onClick={() => rmPhoto(step.id, p.id)} className="text-red-500 hover:text-red-600 active:scale-90 transition-all">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => { addPhoto(step.id); }}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg transition-all"
                    >
                      <Camera size={24} />
                      {photos.length > 0 ? 'Add Another Photo' : 'Take Photo'}
                    </button>

                    <button
                      onClick={() => canDo && (setDoneSteps([...doneSteps, step.id]), setExpandStep(null))}
                      disabled={!canDo}
                      className={`w-full font-bold py-4 rounded-2xl shadow-lg transition-all ${
                        canDo
                          ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:scale-[0.98] text-white'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {!canDo ? `Need ${step.minPhotos! - photos.length} More Photo${step.minPhotos! - photos.length > 1 ? 's' : ''}` : '✓ Mark Complete'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {steps.length > 0 && doneSteps.length === steps.length && (
          <div className="fixed bottom-0 inset-x-0 bg-gradient-to-t from-white via-white to-transparent p-6 border-t-4 border-orange-500 shadow-2xl">
            <div className="max-w-2xl mx-auto">
              <button
                onClick={() => setPhase('cleanup')}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] text-white font-black py-6 rounded-2xl flex items-center justify-center gap-3 text-xl shadow-2xl transition-all"
              >
                Work Done - Start Cleanup 🧹
              </button>
            </div>
          </div>
        )}

        <CommFloater />
      </div>
    );
  }

  if (phase === 'cleanup') {
    const cleanTasks = [
      { id: 'debris', label: 'All debris removed' },
      { id: 'wipe', label: 'Surfaces wiped clean' },
      { id: 'tools', label: 'All tools packed' },
      { id: 'sweep', label: 'Floor swept/vacuumed' }
    ];
    const allDone = cleanTasks.every(t => cleanChecks.includes(t.id)) && cleanPhotos.length > 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-3xl p-8 shadow-xl">
            <div className="text-5xl mb-4">🧹</div>
            <div className="text-3xl font-black mb-2">Cleanup Time</div>
            <div className="text-orange-100 text-lg">Leave the site better than you found it</div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6 space-y-3">
            <h3 className="text-xl font-black text-slate-900 mb-4">Cleanup Checklist</h3>
            {cleanTasks.map((task) => {
              const checked = cleanChecks.includes(task.id);
              return (
                <div
                  key={task.id}
                  onClick={() => checked ? setCleanChecks(cleanChecks.filter(x => x !== task.id)) : setCleanChecks([...cleanChecks, task.id])}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.98] ${
                    checked ? 'bg-green-50 border-green-400' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center ${
                      checked ? 'bg-green-500 border-green-500' : 'border-slate-300'
                    }`}>
                      {checked && <CheckCircle size={20} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className="font-bold text-slate-900">{task.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6">
            <h3 className="text-xl font-black text-slate-900 mb-4">Cleanup Photos</h3>
            {cleanPhotos.length > 0 && (
              <div className="space-y-2 mb-4">
                {cleanPhotos.map((p) => (
                  <div key={p.id} className="flex justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="flex gap-2"><Image size={18} className="text-blue-600" /><span className="font-bold">Photo {cleanPhotos.indexOf(p) + 1}</span></div>
                    <button onClick={() => setCleanPhotos(cleanPhotos.filter(x => x.id !== p.id))} className="text-red-500"><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setCleanPhotos([...cleanPhotos, { id: Date.now(), ts: new Date().toISOString() }])} className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all">
              <Camera size={20} />Take Cleanup Photo
            </button>
          </div>

          <button onClick={() => allDone && setPhase('inspection')} disabled={!allDone} className={`w-full font-black py-6 rounded-2xl text-xl shadow-xl transition-all ${allDone ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
            {allDone ? 'Done - Customer Walkthrough 👀' : 'Complete Cleanup First'}
          </button>
        </div>
        <CommFloater />
      </div>
    );
  }

  if (phase === 'inspection') {
    const canSubmit = inspectDone && customerOK && finalPhotos.length >= 2;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-3xl p-8 shadow-xl">
            <div className="text-5xl mb-4">👀</div>
            <div className="text-3xl font-black mb-2">Final Inspection</div>
            <div className="text-purple-100 text-lg">Walk through with {TASK_DATA.clientName}</div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6 space-y-3">
            <div onClick={() => setInspectDone(!inspectDone)} className={`p-5 rounded-2xl border-2 cursor-pointer active:scale-[0.98] transition-all ${inspectDone ? 'bg-green-50 border-green-400' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex gap-3">
                <div className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center ${inspectDone ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                  {inspectDone && <CheckCircle size={22} className="text-white" strokeWidth={3} />}
                </div>
                <div><div className="font-bold text-slate-900 text-lg">Customer Walkthrough Done</div><div className="text-sm text-slate-600">Showed all work, tested together</div></div>
              </div>
            </div>
            <div onClick={() => setCustomerOK(!customerOK)} className={`p-5 rounded-2xl border-2 cursor-pointer active:scale-[0.98] transition-all ${customerOK ? 'bg-green-50 border-green-400' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex gap-3">
                <div className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center ${customerOK ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                  {customerOK && <CheckCircle size={22} className="text-white" strokeWidth={3} />}
                </div>
                <div><div className="font-bold text-slate-900 text-lg">Customer Approval</div><div className="text-sm text-slate-600">Customer satisfied with quality</div></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6">
            <h3 className="text-xl font-black text-slate-900 mb-2">Final Photos</h3>
            <div className="text-sm text-slate-600 mb-4">Multiple angles (min 2)</div>
            {finalPhotos.length > 0 && (
              <div className="space-y-2 mb-4">
                {finalPhotos.map((p) => (
                  <div key={p.id} className="flex justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="flex gap-2"><Image size={18} className="text-green-600" /><span className="font-bold">Photo {finalPhotos.indexOf(p) + 1}</span></div>
                    <button onClick={() => setFinalPhotos(finalPhotos.filter(x => x.id !== p.id))} className="text-red-500"><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setFinalPhotos([...finalPhotos, { id: Date.now(), ts: new Date().toISOString() }])} className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all">
              <Camera size={20} />Take Final Photo
            </button>
          </div>

          <button onClick={() => canSubmit && setPhase('done')} disabled={!canSubmit} className={`w-full font-black py-6 rounded-2xl text-xl shadow-xl transition-all ${canSubmit ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:scale-[0.98] text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
            {canSubmit ? '✅ Submit Job Complete' : 'Complete All Steps'}
          </button>
        </div>
        <CommFloater />
      </div>
    );
  }

  if (phase === 'done') {
    const steps = TASK_DATA.steps || [];
    const mins = startTime ? Math.round((new Date().getTime() - startTime.getTime()) / 60000) : 0;
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    const totalPhotos = Object.values(stepPhotos).reduce((s, p) => s + p.length, 0) + cleanPhotos.length + finalPhotos.length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-emerald-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-[2rem] shadow-2xl p-10 border-2 border-green-200">
            <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <CheckCircle size={80} className="text-white" strokeWidth={3} />
            </div>

            <div className="text-center mb-8">
              <h2 className="text-4xl font-black text-slate-900 mb-3">Job Complete!</h2>
              <p className="text-xl text-slate-600">Excellent work, {TASK_DATA.assignedTo}</p>
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-6 mb-8 space-y-4">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Summary</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Duration</span>
                  <span className="font-black text-slate-900 text-xl">{hrs > 0 ? `${hrs}h ` : ''}{m}m</span>
                </div>
                <div className="h-px bg-slate-200" />
                {steps.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Work Steps</span>
                    <span className="font-black text-green-600 text-lg">{steps.length} ✓</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Cleanup</span>
                  <span className="font-black text-green-600 text-lg">Complete ✓</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Customer</span>
                  <span className="font-black text-green-600 text-lg">Approved ✓</span>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Total Photos</span>
                  <span className="font-black text-blue-600 text-xl">{totalPhotos} 📸</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {onComplete && (
                <button
                  onClick={() => {
                    onComplete();
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:scale-[0.98] text-white font-black py-5 rounded-2xl shadow-xl transition-all text-lg"
                >
                  ✓ Back to Dashboard
                </button>
              )}
              <button
                onClick={() => {
                  setPhase('review');
                  setCheckedMat([]);
                  setCheckedTools([]);
                  setDoneSteps([]);
                  setStepPhotos({});
                  setExpandStep(null);
                  setCleanChecks([]);
                  setCleanPhotos([]);
                  setInspectDone(false);
                  setCustomerOK(false);
                  setFinalPhotos([]);
                  setStartTime(null);
                  setReminderTime('1hr');
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] text-white font-black py-5 rounded-2xl shadow-xl transition-all text-lg"
              >
                🔄 {onComplete ? 'View Task Again' : 'New Job (Demo Reset)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
