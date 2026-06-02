'use client'

import { useState, useEffect } from 'react'
import { Calendar, ExternalLink, RefreshCw, X } from 'lucide-react'
import { format } from 'date-fns'

interface CalendarEvent {
  id: string
  summary: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
}

export default function CalendarWidget() {
  const [connected, setConnected] = useState(false)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    // Check for connection status in URL
    const params = new URLSearchParams(window.location.search)
    if (params.get('calendar') === 'connected') {
      window.history.replaceState({}, '', '/')
    }
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/calendar')
      const data = await res.json()
      setConnected(data.connected)
      setEvents(data.events || [])
    } catch {}
    finally { setLoading(false); setRefreshing(false) }
  }

  const disconnect = async () => {
    await fetch('/api/calendar', { method: 'DELETE' })
    setConnected(false)
    setEvents([])
  }

  const formatTime = (event: CalendarEvent) => {
    if (event.start?.dateTime) {
      return new Date(event.start.dateTime).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true,
      })
    }
    return 'All day'
  }

  const today = format(new Date(), 'EEEE, MMM d')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={15} color="var(--accent-terra)" />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600 }}>Today</h2>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {connected && (
            <>
              <button onClick={() => { setRefreshing(true); fetchEvents() }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}>
                <RefreshCw size={12} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              </button>
              <button onClick={disconnect}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', fontSize: '10px' }}>
                <X size={12} />
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>{today}</div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>Loading...</div>
      ) : !connected ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, fontStyle: 'italic' }}>
            Connect Google Calendar to see today's events here.
          </p>
          <a href="/api/auth/google" style={{
            display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center',
            background: 'var(--text-primary)', color: 'white',
            borderRadius: '8px', padding: '9px 14px', textDecoration: 'none',
            fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font-sans)',
          }}>
            <ExternalLink size={12} /> Connect Google Calendar
          </a>
        </div>
      ) : events.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic', padding: '8px 0' }}>
          Nothing scheduled today 🌿
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {events.map(event => (
            <div key={event.id} style={{
              background: 'var(--accent-terra-light)',
              border: '1px solid rgba(201,137,106,0.2)',
              borderLeft: '3px solid var(--accent-terra)',
              borderRadius: '7px', padding: '8px 10px',
            }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                {event.summary}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {formatTime(event)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
