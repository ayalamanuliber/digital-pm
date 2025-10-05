# 🗄️ Digital PM - Data Architecture & Cleanup Plan

## 🎯 Goal: Remove Mock Data, Build Real Data Layer

**Current State:** Everything uses hardcoded mock data scattered across components
**Target State:** Centralized data management with proper state and storage

---

## 📊 Current Mock Data Inventory

### **1. Projects Module** ❌ Mock Data Locations

**File:** `/components/features/projects/ProjectsListView.tsx`
```typescript
// Lines 21-65: Hardcoded projects array
const projects: Project[] = [
  {
    id: 'p1',
    number: '2037',
    client: 'Maddie Thompson',
    // ... mock data
  }
]
```

**File:** `/components/features/dashboard/OperationsHub.tsx`
```typescript
// Lines 19-27: Active project mock
const [activeProject] = useState<ActiveProject>({
  number: '2037',
  client: 'Maddie Thompson',
  // ... mock data
})

// Lines 111-125: Mock project for detail view
const mockProject: Project = {
  id: 'p1',
  number: '2037',
  // ... mock data
}
```

---

### **2. Tasks Module** ❌ Mock Data Locations

**File:** `/components/features/projects/ProjectDetailView.tsx`
```typescript
// Lines 21-64: Hardcoded tasks array
const tasks: Task[] = [
  {
    id: 't1',
    projectId: project.id,
    title: 'Install Kitchen Cabinets',
    // ... mock data
  }
]
```

---

### **3. Workers Module** ❌ Mock Data Locations

**File:** `/components/features/projects/ProjectDetailView.tsx`
```typescript
// Lines 66-70: Hardcoded crew members
const crewMembers = [
  { id: 'w1', name: 'Carlos Rodriguez', role: 'Lead Installer', avatar: '👷' },
  // ... mock data
]
```

**File:** `/components/features/tasks/TaskAdminModal.tsx`
```typescript
// Lines 20-24: Hardcoded crew members
const crewMembers = [
  { id: 'w1', name: 'Carlos Rodriguez', role: 'Lead Installer', phone: '(720) 555-0101', avatar: '👷' },
  // ... mock data
]
```

---

### **4. Dashboard Module** ❌ Mock Data Locations

**File:** `/components/features/dashboard/OperationsHub.tsx`
```typescript
// Lines 22-28: Stats mock
const [stats] = useState<DashboardStats>({
  teamAvailable: 3,
  teamTotal: 4,
  activeTasks: 12,
  needsAction: 3,
  performance: 4.85
})

// Lines 30-55: Alerts mock
const [alerts] = useState<Alert[]>([...])

// Lines 57-94: Activity mock
const [activity] = useState<ActivityType[]>([...])
```

---

### **5. Upload Module** ❌ Mock Data Locations

**File:** `/components/features/upload/UploadAssignView.tsx`
```typescript
// Lines 14-71: Mock parsed data from Estimate #2011
const mockParsedData = {
  estimateNumber: '2011',
  client: 'Jack Shippee',
  // ... mock data for 8 tasks
}
```

---

## 🏗️ Real Data Architecture Plan

### **Phase 1: State Management Setup**

#### **Option A: Context API** (Simpler, good for MVP)
```typescript
// contexts/AppContext.tsx
interface AppState {
  projects: Project[]
  tasks: Task[]
  workers: Worker[]
  alerts: Alert[]
  activity: Activity[]
}

const AppContext = createContext<AppState>()
```

#### **Option B: Zustand** (Recommended, cleaner syntax)
```typescript
// stores/useProjectStore.ts
const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  addProject: (project) => set((state) => ({
    projects: [...state.projects, project]
  })),
  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map(p =>
      p.id === id ? { ...p, ...updates } : p
    )
  })),
  deleteProject: (id) => set((state) => ({
    projects: state.projects.filter(p => p.id !== id)
  }))
}))
```

---

### **Phase 2: Data Storage Options**

#### **Option 1: LocalStorage** (MVP - No backend needed)
```typescript
// utils/storage.ts
const STORAGE_KEYS = {
  PROJECTS: 'digital-pm-projects',
  WORKERS: 'digital-pm-workers',
  TASKS: 'digital-pm-tasks'
}

export const storage = {
  saveProjects: (projects: Project[]) => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects))
  },
  loadProjects: (): Project[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTS)
    return data ? JSON.parse(data) : []
  }
}
```

**Pros:**
- ✅ No backend needed
- ✅ Fast to implement (30 min)
- ✅ Persists data between sessions
- ✅ Perfect for MVP demo

**Cons:**
- ❌ Single user only
- ❌ 5-10MB limit
- ❌ No server sync

---

#### **Option 2: Supabase** (Quick Backend)
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Real-time projects
export const getProjects = () =>
  supabase.from('projects').select('*')

export const addProject = (project: Project) =>
  supabase.from('projects').insert(project)
