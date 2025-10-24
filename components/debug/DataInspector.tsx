'use client';

import { useEffect, useState } from 'react';
import { storage } from '@/lib/localStorage';

export default function DataInspector() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const projects = storage.getProjects();
    const workers = storage.getWorkers();

    const scheduledTasks: any[] = [];

    projects.forEach(project => {
      project.tasks.forEach(task => {
        if (task.scheduledDate && task.assignedTo) {
          const worker = workers.find(w => w.id === task.assignedTo);
          scheduledTasks.push({
            projectNumber: project.number,
            clientName: project.clientName,
            taskDescription: task.description.substring(0, 60),
            scheduledDate: task.scheduledDate,
            workerName: worker?.name || 'Unknown',
            workerId: task.assignedTo,
            status: task.status,
            estimatedHours: task.estimatedHours
          });
        }
      });
    });

    setData({
      totalProjects: projects.length,
      totalWorkers: workers.length,
      scheduledTasks,
      workers: workers.map(w => ({ id: w.id, name: w.name, role: w.role }))
    });
  }, []);

  if (!data) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-6xl mx-auto my-6">
      <h2 className="text-2xl font-bold mb-4">Data Inspector</h2>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Summary</h3>
        <p>Total Projects: {data.totalProjects}</p>
        <p>Total Workers: {data.totalWorkers}</p>
        <p>Scheduled Tasks: {data.scheduledTasks.length}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Workers</h3>
        <div className="space-y-2">
          {data.workers.map((w: any) => (
            <div key={w.id} className="p-2 bg-gray-50 rounded">
              <span className="font-medium">{w.name}</span> - {w.role} (ID: {w.id})
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Scheduled Tasks</h3>
        {data.scheduledTasks.length === 0 ? (
          <p className="text-gray-500">No tasks with scheduledDate + assignedTo found</p>
        ) : (
          <div className="space-y-3">
            {data.scheduledTasks.map((task: any, idx: number) => (
              <div key={idx} className="p-3 bg-blue-50 rounded border border-blue-200">
                <div className="font-semibold">#{task.projectNumber} - {task.clientName}</div>
                <div className="text-sm text-gray-700">{task.taskDescription}</div>
                <div className="text-xs text-gray-600 mt-1">
                  📅 {task.scheduledDate} | 👷 {task.workerName} | ⏱️ {task.estimatedHours || 'N/A'}h | 🏷️ {task.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
