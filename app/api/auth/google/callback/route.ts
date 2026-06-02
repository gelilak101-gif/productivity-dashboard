import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { googleTokens } from '@/lib/schema'
import { exchangeCodeForTokens } from '@/lib/google'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const origin = req.nextUrl.origin

  if (!code) {
    return NextResponse.redirect(`${origin}/?calendar=error`)
  }

  try {
    const tokens = await exchangeCodeForTokens(code)

    if (tokens.error) {
      console.error('Token exchange error:', tokens.error, tokens.error_description)
      return NextResponse.redirect(`${origin}/?calendar=error`)
    }

    // Clear existing tokens and store new ones
    await db.delete(googleTokens)
    await db.insert(googleTokens).values({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      expiresAt: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null,
    })

    return NextResponse.redirect(`${origin}/?calendar=connected`)
  } catch (error) {
    console.error('Calendar auth error:', error)
    return NextResponse.redirect(`${origin}/?calendar=error`)
  }
}
