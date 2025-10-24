// Vercel KV Integration - Shared storage for admin and workers
import { kv } from '@vercel/kv';

// Storage keys
const KEYS = {
  PROJECTS: 'pm:projects',
  WORKERS: 'pm:workers',
  SYNC_TIMESTAMP: 'pm:sync:timestamp',
  WORKER_SESSIONS: 'pm:worker:sessions',
};

export type SyncData = {
  projects: any[];
  workers: any[];
  timestamp: string;
};

// ============================================================================
// SYNC FUNCTIONS - Admin pushes data to cloud
// ============================================================================

export async function syncToCloud(data: { projects?: any[]; workers?: any[] }) {
  try {
    const timestamp = new Date().toISOString();

    if (data.projects) {
      await kv.set(KEYS.PROJECTS, data.projects);
    }

    if (data.workers) {
      await kv.set(KEYS.WORKERS, data.workers);
    }

    await kv.set(KEYS.SYNC_TIMESTAMP, timestamp);

    return { success: true, timestamp };
  } catch (error) {
    console.error('Failed to sync to cloud:', error);
    return { success: false, error };
  }
}

// ============================================================================
// FETCH FUNCTIONS - Workers pull data from cloud
// ============================================================================

export async function fetchFromCloud(): Promise<SyncData | null> {
  try {
    const [projects, workers, timestamp] = await Promise.all([
      kv.get(KEYS.PROJECTS),
      kv.get(KEYS.WORKERS),
      kv.get(KEYS.SYNC_TIMESTAMP),
    ]);

    return {
      projects: (projects as any[]) || [],
      workers: (workers as any[]) || [],
      timestamp: (timestamp as string) || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to fetch from cloud:', error);
    return null;
  }
}

// ============================================================================
// WORKER-SPECIFIC FUNCTIONS
// ============================================================================

export async function getWorkerByPin(pin: string) {
  try {
    const workers = await kv.get<any[]>(KEYS.WORKERS);
    if (!workers) return null;

    return workers.find((w) => w.pin === pin) || null;
  } catch (error) {
    console.error('Failed to get worker by PIN:', error);
    return null;
  }
}

export async function getWorkerTasks(workerId: string) {
  try {
    const projects = await kv.get<any[]>(KEYS.PROJECTS);
    if (!projects) return [];

    const workerTasks: any[] = [];

    projects.forEach((project) => {
      project.tasks?.forEach((task: any) => {
        if (task.assignedTo === workerId) {
          workerTasks.push({
            ...task,
            projectId: project.id,
            projectNumber: project.number,
            projectClient: project.clientName,
            projectAddress: project.clientAddress,
            projectColor: project.color,
          });
        }
      });
    });

    return workerTasks;
  } catch (error) {
    console.error('Failed to get worker tasks:', error);
    return [];
  }
}

export async function updateTaskStatus(
  projectId: string,
  taskId: string,
  updates: any
) {
  try {
    const projects = await kv.get<any[]>(KEYS.PROJECTS);
    if (!projects) return { success: false, error: 'No projects found' };

    const updatedProjects = projects.map((project) => {
      if (project.id === projectId) {
        return {
          ...project,
          tasks: project.tasks.map((task: any) => {
            if (task.id === taskId) {
              return {
                ...task,
                ...updates,
                updatedAt: new Date().toISOString(),
              };
            }
            return task;
          }),
        };
      }
      return project;
    });

    await kv.set(KEYS.PROJECTS, updatedProjects);
    await kv.set(KEYS.SYNC_TIMESTAMP, new Date().toISOString());

    return { success: true };
  } catch (error) {
    console.error('Failed to update task status:', error);
    return { success: false, error };
  }
}

// ============================================================================
// WORKER SESSION TRACKING
// ============================================================================

export async function trackWorkerSession(workerId: string, workerName: string) {
  try {
    const sessionKey = `${KEYS.WORKER_SESSIONS}:${workerId}`;
    const session = {
      workerId,
      workerName,
      lastActive: new Date().toISOString(),
      loginCount: 1,
    };

    const existing = await kv.get(sessionKey);
    if (existing && typeof existing === 'object' && 'loginCount' in existing) {
      session.loginCount = (existing.loginCount as number) + 1;
    }

    await kv.set(sessionKey, session);
    return { success: true };
  } catch (error) {
    console.error('Failed to track worker session:', error);
    return { success: false };
  }
}

export async function getWorkerSession(workerId: string) {
  try {
    const sessionKey = `${KEYS.WORKER_SESSIONS}:${workerId}`;
    return await kv.get(sessionKey);
  } catch (error) {
    console.error('Failed to get worker session:', error);
    return null;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export async function getLastSyncTime(): Promise<string | null> {
  try {
    return await kv.get(KEYS.SYNC_TIMESTAMP);
  } catch (error) {
    console.error('Failed to get last sync time:', error);
    return null;
  }
}

export async function clearAllData() {
  try {
    await Promise.all([
      kv.del(KEYS.PROJECTS),
      kv.del(KEYS.WORKERS),
      kv.del(KEYS.SYNC_TIMESTAMP),
    ]);
    return { success: true };
  } catch (error) {
    console.error('Failed to clear data:', error);
    return { success: false, error };
  }
}
