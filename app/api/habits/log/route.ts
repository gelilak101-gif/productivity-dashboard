import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { habitLogs } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { format } from 'date-fns'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { habitId, date } = body
    const logDate = date || format(new Date(), 'yyyy-MM-dd')

    // Check if log already exists
    const existing = await db.select().from(habitLogs)
      .where(and(
        eq(habitLogs.habitId, habitId),
        eq(habitLogs.logDate, logDate)
      ))

    if (existing.length > 0) {
      // Delete it (toggle off)
      await db.delete(habitLogs)
        .where(and(
          eq(habitLogs.habitId, habitId),
          eq(habitLogs.logDate, logDate)
        ))
      return NextResponse.json({ completed: false })
    } else {
      // Create it (toggle on)
      await db.insert(habitLogs).values({ habitId, logDate })
      return NextResponse.json({ completed: true })
    }
  } catch (error) {
    console.error('POST /api/habits/log error:', error)
    return NextResponse.json({ error: 'Failed to toggle habit log' }, { status: 500 })
  }
}
