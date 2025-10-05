import { db } from '../db';
import { projects, workers, tasks } from '../db/schema';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Seed workers
    console.log('Adding workers...');
    const worker1 = await db.insert(workers).values({
      name: 'Carlos Rodriguez',
      email: 'carlos@example.com',
      phone: '(720) 555-0101',
      skills: ['HVAC', 'General Labor'],
      hourlyRate: '45.00',
      status: 'available'
    }).returning();

    const worker2 = await db.insert(workers).values({
      name: 'Juan Martinez',
      email: 'juan@example.com',
      phone: '(720) 555-0102',
      skills: ['Electrical'],
      hourlyRate: '50.00',
      status: 'available'
    }).returning();

    const worker3 = await db.insert(workers).values({
      name: 'David Chen',
      email: 'david@example.com',
      phone: '(720) 555-0103',
      skills: ['Masonry', 'General Labor'],
      hourlyRate: '48.00',
      status: 'available'
    }).returning();

    console.log('✅ Workers added');

    // Seed Project #2011 (Jack Shippee)
    console.log('Adding Project #2011...');
    const project = await db.insert(projects).values({
      number: '2011',
      client: 'Jack Shippee',
      address: '2690 Stuart St, Denver CO 80212',
      budget: '3953.25',
      spent: '0',
      status: 'active',
      priority: 'medium',
      startDate: new Date('2025-09-04'),
      estimatedCompletion: new Date('2025-10-20')
    }).returning();

    console.log('✅ Project #2011 added');

    // Seed tasks from Estimate #2011
    console.log('Adding tasks...');
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
        description: 'Install code-compliant smoke detectors throughout property',
        cost: '240.00',
        estimatedHours: '2.00',
        status: 'scheduled',
        priority: 'high',
        materials: ['Smoke detectors', 'Batteries', 'Mounting hardware']
      },
      {
        projectId: project[0].id,
        title: 'Plumbing - Kitchen Sink',
        description: 'Plumber, inspect and repair all leaks in sink/plumbing',
        cost: '375.00',
        estimatedHours: '2.50',
        status: 'scheduled',
        priority: 'high',
        materials: ['Pipes', 'Fittings', 'Sealant']
      },
      {
        projectId: project[0].id,
        title: 'Backyard walkway',
        description: 'Repair and level concrete walkway',
        cost: '650.00',
        estimatedHours: '4.00',
        status: 'scheduled',
        priority: 'medium',
        materials: ['Concrete mix', 'Rebar', 'Tools']
      },
      {
        projectId: project[0].id,
        title: 'Fix garage door',
        description: 'Inspect and repair garage door mechanism',
        cost: '280.00',
        estimatedHours: '2.00',
        status: 'scheduled',
        priority: 'medium',
        materials: ['Springs', 'Cables', 'Lubricant']
      },
      {
        projectId: project[0].id,
        title: 'Basement Electrical',
        description: 'Update electrical wiring to code',
        cost: '890.00',
        estimatedHours: '6.00',
        status: 'scheduled',
        priority: 'high',
        materials: ['Wire', 'Outlets', 'Breakers']
      },
      {
        projectId: project[0].id,
        title: 'Paint master bedroom',
        description: 'Prep and paint master bedroom walls',
        cost: '320.00',
        estimatedHours: '4.00',
        status: 'scheduled',
        priority: 'low',
        materials: ['Paint', 'Primer', 'Brushes', 'Rollers']
      },
      {
        projectId: project[0].id,
        title: 'Replace front door weatherstripping',
        description: 'Install new weatherstripping on front entry',
        cost: '85.00',
        estimatedHours: '1.00',
        status: 'scheduled',
        priority: 'low',
        materials: ['Weatherstripping', 'Adhesive']
      }
    ]);

    console.log('✅ Tasks added');

    // Update project task count
    await db.update(projects).set({
      totalTasks: 8,
      updatedAt: new Date()
    }).where(projects.id.eq(project[0].id));

    console.log('✅ Seed completed successfully!');
    console.log(`
📊 Seeded Data:
- 3 workers (Carlos, Juan, David)
- 1 project (#2011 - Jack Shippee)
- 8 tasks ($3,953.25 total)
`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
