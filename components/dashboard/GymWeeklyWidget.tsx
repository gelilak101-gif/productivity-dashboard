'use client'

import { useState } from 'react'
import { Dumbbell } from 'lucide-react'
import { format, subDays } from 'date-fns'
import type { GymSession } from '@/lib/schema'

interface GymWeeklyWidgetProps {
  gymSessions: GymSession[]
  onGymSessionsChange: (sessions: GymSession[]) => void
}

const GYM_TYPES = ['💪 Strength', '🏃 Cardio', '🧘 Yoga', '🚴 Cycling', '🏊 Swim', '🥊 Boxing', '🔥 HIIT']

const getCurrentWeekDays = () => {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const sunday = subDays(today, dayOfWeek)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return {
      date: format(d, 'yyyy-MM-dd'),
      label: format(d, 'EEE')[0],
      full: format(d, 'EEE'),
    }
  })
}

export default function GymWeeklyWidget({ gymSessions, onGymSessionsChange }: GymWeeklyWidgetProps) {
  const [gymTypeModal, setGymTypeModal] = useState<string | null>(null)
  const weekDays = getCurrentWeekDays()
  const today = format(new Date(), 'yyyy-MM-dd')
  const gymCount = gymSessions.length

  const gymOnDate = (date: string) => gymSessions.find(s => s.sessionDate === date)

  const toggleGym = async (date: string, type?: string) => {
    const res = await fetch('/api/gym', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionDate: date, type }),
    })
    const data = await res.json()
    if (data.logged) {
      onGymSessionsChange([...gymSessions, data.session])
    } else {
      onGymSessionsChange(gymSessions.filter(s => s.sessionDate !== date))
    }
    setGymTypeModal(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <Dumbbell size={15} color="var(--accent-terra)" />
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600 }}>Gym This Week</h2>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 600, color: gymCount > 0 ? 'var(--accent-terra)' : 'var(--text-muted)' }}>
          {gymCount}<span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)' }}> sessions</span>
        </span>
      </div>

      {/* Day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
        {weekDays.map(day => {
          const gym = gymOnDate(day.date)
          const isToday = day.date === today
          return (
            <div key={day.date} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '11px', color: isToday ? 'var(--accent-terra)' : 'var(--text-muted)',
                fontWeight: isToday ? 700 : 400, marginBottom: '5px',
              }}>
                {day.label}
              </div>
              <button
                onClick={() => gym ? toggleGym(day.date) : setGymTypeModal(day.date)}
                title={gym ? `${gym.type} — click to remove` : 'Log workout'}
                style={{
                  background: gym ? 'var(--accent-terra)' : isToday ? 'var(--accent-terra-light)' : 'var(--bg-parchment)',
                  border: `1.5px solid ${gym ? 'var(--accent-terra)' : isToday ? 'var(--accent-terra)' : 'var(--border)'}`,
                  borderRadius: '8px', cursor: 'pointer', fontSize: '16px',
                  height: '38px', width: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
              >
                {gym ? '💪' : ''}
              </button>
              {gym && (
                <div style={{ fontSize: '9px', color: 'var(--accent-terra)', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {gym.type.replace(/^[^\s]+\s/, '')}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Workout type modal */}
      {gymTypeModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }} onClick={() => setGymTypeModal(null)}>
          <div onClick={e => e.stopPropagation()} className="animate-scale-in" style={{
            background: 'white', borderRadius: '14px', padding: '20px',
            boxShadow: 'var(--shadow-lg)', minWidth: '280px',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, marginBottom: '14px' }}>
              What type of workout?
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {GYM_TYPES.map(type => (
                <button key={type} onClick={() => toggleGym(gymTypeModal, type)} style={{
                  background: 'var(--bg-parchment)', border: '1px solid var(--border)',
                  borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  fontSize: '13px', fontWeight: 500, padding: '10px 14px', textAlign: 'left',
                  transition: 'all 0.15s',
                }}>
                  {type}
                </button>
              ))}
            </div>
            <button className="btn btn-ghost" onClick={() => setGymTypeModal(null)}
              style={{ marginTop: '12px', width: '100%', justifyContent: 'center', fontSize: '12px' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
