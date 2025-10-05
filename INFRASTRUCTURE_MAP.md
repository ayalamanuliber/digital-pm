# 🏗️ Digital PM - Complete Infrastructure Map

## 📐 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DIGITAL PM PLATFORM                            │
│                     "The System IS the Project Manager"                 │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND LAYER                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│   │  Dashboard  │  │  Projects   │  │   Upload    │  │  Calendar   │  │
│   │    Hub      │  │    View     │  │  & Assign   │  │    View     │  │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                                         │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│   │   Workers   │  │    Tasks    │  │  Analytics  │  │   Client    │  │
│   │ Management  │  │   Admin     │  │  & Reports  │  │   Portal    │  │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                                         │
│   Technology: Next.js 15 + React 19 + TypeScript + Tailwind CSS        │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY LAYER                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐    │
│   │                    REST API (Express.js)                     │    │
│   ├──────────────────────────────────────────────────────────────┤    │
│   │  /api/projects     /api/tasks       /api/workers             │    │
│   │  /api/upload       /api/parse       /api/assign              │    │
│   │  /api/notifications /api/photos     /api/analytics           │    │
│   └──────────────────────────────────────────────────────────────┘    │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐    │
│   │              WebSocket Server (Real-time Updates)            │    │
│   ├──────────────────────────────────────────────────────────────┤    │
│   │  - Task status changes       - Worker confirmations          │    │
│   │  - Photo uploads              - Schedule conflicts           │    │
│   └──────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                        BUSINESS LOGIC LAYER                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌───────────────────┐  ┌───────────────────┐  ┌──────────────────┐  │
│   │  AI Parser        │  │  Auto-Assignment  │  │  Scheduling      │  │
│   │  Service          │  │  Engine           │  │  Engine          │  │
│   ├───────────────────┤  ├───────────────────┤  ├──────────────────┤  │
│   │ • PDF/Image OCR   │  │ • Skills matching │  │ • Dependencies   │  │
│   │ • Task extraction │  │ • Availability    │  │ • Time batching  │  │
│   │ • Cost parsing    │  │ • Proximity calc  │  │ • Optimization   │  │
│   └───────────────────┘  └───────────────────┘  └──────────────────┘  │
│                                                                         │
│   ┌───────────────────┐  ┌───────────────────┐  ┌──────────────────┐  │
│   │  Notification     │  │  Analytics        │  │  Material        │  │
│   │  Manager          │  │  Engine           │  │  Manager         │  │
│   ├───────────────────┤  ├───────────────────┤  ├──────────────────┤  │
│   │ • Reminder queue  │  │ • Performance     │  │ • Cost estimate  │  │
│   │ • Multi-channel   │  │ • Efficiency      │  │ • Vendor price   │  │
│   │ • Escalation      │  │ • Budget tracking │  │ • Inventory      │  │
│   └───────────────────┘  └───────────────────┘  └──────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐    │
│   │                PostgreSQL (Primary Database)                 │    │
│   ├──────────────────────────────────────────────────────────────┤    │
│   │  Tables:                                                      │    │
│   │  • projects          • tasks            • workers            │    │
│   │  • assignments       • photos           • reminders          │    │
│   │  • materials         • performance      • budgets            │    │
│   │  • notifications     • calendar_events  • documents          │    │
│   └──────────────────────────────────────────────────────────────┘    │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐    │
│   │                    Redis (Cache & Queue)                     │    │
│   ├──────────────────────────────────────────────────────────────┤    │
│   │  • Session storage       • Real-time data cache              │    │
│   │  • Job queue (Bull)      • Rate limiting                     │    │
│   └──────────────────────────────────────────────────────────────┘    │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐    │
│   │              File Storage (S3/Cloudflare R2)                 │    │
│   ├──────────────────────────────────────────────────────────────┤    │
│   │  • PDF estimates         • Photos (before/after)             │    │
│   │  • Documents             • Worker uploads                    │    │
│   └──────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                        AI & AUTOMATION LAYER                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌───────────────────┐  ┌───────────────────┐  ┌──────────────────┐  │
│   │  Gemini Vision    │  │  Claude Sonnet    │  │  Custom ML       │  │
│   │  API              │  │  API              │  │  Models          │  │
│   ├───────────────────┤  ├───────────────────┤  ├──────────────────┤  │
│   │ • PDF parsing     │  │ • Task analysis   │  │ • Worker match   │  │
│   │ • Image OCR       │  │ • Cost estimate   │  │ • Time predict   │  │
│   │ • Data extraction │  │ • Material list   │  │ • Route optimize │  │
│   └───────────────────┘  └───────────────────┘  └──────────────────┘  │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐    │
│   │                   Cron Jobs / Scheduled Tasks                │    │
│   ├──────────────────────────────────────────────────────────────┤    │
│   │  • Reminder scheduler (3d, 12h, day-of)                      │    │
│   │  • Escalation handler (no response → retry)                  │    │
│   │  • Performance aggregation (daily rollup)                    │    │
│   │  • Budget variance alerts                                    │    │
│   └──────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                      INTEGRATION LAYER                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌───────────────────┐  ┌───────────────────┐  ┌──────────────────┐  │
│   │  Twilio           │  │  WhatsApp         │  │  Google Calendar │  │
│   │  (SMS)            │  │  Business API     │  │  API             │  │
│   ├───────────────────┤  ├───────────────────┤  ├──────────────────┤  │
│   │ • Reminders       │  │ • Rich messages   │  │ • Availability   │  │
│   │ • Confirmations   │  │ • Media support   │  │ • Event creation │  │
│   │ • Alerts          │  │ • Read receipts   │  │ • Sync schedules │  │
│   └───────────────────┘  └───────────────────┘  └──────────────────┘  │
│                                                                         │
│   ┌───────────────────┐  ┌───────────────────┐  ┌──────────────────┐  │
│   │  Google Maps      │  │  Stripe           │  │  Email           │  │
│   │  API              │  │  (Payments)       │  │  (SendGrid)      │  │
│   ├───────────────────┤  ├───────────────────┤  ├──────────────────┤  │
│   │ • Proximity calc  │  │ • Client portal   │  │ • Notifications  │  │
│   │ • Route optimize  │  │ • Invoicing       │  │ • Reports        │  │
│   │ • Map view        │  │ • Subscriptions   │  │ • Summaries      │  │
│   └───────────────────┘  └───────────────────┘  └──────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Module Structure & Dependencies

