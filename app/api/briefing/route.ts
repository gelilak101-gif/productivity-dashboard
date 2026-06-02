import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tasks, googleTokens, weeklyPlans } from '@/lib/schema'
import { getTodayEvents, refreshAccessToken, formatEventTime } from '@/lib/google'
import { format, startOfWeek } from 'date-fns'
import { eq, gte } from 'drizzle-orm'

export async function GET() {
  try {
    const today = format(new Date(), 'yyyy-MM-dd')
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
    const dayName = format(new Date(), 'EEEE')

    // Get today's tasks
    const allTasks = await db.select().from(tasks)
    const todayTasks = allTasks.filter(t =>
      !t.completed && t.dueDate &&
      format(new Date(t.dueDate), 'yyyy-MM-dd') === today
    )
    const unscheduled = allTasks.filter(t => !t.completed && !t.dueDate).slice(0, 3)

    // Get weekly focus
    const [plan] = await db.select().from(weeklyPlans).where(eq(weeklyPlans.weekStart, weekStart))

    // Get calendar events
    let events: any[] = []
    const [tokenRow] = await db.select().from(googleTokens).limit(1)
    if (tokenRow) {
      let accessToken = tokenRow.accessToken
      if (tokenRow.expiresAt && new Date() > tokenRow.expiresAt && tokenRow.refreshToken) {
        const refreshed = await refreshAccessToken(tokenRow.refreshToken)
        if (refreshed.access_token) accessToken = refreshed.access_token
      }
      events = await getTodayEvents(accessToken) || []
    }

    // Build the briefing message
    let message = `${greeting}, Gelila! ✦\n${dayName}\n\n`

    if (events.length > 0) {
      message += `📅 Today:\n`
      events.forEach((e: any) => {
        message += `• ${formatEventTime(e)} - ${e.summary}\n`
      })
      message += '\n'
    }

    if (todayTasks.length > 0) {
      message += `✅ On your list today:\n`
      todayTasks.forEach((t, i) => {
        message += `${i + 1}. ${t.title}\n`
      })
      message += '\n'
    } else if (unscheduled.length > 0) {
      message += `✅ This week:\n`
      unscheduled.forEach((t, i) => {
        message += `${i + 1}. ${t.title}\n`
      })
      message += '\n'
    }

    if (plan?.weeklyFocus) {
      message += `🎯 Weekly focus: ${plan.weeklyFocus}\n`
    }

    message += `\nMake it a great day ✨`

    return NextResponse.json({ message, events, tasks: todayTasks })
  } catch (error) {
    console.error('GET /api/briefing error:', error)
    return NextResponse.json({ error: 'Failed to generate briefing' }, { status: 500 })
  }
}
