'use client'

import { useState } from 'react'
import { Plus, Trash2, Flame } from 'lucide-react'
import { format, subDays } from 'date-fns'
import type { Habit, HabitLog } from '@/lib/schema'

type HabitWithLogs = Habit & { logs: HabitLog[] }

interface HabitsPanelProps {
  habits: HabitWithLogs[]
  onHabitsChange: (habits: HabitWithLogs[]) => void
}

const EMOJIS = ['💧', '📚', '🏃', '🧘', '✍️', '🥗', '😴', '💪', '🎯', '🎨', '🙏', '💊', '🧴', '📝', '🌿']
const COLORS = [
  { value: 'amber', bg: '#fef3c7', dot: '#d97706' },
  { value: 'sage', bg: '#e0e6db', dot: '#566d49' },
  { value: 'rust', bg: '#fde8e4', dot: '#c9614a' },
  { value: 'ink', bg: '#e8e6e0', dot: '#52422e' },
]

const SECTIONS = [
  { key: 'daily', label: 'Daily', desc: 'Every day', daysInPeriod: 7 },
  { key: 'weekly', label: 'Weekly', desc: 'This week', daysInPeriod: 7 },
  { key: 'monthly', label: 'Monthly', desc: 'This month', daysInPeriod: 30 },
] as const
type Section = 'daily' | 'weekly' | 'monthly'

const getCurrentWeekDays = () => {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Sunday
  const sunday = subDays(today, dayOfWeek)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return { date: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE')[0] }
  })
}

