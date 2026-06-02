import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { googleTokens } from '@/lib/schema'
import { getTodayEvents, refreshAccessToken } from '@/lib/google'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const [tokenRow] = await db.select().from(googleTokens).limit(1)

    if (!tokenRow) {
      return NextResponse.json({ connected: false, events: [] })
    }

    let accessToken = tokenRow.accessToken

    // Refresh if expired
    if (tokenRow.expiresAt && new Date() > tokenRow.expiresAt && tokenRow.refreshToken) {
      const refreshed = await refreshAccessToken(tokenRow.refreshToken)
      if (refreshed.access_token) {
        accessToken = refreshed.access_token
        await db.update(googleTokens)
          .set({
            accessToken: refreshed.access_token,
            expiresAt: refreshed.expires_in
              ? new Date(Date.now() + refreshed.expires_in * 1000)
              : null,
          })
          .where(eq(googleTokens.id, tokenRow.id))
      }
    }

    const events = await getTodayEvents(accessToken)
    if (!events) {
      return NextResponse.json({ connected: true, events: [], error: 'Failed to fetch events' })
    }

    return NextResponse.json({ connected: true, events })
  } catch (error) {
    console.error('GET /api/calendar error:', error)
    return NextResponse.json({ connected: false, events: [] })
  }
}

export async function DELETE() {
  try {
    await db.delete(googleTokens)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
}
