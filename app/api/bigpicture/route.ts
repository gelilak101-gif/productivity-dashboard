import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bigPictureItems } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  try {
    const items = await db.select().from(bigPictureItems).orderBy(desc(bigPictureItems.createdAt))
    return NextResponse.json(items)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { category, text } = body
    if (!text?.trim()) return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    const [item] = await db.insert(bigPictureItems).values({ category, text: text.trim() }).returning()
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, completed } = body
    const [item] = await db.update(bigPictureItems)
      .set({ completed, completedAt: completed ? new Date() : null })
      .where(eq(bigPictureItems.id, id)).returning()
    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.delete(bigPictureItems).where(eq(bigPictureItems.id, parseInt(id)))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
