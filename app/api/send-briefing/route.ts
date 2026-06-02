import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tasks, weeklyPlans, googleTokens } from '@/lib/schema'
import { getTodayEvents, refreshAccessToken, formatEventTime } from '@/lib/google'
import { format, startOfWeek } from 'date-fns'
import { eq, gte } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  // Verify this is coming from Vercel cron
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = format(new Date(), 'yyyy-MM-dd')
    const dayName = format(new Date(), 'EEEE, MMMM d')
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')

    // Get today's tasks
    const allTasks = await db.select().from(tasks)
    const todayTasks = allTasks.filter(t =>
      !t.completed && t.dueDate &&
      format(new Date(t.dueDate), 'yyyy-MM-dd') === today
    )
    const unscheduled = allTasks.filter(t => !t.completed && !t.dueDate && !t.startDate).slice(0, 3)
    const displayTasks = todayTasks.length > 0 ? todayTasks : unscheduled

    // Get weekly focus
    const [plan] = await db.select().from(weeklyPlans).where(eq(weeklyPlans.weekStart, weekStart))

    // Get calendar events
    let events: any[] = []
    try {
      const [tokenRow] = await db.select().from(googleTokens).limit(1)
      if (tokenRow) {
        let accessToken = tokenRow.accessToken
        if (tokenRow.expiresAt && new Date() > tokenRow.expiresAt && tokenRow.refreshToken) {
          const refreshed = await refreshAccessToken(tokenRow.refreshToken)
          if (refreshed.access_token) accessToken = refreshed.access_token
        }
        events = await getTodayEvents(accessToken) || []
      }
    } catch {}

    // Build HTML email
    const eventsHtml = events.length > 0 ? `
      <div style="margin-bottom:24px;">
        <h2 style="font-size:16px;color:#6b4f3a;margin:0 0 12px;font-family:Georgia,serif;">📅 Today's Calendar</h2>
        ${events.map((e: any) => `
          <div style="background:#fdf0e4;border-left:3px solid #c9896a;border-radius:6px;padding:8px 12px;margin-bottom:8px;">
            <div style="font-weight:600;color:#2e2118;font-size:14px;">${e.summary}</div>
            <div style="color:#9e846e;font-size:12px;margin-top:2px;">${formatEventTime(e)}</div>
          </div>
        `).join('')}
      </div>
    ` : ''

    const tasksHtml = displayTasks.length > 0 ? `
      <div style="margin-bottom:24px;">
        <h2 style="font-size:16px;color:#6b4f3a;margin:0 0 12px;font-family:Georgia,serif;">✅ ${todayTasks.length > 0 ? "Today's Tasks" : 'This Week'}</h2>
        ${displayTasks.map((t, i) => `
          <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f5e8d8;">
            <span style="color:#c9896a;font-weight:700;font-size:14px;">${i + 1}.</span>
            <span style="color:#2e2118;font-size:14px;">${t.title}</span>
            <span style="margin-left:auto;font-size:11px;font-weight:600;color:${t.priority === 'high' ? '#a86c50' : t.priority === 'medium' ? '#c9896a' : '#5a6e50'}">${t.priority}</span>
          </div>
        `).join('')}
      </div>
    ` : ''

    const focusHtml = plan?.weeklyFocus ? `
      <div style="background:#f5e8d8;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
        <div style="font-size:12px;color:#9e846e;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Weekly Focus</div>
        <div style="font-size:15px;color:#2e2118;font-style:italic;font-family:Georgia,serif;">"${plan.weeklyFocus}"</div>
      </div>
    ` : ''

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fdf0e4;font-family:'DM Sans',system-ui,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    
    <!-- Header -->
    <div style="margin-bottom:28px;">
      <div style="font-size:12px;color:#9e846e;font-style:italic;margin-bottom:6px;">${dayName}</div>
      <h1 style="font-family:Georgia,serif;font-size:32px;font-weight:400;font-style:italic;color:#2e2118;margin:0;line-height:1.1;">Good morning, Gelila.</h1>
    </div>

    <!-- Quote -->
    <div style="background:linear-gradient(135deg,#f5e0d4,#f5ece0);border-left:3px solid #c9896a;border-radius:8px;padding:14px 18px;margin-bottom:28px;">
      <div style="font-family:Georgia,serif;font-size:14px;font-style:italic;color:#2e2118;">
        "Create the life you can't wait to wake up to."
      </div>
    </div>

    ${eventsHtml}
    ${tasksHtml}
    ${focusHtml}

    <!-- CTA -->
    <div style="text-align:center;margin-top:28px;">
      <a href="https://gelila-focus.vercel.app" style="background:#2e2118;color:#fdf8f0;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;">
        Open Dashboard →
      </a>
    </div>

    <div style="text-align:center;margin-top:24px;color:#9e846e;font-size:11px;font-style:italic;">
      Focus — Gelila's Dashboard
    </div>
  </div>
</body>
</html>`

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Focus Dashboard <onboarding@resend.dev>',
        to: [process.env.BRIEFING_EMAIL!],
        subject: `Good morning, Gelila ✦ ${dayName}`,
        html,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      console.error('Resend error:', data)
      return NextResponse.json({ error: 'Failed to send email', details: data }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch (error) {
    console.error('Briefing error:', error)
    return NextResponse.json({ error: 'Failed to send briefing' }, { status: 500 })
  }
}