```

**Pros:**
- ✅ Real database
- ✅ Multi-user support
- ✅ Real-time updates
- ✅ Free tier generous

**Cons:**
- ❌ Requires setup (1-2 hours)
- ❌ API keys needed

---

#### **Option 3: JSON Files** (Simplest for single user)
```typescript
// data/projects.json
{
  "projects": [],
  "workers": [],
  "tasks": []
}

// utils/data.ts
import projectsData from '@/data/projects.json'

export const getProjects = () => projectsData.projects
```

**Pros:**
- ✅ Super simple
- ✅ Version controlled
- ✅ No database needed

**Cons:**
- ❌ Not scalable
- ❌ Manual data management

---

## 🧹 Cleanup Checklist

### **Step 1: Create Data Stores** (Recommended: Zustand + LocalStorage)

```typescript
// stores/useProjectStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProjectStore {
  projects: Project[]
  addProject: (project: Project) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  getProjectById: (id: string) => Project | undefined
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      addProject: (project) =>
        set((state) => ({ projects: [...state.projects, project] })),
      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map(p =>
            p.id === id ? { ...p, ...updates } : p
          )
        })),
      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter(p => p.id !== id)
        })),
      getProjectById: (id) =>
        get().projects.find(p => p.id === id)
    }),
    { name: 'project-storage' }
  )
)
```

```typescript
// stores/useWorkerStore.ts
export const useWorkerStore = create<WorkerStore>()(
  persist(
    (set, get) => ({
      workers: [],
      addWorker: (worker) =>
        set((state) => ({ workers: [...state.workers, worker] })),
      // ... similar CRUD operations
    }),
    { name: 'worker-storage' }
  )
)
```

```typescript
// stores/useTaskStore.ts
export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      addTask: (task) =>
        set((state) => ({ tasks: [...state.tasks, task] })),
      // ... similar CRUD operations
      getTasksByProject: (projectId) =>
        get().tasks.filter(t => t.projectId === projectId)
    }),
    { name: 'task-storage' }
  )
)
```

---

### **Step 2: Remove Mock Data**

#### **File by File Cleanup:**

**1. OperationsHub.tsx**
```typescript
// REMOVE:
const [activeProject] = useState<ActiveProject>({...})
const [stats] = useState<DashboardStats>({...})
const [alerts] = useState<Alert[]>([...])
const [activity] = useState<ActivityType[]>([...])
const mockProject: Project = {...}

// REPLACE WITH:
const projects = useProjectStore(state => state.projects)
const workers = useWorkerStore(state => state.workers)
const tasks = useTaskStore(state => state.tasks)

// Calculate stats dynamically
const stats = useMemo(() => ({
  teamAvailable: workers.filter(w => w.status === 'available').length,
  teamTotal: workers.length,
  activeTasks: tasks.filter(t => t.status === 'in_progress').length,
  needsAction: tasks.filter(t => !t.assignedTo.length).length,
  performance: calculateAveragePerformance(workers)
}), [workers, tasks])
```

**2. ProjectsListView.tsx**
```typescript
// REMOVE:
const projects: Project[] = [{...}, {...}]

// REPLACE WITH:
const projects = useProjectStore(state => state.projects)
const filteredProjects = useMemo(() =>
  projects.filter(p => {
    const matchesSearch = p.client.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === 'all' || p.status === filterStatus
    return matchesSearch && matchesFilter
  }), [projects, searchQuery, filterStatus]
)
```

**3. ProjectDetailView.tsx**
```typescript
// REMOVE:
const tasks: Task[] = [{...}, {...}]
const crewMembers = [{...}, {...}]

// REPLACE WITH:
const tasks = useTaskStore(state =>
  state.tasks.filter(t => t.projectId === project.id)
)
const workers = useWorkerStore(state => state.workers)
const assignedWorkers = workers.filter(w =>
  tasks.some(t => t.assignedTo.includes(w.id))
)
```

**4. TaskAdminModal.tsx**
```typescript
// REMOVE:
const crewMembers = [{...}, {...}]