```
DIGITAL PM PLATFORM
│
├── 📊 DASHBOARD (Core - Always Loaded)
│   ├── Quick Stats (Team Available, Active Tasks, Performance)
│   ├── Active Project Card
│   ├── Alerts & Conflicts
│   ├── Today's Activity Feed
│   └── Quick Actions Wheel
│
├── 📋 PROJECTS MODULE ✅ (Built)
│   ├── ProjectsListView
│   │   ├── Search & Filters
│   │   ├── Stats Dashboard
│   │   ├── Project Cards Grid
│   │   └── Breadcrumb Navigation
│   │
│   ├── ProjectDetailView
│   │   ├── Project Header (Stats, Timeline, Crew)
│   │   ├── View Modes (List, Timeline, Materials, Budget, Docs)
│   │   ├── Task Groups (Completed, In Progress, Scheduled)
│   │   └── Task Admin Modal Integration
│   │
│   └── TaskAdminModal
│       ├── Task Overview (Details, Crew, Progress)
│       ├── Steps Management (Checklist)
│       ├── Materials List
│       ├── Photo Gallery (Before/After)
│       └── Timeline History
│
├── 📤 UPLOAD & ASSIGN MODULE (Phase 1 - Build Next)
│   ├── EstimateUploadView
│   │   ├── PDF/Image Upload Dropzone
│   │   ├── AI Parsing Status
│   │   ├── Extracted Data Preview
│   │   └── Confirmation/Edit Step
│   │
│   ├── TaskExtractionView
│   │   ├── Parsed Tasks Table
│   │   ├── Skill Requirements
│   │   ├── Cost Breakdown
│   │   └── Material Lists
│   │
│   ├── ManualAssignmentView
│   │   ├── Worker Selection Dropdown
│   │   ├── Calendar Date Picker
│   │   ├── Bulk Actions (Assign All, Set Dates)
│   │   └── Assignment Preview
│   │
│   └── AutoAssignmentEngine
│       ├── Skills Matching Algorithm
│       ├── Availability Check (Calendar API)
│       ├── Proximity Optimization (Maps API)
│       └── Timeline Scheduler (Dependencies)
│
├── 👷 WORKERS MODULE (Phase 1)
│   ├── WorkersListView
│   │   ├── Worker Cards (Skills, Availability, Stats)
│   │   ├── Search & Filters (By skill, location, status)
│   │   ├── Quick Add Worker
│   │   └── Efficiency Leaderboard
│   │
│   ├── WorkerDetailView
│   │   ├── Profile (Contact, Skills, Certifications)
│   │   ├── Availability Calendar
│   │   ├── Assigned Tasks (Current & Upcoming)
│   │   ├── Performance Metrics (Efficiency, Quality)
│   │   └── Work History
│   │
│   └── WorkerMobileView (Labor Card) ✅ (Built - PremiumLaborCard)
│       ├── Task Review Phase
│       ├── Calendar Integration
│       ├── Materials Prep
│       ├── Active Work (Steps + Photos)
│       ├── Cleanup Checklist
│       ├── Inspection Walkthrough
│       └── Completion Summary
│
├── 📅 CALENDAR MODULE ✅ (Built)
│   ├── MultiViewCalendar
│   │   ├── Day View
│   │   ├── Week View
│   │   ├── Month View
│   │   └── Crew View
│   │
│   └── ScheduleConflictDetector
│       ├── Overlap Detection
│       ├── Availability Gaps
│       └── Suggested Reschedules
│
├── 📈 ANALYTICS MODULE (Phase 5)
│   ├── PerformanceDashboard
│   │   ├── Worker Efficiency Scores
│   │   ├── On-Time Completion Rate
│   │   ├── Budget Variance Analysis
│   │   └── Revenue per Hour
│   │
│   ├── BudgetTracking
│   │   ├── Estimated vs Actual Costs
│   │   ├── Profit Margin Calculator
│   │   ├── Material Cost Analysis
│   │   └── Labor Cost Breakdown
│   │
│   └── Reports
│       ├── Project Summary Reports
│       ├── Worker Performance Reports
│       ├── Financial Reports
│       └── Custom Report Builder
│
├── 🗺️ MAP VIEW MODULE (Phase 6 - Upsell)
│   ├── ProjectMapView
│   │   ├── Google Maps Integration
│   │   ├── Project Pins (Color-coded by status)
│   │   ├── Worker Location Tracking
│   │   └── Route Optimization
│   │
│   └── ProximityScheduler
│       ├── Nearby Jobs Suggestion
│       ├── Travel Time Calculator
│       └── Territory Management
│
├── 💬 NOTIFICATIONS MODULE (Phase 4)
│   ├── ReminderSystem
│   │   ├── SMS via Twilio
│   │   ├── WhatsApp via Business API
│   │   ├── Email via SendGrid
│   │   └── In-App Notifications
│   │
│   ├── EscalationEngine
│   │   ├── No Response Handler
│   │   ├── Retry Logic (3d → 12h → day-of)
│   │   └── Manager Alerts
│   │
│   └── NotificationTemplates
│       ├── Task Assignment
│       ├── Reminders
│       ├── Confirmations
│       └── Completions
│
├── 📦 MATERIALS MODULE (Phase 5 - Upsell)
│   ├── MaterialExtractor (AI)
│   │   ├── Parse from Estimate
│   │   ├── Categorize Items
│   │   └── Quantity Calculations
│   │
│   ├── VendorPricing
│   │   ├── Multi-Vendor Comparison
│   │   ├── API Integrations (Home Depot, etc.)
│   │   └── Manual Price Entry
│   │
│   └── InventoryTracker (Optional)
│       ├── Stock Levels
│       ├── Reorder Alerts
│       └── Usage History
│
├── 👥 CLIENT PORTAL MODULE (Phase 6 - Upsell)
│   ├── ClientDashboard
│   │   ├── Project Status Overview
│   │   ├── Photo Gallery (Before/After)
│   │   ├── Budget Transparency
│   │   └── Messaging with PM
│   │
│   ├── PaymentPortal
│   │   ├── Stripe Integration
│   │   ├── Invoice Generation
│   │   ├── Payment History
│   │   └── Receipts
│   │
│   └── ApprovalWorkflows
│       ├── Change Order Approvals
│       ├── Photo Sign-offs
│       └── Final Inspections
│
└── ⚙️ SETTINGS & ADMIN
    ├── CompanySettings
    │   ├── Business Info
    │   ├── Branding (Logo, Colors)
    │   └── Default Preferences
    │
    ├── UserManagement
    │   ├── Admin Users
    │   ├── Worker Accounts
    │   └── Permissions & Roles
    │
    └── IntegrationSettings
        ├── API Keys (Twilio, Google, etc.)
        ├── Calendar Sync
        └── Payment Gateway
```

