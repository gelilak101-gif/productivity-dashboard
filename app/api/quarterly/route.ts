import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { quarterlyGoals } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const quarterKey = searchParams.get('quarterKey')
    if (!quarterKey) return NextResponse.json({ error: 'quarterKey required' }, { status: 400 })
    const goals = await db.select().from(quarterlyGoals).where(eq(quarterlyGoals.quarterKey, quarterKey))
    return NextResponse.json(goals)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { quarterKey, category, text } = body
    if (!text?.trim()) return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    const [goal] = await db.insert(quarterlyGoals).values({
      quarterKey, category, text: text.trim(),
    }).returning()
    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, completed } = body
    const [goal] = await db.update(quarterlyGoals).set({ completed }).where(eq(quarterlyGoals.id, id)).returning()
    return NextResponse.json(goal)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.delete(quarterlyGoals).where(eq(quarterlyGoals.id, parseInt(id)))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
  }
}
