import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notes } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  try {
    const allNotes = await db.select().from(notes).orderBy(desc(notes.pinned), desc(notes.updatedAt))
    return NextResponse.json(allNotes)
  } catch (error) {
    console.error('GET /api/notes error:', error)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, content, color } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const [note] = await db.insert(notes).values({
      title: title.trim(),
      content: content || '',
      color: color || 'default',
    }).returning()

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('POST /api/notes error:', error)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const [note] = await db.update(notes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(notes.id, id))
      .returning()

    return NextResponse.json(note)
  } catch (error) {
    console.error('PATCH /api/notes error:', error)
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await db.delete(notes).where(eq(notes.id, parseInt(id)))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/notes error:', error)
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }
}