export default function HabitsPanel({ habits, onHabitsChange }: HabitsPanelProps) {
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('🎯')
  const [newColor, setNewColor] = useState('amber')
  const [newSection, setNewSection] = useState<Section>('daily')
  const [showAdd, setShowAdd] = useState(false)
  const [activeSection, setActiveSection] = useState<Section>('daily')

  const days = getCurrentWeekDays()
  const today = format(new Date(), 'yyyy-MM-dd')
  const colorMap = Object.fromEntries(COLORS.map(c => [c.value, c]))

  const isLogged = (habit: HabitWithLogs, date: string) =>
    habit.logs.some(l => l.logDate === date && l.completed)

  const toggleLog = async (habit: HabitWithLogs, date: string) => {
    const res = await fetch('/api/habits/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habitId: habit.id, date }),
    })
    const { completed } = await res.json()
    onHabitsChange(habits.map(h => {
      if (h.id !== habit.id) return h
      const logsWithoutDate = h.logs.filter(l => l.logDate !== date)
      if (completed) {
        return { ...h, logs: [...logsWithoutDate, { id: Date.now(), habitId: h.id, logDate: date, completed: true, createdAt: new Date() }] }
      }
      return { ...h, logs: logsWithoutDate }
    }))
  }

  const addHabit = async () => {
    if (!newName.trim()) return
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, emoji: newEmoji, color: newColor, section: newSection }),
    })
    const habit = await res.json()
    onHabitsChange([...habits, habit])
    setNewName('')
    setShowAdd(false)
  }

  const deleteHabit = async (id: number) => {
    await fetch(`/api/habits?id=${id}`, { method: 'DELETE' })
    onHabitsChange(habits.filter(h => h.id !== id))
  }

  const getStreak = (habit: HabitWithLogs) => {
    let streak = 0
    for (let i = 0; i < 7; i++) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
      if (isLogged(habit, d)) streak++
      else break
    }
    return streak
  }

  // Score calculation per section
  const getSectionScore = (section: Section) => {
    const sectionHabits = habits.filter(h => h.section === section)
    if (sectionHabits.length === 0) return null
    const total = sectionHabits.length * 7
    const done = sectionHabits.reduce((sum, h) => sum + days.filter(d => isLogged(h, d.date)).length, 0)
    return Math.round((done / total) * 100)
  }

  const filteredHabits = habits.filter(h => h.section === activeSection)
  const score = getSectionScore(activeSection)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '14px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600 }}>Habits</h2>
        <button className="btn btn-ghost" onClick={() => setShowAdd(!showAdd)} style={{ padding: '6px 10px' }}>
          <Plus size={14} /> Add
        </button>
      </div>

      {/* Section tabs + score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ display: 'flex', background: 'var(--border)', borderRadius: '8px', padding: '3px', flex: 1 }}>
          {SECTIONS.map(s => (
            <button key={s.key} onClick={() => setActiveSection(s.key)} style={{
              flex: 1, background: activeSection === s.key ? 'white' : 'transparent',
              border: 'none', borderRadius: '6px',
              boxShadow: activeSection === s.key ? 'var(--shadow-sm)' : 'none',
              color: activeSection === s.key ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer', fontSize: '12px', fontWeight: activeSection === s.key ? 600 : 400,
              padding: '5px 8px', transition: 'all 0.15s ease',
            }}>{s.label}</button>
          ))}
        </div>
        {score !== null && (
          <div style={{
            background: score >= 80 ? 'var(--accent-sage-light)' : score >= 50 ? 'var(--accent-amber-light)' : 'var(--accent-rust-light)',
            border: `1px solid ${score >= 80 ? '#c2ccb8' : score >= 50 ? '#fde68a' : '#fecdc5'}`,
            borderRadius: '8px', padding: '4px 10px', textAlign: 'center', minWidth: '52px',
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 600,
              color: score >= 80 ? 'var(--accent-sage)' : score >= 50 ? 'var(--accent-amber)' : 'var(--accent-rust)',
            }}>{score}%</div>
          </div>
        )}
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(7, 28px)', gap: '4px', alignItems: 'center', padding: '0 10px' }}>
        <div />
        {days.map(d => (
          <div key={d.date} style={{
            textAlign: 'center', fontSize: '11px',
            fontWeight: d.date === today ? 700 : 400,
            color: d.date === today ? 'var(--accent-amber)' : 'var(--text-muted)',
          }}>{d.label}</div>
        ))}
      </div>

      {/* Add habit form */}
      {showAdd && (
        <div className="animate-scale-in" style={{
          background: 'white', border: '1px solid var(--border)', borderRadius: '10px',
          padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select value={newEmoji} onChange={e => setNewEmoji(e.target.value)} style={{ width: '60px' }}>
              {EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <input type="text" placeholder="Habit name..." value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addHabit()} style={{ flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {COLORS.map(c => (
              <button key={c.value} onClick={() => setNewColor(c.value)} style={{
                background: c.bg, border: `2px solid ${newColor === c.value ? c.dot : 'transparent'}`,
                borderRadius: '50%', cursor: 'pointer', height: '20px', width: '20px',
              }} />
            ))}
            <div style={{ marginLeft: '4px', display: 'flex', background: 'var(--border)', borderRadius: '6px', padding: '2px' }}>
              {SECTIONS.map(s => (
                <button key={s.key} onClick={() => setNewSection(s.key)} style={{
                  background: newSection === s.key ? 'white' : 'transparent',
                  border: 'none', borderRadius: '4px', cursor: 'pointer',
                  fontSize: '11px', fontWeight: newSection === s.key ? 600 : 400,
                  padding: '3px 7px', color: newSection === s.key ? 'var(--text-primary)' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}>{s.label}</button>
              ))}
            </div>
            <button className="btn btn-primary" onClick={addHabit} style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: '12px' }}>
              Add
            </button>
          </div>
        </div>
      )}

      {/* Habit rows */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {filteredHabits.length === 0 && (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0', fontSize: '13px' }}>
            No {activeSection} habits yet — add one above
          </div>
        )}
        {filteredHabits.map(habit => {
          const color = colorMap[habit.color] || colorMap.amber
          const streak = getStreak(habit)
          const weekDone = days.filter(d => isLogged(habit, d.date)).length
          return (
            <div key={habit.id} style={{
              display: 'grid', gridTemplateColumns: '1fr repeat(7, 28px)', gap: '4px',
              alignItems: 'center', background: 'white', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '8px 10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                <span style={{ fontSize: '15px' }}>{habit.emoji}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {habit.name}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{weekDone}/7 this week</div>
                </div>
                {streak > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px', color: '#d97706', flexShrink: 0 }}>
                    <Flame size={10} />{streak}
                  </span>
                )}
                <button onClick={() => deleteHabit(habit.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--border-strong)', opacity: 0.4, padding: 0, flexShrink: 0,
                }}>
                  <Trash2 size={11} />
                </button>
              </div>
              {days.map(d => {
                const done = isLogged(habit, d.date)
                const isToday = d.date === today
                return (
                  <button key={d.date} onClick={() => toggleLog(habit, d.date)} style={{
                    background: done ? color.dot : isToday ? color.bg : 'transparent',
                    border: `1.5px solid ${done ? color.dot : isToday ? color.dot + '60' : 'var(--border)'}`,
                    borderRadius: '6px', cursor: 'pointer', height: '26px',
                    transition: 'all 0.15s ease', width: '26px',
                  }} />
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Section summary dots */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        {SECTIONS.map(s => {
          const sc = getSectionScore(s.key)
          const count = habits.filter(h => h.section === s.key).length
          return (
            <div key={s.key} onClick={() => setActiveSection(s.key)} style={{
              cursor: 'pointer', textAlign: 'center', opacity: activeSection === s.key ? 1 : 0.5,
              transition: 'opacity 0.15s',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>{s.label}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{count} habits{sc !== null ? ` · ${sc}%` : ''}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
