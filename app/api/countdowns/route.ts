import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { countdowns } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  try {
    const all = await db.select().from(countdowns).orderBy(countdowns.targetDate)
    return NextResponse.json(all)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch countdowns' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { label, targetDate, emoji } = body
    if (!label?.trim() || !targetDate) return NextResponse.json({ error: 'Label and date required' }, { status: 400 })
    const [item] = await db.insert(countdowns).values({ label: label.trim(), targetDate, emoji: emoji || '🎯' }).returning()
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create countdown' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.delete(countdowns).where(eq(countdowns.id, parseInt(id)))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete countdown' }, { status: 500 })
  }
}
