// Test script to simulate complete task assignment workflow
// Run this in browser console on localhost:3000

console.log("🧪 TASK ASSIGNMENT WORKFLOW TEST\n");

// Step 1: Get initial data
console.log("📋 Step 1: Getting initial data...");
const projects = JSON.parse(localStorage.getItem('digital-pm-projects') || '[]');
const workers = JSON.parse(localStorage.getItem('digital-pm-workers') || '[]');

console.log(`   Found ${projects.length} projects`);
console.log(`   Found ${workers.length} workers`);

if (workers.length === 0) {
  console.error("❌ No workers found! Run storage.init() first");
} else {
  console.log("\n👷 Workers:");
  workers.forEach(w => console.log(`   - ${w.name} (${w.skills.join(', ')})`));
}

if (projects.length === 0) {
  console.log("\n⚠️  No projects found. Creating test project...");

  const testProject = {
    number: "TEST-001",
    clientName: "Test Client",
    clientAddress: "123 Test St, Denver CO",
    estimateDate: new Date().toISOString().split('T')[0],
    status: "active",
    color: "blue",
    tasks: [
      {
        description: "Install HVAC system",
        quantity: 1,
        price: 5000,
        amount: 5000,
        type: "hvac",
        estimatedHours: 8,
        status: "unassigned",
        skills: ["HVAC"],
        activity: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        description: "Install electrical outlets",
        quantity: 10,
        price: 150,
        amount: 1500,
        type: "electrical",
        estimatedHours: 4,
        status: "unassigned",
        skills: ["Electrical"],
        activity: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    subtotal: 6500,
    tax: 325,
    total: 6825
  };

  // Simulate storage.addProject
  const newProject = {
    ...testProject,
    id: `p-${Date.now()}`,
    tasks: testProject.tasks.map((t, idx) => ({
      ...t,
      id: `t-${Date.now()}-${idx}`
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  projects.push(newProject);
  localStorage.setItem('digital-pm-projects', JSON.stringify(projects));
  console.log("   ✅ Created test project #TEST-001 with 2 tasks");
}

// Get fresh data
const currentProjects = JSON.parse(localStorage.getItem('digital-pm-projects') || '[]');
const currentWorkers = JSON.parse(localStorage.getItem('digital-pm-workers') || '[]');

console.log("\n\n🔄 SIMULATING WORKFLOW:\n");

// Get first project and task
const project = currentProjects[0];
const task = project.tasks.find(t => t.status === 'unassigned' || t.status === 'pending');

if (!task) {
  console.error("❌ No unassigned tasks found!");
} else {
  // Get worker with matching skills
  const worker = currentWorkers.find(w =>
    task.skills.some(skill => w.skills.includes(skill))
  ) || currentWorkers[0];

  console.log(`1️⃣  TASK: "${task.description}" (${task.status})`);
  console.log(`   Skills needed: ${task.skills.join(', ')}\n`);

  // Step 2: Assign task
  console.log(`2️⃣  ASSIGN to ${worker.name}`);
  console.log(`   Date: ${new Date().toISOString().split('T')[0]}`);
  console.log(`   Time: 09:00 AM`);
  console.log(`   Duration: 4 hours`);

  task.status = 'pending_acceptance';
  task.assignedTo = worker.id;
  task.assignedDate = new Date().toISOString().split('T')[0];
  task.time = '09:00 AM';
  task.duration = 4;
  task.activity = task.activity || [];
  task.activity.push({
    id: `a-${Date.now()}`,
    date: new Date().toISOString(),
    action: `Assigned to ${worker.name}`,
    user: 'Robert'
  });
  task.updatedAt = new Date().toISOString();

  console.log(`   ✅ Status: ${task.status}\n`);

  // Step 3: Worker accepts
  console.log(`3️⃣  ${worker.name} ACCEPTS task`);
  task.status = 'accepted';
  task.activity.push({
    id: `a-${Date.now() + 1}`,
    date: new Date().toISOString(),
    action: `Accepted by ${worker.name}`,
    user: worker.name
  });
  task.updatedAt = new Date().toISOString();
  console.log(`   ✅ Status: ${task.status}\n`);

  // Step 4: Worker starts work
  console.log(`4️⃣  ${worker.name} STARTS work`);
  task.status = 'in_progress';
  task.activity.push({
    id: `a-${Date.now() + 2}`,
    date: new Date().toISOString(),
    action: `Started work`,
    user: worker.name
  });
  task.updatedAt = new Date().toISOString();
  console.log(`   ✅ Status: ${task.status}\n`);

  // Step 5: Worker completes
  console.log(`5️⃣  ${worker.name} COMPLETES task`);
  task.status = 'completed';
  task.activity.push({
    id: `a-${Date.now() + 3}`,
    date: new Date().toISOString(),
    action: `Completed task`,
    user: worker.name
  });
  task.updatedAt = new Date().toISOString();
  console.log(`   ✅ Status: ${task.status}\n`);

  // Save updated project
  localStorage.setItem('digital-pm-projects', JSON.stringify(currentProjects));

  console.log("\n✨ WORKFLOW COMPLETE!\n");
  console.log("📊 Final task state:");
  console.log(`   Status: ${task.status}`);
  console.log(`   Assigned to: ${worker.name}`);
  console.log(`   Activity log: ${task.activity.length} entries`);
  console.log("\n💡 Reload the page to see changes in UI");
  console.log("   Or run: window.location.reload()");
}

console.log("\n\n📋 KANBAN COLUMN MAPPING:");
console.log("   TO DO: unassigned, rejected");
console.log("   IN PROGRESS: pending_acceptance, accepted, in_progress");
console.log("   DONE: completed");

console.log("\n\n🔍 TO VERIFY:");
console.log("1. Go to Projects → Click project");
console.log("2. Check 3-column Kanban shows tasks correctly");
console.log("3. Click task → Workers should appear in dropdown");
console.log("4. Go to Tasks view → Check 5-column Kanban");
console.log("5. Activity log should show all state changes");
