import { db } from '@/lib/db'
import { tasks, weeklyPlans, gymSessions } from '@/lib/schema'
import { eq, gte, lte, and } from 'drizzle-orm'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import WeeklyDashboard from '@/components/dashboard/WeeklyDashboard'
import { desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function WeeklyPage() {
  const now = new Date()
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const [allTasks, plan, sessions] = await Promise.all([
    db.select().from(tasks).orderBy(desc(tasks.createdAt)),
    db.select().from(weeklyPlans).where(eq(weeklyPlans.weekStart, weekStart)).then(r => r[0] || null),
    db.select().from(gymSessions).where(
      and(gte(gymSessions.sessionDate, weekStart), lte(gymSessions.sessionDate, weekEnd))
    ),
  ])

  return (
    <WeeklyDashboard
      initialTasks={allTasks}
      initialPlan={plan}
      initialGymSessions={sessions}
      weekStart={weekStart}
      weekEnd={weekEnd}
    />
  )
}
