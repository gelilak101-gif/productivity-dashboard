'use client'

import { useState } from 'react'
import { Plus, Trash2, Clock } from 'lucide-react'
import { differenceInDays, parseISO, isPast, format } from 'date-fns'
import type { Countdown } from '@/lib/schema'

interface CountdownsWidgetProps {
  countdowns: Countdown[]
  onCountdownsChange: (c: Countdown[]) => void
}

const EMOJIS = ['🎯', '✈️', '🎂', '💍', '🏖️', '🎓', '🏃', '💼', '🌍', '🎉', '🏠', '💫', '🌸', '🎵', '⭐']

export default function CountdownsWidget({ countdowns, onCountdownsChange }: CountdownsWidgetProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newEmoji, setNewEmoji] = useState('🎯')

  const addCountdown = async () => {
    if (!newLabel.trim() || !newDate) return
    const res = await fetch('/api/countdowns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newLabel, targetDate: newDate, emoji: newEmoji }),
    })
    const item = await res.json()
    onCountdownsChange([...countdowns, item].sort((a, b) => a.targetDate.localeCompare(b.targetDate)))
    setNewLabel('')
    setNewDate('')
    setShowAdd(false)
  }

  const deleteCountdown = async (id: number) => {
    await fetch(`/api/countdowns?id=${id}`, { method: 'DELETE' })
    onCountdownsChange(countdowns.filter(c => c.id !== id))
  }

  const getDays = (targetDate: string) => {
    const target = parseISO(targetDate)
    const diff = differenceInDays(target, new Date())
    return diff
  }

  const getUrgencyStyle = (days: number) => {
    if (days < 0) return { bg: 'var(--bg-sand)', color: 'var(--text-muted)', label: 'Passed' }
    if (days === 0) return { bg: '#fde8e4', color: 'var(--accent-rust)', label: 'Today!' }
    if (days <= 7) return { bg: '#fde8e4', color: 'var(--accent-rust)', label: `${days}d` }
    if (days <= 30) return { bg: 'var(--accent-terra-light)', color: 'var(--accent-terra)', label: `${days}d` }
    return { bg: 'var(--accent-sage-light)', color: 'var(--accent-sage)', label: `${days}d` }
  }

  const sorted = [...countdowns].sort((a, b) => a.targetDate.localeCompare(b.targetDate))
  const upcoming = sorted.filter(c => getDays(c.targetDate) >= 0)
  const past = sorted.filter(c => getDays(c.targetDate) < 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={15} color="var(--accent-terra)" />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600 }}>Countdowns</h2>
        </div>
        <button className="btn btn-ghost" onClick={() => setShowAdd(!showAdd)} style={{ padding: '5px 10px', fontSize: '12px' }}>
          <Plus size={13} /> Add
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="animate-scale-in" style={{
          background: 'var(--bg-parchment)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '12px',
          display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <select value={newEmoji} onChange={e => setNewEmoji(e.target.value)} style={{ width: '58px', fontSize: '16px', textAlign: 'center' }}>
              {EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <input type="text" placeholder="What are you counting down to?" value={newLabel}
              onChange={e => setNewLabel(e.target.value)} style={{ flex: 1, fontSize: '13px' }} />
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={{ flex: 1, fontSize: '13px' }} />
            <button className="btn btn-primary" onClick={addCountdown} style={{ padding: '8px 12px', fontSize: '12px' }}>
              Add
            </button>
            <button className="btn btn-ghost" onClick={() => setShowAdd(false)} style={{ padding: '8px 10px', fontSize: '12px' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Upcoming countdowns */}
      {upcoming.length === 0 && !showAdd && (
        <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
          Add something to look forward to ✨
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {upcoming.map(c => {
          const days = getDays(c.targetDate)
          const urgency = getUrgencyStyle(days)
          return (
            <div key={c.id} className="animate-slide-up" style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: urgency.bg,
              border: '1px solid var(--border)',
              borderRadius: '10px', padding: '12px 14px',
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: '22px', flexShrink: 0 }}>{c.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.label}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {format(parseISO(c.targetDate), 'MMM d, yyyy')}
                </div>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 600, color: urgency.color, lineHeight: 1 }}>
                  {days === 0 ? '🎉' : days}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {days === 0 ? 'today' : days === 1 ? 'day' : 'days'}
                </div>
              </div>
              <button onClick={() => deleteCountdown(c.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', opacity: 0.4, padding: 0, flexShrink: 0,
              }}>
                <Trash2 size={12} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Past countdowns (collapsed) */}
      {past.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontStyle: 'italic' }}>Past</div>
          {past.map(c => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 4px', opacity: 0.5,
            }}>
              <span style={{ fontSize: '14px' }}>{c.emoji}</span>
              <span style={{ flex: 1, fontSize: '12px', textDecoration: 'line-through', color: 'var(--text-muted)' }}>{c.label}</span>
              <button onClick={() => deleteCountdown(c.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', opacity: 0.4, padding: 0,
              }}>
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
