import { db } from '@/lib/db'
import { tasks, habits, habitLogs, notes, pomodoroSessions, countdowns, bannerPhotos, gymSessions } from '@/lib/schema'
import { desc, gte, lte, and } from 'drizzle-orm'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'
import Dashboard from '@/components/dashboard/Dashboard'
import type { Habit, HabitLog } from '@/lib/schema'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getData() {
  try {
    const now = new Date()
    const weekStart = format(startOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd')
    const weekEnd = format(endOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd')

    const [allTasks, allHabits, allNotes, recentSessions, recentLogs, allCountdowns, allBannerPhotos, weekGymSessions] = await Promise.all([
      db.select().from(tasks).orderBy(desc(tasks.createdAt)),
      db.select().from(habits).orderBy(desc(habits.createdAt)),
      db.select().from(notes).orderBy(desc(notes.pinned), desc(notes.updatedAt)),
      db.select().from(pomodoroSessions)
        .where(gte(pomodoroSessions.completedAt, subDays(now, 7)))
        .orderBy(desc(pomodoroSessions.completedAt)),
      db.select().from(habitLogs)
        .where(gte(habitLogs.logDate, format(subDays(now, 6), 'yyyy-MM-dd'))),
      db.select().from(countdowns).orderBy(countdowns.targetDate),
      db.select().from(bannerPhotos).orderBy(bannerPhotos.position),
      db.select().from(gymSessions).where(
        and(gte(gymSessions.sessionDate, weekStart), lte(gymSessions.sessionDate, weekEnd))
      ),
    ])

    const habitsWithLogs = allHabits.map((habit: Habit) => ({
      ...habit,
      logs: recentLogs.filter((log: HabitLog) => log.habitId === habit.id),
    }))

    return {
      tasks: allTasks, habits: habitsWithLogs, notes: allNotes,
      sessions: recentSessions, countdowns: allCountdowns,
      bannerPhotos: allBannerPhotos, gymSessions: weekGymSessions,
    }
  } catch (error) {
    console.error('Failed to fetch data:', error)
    return { tasks: [], habits: [], notes: [], sessions: [], countdowns: [], bannerPhotos: [], gymSessions: [] }
  }
}

export default async function Home() {
  const { tasks: allTasks, habits: allHabits, notes: allNotes, sessions, countdowns: allCountdowns, bannerPhotos: allBannerPhotos, gymSessions: weekGymSessions } = await getData()

  return (
    <Dashboard
      initialTasks={allTasks}
      initialHabits={allHabits}
      initialNotes={allNotes}
      initialSessions={sessions}
      initialCountdowns={allCountdowns}
      initialBannerPhotos={allBannerPhotos}
      initialGymSessions={weekGymSessions}
    />
  )
}