---

## 🔄 Data Flow Diagrams

### **Upload → Assignment Flow**
```
┌─────────────────┐
│ User Uploads    │
│ Estimate PDF    │
└────────┬────────┘
         ↓
┌─────────────────────────────────┐
│ Gemini Vision API               │
│ - Extract text & tables         │
│ - Identify line items           │
│ - Parse costs & quantities      │
└────────┬────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ Task Intelligence Layer         │
│ - Categorize by skill type      │
│ - Match to skill library        │
│ - Estimate time (historical)    │
│ - Identify dependencies         │
└────────┬────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ Auto-Assignment Engine          │
│ - Query worker availability     │
│ - Calculate proximity scores    │
│ - Optimize schedule batching    │
│ - Generate assignments          │
└────────┬────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ Notification Manager            │
│ - Create calendar events        │
│ - Queue reminders (3d, 12h, 0d) │
│ - Send initial assignment       │
└────────┬────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ Worker Mobile View              │
│ - Receives Labor Card           │
│ - Confirms or declines          │
│ - Executes task                 │
└─────────────────────────────────┘
```

### **Worker Execution Flow**
```
┌─────────────────┐
│ Worker Gets     │
│ Notification    │
└────────┬────────┘
         ↓
┌─────────────────────────────────┐
│ Review Phase                    │
│ - View task details             │
│ - Check materials list          │
│ - Confirm or decline            │
└────────┬────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ Preparation Phase               │
│ - Add to calendar               │
│ - Get directions (Maps)         │
│ - Gather materials              │
└────────┬────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ Active Work Phase               │
│ - Take BEFORE photos            │
│ - Follow step checklist         │
│ - Upload progress photos        │
│ - Log time                      │
└────────┬────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ Completion Phase                │
│ - Take AFTER photos             │
│ - Complete cleanup checklist    │
│ - Client walkthrough (optional) │
│ - Submit for review             │
└────────┬────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ Analytics Update                │
│ - Calculate efficiency score    │
│ - Update worker stats           │
│ - Track budget variance         │
│ - Feed ML model (time predict)  │
└─────────────────────────────────┘
```

