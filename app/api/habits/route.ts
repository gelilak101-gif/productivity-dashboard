import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { habits, habitLogs } from '@/lib/schema'
import { eq, desc, gte } from 'drizzle-orm'
import { format, subDays } from 'date-fns'

export async function GET() {
  try {
    const allHabits = await db.select().from(habits).orderBy(desc(habits.createdAt))
    const sevenDaysAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd')
    const logs = await db.select().from(habitLogs).where(gte(habitLogs.logDate, sevenDaysAgo))
    const habitsWithLogs = allHabits.map(habit => ({
      ...habit,
      logs: logs.filter(log => log.habitId === habit.id),
    }))
    return NextResponse.json(habitsWithLogs)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, emoji, color, targetDays, section } = body
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const [habit] = await db.insert(habits).values({
      name: name.trim(), emoji: emoji || '✓', color: color || 'amber',
      targetDays: targetDays || 7, section: section || 'daily',
    }).returning()
    return NextResponse.json({ ...habit, logs: [] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    await db.delete(habits).where(eq(habits.id, parseInt(id)))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 })
  }
}
