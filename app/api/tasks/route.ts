import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tasks } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  try {
    const allTasks = await db.select().from(tasks).orderBy(desc(tasks.createdAt))
    return NextResponse.json(allTasks)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, description, priority, dueDate, startDate, endDate } = body
    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

    const [task] = await db.insert(tasks).values({
      title: title.trim(),
      description: description || null,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : (startDate ? new Date(startDate) : null),
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    }).returning()

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, dueDate, startDate, endDate, completed, priority, title, description } = body
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (completed !== undefined) updateData.completed = completed
    if (priority !== undefined) updateData.priority = priority
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null

    // Keep dueDate in sync with startDate for backwards compat
    if (startDate !== undefined && updateData.dueDate === undefined) {
      updateData.dueDate = startDate ? new Date(startDate) : null
    }

    const [task] = await db.update(tasks).set(updateData).where(eq(tasks.id, id)).returning()
    return NextResponse.json(task)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    await db.delete(tasks).where(eq(tasks.id, parseInt(id)))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