// REPLACE WITH:
const workers = useWorkerStore(state => state.workers)
const assignedCrew = workers.filter(w =>
  task.assignedTo.includes(w.id)
)
```

---

### **Step 3: Seed Initial Data** (For Demo Purposes)

```typescript
// utils/seedData.ts
export const seedDemoData = () => {
  const projectStore = useProjectStore.getState()
  const workerStore = useWorkerStore.getState()
  const taskStore = useTaskStore.getState()

  // Check if already seeded
  if (projectStore.projects.length > 0) return

  // Seed workers (from Estimate #2011 needs)
  const workers = [
    {
      id: 'w1',
      name: 'Carlos Rodriguez',
      email: 'carlos@example.com',
      phone: '(720) 555-0101',
      skills: ['HVAC', 'General Labor'],
      status: 'available',
      hourlyRate: 45
    },
    {
      id: 'w2',
      name: 'Juan Martinez',
      email: 'juan@example.com',
      phone: '(720) 555-0102',
      skills: ['Electrical'],
      status: 'available',
      hourlyRate: 50
    },
    {
      id: 'w3',
      name: 'David Chen',
      email: 'david@example.com',
      phone: '(720) 555-0103',
      skills: ['Masonry', 'General Labor'],
      status: 'available',
      hourlyRate: 48
    }
  ]
  workers.forEach(w => workerStore.addWorker(w))

  // Seed Project #2011 (Jack Shippee)
  const project2011 = {
    id: 'p-2011',
    number: '2011',
    client: 'Jack Shippee',
    address: '2690 Stuart St, Denver CO 80212',
    budget: 3953.25,
    spent: 0,
    status: 'active',
    priority: 'medium',
    startDate: '2025-09-04',
    estimatedCompletion: '2025-10-20',
    totalTasks: 0,
    completedTasks: 0
  }
  projectStore.addProject(project2011)

  // Seed tasks from Estimate #2011
  const tasks2011 = [
    {
      id: 't-2011-1',
      projectId: 'p-2011',
      title: 'Full AC service',
      description: 'Repair Insulation lines, Fill Refrigerant, Level units',
      cost: 475,
      estimatedHours: 3,
      status: 'scheduled',
      priority: 'high',
      assignedTo: [], // Will assign manually
      scheduledDate: null,
      materials: ['Refrigerant', 'Insulation tape', 'Level']
    },
    {
      id: 't-2011-2',
      title: 'Smoke detectors in every bedroom, and floor',
      projectId: 'p-2011',
      cost: 240,
      estimatedHours: 2,
      status: 'scheduled',
      priority: 'high',
      assignedTo: [],
      materials: ['Smoke detectors', 'Batteries', 'Mounting hardware']
    },
    // ... other 6 tasks
  ]
  tasks2011.forEach(t => taskStore.addTask(t))

  // Update project task count
  projectStore.updateProject('p-2011', {
    totalTasks: tasks2011.length
  })
}
```

**Call seed on app load:**
```typescript
// app/page.tsx or layout.tsx
useEffect(() => {
  seedDemoData()
}, [])
```

---

## 📋 Implementation Order

### **Phase 1: Setup (30 min)**
1. ✅ Install Zustand: `npm install zustand`
2. ✅ Create stores: `useProjectStore`, `useWorkerStore`, `useTaskStore`
3. ✅ Add persist middleware (localStorage)

### **Phase 2: Cleanup (30 min)**
4. ✅ Remove mock data from OperationsHub
5. ✅ Remove mock data from ProjectsListView
6. ✅ Remove mock data from ProjectDetailView
7. ✅ Remove mock data from TaskAdminModal

### **Phase 3: Seed Data (15 min)**
8. ✅ Create seed function for Estimate #2011
9. ✅ Add 3 workers (Carlos, Juan, David)
10. ✅ Add 8 tasks from estimate

### **Phase 4: Connect UI (15 min)**
11. ✅ Update all components to use stores
12. ✅ Test CRUD operations
13. ✅ Verify persistence (refresh browser)

**Total Time: ~1.5 hours**

---

## 🎯 What This Achieves

### **Before (Current):**
- ❌ Hardcoded mock data everywhere
- ❌ Can't add/edit/delete anything
- ❌ Data lost on refresh
- ❌ Can't test real workflows

### **After (Real Data):**
- ✅ Centralized data management
- ✅ Full CRUD operations work
- ✅ Data persists in localStorage
- ✅ Can demo real workflows with #2011
- ✅ Ready for backend integration later

---

## 🔄 Future: Backend Integration (Post-MVP)

When ready to add real backend:

```typescript
// Replace persist middleware with API calls
export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],

  // Load from API
  loadProjects: async () => {
    const res = await fetch('/api/projects')
    const projects = await res.json()
    set({ projects })
  },

  // Save to API
  addProject: async (project) => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify(project)
    })
    const newProject = await res.json()
    set((state) => ({ projects: [...state.projects, newProject] }))
  }
}))
```

---

## ✅ Decision Time

**Which approach for MVP?**

### **Option 1: Zustand + LocalStorage** ⭐ RECOMMENDED
- ✅ Fast to implement (1.5 hours)
- ✅ Persists data
- ✅ No backend needed
- ✅ Easy to migrate to API later
- **Cost:** $0
- **Time:** 1.5 hours

### **Option 2: Supabase**
- ✅ Real database
- ✅ Multi-user ready
- ❌ Requires setup
- **Cost:** $0 (free tier)
- **Time:** 3-4 hours

### **Option 3: JSON Files**
- ✅ Simplest
- ❌ Not persistent
- ❌ Not scalable
- **Cost:** $0
- **Time:** 30 min

---

## 🚀 Recommendation

**Go with Zustand + LocalStorage for MVP**

**Why:**
1. Fast implementation (ready today)
2. Real CRUD operations work
3. Data persists (survives refresh)
4. Easy to demo with Robert & Erick
5. Clean migration path to backend later

**Next Steps:**
1. Install Zustand
2. Create 3 stores (projects, workers, tasks)
3. Remove all mock data
4. Seed Estimate #2011 data
5. Test full workflow

**Ready to start?** 🎯
