import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bannerPhotos } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const photos = await db.select().from(bannerPhotos).orderBy(bannerPhotos.position)
    return NextResponse.json(photos)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { url, position } = body
    if (!url?.trim()) return NextResponse.json({ error: 'URL required' }, { status: 400 })
    const [photo] = await db.insert(bannerPhotos).values({ url: url.trim(), position: position || 0 }).returning()
    return NextResponse.json(photo, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add photo' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.delete(bannerPhotos).where(eq(bannerPhotos.id, parseInt(id)))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 })
  }
}
