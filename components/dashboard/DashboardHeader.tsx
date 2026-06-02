'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { CalendarDays, Target, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface DashboardHeaderProps {
  tasksDone: number
  tasksTotal: number
  habitsStreak: number
  onDarkBg?: boolean
}

const QUOTES = [
  { text: "Create the life you can't wait to wake up to.", author: null },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: null },
  { text: "Your future is created by what you do today, not tomorrow.", author: null },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "She believed she could, so she did.", author: "R.S. Grey" },
  { text: "The comeback is always stronger than the setback.", author: null },
  { text: "Progress, not perfection.", author: null },
  { text: "Every day is a new beginning.", author: null },
  { text: "Work hard in silence, let success be your noise.", author: null },
  { text: "Consistency is what transforms average into excellence.", author: null },
  { text: "A year from now you'll wish you had started today.", author: "Karen Lamb" },
  { text: "Do something today that your future self will thank you for.", author: null },
  { text: "The only bad workout is the one that didn't happen.", author: null },
  { text: "Protect your peace. Choose your focus. Own your day.", author: null },
  { text: "Build the life you want, one day at a time.", author: null },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: null },
  { text: "You are capable of amazing things.", author: null },
  { text: "Make today so great that yesterday gets jealous.", author: null },
  { text: "Your only limit is your mind.", author: null },
  { text: "Dream bigger. Do bigger.", author: null },
  { text: "Little things make big days.", author: null },
  { text: "Good things take time. Be patient.", author: null },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "You have exactly one life. There is no reason to hold back.", author: null },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "She is clothed in strength and dignity, and she laughs without fear of the future.", author: "Proverbs 31:25" },
  { text: "Make it happen. Shock everyone.", author: null },
]

function getDailyQuote() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  )
  return QUOTES[dayOfYear % QUOTES.length]
}

export default function DashboardHeader({ tasksDone, tasksTotal, habitsStreak, onDarkBg = false }: DashboardHeaderProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const now = new Date()
  const hour = now.getHours()
  const greeting =
    hour < 5  ? 'Good night' :
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
    'Good evening'

  const quote = getDailyQuote()

  // When on dark bg (photo banner), use white text; otherwise use normal colors
  const textColor = onDarkBg ? 'rgba(255,255,255,0.95)' : 'var(--text-primary)'
  const mutedColor = onDarkBg ? 'rgba(255,255,255,0.65)' : 'var(--text-muted)'

  return (
    <div style={{ width: '100%' }}>
      <style>{`
        @media (max-width: 767px) {
          .header-top-row { flex-direction: column !important; gap: 12px !important; }
          .header-nav-stats { flex-wrap: wrap !important; gap: 6px !important; }
          .header-greeting { font-size: 28px !important; }
          .header-nav-btn { padding: 6px 10px !important; font-size: 11px !important; }
          .header-stat-card { padding: 6px 10px !important; }
          .header-stat-value { font-size: 15px !important; }
        }
      `}</style>
      {/* Top row */}
      <div className='header-top-row' style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: onDarkBg ? '12px' : '16px' }}>
        <div>
          <p style={{ color: mutedColor, fontSize: '12px', fontStyle: 'italic', marginBottom: '4px', letterSpacing: '0.04em' }}>
            {format(now, 'EEEE, MMMM d, yyyy')}
          </p>
          <h1 className='header-greeting' style={{
            fontFamily: 'var(--font-display)',
            fontSize: onDarkBg ? '44px' : '40px',
            fontWeight: 500, fontStyle: 'italic',
            letterSpacing: '-0.5px',
            color: textColor,
            lineHeight: 1.05,
            textShadow: onDarkBg ? '0 2px 12px rgba(0,0,0,0.3)' : 'none',
          }}>
            {greeting}, Gelila.
          </h1>
        </div>

        {/* Nav + stats */}
        <div className='header-nav-stats' style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link href="/weekly" style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: onDarkBg ? 'rgba(255,255,255,0.2)' : 'var(--bg-sand)',
            backdropFilter: onDarkBg ? 'blur(8px)' : 'none',
            color: onDarkBg ? 'white' : 'var(--text-secondary)',
            border: `1px solid ${onDarkBg ? 'rgba(255,255,255,0.3)' : 'var(--border)'}`,
            textDecoration: 'none', fontSize: '12px', fontWeight: 500,
            borderRadius: '8px', padding: '8px 14px', fontFamily: 'var(--font-sans)',
          }}>
            <CalendarDays size={13} /> Weekly
          </Link>
          <Link href="/quarter" style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: onDarkBg ? 'rgba(92,99,80,0.7)' : 'var(--accent-sage)',
            backdropFilter: onDarkBg ? 'blur(8px)' : 'none',
            color: 'white',
            textDecoration: 'none', fontSize: '12px', fontWeight: 500,
            borderRadius: '8px', padding: '8px 14px', fontFamily: 'var(--font-sans)',
          }}>
            <Target size={13} /> Quarter
          </Link>
          {[
            { label: 'Tasks done', value: `${tasksDone}/${tasksTotal}` },
            { label: 'Habit streak', value: `${habitsStreak}🔥` },
          ].map(s => (
            <div key={s.label} style={{
              background: onDarkBg ? 'rgba(255,255,255,0.18)' : 'var(--bg-card)',
              backdropFilter: onDarkBg ? 'blur(8px)' : 'none',
              border: `1px solid ${onDarkBg ? 'rgba(255,255,255,0.25)' : 'var(--border)'}`,
              borderRadius: '10px', padding: '8px 16px', textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 500, color: textColor }}>
                {s.value}
              </div>
              <div style={{ fontSize: '10px', color: mutedColor, marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quote — only show when no photo (photo banner has limited space) */}
      {mounted && !onDarkBg && (
        <div className="animate-quote" style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'linear-gradient(135deg, var(--accent-terra-light) 0%, var(--accent-sand-light) 100%)',
          border: '1px solid rgba(201, 137, 106, 0.2)',
          borderLeft: '3px solid var(--accent-terra)',
          borderRadius: '10px', padding: '13px 18px',
          marginBottom: '4px',
        }}>
          <Sparkles size={14} color="var(--accent-terra)" style={{ flexShrink: 0, opacity: 0.7 }} />
          <div style={{ flex: 1 }}>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: '15px',
              fontStyle: 'italic', fontWeight: 500,
              color: 'var(--text-primary)', lineHeight: 1.5,
            }}>
              "{quote.text}"
            </p>
            {quote.author && (
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                — {quote.author}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Quote on dark bg — smaller, under name */}
      {mounted && onDarkBg && (
        <p style={{
          fontFamily: 'var(--font-display)', fontSize: '14px',
          fontStyle: 'italic', color: 'rgba(255,255,255,0.8)',
          textShadow: '0 1px 6px rgba(0,0,0,0.3)',
          lineHeight: 1.5, maxWidth: '500px',
        }}>
          "{quote.text}"
        </p>
      )}
    </div>
  )
}
