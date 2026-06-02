import { pgTable, serial, text, boolean, timestamp, integer, varchar } from 'drizzle-orm/pg-core'

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  completed: boolean('completed').default(false).notNull(),
  priority: varchar('priority', { length: 10 }).default('medium').notNull(),
  dueDate: timestamp('due_date'),       // kept for backwards compat / single day
  startDate: timestamp('start_date'),   // range start
  endDate: timestamp('end_date'),       // range end
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const habits = pgTable('habits', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  emoji: varchar('emoji', { length: 10 }).default('✓').notNull(),
  color: varchar('color', { length: 20 }).default('amber').notNull(),
  targetDays: integer('target_days').default(7).notNull(),
  section: varchar('section', { length: 10 }).default('daily').notNull(), // daily, weekly, monthly
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const habitLogs = pgTable('habit_logs', {
  id: serial('id').primaryKey(),
  habitId: integer('habit_id').notNull().references(() => habits.id, { onDelete: 'cascade' }),
  logDate: varchar('log_date', { length: 10 }).notNull(),
  completed: boolean('completed').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').default('').notNull(),
  pinned: boolean('pinned').default(false).notNull(),
  color: varchar('color', { length: 20 }).default('default').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const pomodoroSessions = pgTable('pomodoro_sessions', {
  id: serial('id').primaryKey(),
  duration: integer('duration').notNull(),
  type: varchar('type', { length: 10 }).default('work').notNull(),
  taskId: integer('task_id').references(() => tasks.id, { onDelete: 'set null' }),
  completedAt: timestamp('completed_at').defaultNow().notNull(),
})

export const weeklyPlans = pgTable('weekly_plans', {
  id: serial('id').primaryKey(),
  weekStart: varchar('week_start', { length: 10 }).notNull(),
  weeklyFocus: text('weekly_focus').default('').notNull(),
  goals: text('goals').default('').notNull(),
  reflections: text('reflections').default('').notNull(),
  plans: text('plans').default('').notNull(),
  reminders: text('reminders').default('').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const gymSessions = pgTable('gym_sessions', {
  id: serial('id').primaryKey(),
  sessionDate: varchar('session_date', { length: 10 }).notNull(),
  type: varchar('type', { length: 30 }).default('workout').notNull(),
  notes: text('notes').default('').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Quarterly goals: Health, Business, Personal
export const quarterlyGoals = pgTable('quarterly_goals', {
  id: serial('id').primaryKey(),
  quarterKey: varchar('quarter_key', { length: 7 }).notNull(), // e.g. "2026-Q2"
  category: varchar('category', { length: 20 }).notNull(), // Health, Business, Personal
  text: text('text').notNull(),
  completed: boolean('completed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Big Picture items: Travel, Career/Business, Personal, Health, Financial
export const bigPictureItems = pgTable('big_picture_items', {
  id: serial('id').primaryKey(),
  category: varchar('category', { length: 20 }).notNull(),
  text: text('text').notNull(),
  completed: boolean('completed').default(false).notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
export type Habit = typeof habits.$inferSelect
export type NewHabit = typeof habits.$inferInsert
export type HabitLog = typeof habitLogs.$inferSelect
export type Note = typeof notes.$inferSelect
export type NewNote = typeof notes.$inferInsert
export type PomodoroSession = typeof pomodoroSessions.$inferSelect
export type WeeklyPlan = typeof weeklyPlans.$inferSelect
export type GymSession = typeof gymSessions.$inferSelect
export type QuarterlyGoal = typeof quarterlyGoals.$inferSelect
export type BigPictureItem = typeof bigPictureItems.$inferSelect

export const countdowns = pgTable('countdowns', {
  id: serial('id').primaryKey(),
  label: text('label').notNull(),
  targetDate: varchar('target_date', { length: 10 }).notNull(), // YYYY-MM-DD
  emoji: varchar('emoji', { length: 10 }).default('🎯').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const bannerPhotos = pgTable('banner_photos', {
  id: serial('id').primaryKey(),
  url: text('url').notNull(),
  position: integer('position').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type Countdown = typeof countdowns.$inferSelect
export type BannerPhoto = typeof bannerPhotos.$inferSelect

export const googleTokens = pgTable('google_tokens', {
  id: serial('id').primaryKey(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type GoogleToken = typeof googleTokens.$inferSelect
