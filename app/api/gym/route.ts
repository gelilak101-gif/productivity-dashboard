import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { gymSessions } from '@/lib/schema'
import { eq, and, gte, lte } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    let sessions
    if (from && to) {
      sessions = await db.select().from(gymSessions)
        .where(and(gte(gymSessions.sessionDate, from), lte(gymSessions.sessionDate, to)))
    } else {
      sessions = await db.select().from(gymSessions)
    }

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('GET /api/gym error:', error)
    return NextResponse.json({ error: 'Failed to fetch gym sessions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionDate, type, notes } = body

    // Toggle: if session exists for date, delete it
    const existing = await db.select().from(gymSessions).where(eq(gymSessions.sessionDate, sessionDate))
    if (existing.length > 0) {
      await db.delete(gymSessions).where(eq(gymSessions.sessionDate, sessionDate))
      return NextResponse.json({ logged: false })
    }

    const [session] = await db.insert(gymSessions)
      .values({ sessionDate, type: type || 'workout', notes: notes || '' })
      .returning()

    return NextResponse.json({ logged: true, session })
  } catch (error) {
    console.error('POST /api/gym error:', error)
    return NextResponse.json({ error: 'Failed to log gym session' }, { status: 500 })
  }
}
