# 🚀 Digital PM - Production Deployment Guide

## 📋 Quick Setup (15 minutes)

### **Step 1: Create Neon Database** (5 min)

1. Go to [neon.tech](https://neon.tech) and sign up (free)
2. Click "New Project"
3. Name it: `digital-pm-production`
4. Region: Choose closest to Denver (e.g., US East)
5. Click "Create Project"
6. **Copy the connection string** (looks like: `postgresql://user:pass@host.neon.tech/dbname`)

---

### **Step 2: Setup Environment Variables** (2 min)

Create `.env.local` file:

```bash
# Database
DATABASE_URL="postgresql://user:pass@host.neon.tech/dbname"

# Optional: For future features
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
# TWILIO_ACCOUNT_SID=
# TWILIO_AUTH_TOKEN=
```

---

### **Step 3: Run Database Migrations** (3 min)

```bash
# Generate migration files
npx drizzle-kit generate

# Push schema to database
npx drizzle-kit push
```

This creates all tables:
- ✅ projects
- ✅ workers
- ✅ tasks
- ✅ assignments
- ✅ activity_log

---

### **Step 4: Seed Demo Data** (Optional - 2 min)

Create `scripts/seed.ts`:

```typescript
import { db } from '@/db';
import { projects, workers, tasks } from '@/db/schema';

async function seed() {
  // Seed workers
  const worker1 = await db.insert(workers).values({
    name: 'Carlos Rodriguez',
    email: 'carlos@example.com',
    phone: '(720) 555-0101',
    skills: ['HVAC', 'General Labor'],
    hourlyRate: '45.00'
  }).returning();

  const worker2 = await db.insert(workers).values({
    name: 'Juan Martinez',
    email: 'juan@example.com',
    phone: '(720) 555-0102',
    skills: ['Electrical'],
    hourlyRate: '50.00'
  }).returning();

  // Seed Project #2011
  const project = await db.insert(projects).values({
    number: '2011',
    client: 'Jack Shippee',
    address: '2690 Stuart St, Denver CO 80212',
    budget: '3953.25',
    status: 'active',
    priority: 'medium',
    startDate: new Date('2025-09-04'),
    estimatedCompletion: new Date('2025-10-20')
  }).returning();

  // Seed tasks
  await db.insert(tasks).values([
    {
      projectId: project[0].id,
      title: 'Full AC service',
      description: 'Repair Insulation lines, Fill Refrigerant, Level units',
      cost: '475.00',
      estimatedHours: '3.00',
      status: 'scheduled',
      priority: 'high',
      materials: ['Refrigerant', 'Insulation tape', 'Level']
    },
    {
      projectId: project[0].id,
      title: 'Smoke detectors in every bedroom, and floor',
      cost: '240.00',
      estimatedHours: '2.00',
      status: 'scheduled',
      priority: 'high',
      materials: ['Smoke detectors', 'Batteries', 'Mounting hardware']
    }
    // ... add other 6 tasks
  ]);

  console.log('✅ Seed completed!');
}

seed().catch(console.error);
```

Run: `npx tsx scripts/seed.ts`

---

### **Step 5: Deploy to Vercel** (3 min)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

**During deployment, add env variables:**
1. Click "Environment Variables"
2. Add `DATABASE_URL` with your Neon connection string
3. Deploy!

---

## 🔗 What Robert & Erick Get

**Live URL:** `https://digital-pm.vercel.app` (or your custom domain)

**They can:**
- ✅ Create real projects
- ✅ Add real workers with skills
- ✅ Assign tasks to workers
- ✅ Track progress on calendar
- ✅ See real-time dashboard updates
- ✅ All data persists in database

**No localhost limits:**
- ✅ Access from any device
- ✅ Multiple users simultaneously
- ✅ Data syncs across devices
- ✅ Professional deployment

---

## 📊 Database Schema (Deployed)

```sql
-- Projects
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  number VARCHAR(50) UNIQUE NOT NULL,
  client VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  budget DECIMAL(10,2) NOT NULL,
  spent DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  priority VARCHAR(20) DEFAULT 'medium',
  start_date TIMESTAMP,
  estimated_completion TIMESTAMP,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Workers
CREATE TABLE workers (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) NOT NULL,
  skills JSONB DEFAULT '[]',
  certifications JSONB DEFAULT '[]',
  hourly_rate DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'available',
  efficiency_score DECIMAL(3,2) DEFAULT 1.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cost DECIMAL(10,2),
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  status VARCHAR(50) DEFAULT 'scheduled',
  priority VARCHAR(20) DEFAULT 'medium',
  assigned_to JSONB DEFAULT '[]',
  scheduled_date TIMESTAMP,
  completed_date TIMESTAMP,
  photos_required INTEGER DEFAULT 2,
  photos_uploaded INTEGER DEFAULT 0,
  materials JSONB DEFAULT '[]',
  steps JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 Features Working in Production

### ✅ **Working Now (No APIs needed)**
- Full CRUD for Projects
- Full CRUD for Workers
- Full CRUD for Tasks
- Task assignment to workers
- Calendar scheduling
- Dashboard stats (real-time)
- Activity log
- Progress tracking

### ⏳ **Coming Soon (Need APIs)**
- SMS notifications (Twilio)
- WhatsApp reminders (WhatsApp API)
- AI PDF parsing (Gemini Vision)
- Auto-assignment algorithm
- Photo uploads (Cloudflare R2)
- Email notifications (SendGrid)

---

## 💰 Cost Breakdown

### **MVP (Free Tier)**
- ✅ Vercel: Free (100GB bandwidth)
- ✅ Neon Database: Free (3GB storage)
- ✅ Total: **$0/month**

### **Production Scale (When Needed)**
- Vercel Pro: $20/month (unlimited bandwidth)
- Neon Scale: $19/month (10GB storage)
- Twilio: Pay-as-you-go ($0.01/SMS)
- Total: **~$50/month** (for serious usage)

---

## 🔧 Maintenance

### **Update Database Schema**
```bash
# 1. Modify db/schema.ts
# 2. Generate migration
npx drizzle-kit generate

# 3. Push to database
npx drizzle-kit push
```

### **View Database (Drizzle Studio)**
```bash
npx drizzle-kit studio
```
Opens visual database editor at `https://local.drizzle.studio`

---

## 🚨 Troubleshooting

### **Error: DATABASE_URL not found**
→ Add to Vercel environment variables

### **Error: Migration failed**
→ Run `npx drizzle-kit push --force`

### **Error: Connection timeout**
→ Check Neon database is active (free tier sleeps after inactivity)

---

## 📈 Next Steps After Deployment

1. ✅ Share URL with Robert & Erick
2. ✅ They create real workers
3. ✅ They add real projects
4. ✅ Test full workflow
5. ✅ Gather feedback
6. ✅ Add AI features as upsells

---

## 🎬 Quick Deploy Commands

```bash
# Full deployment from scratch
npm install
npx drizzle-kit generate
npx drizzle-kit push
npx tsx scripts/seed.ts
vercel --prod
```

**Total time: 15 minutes** ⏱️

---

**Status:** 🟢 Ready for Production
**Next:** Share link with Robert & Erick!
