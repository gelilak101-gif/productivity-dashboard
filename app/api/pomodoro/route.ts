import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pomodoroSessions } from '@/lib/schema'
import { desc, gte } from 'drizzle-orm'
import { subDays } from 'date-fns'

export async function GET() {
  try {
    const sevenDaysAgo = subDays(new Date(), 7)
    const sessions = await db.select().from(pomodoroSessions)
      .where(gte(pomodoroSessions.completedAt, sevenDaysAgo))
      .orderBy(desc(pomodoroSessions.completedAt))

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('GET /api/pomodoro error:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { duration, type, taskId } = body

    const [session] = await db.insert(pomodoroSessions).values({
      duration,
      type: type || 'work',
      taskId: taskId || null,
    }).returning()

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error('POST /api/pomodoro error:', error)
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 })
  }
}
