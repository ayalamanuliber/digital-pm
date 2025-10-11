'use client';

import React, { useState } from 'react';
import { storage } from '@/lib/localStorage';
import { Play, CheckCircle, XCircle } from 'lucide-react';

export default function WorkflowTester() {
  const [log, setLog] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : '📝';
    setLog(prev => [...prev, `${emoji} ${message}`]);
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const runWorkflowTest = async () => {
    setLog([]);
    setIsRunning(true);

    try {
      addLog('🧪 Starting Task Assignment Workflow Test');
      await delay(500);

      // Step 1: Get data
      addLog('Step 1: Loading data...');
      const projects = storage.getProjects();
      const workers = storage.getWorkers();
      addLog(`Found ${projects.length} projects and ${workers.length} workers`, 'success');
      await delay(500);

      // Create test project if needed
      let project = projects[0];
      if (!project) {
        addLog('Creating test project...');
        project = storage.addProject({
          number: 'TEST-001',
          clientName: 'Test Client',
          clientAddress: '123 Test St, Denver CO',
          estimateDate: new Date().toISOString().split('T')[0],
          status: 'active',
          color: 'blue',
          tasks: [
            {
              description: 'Install HVAC system',
              quantity: 1,
              price: 5000,
              amount: 5000,
              type: 'hvac',
              estimatedHours: 8,
              status: 'unassigned',
              skills: ['HVAC'],
              activity: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          subtotal: 5000,
          tax: 250,
          total: 5250
        });
        addLog('Test project created!', 'success');
      }
      await delay(500);

      // Get unassigned task
      const task = project.tasks.find(t => t.status === 'unassigned' || t.status === 'pending');
      if (!task) {
        addLog('No unassigned tasks found', 'error');
        setIsRunning(false);
        return;
      }
      addLog(`Task: "${task.description}"`);
      await delay(500);

      // Get matching worker
      const worker = workers.find(w =>
        task.skills.some(skill => w.skills.includes(skill))
      ) || workers[0];
      if (!worker) {
        addLog('No workers available', 'error');
        setIsRunning(false);
        return;
      }
      addLog(`Worker: ${worker.name} (${worker.skills.join(', ')})`);
      await delay(800);

      // Step 2: Assign
      addLog('Step 2: Assigning task...');
      storage.assignTask(
        project.id,
        task.id,
        worker.id,
        new Date().toISOString().split('T')[0],
        '09:00 AM',
        4,
        'Robert'
      );
      addLog(`✅ Assigned to ${worker.name} (status: pending_acceptance)`, 'success');
      await delay(800);

      // Step 3: Accept
      addLog('Step 3: Worker accepts task...');
      storage.acceptTask(project.id, task.id, worker.name);
      addLog(`✅ ${worker.name} accepted (status: accepted)`, 'success');
      await delay(800);

      // Step 4: Start work
      addLog('Step 4: Worker starts work...');
      storage.startTask(project.id, task.id, worker.name);
      addLog(`✅ Work started (status: in_progress)`, 'success');
      await delay(800);

      // Step 5: Complete
      addLog('Step 5: Worker completes task...');
      storage.completeTask(project.id, task.id, worker.name);
      addLog(`✅ Task completed (status: completed)`, 'success');
      await delay(800);

      // Summary
      addLog('');
      addLog('🎉 WORKFLOW COMPLETE!', 'success');
      addLog('');
      addLog('📊 Verify in UI:');
      addLog('1. Go to Projects → Click project');
      addLog('2. Task should be in DONE column');
      addLog('3. Activity log should show 5 entries');
      addLog('4. Go to Tasks view → Check 5-column Kanban');

    } catch (error) {
      addLog(`Error: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">🧪 Workflow Tester</h3>
          <p className="text-sm text-gray-600">Test complete task assignment workflow</p>
        </div>
        <button
          onClick={runWorkflowTest}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4" />
          {isRunning ? 'Running...' : 'Run Test'}
        </button>
      </div>

      {log.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
          {log.map((line, i) => (
            <div key={i} className="text-gray-300 mb-1">
              {line}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
        <strong>6-State Workflow:</strong>
        <div className="mt-2 space-y-1">
          <div>1. unassigned → 2. pending_acceptance → 3. accepted → 4. in_progress → 5. completed</div>
          <div className="text-blue-600 mt-2"><strong>Kanban Mapping:</strong></div>
          <div>• TO DO: [unassigned, rejected]</div>
          <div>• IN PROGRESS: [pending_acceptance, accepted, in_progress]</div>
          <div>• DONE: [completed]</div>
        </div>
      </div>
    </div>
  );
}