---

## 🎨 UI Component Hierarchy

```
OperationsHub (Main Container)
│
├── Sidebar Navigation
│   ├── Logo & Branding
│   ├── Command Center
│   │   └── Dashboard
│   ├── Core System
│   │   ├── Projects
│   │   ├── Upload & Assign
│   │   ├── Workers
│   │   └── Tasks
│   ├── Modules
│   │   ├── Calendar
│   │   ├── Analytics
│   │   ├── Materials
│   │   └── Map View
│   └── User Profile
│
├── Header Bar
│   ├── Page Title & Subtitle
│   ├── Notifications Bell
│   └── Quick Actions
│
└── Main Content Area
    ├── Dashboard View
    │   ├── Stats Cards (4x circular)
    │   ├── Quick Actions Wheel (6 buttons)
    │   ├── Alerts Section (conflicts, warnings)
    │   ├── Active Project Card
    │   └── Activity Feed
    │
    ├── Projects View
    │   ├── Breadcrumb Navigation
    │   ├── Search & Filters
    │   ├── Project Grid (or Detail View)
    │   └── Task Admin Modal
    │
    ├── Upload View (NEW - Build This)
    │   ├── Upload Dropzone
    │   ├── AI Parsing Progress
    │   ├── Task Extraction Table
    │   └── Assignment Interface
    │
    ├── Workers View (NEW - Build This)
    │   ├── Worker Cards Grid
    │   ├── Leaderboard
    │   ├── Add Worker Form
    │   └── Worker Detail Modal
    │
    ├── Calendar View ✅ (Built)
    │   └── Multi-View Calendar
    │
    └── Analytics View (Future)
        ├── Performance Dashboard
        ├── Budget Tracker
        └── Reports
```

