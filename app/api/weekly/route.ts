import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { weeklyPlans } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const weekStart = searchParams.get('weekStart')
    if (!weekStart) return NextResponse.json({ error: 'weekStart required' }, { status: 400 })

    const [plan] = await db.select().from(weeklyPlans).where(eq(weeklyPlans.weekStart, weekStart))
    return NextResponse.json(plan || null)
  } catch (error) {
    console.error('GET /api/weekly error:', error)
    return NextResponse.json({ error: 'Failed to fetch weekly plan' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { weekStart, weeklyFocus, goals, reflections, plans, reminders } = body

    const existing = await db.select().from(weeklyPlans).where(eq(weeklyPlans.weekStart, weekStart))

    if (existing.length > 0) {
      const [updated] = await db.update(weeklyPlans)
        .set({ weeklyFocus, goals, reflections, plans, reminders, updatedAt: new Date() })
        .where(eq(weeklyPlans.weekStart, weekStart))
        .returning()
      return NextResponse.json(updated)
    } else {
      const [created] = await db.insert(weeklyPlans)
        .values({ weekStart, weeklyFocus, goals, reflections, plans, reminders })
        .returning()
      return NextResponse.json(created, { status: 201 })
    }
  } catch (error) {
    console.error('POST /api/weekly error:', error)
    return NextResponse.json({ error: 'Failed to save weekly plan' }, { status: 500 })
  }
}
