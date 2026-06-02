# Focus — Personal Productivity Dashboard

A full-stack productivity dashboard built with Next.js 14 App Router, deployed on Vercel, with Neon Postgres for data persistence.

## Features

- **Tasks** — Add, complete, prioritize, and filter tasks with progress tracking
- **Habit Tracker** — Track daily habits with a 7-day grid view, streaks, and color coding
- **Notes** — Create, pin, and edit rich notes with color themes
- **Pomodoro Timer** — Focus timer with short/long breaks, cycle tracking, and session history

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Neon Postgres (serverless) |
| ORM | Drizzle ORM |
| Deployment | Vercel |

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── tasks/route.ts        # GET, POST, PATCH, DELETE tasks
│   │   ├── habits/
│   │   │   ├── route.ts          # GET, POST, DELETE habits
│   │   │   └── log/route.ts      # POST toggle habit log
│   │   ├── notes/route.ts        # GET, POST, PATCH, DELETE notes
│   │   └── pomodoro/route.ts     # GET, POST sessions
│   ├── globals.css               # Design tokens & base styles
│   ├── layout.tsx                # Root layout with fonts
│   └── page.tsx                  # Server component with data fetching
├── components/dashboard/
│   ├── Dashboard.tsx             # Main layout & state management
│   ├── DashboardHeader.tsx       # Header with date & quick stats
│   ├── TasksPanel.tsx            # Task manager
│   ├── HabitsPanel.tsx           # Habit tracker with 7-day grid
│   ├── NotesPanel.tsx            # Notes with inline editing
│   └── PomodoroTimer.tsx         # Focus timer with SVG ring
├── lib/
│   ├── schema.ts                 # Drizzle ORM table definitions
│   └── db.ts                     # Neon DB connection
└── scripts/
    └── migrate.js                # Database setup script
```

## Getting Started

### 1. Clone & Install

```bash
git clone <your-repo>
cd productivity-dashboard
npm install
```

### 2. Set Up Neon Database

1. Go to [console.neon.tech](https://console.neon.tech)
2. Create a new project
3. Copy your connection string from **Project Settings → Connection Details**
4. Create `.env.local`:

```bash
cp .env.local.example .env.local
# Edit .env.local and paste your DATABASE_URL
```

### 3. Run Database Migration

```bash
npm run db:push
```

This creates all 5 tables: `tasks`, `habits`, `habit_logs`, `notes`, `pomodoro_sessions`.

### 4. Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

### Option A: Vercel Dashboard (Recommended)

1. Push to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Add environment variable: `DATABASE_URL` = your Neon connection string
5. Deploy!

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel
# Follow prompts, then set env var:
vercel env add DATABASE_URL
```

### Neon + Vercel Integration (Optional)

Vercel and Neon have a native integration that auto-provisions a database:
1. In Vercel dashboard → **Storage** → **Connect Store** → **Neon**
2. This auto-sets `DATABASE_URL` in your Vercel env

## Database Schema

```sql
-- Tasks with priority and due dates
tasks (id, title, description, completed, priority, due_date, created_at, updated_at)

-- Habit definitions
habits (id, name, emoji, color, target_days, created_at)

-- Daily habit completion logs
habit_logs (id, habit_id, log_date, completed, created_at)

-- Notes with pin and color support
notes (id, title, content, pinned, color, created_at, updated_at)

-- Pomodoro session history
pomodoro_sessions (id, duration, type, task_id, completed_at)
```

## Customization

- **Timer durations**: Edit `MODES` in `components/dashboard/PomodoroTimer.tsx`
- **Colors**: Edit CSS variables in `app/globals.css`
- **Fonts**: Replace Google Fonts links in `app/layout.tsx`
- **Layout**: Adjust grid in `components/dashboard/Dashboard.tsx`