---

## 🔌 API Endpoints Architecture

```
API GATEWAY (Express.js)
│
├── /api/projects
│   ├── POST   /upload-estimate          → Upload PDF/Image
│   ├── POST   /parse-estimate           → AI parsing (Gemini)
│   ├── GET    /                         → List all projects
│   ├── GET    /:id                      → Project details
│   ├── PUT    /:id                      → Update project
│   ├── DELETE /:id                      → Delete project
│   └── GET    /:id/budget-status        → Budget tracking
│
├── /api/tasks
│   ├── POST   /                         → Create task (manual)
│   ├── POST   /bulk-create              → Create tasks (from estimate)
│   ├── GET    /                         → List tasks (with filters)
│   ├── GET    /:id                      → Task details
│   ├── PUT    /:id                      → Update task
│   ├── DELETE /:id                      → Delete task
│   ├── POST   /auto-assign              → Auto-assignment engine
│   └── GET    /:id/timeline             → Task timeline/history
│
├── /api/workers
│   ├── GET    /                         → List all workers
│   ├── GET    /:id                      → Worker details
│   ├── POST   /                         → Create worker
│   ├── PUT    /:id                      → Update worker
│   ├── DELETE /:id                      → Delete worker
│   ├── GET    /:id/availability         → Check calendar availability
│   ├── GET    /:id/performance          → Performance metrics
│   └── POST   /:id/skills               → Update skills
│
├── /api/assignments
│   ├── POST   /                         → Assign task to worker
│   ├── PUT    /:id                      → Update assignment
│   ├── POST   /:id/confirm              → Worker confirms task
│   ├── POST   /:id/decline              → Worker declines task
│   ├── POST   /:id/start                → Start task (clock-in)
│   ├── POST   /:id/complete             → Complete task
│   └── GET    /worker/:workerId         → Worker's assignments
│
├── /api/photos
│   ├── POST   /upload                   → Upload photo (S3/R2)
│   ├── GET    /task/:taskId             → Get task photos
│   ├── DELETE /:id                      → Delete photo
│   └── PUT    /:id/tag                  → Tag photo (before/after/progress)
│
├── /api/notifications
│   ├── POST   /send                     → Send notification
│   ├── POST   /schedule-reminder        → Schedule reminder
│   ├── GET    /worker/:workerId         → Worker notifications
│   ├── PUT    /:id/mark-read            → Mark notification as read
│   └── POST   /escalate                 → Escalation handler
│
├── /api/calendar
│   ├── GET    /availability             → Check worker availability
│   ├── POST   /create-event             → Create calendar event
│   ├── PUT    /event/:id                → Update event
│   ├── DELETE /event/:id                → Delete event
│   └── GET    /conflicts                → Detect conflicts
│
├── /api/analytics
│   ├── GET    /worker-performance       → Performance metrics
│   ├── GET    /project-budget           → Budget tracking
│   ├── GET    /efficiency               → Efficiency scores
│   ├── GET    /time-variance            → Time: estimated vs actual
│   └── GET    /reports                  → Custom reports
│
├── /api/materials
│   ├── POST   /extract                  → Extract from estimate (AI)
│   ├── GET    /task/:taskId             → Materials for task
│   ├── POST   /vendor-pricing           → Get vendor prices
│   └── GET    /cost-estimate            → Cost estimation (AI)
│
└── /api/ai
    ├── POST   /parse-pdf                → Gemini Vision (PDF)
    ├── POST   /parse-image              → Gemini Vision (Image)
    ├── POST   /analyze-task             → Claude (Task analysis)
    ├── POST   /estimate-time            → ML (Time prediction)
    └── POST   /match-workers            → ML (Worker assignment)
```

