import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'

// Load .env.local manually
try {
  const env = readFileSync('.env.local', 'utf8')
  env.split('\n').forEach(line => {
    const [key, ...val] = line.split('=')
    if (key && val.length) process.env[key.trim()] = val.join('=').trim()
  })
} catch {}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)
console.log('🔄 Running migrations...')

await sql`CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT,
  completed BOOLEAN DEFAULT false NOT NULL, priority VARCHAR(10) DEFAULT 'medium' NOT NULL,
  due_date TIMESTAMP, created_at TIMESTAMP DEFAULT NOW() NOT NULL, updated_at TIMESTAMP DEFAULT NOW() NOT NULL
)`

await sql`CREATE TABLE IF NOT EXISTS habits (
  id SERIAL PRIMARY KEY, name TEXT NOT NULL, emoji VARCHAR(10) DEFAULT '✓' NOT NULL,
  color VARCHAR(20) DEFAULT 'amber' NOT NULL, target_days INTEGER DEFAULT 7 NOT NULL,
  section VARCHAR(10) DEFAULT 'daily' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
)`

await sql`ALTER TABLE habits ADD COLUMN IF NOT EXISTS section VARCHAR(10) DEFAULT 'daily' NOT NULL`

await sql`CREATE TABLE IF NOT EXISTS habit_logs (
  id SERIAL PRIMARY KEY, habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  log_date VARCHAR(10) NOT NULL, completed BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL, UNIQUE(habit_id, log_date)
)`

await sql`CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY, title TEXT NOT NULL, content TEXT DEFAULT '' NOT NULL,
  pinned BOOLEAN DEFAULT false NOT NULL, color VARCHAR(20) DEFAULT 'default' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL, updated_at TIMESTAMP DEFAULT NOW() NOT NULL
)`

await sql`CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id SERIAL PRIMARY KEY, duration INTEGER NOT NULL, type VARCHAR(10) DEFAULT 'work' NOT NULL,
  task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL, completed_at TIMESTAMP DEFAULT NOW() NOT NULL
)`

await sql`CREATE TABLE IF NOT EXISTS weekly_plans (
  id SERIAL PRIMARY KEY, week_start VARCHAR(10) NOT NULL UNIQUE,
  weekly_focus TEXT DEFAULT '' NOT NULL, goals TEXT DEFAULT '' NOT NULL,
  reflections TEXT DEFAULT '' NOT NULL, plans TEXT DEFAULT '' NOT NULL,
  reminders TEXT DEFAULT '' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL, updated_at TIMESTAMP DEFAULT NOW() NOT NULL
)`

await sql`CREATE TABLE IF NOT EXISTS gym_sessions (
  id SERIAL PRIMARY KEY, session_date VARCHAR(10) NOT NULL UNIQUE,
  type VARCHAR(30) DEFAULT 'workout' NOT NULL, notes TEXT DEFAULT '' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
)`

await sql`CREATE TABLE IF NOT EXISTS quarterly_goals (
  id SERIAL PRIMARY KEY, quarter_key VARCHAR(7) NOT NULL,
  category VARCHAR(20) NOT NULL, text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
)`

await sql`CREATE TABLE IF NOT EXISTS big_picture_items (
  id SERIAL PRIMARY KEY, category VARCHAR(20) NOT NULL,
  text TEXT NOT NULL, completed BOOLEAN DEFAULT false NOT NULL,
  completed_at TIMESTAMP, created_at TIMESTAMP DEFAULT NOW() NOT NULL
)`

await sql`CREATE TABLE IF NOT EXISTS countdowns (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  target_date VARCHAR(10) NOT NULL,
  emoji VARCHAR(10) DEFAULT '🎯' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
)`

await sql`CREATE TABLE IF NOT EXISTS banner_photos (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  position INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
)`

console.log('✅ All tables created successfully!')

await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date TIMESTAMP`
await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS end_date TIMESTAMP`

await sql`CREATE TABLE IF NOT EXISTS google_tokens (
  id SERIAL PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
)`


