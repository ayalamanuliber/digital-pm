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

    // DON'T extract messages - let cloud be the source of truth
    // Messages flow: Worker → Cloud → Admin (not Admin → Cloud)

    // PUSH: Send to cloud (NO MESSAGES - only projects, workers, notifications)
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projects,
        workers,
        notifications
        // messages NOT included - cloud messages are source of truth
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Data synced to cloud at:', data.timestamp);

      // PULL: Get messages from cloud (worker messages)
      try {
        console.log('🔍 PULLING messages from cloud...');
        const cloudResponse = await fetch('/api/sync/messages');
        const cloudData = await cloudResponse.json();

        console.log('📦 Cloud response:', {
          success: cloudData.success,
          messageCount: cloudData.messages?.length || 0,
          messages: cloudData.messages
        });

        if (cloudData.success && cloudData.messages) {
          // Merge cloud messages into localStorage projects
          const updatedProjects = [...projects];
          let hasChanges = false;

          console.log('🔄 Attempting to merge', cloudData.messages.length, 'message threads into', updatedProjects.length, 'projects');

          cloudData.messages.forEach((cloudThread: any) => {
            console.log('  🔍 Processing thread:', {
              projectId: cloudThread.projectId,
              taskId: cloudThread.taskId,
              messageCount: cloudThread.messages?.length || 0
            });

            const project = updatedProjects.find((p: any) => p.id === cloudThread.projectId);
            if (!project) {
              console.log('    ❌ Project not found in localStorage:', cloudThread.projectId);
              return;
            }

            const task = project.tasks?.find((t: any) => t.id === cloudThread.taskId);
            if (!task) {
              console.log('    ❌ Task not found in project:', cloudThread.taskId);
              return;
            }

            console.log('    ✅ Found task, existing messages:', task.messages?.length || 0);

            // Merge messages (keep unique ones by timestamp)
            const existingMessages = task.messages || [];
            const existingTimestamps = new Set(existingMessages.map((m: any) => m.timestamp));

            cloudThread.messages.forEach((cloudMsg: any) => {
              if (!existingTimestamps.has(cloudMsg.timestamp)) {
                console.log('      ➕ Adding new message from', cloudMsg.sender);
                existingMessages.push(cloudMsg);
                hasChanges = true;
              } else {
                console.log('      ⏭️ Skipping duplicate message');
              }
            });

            task.messages = existingMessages.sort((a: any, b: any) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            console.log('    📝 Task now has', task.messages.length, 'messages');
          });

          if (hasChanges) {
            // Save updated projects with worker messages
            localStorage.setItem('digital-pm-projects', JSON.stringify(updatedProjects));
            console.log('✅ Worker messages synced from cloud to admin - SAVED TO LOCALSTORAGE');
            console.log('🔔 Firing projectsUpdated event...');
            window.dispatchEvent(new Event('projectsUpdated'));
          } else {
            console.log('ℹ️ No new messages to merge');
          }
        } else {
          console.log('⚠️ No messages in cloud or request failed');
        }
      } catch (error) {
        console.error('❌ Failed to pull messages from cloud:', error);
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

  // PERIODIC POLLING: Check for worker messages every 15 seconds
  const pollInterval = setInterval(() => {
    console.log('🔄 Admin: Periodic sync check for worker messages...');
    syncDataToCloud();
  }, 15000); // Poll every 15 seconds

  // Cleanup function (if needed)
  window.__adminSyncInterval = pollInterval;

  console.log('🔄 Auto-sync initialized with 15s polling');
}
