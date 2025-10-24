// Client-side utility to sync localStorage data to Vercel KV
import { storage } from './localStorage';

let syncInProgress = false;
let syncQueue: (() => Promise<void>)[] = [];

/**
 * Sync current localStorage data to cloud AND pull messages from cloud
 * This creates bidirectional sync so admin sees worker messages
 */
export async function syncDataToCloud() {
  // Avoid multiple simultaneous syncs
  if (syncInProgress) {
    return;
  }

  syncInProgress = true;

  try {
    const projects = storage.getProjects();
    const workers = storage.getWorkers();
    const notifications = storage.getNotifications();

    // Extract messages from projects
    const messages: any[] = [];
    projects.forEach((project: any) => {
      project.tasks?.forEach((task: any) => {
        if (task.messages && task.messages.length > 0) {
          messages.push({
            projectId: project.id,
            taskId: task.id,
            projectNumber: project.number,
            taskDescription: task.description,
            messages: task.messages
          });
        }
      });
    });

    // PUSH: Send to cloud
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projects,
        workers,
        notifications,
        messages
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Data synced to cloud at:', data.timestamp);

      // PULL: Get messages from cloud (worker messages)
      try {
        const cloudResponse = await fetch('/api/sync/messages');
        const cloudData = await cloudResponse.json();

        if (cloudData.success && cloudData.messages) {
          // Merge cloud messages into localStorage projects
          const updatedProjects = [...projects];
          let hasChanges = false;

          cloudData.messages.forEach((cloudThread: any) => {
            const project = updatedProjects.find((p: any) => p.id === cloudThread.projectId);
            if (project) {
              const task = project.tasks?.find((t: any) => t.id === cloudThread.taskId);
              if (task) {
                // Merge messages (keep unique ones by timestamp)
                const existingMessages = task.messages || [];
                const existingTimestamps = new Set(existingMessages.map((m: any) => m.timestamp));

                cloudThread.messages.forEach((cloudMsg: any) => {
                  if (!existingTimestamps.has(cloudMsg.timestamp)) {
                    existingMessages.push(cloudMsg);
                    hasChanges = true;
                  }
                });

                task.messages = existingMessages.sort((a: any, b: any) =>
                  new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                );
              }
            }
          });

          if (hasChanges) {
            // Save updated projects with worker messages
            localStorage.setItem('projects', JSON.stringify(updatedProjects));
            console.log('✅ Worker messages synced from cloud to admin');
            window.dispatchEvent(new Event('projectsUpdated'));
          }
        }
      } catch (error) {
        console.error('Failed to pull messages from cloud:', error);
      }
    } else {
      console.error('❌ Sync failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Sync error:', error);
  } finally {
    syncInProgress = false;
  }
}

/**
 * Debounced sync - waits 1 second after last change before syncing
 * Use this for frequent updates to avoid excessive API calls
 */
let debounceTimer: NodeJS.Timeout | null = null;

export function debouncedSync() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    syncDataToCloud();
  }, 1000); // Wait 1 second after last change
}

/**
 * Setup auto-sync on storage events
 * Call this once in your app root
 */
export function setupAutoSync() {
  // Sync when projectsUpdated event fires
  window.addEventListener('projectsUpdated', () => {
    debouncedSync();
  });

  // Sync when workers are updated
  window.addEventListener('workersUpdated', () => {
    debouncedSync();
  });

  // Initial sync on page load
  syncDataToCloud();

  console.log('🔄 Auto-sync initialized');
}
