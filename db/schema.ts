import { pgTable, text, integer, decimal, timestamp, boolean, jsonb, varchar } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Projects Table
export const projects = pgTable('projects', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  number: varchar('number', { length: 50 }).notNull().unique(),
  client: varchar('client', { length: 255 }).notNull(),
  address: text('address').notNull(),
  budget: decimal('budget', { precision: 10, scale: 2 }).notNull(),
  spent: decimal('spent', { precision: 10, scale: 2 }).default('0'),
  status: varchar('status', { length: 50 }).default('active'),
  priority: varchar('priority', { length: 20 }).default('medium'),
  startDate: timestamp('start_date'),
  estimatedCompletion: timestamp('estimated_completion'),
  totalTasks: integer('total_tasks').default(0),
  completedTasks: integer('completed_tasks').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Workers Table
export const workers = pgTable('workers', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  phone: varchar('phone', { length: 20 }).notNull(),
  skills: jsonb('skills').$type<string[]>().default([]),
  certifications: jsonb('certifications').$type<string[]>().default([]),
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }),
  status: varchar('status', { length: 20 }).default('available'),
  efficiencyScore: decimal('efficiency_score', { precision: 3, scale: 2 }).default('1.00'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Tasks Table
export const tasks = pgTable('tasks', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  cost: decimal('cost', { precision: 10, scale: 2 }),
  estimatedHours: decimal('estimated_hours', { precision: 5, scale: 2 }),
  actualHours: decimal('actual_hours', { precision: 5, scale: 2 }),
  status: varchar('status', { length: 50 }).default('scheduled'),
  priority: varchar('priority', { length: 20 }).default('medium'),
  assignedTo: jsonb('assigned_to').$type<string[]>().default([]),
  scheduledDate: timestamp('scheduled_date'),
  completedDate: timestamp('completed_date'),
  photosRequired: integer('photos_required').default(2),
  photosUploaded: integer('photos_uploaded').default(0),
  materials: jsonb('materials').$type<string[]>().default([]),
  steps: jsonb('steps').$type<any[]>().default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Assignments Table (for tracking who's assigned to what)
export const assignments = pgTable('assignments', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  taskId: text('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  workerId: text('worker_id').notNull().references(() => workers.id, { onDelete: 'cascade' }),
  scheduledDate: timestamp('scheduled_date').notNull(),
  status: varchar('status', { length: 50 }).default('pending'),
  confirmedAt: timestamp('confirmed_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  actualHours: decimal('actual_hours', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Activity Log (for dashboard)
export const activityLog = pgTable('activity_log', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  type: varchar('type', { length: 50 }).notNull(),
  description: text('description').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow()
});

// Types
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Worker = typeof workers.$inferSelect;
export type NewWorker = typeof workers.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type Assignment = typeof assignments.$inferSelect;
export type NewAssignment = typeof assignments.$inferInsert;

export type Activity = typeof activityLog.$inferSelect;
export type NewActivity = typeof activityLog.$inferInsert;
