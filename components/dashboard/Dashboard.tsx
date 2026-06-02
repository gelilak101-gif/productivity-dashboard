'use client'

import { useState } from 'react'
import { format, subDays } from 'date-fns'
import DashboardHeader from './DashboardHeader'
import TasksPanel from './TasksPanel'
import HabitsPanel from './HabitsPanel'
import CollageBanner from './CollageBanner'
import CountdownsWidget from './CountdownsWidget'
import CalendarWidget from './CalendarWidget'
import GymWeeklyWidget from './GymWeeklyWidget'
import type { Task, Habit, HabitLog, Note, PomodoroSession, Countdown, BannerPhoto, GymSession } from '@/lib/schema'

type HabitWithLogs = Habit & { logs: HabitLog[] }

interface DashboardProps {
  initialTasks: Task[]
  initialHabits: HabitWithLogs[]
  initialNotes: Note[]
  initialSessions: PomodoroSession[]
  initialCountdowns: Countdown[]
  initialBannerPhotos: BannerPhoto[]
  initialGymSessions: GymSession[]
}

export default function Dashboard({
  initialTasks, initialHabits, initialNotes, initialSessions,
  initialCountdowns, initialBannerPhotos, initialGymSessions,
}: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [habits, setHabits] = useState<HabitWithLogs[]>(initialHabits)
  const [countdowns, setCountdowns] = useState<Countdown[]>(initialCountdowns)
  const [bannerPhotos, setBannerPhotos] = useState<BannerPhoto[]>(initialBannerPhotos)
  const [gymSessions, setGymSessions] = useState<GymSession[]>(initialGymSessions)
  const [mobileTab, setMobileTab] = useState<'tasks' | 'habits' | 'gym' | 'more'>('tasks')

  const maxStreak = habits.reduce((best, habit) => {
    let streak = 0
    for (let i = 0; i < 7; i++) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
      if (habit.logs.some(l => l.logDate === d && l.completed)) streak++
      else break
    }
    return Math.max(best, streak)
  }, 0)

  const mobileTabs = [
    { key: 'tasks', label: '✅ Tasks' },
    { key: 'habits', label: '🌿 Habits' },
    { key: 'gym', label: '💪 Gym' },
    { key: 'more', label: '📅 More' },
  ] as const

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      backgroundImage: `
        radial-gradient(ellipse at 20% 0%, rgba(201,137,106,0.08) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 100%, rgba(92,99,80,0.06) 0%, transparent 50%)
      `,
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 24px' }} className="mobile-container">

        {/* Collage Banner */}
        <CollageBanner photos={bannerPhotos} onPhotosChange={setBannerPhotos}>
          <DashboardHeader
            tasksDone={tasks.filter(t => t.completed).length}
            tasksTotal={tasks.length}
            habitsStreak={maxStreak}
            onDarkBg={bannerPhotos.length > 0}
          />
        </CollageBanner>

        {/* DESKTOP grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr 320px',
          gap: '14px',
          alignItems: 'start',
        }} className="desktop-grid">
          <div className="card" style={{ padding: '20px', minHeight: '560px', display: 'flex', flexDirection: 'column' }}>
            <TasksPanel tasks={tasks} onTasksChange={setTasks} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <HabitsPanel habits={habits} onHabitsChange={setHabits} />
            </div>
            <div className="card" style={{ padding: '20px' }}>
              <GymWeeklyWidget gymSessions={gymSessions} onGymSessionsChange={setGymSessions} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <CalendarWidget />
            </div>
            <div className="card" style={{ padding: '20px' }}>
              <CountdownsWidget countdowns={countdowns} onCountdownsChange={setCountdowns} />
            </div>
          </div>
        </div>

        {/* MOBILE tabs */}
        <div style={{ display: 'none' }} className="mobile-only" id="mobile-content">
          {/* Tab buttons */}
          <div style={{
            display: 'flex', gap: '6px', marginBottom: '14px',
            overflowX: 'auto', paddingBottom: '2px',
          }}>
            {mobileTabs.map(tab => (
              <button key={tab.key} onClick={() => setMobileTab(tab.key)} style={{
                background: mobileTab === tab.key ? 'var(--text-primary)' : 'var(--bg-card)',
                border: `1px solid ${mobileTab === tab.key ? 'var(--text-primary)' : 'var(--border)'}`,
                borderRadius: '20px', cursor: 'pointer', whiteSpace: 'nowrap',
                color: mobileTab === tab.key ? 'white' : 'var(--text-secondary)',
                fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500,
                padding: '8px 16px', transition: 'all 0.15s',
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          {mobileTab === 'tasks' && (
            <div className="card" style={{ padding: '16px', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
              <TasksPanel tasks={tasks} onTasksChange={setTasks} />
            </div>
          )}
          {mobileTab === 'habits' && (
            <div className="card" style={{ padding: '16px' }}>
              <HabitsPanel habits={habits} onHabitsChange={setHabits} />
            </div>
          )}
          {mobileTab === 'gym' && (
            <div className="card" style={{ padding: '16px' }}>
              <GymWeeklyWidget gymSessions={gymSessions} onGymSessionsChange={setGymSessions} />
            </div>
          )}
          {mobileTab === 'more' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="card" style={{ padding: '16px' }}>
                <CalendarWidget />
              </div>
              <div className="card" style={{ padding: '16px' }}>
                <CountdownsWidget countdowns={countdowns} onCountdownsChange={setCountdowns} />
              </div>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)', fontSize: '11px', fontStyle: 'italic' }}>
          Focus — Gelila's Dashboard
        </div>
      </div>

      {/* Inline mobile CSS override */}
      <style>{`
        @media (max-width: 767px) {
          .desktop-grid { display: none !important; }
          #mobile-content { display: block !important; }
          .mobile-container { padding: 16px !important; padding-bottom: 90px !important; }
        }
        @media (min-width: 768px) {
          #mobile-content { display: none !important; }
          .desktop-grid { display: grid !important; }
        }
      `}</style>
    </div>
  )
}