---

## 🗄️ Database Schema (PostgreSQL)

```sql
-- PROJECTS
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number VARCHAR(50) UNIQUE NOT NULL,
  client VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  budget DECIMAL(10,2),
  spent DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  priority VARCHAR(20) DEFAULT 'medium',
  start_date DATE,
  estimated_completion DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TASKS
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cost DECIMAL(10,2),
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  status VARCHAR(50) DEFAULT 'scheduled',
  priority VARCHAR(20) DEFAULT 'medium',
  scheduled_date DATE,
  completed_date DATE,
  photos_required INT DEFAULT 2,
  photos_uploaded INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- WORKERS
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) NOT NULL,
  skills TEXT[], -- Array: ['HVAC', 'Electrical', 'Plumbing']
  certifications TEXT[],
  efficiency_score DECIMAL(3,2) DEFAULT 1.00,
  availability_status VARCHAR(20) DEFAULT 'available',
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ASSIGNMENTS
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, in_progress, completed
  confirmed_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  actual_hours DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TASK STEPS
CREATE TABLE task_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  step_order INT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  photos_required INT DEFAULT 0,
  photos_uploaded INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- PHOTOS
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  step_id UUID REFERENCES task_steps(id) ON DELETE SET NULL,
  worker_id UUID REFERENCES workers(id),
  url TEXT NOT NULL,
  type VARCHAR(20), -- 'before', 'progress', 'after'
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- MATERIALS
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  item VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2),
  unit VARCHAR(50),
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  vendor VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES workers(id),
  type VARCHAR(50), -- 'sms', 'whatsapp', 'email', 'in_app'
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, failed
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- REMINDERS
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  reminder_type VARCHAR(50), -- '3_days_before', '12_hours_before', 'day_of'
  scheduled_time TIMESTAMP NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- WORKER PERFORMANCE
CREATE TABLE worker_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  efficiency_score DECIMAL(3,2), -- actual_hours / estimated_hours
  quality_score DECIMAL(3,2), -- based on rework, client feedback
  on_time BOOLEAN,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- BUDGET TRACKING
CREATE TABLE budget_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  category VARCHAR(100), -- 'labor', 'materials', 'permits', etc.
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  variance DECIMAL(10,2) GENERATED ALWAYS AS (actual_cost - estimated_cost) STORED,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- CALENDAR EVENTS
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id),
  google_event_id VARCHAR(255),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- DOCUMENTS
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type VARCHAR(50), -- 'estimate', 'permit', 'invoice', 'contract'
  name VARCHAR(255),
  url TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔄 Real-Time Updates (WebSocket Events)

```javascript
// Server → Client Events
{
  'task:assigned': { taskId, workerId, details },
  'task:confirmed': { taskId, workerId, confirmedAt },
  'task:started': { taskId, workerId, startedAt },
  'task:completed': { taskId, workerId, completedAt },
  'photo:uploaded': { taskId, photoId, type, url },
  'conflict:detected': { taskId, workerId, conflictDetails },
  'reminder:sent': { assignmentId, type, sentAt },
  'budget:alert': { projectId, variance, threshold }
}

// Client → Server Events
{
  'worker:join': { workerId }, // Worker comes online
  'worker:leave': { workerId }, // Worker goes offline
  'task:update': { taskId, updates },
  'photo:request': { taskId, stepId }
}
```

---

## 📱 Mobile-First Considerations (Future Upsell)

```
Desktop-First Build (Current)
├── Optimized for 1920x1080
├── Sidebar navigation
├── Grid layouts (4 columns)
└── Hover interactions

Mobile Responsive (Upsell Module - $2,500-3,500)
├── Breakpoint: 768px (tablet)
├── Breakpoint: 480px (mobile)
├── Hamburger menu
├── Bottom navigation
├── Stacked cards (1 column)
├── Touch-optimized buttons
└── Swipe gestures
```

---

**Last Updated**: October 2025
**Version**: 1.0
**Status**: 🟢 Infrastructure Defined - Ready to Build
