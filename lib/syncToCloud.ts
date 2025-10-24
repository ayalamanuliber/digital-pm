// Client-side utility to sync localStorage data to Vercel KV
import { storage } from './localStorage';

let syncInProgress = false;
let syncQueue: (() => Promise<void>)[] = [];

/**
 * Sync current localStorage data to cloud
 * This should be called after any data mutation (add, update, delete)
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

    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projects,
        workers,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Data synced to cloud at:', data.timestamp);
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
