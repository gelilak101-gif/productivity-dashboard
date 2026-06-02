'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Plus, Trash2, ArrowLeft, Target, Map, ChevronDown, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { QuarterlyGoal, BigPictureItem, GymSession } from '@/lib/schema'

interface QuarterViewProps {
  initialGoals: QuarterlyGoal[]
  initialBigPicture: BigPictureItem[]
  gymSessions: GymSession[]
  currentQuarterKey: string
}

const GOAL_CATEGORIES = [
  { key: 'Health', emoji: '💪', color: '#566d49', bg: '#e0e6db', border: '#c2ccb8' },
  { key: 'Business', emoji: '💼', color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  { key: 'Personal', emoji: '🌿', color: '#c9614a', bg: '#fde8e4', border: '#fecdc5' },
]

const BP_CATEGORIES = [
  { key: 'Travel', emoji: '✈️', color: '#0ea5e9', bg: '#e0f2fe', border: '#bae6fd' },
  { key: 'Career/Business', emoji: '💼', color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  { key: 'Personal', emoji: '🌿', color: '#c9614a', bg: '#fde8e4', border: '#fecdc5' },
  { key: 'Health', emoji: '💪', color: '#566d49', bg: '#e0e6db', border: '#c2ccb8' },
  { key: 'Financial', emoji: '💰', color: '#7c3aed', bg: '#ede9fe', border: '#ddd6fe' },
]

function getQuarterOptions(currentKey: string) {
  const [year, q] = currentKey.split('-Q').map(Number)
  const options = []
  for (let y = year; y <= year + 1; y++) {
    for (let qi = 1; qi <= 4; qi++) {
      const key = `${y}-Q${qi}`
      if (key >= currentKey) options.push(key)
      if (options.length >= 6) break
    }
    if (options.length >= 6) break
  }
  return options
}

function getQuarterDateRange(quarterKey: string) {
  const [year, q] = quarterKey.split('-Q').map(Number)
  const startMonth = (q - 1) * 3 // 0, 3, 6, 9
  const start = new Date(year, startMonth, 1)
  const end = new Date(year, startMonth + 3, 0) // last day of quarter
  return { start, end }
}

function getGymWeeks(gymSessions: GymSession[], quarterKey: string) {
  const { end } = getQuarterDateRange(quarterKey)
  // Use end of quarter as anchor, show 13 weeks ending at that date
  const anchor = end > new Date() ? new Date() : end
  const weeks: { label: string; count: number }[] = []
  for (let w = 12; w >= 0; w--) {
    const weekEnd = new Date(anchor)
    weekEnd.setDate(anchor.getDate() - (anchor.getDay() || 7) + 7 - w * 7)
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekEnd.getDate() - 6)
    const ws = weekStart.toISOString().slice(0, 10)
    const we = weekEnd.toISOString().slice(0, 10)
    const count = gymSessions.filter(s => s.sessionDate >= ws && s.sessionDate <= we).length
    const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    weeks.push({ label, count })
  }
  return weeks
}

export default function QuarterView({ initialGoals, initialBigPicture, gymSessions, currentQuarterKey }: QuarterViewProps) {
  const [goals, setGoals] = useState<QuarterlyGoal[]>(initialGoals)
  const [bigPicture, setBigPicture] = useState<BigPictureItem[]>(initialBigPicture)
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarterKey)
  const [newGoalText, setNewGoalText] = useState('')
  const [newGoalCategory, setNewGoalCategory] = useState('Health')
  const [newBPText, setNewBPText] = useState('')
  const [newBPCategory, setNewBPCategory] = useState('Travel')
  const [bpFilter, setBpFilter] = useState<string>('All')
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set())
  const [showAddGoal, setShowAddGoal] = useState<string | null>(null)
  const [showAddBP, setShowAddBP] = useState(false)

  const quarterGoals = goals.filter(g => g.quarterKey === selectedQuarter)
  const quarterOptions = getQuarterOptions(currentQuarterKey)
  const gymWeeks = getGymWeeks(gymSessions, selectedQuarter)
  const maxGym = Math.max(...gymWeeks.map(w => w.count), 1)

  const completedGoals = quarterGoals.filter(g => g.completed).length
  const goalProgress = quarterGoals.length > 0 ? Math.round((completedGoals / quarterGoals.length) * 100) : 0

  const completedBP = bigPicture.filter(i => i.completed).length
  const bpProgress = bigPicture.length > 0 ? Math.round((completedBP / bigPicture.length) * 100) : 0

  const addGoal = async (category: string) => {
    if (!newGoalText.trim()) return
    const res = await fetch('/api/quarterly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quarterKey: selectedQuarter, category, text: newGoalText }),
    })
    const goal = await res.json()
    setGoals([...goals, goal])
    setNewGoalText('')
    setShowAddGoal(null)
  }

  const toggleGoal = async (goal: QuarterlyGoal) => {
    const res = await fetch('/api/quarterly', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: goal.id, completed: !goal.completed }),
    })
    const updated = await res.json()
    setGoals(goals.map(g => g.id === updated.id ? updated : g))
  }

  const deleteGoal = async (id: number) => {
    await fetch(`/api/quarterly?id=${id}`, { method: 'DELETE' })
    setGoals(goals.filter(g => g.id !== id))
  }

  const addBPItem = async () => {
    if (!newBPText.trim()) return
    const res = await fetch('/api/bigpicture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: newBPCategory, text: newBPText }),
    })
    const item = await res.json()
    setBigPicture([item, ...bigPicture])
    setNewBPText('')
    setShowAddBP(false)
  }

  const toggleBPItem = async (item: BigPictureItem) => {
    const res = await fetch('/api/bigpicture', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, completed: !item.completed }),
    })
    const updated = await res.json()
    setBigPicture(bigPicture.map(i => i.id === updated.id ? updated : i))
  }

  const deleteBPItem = async (id: number) => {
    await fetch(`/api/bigpicture?id=${id}`, { method: 'DELETE' })
    setBigPicture(bigPicture.filter(i => i.id !== id))
  }

  const toggleCollapse = (cat: string) => {
    setCollapsedCats(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  const filteredBP = bpFilter === 'All' ? bigPicture : bigPicture.filter(i => i.category === bpFilter)

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      backgroundImage: `radial-gradient(ellipse at 15% 0%, rgba(86,109,73,0.07) 0%, transparent 50%),
        radial-gradient(ellipse at 85% 100%, rgba(217,119,6,0.05) 0%, transparent 50%)`,
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '28px 24px' }}>

        {/* Nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/" style={{
              display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)',
              textDecoration: 'none', fontSize: '13px', background: 'white',
              border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 12px',
            }}>
              <ArrowLeft size={13} /> Dashboard
            </Link>
            <Link href="/weekly" style={{
              display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)',
              textDecoration: 'none', fontSize: '13px', background: 'white',
              border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 12px',
            }}>
              Weekly View
            </Link>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 600, letterSpacing: '-0.5px' }}>
                Quarter View
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
                Big goals, big picture
              </p>
            </div>
          </div>

          {/* Quarter selector */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {[
              { label: 'Goals done', value: `${completedGoals}/${quarterGoals.length}`, sub: `${goalProgress}%` },
              { label: 'Big Picture', value: `${completedBP}/${bigPicture.length}`, sub: `${bpProgress}%` },
            ].map(s => (
              <div key={s.label} style={{
                background: 'white', border: '1px solid var(--border)', borderRadius: '10px',
                padding: '8px 14px', textAlign: 'center',
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 500 }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>{s.label} · {s.sub}</div>
              </div>
            ))}
            <select value={selectedQuarter} onChange={e => setSelectedQuarter(e.target.value)}
              style={{ width: 'auto', fontWeight: 600, fontSize: '14px', padding: '8px 12px' }}>
              {quarterOptions.map(q => (
                <option key={q} value={q}>{q}{q === currentQuarterKey ? ' (Current)' : ''}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Main grid: goals left, gym middle, big picture right */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px 1fr', gap: '16px', alignItems: 'start' }}>

          {/* LEFT: Quarterly Goals by category */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={16} color="var(--accent-amber)" />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600 }}>
                {selectedQuarter} Goals
              </h2>
            </div>

            {/* Overall progress */}
            {quarterGoals.length > 0 && (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <span>{completedGoals} of {quarterGoals.length} goals complete</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{goalProgress}%</span>
                </div>
                <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${goalProgress}%`,
                    background: goalProgress === 100 ? 'var(--accent-sage)' : 'var(--accent-amber)',
                    borderRadius: '3px', transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>
            )}

            {/* Category sections */}
            {GOAL_CATEGORIES.map(cat => {
              const catGoals = quarterGoals.filter(g => g.category === cat.key)
              const isCollapsed = collapsedCats.has(cat.key)
              const catDone = catGoals.filter(g => g.completed).length
              return (
                <div key={cat.key} className="card" style={{ padding: '16px', overflow: 'hidden' }}>
                  {/* Category header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: isCollapsed ? 0 : '12px' }}>
                    <button onClick={() => toggleCollapse(cat.key)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                    }}>
                      {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <span style={{ fontSize: '18px' }}>{cat.emoji}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, flex: 1 }}>{cat.key}</span>
                    <span style={{
                      background: cat.bg, border: `1px solid ${cat.border}`, borderRadius: '6px',
                      color: cat.color, fontSize: '11px', fontWeight: 600, padding: '2px 8px',
                    }}>{catDone}/{catGoals.length}</span>
                    <button onClick={() => setShowAddGoal(showAddGoal === cat.key ? null : cat.key)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                      <Plus size={15} />
                    </button>
                  </div>

                  {!isCollapsed && (
                    <>
                      {/* Add goal inline */}
                      {showAddGoal === cat.key && (
                        <div className="animate-scale-in" style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                          <input type="text" placeholder={`Add ${cat.key} goal...`} value={newGoalText}
                            onChange={e => setNewGoalText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addGoal(cat.key)}
                            style={{ flex: 1, fontSize: '13px' }} autoFocus />
                          <button className="btn btn-primary" onClick={() => addGoal(cat.key)} style={{ padding: '8px 10px' }}>
                            <Plus size={13} />
                          </button>
                        </div>
                      )}

                      {catGoals.length === 0 && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic', padding: '6px 0' }}>
                          No {cat.key} goals yet — click + to add
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {catGoals.map(goal => (
                          <div key={goal.id} style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: goal.completed ? 'transparent' : cat.bg,
                            border: `1px solid ${goal.completed ? 'var(--border)' : cat.border}`,
                            borderRadius: '7px', padding: '8px 10px',
                            opacity: goal.completed ? 0.6 : 1, transition: 'all 0.15s',
                          }}>
                            <button onClick={() => toggleGoal(goal)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                              {goal.completed
                                ? <CheckCircle2 size={16} color={cat.color} />
                                : <Circle size={16} color={cat.color} />}
                            </button>
                            <span style={{
                              flex: 1, fontSize: '13px', fontWeight: 500,
                              textDecoration: goal.completed ? 'line-through' : 'none',
                              color: goal.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                            }}>{goal.text}</span>
                            <button onClick={() => deleteGoal(goal.id)} style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: 'var(--text-muted)', opacity: 0.4, padding: 0,
                            }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* MIDDLE: Gym consistency chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                💪 Gym Consistency
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>Last 13 weeks</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {gymWeeks.map((week, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', width: '50px', flexShrink: 0 }}>{week.label}</div>
                    <div style={{ flex: 1, height: '14px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${(week.count / maxGym) * 100}%`,
                        background: week.count >= 4 ? 'var(--accent-sage)' : week.count >= 2 ? 'var(--accent-amber)' : week.count > 0 ? '#fcd34d' : 'transparent',
                        borderRadius: '4px', transition: 'width 0.4s ease',
                        minWidth: week.count > 0 ? '8px' : '0',
                      }} />
                    </div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', width: '14px', textAlign: 'right', flexShrink: 0 }}>
                      {week.count > 0 ? week.count : ''}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                {[{ label: '4+ sessions', color: 'var(--accent-sage)' }, { label: '2-3 sessions', color: 'var(--accent-amber)' }, { label: '1 session', color: '#fcd34d' }].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: l.color }} />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quarter summary stat */}
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                📊 Quarter Stats
              </div>
              {[
          { label: 'Total gym sessions', value: (() => {
                const { start, end } = getQuarterDateRange(selectedQuarter)
                const qs = start.toISOString().slice(0, 10)
                const qe = end.toISOString().slice(0, 10)
                return gymSessions.filter(s => s.sessionDate >= qs && s.sessionDate <= qe).length
              })() },
                { label: 'Goals set', value: quarterGoals.length },
                { label: 'Goals completed', value: completedGoals },
                { label: 'Completion rate', value: `${goalProgress}%` },
              ].map(s => (
                <div key={s.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0', borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600 }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Big Picture */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Map size={16} color="var(--accent-sage)" />
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600 }}>Big Picture</h2>
              </div>
              <button className="btn btn-ghost" onClick={() => setShowAddBP(!showAddBP)} style={{ padding: '6px 10px' }}>
                <Plus size={14} /> Add
              </button>
            </div>

            {/* Overall progress */}
            {bigPicture.length > 0 && (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  <span>{completedBP} of {bigPicture.length} achieved</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{bpProgress}%</span>
                </div>
                <div style={{ height: '5px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${bpProgress}%`,
                    background: 'var(--accent-sage)', borderRadius: '3px', transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>
            )}

            {/* Add item form */}
            {showAddBP && (
              <div className="animate-scale-in card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <select value={newBPCategory} onChange={e => setNewBPCategory(e.target.value)} style={{ fontSize: '13px' }}>
                  {BP_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.emoji} {c.key}</option>)}
                </select>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input type="text" placeholder="What do you want to achieve?" value={newBPText}
                    onChange={e => setNewBPText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addBPItem()}
                    style={{ flex: 1, fontSize: '13px' }} autoFocus />
                  <button className="btn btn-primary" onClick={addBPItem} style={{ padding: '8px 10px' }}>
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* Category filter */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {['All', ...BP_CATEGORIES.map(c => c.key)].map(f => (
                <button key={f} onClick={() => setBpFilter(f)} style={{
                  background: bpFilter === f ? 'var(--text-primary)' : 'white',
                  border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer',
                  color: bpFilter === f ? 'white' : 'var(--text-muted)', fontSize: '11px',
                  fontWeight: bpFilter === f ? 600 : 400, padding: '4px 10px', transition: 'all 0.15s',
                  fontFamily: 'var(--font-sans)',
                }}>{f}</button>
              ))}
            </div>

            {/* Items by category */}
            {BP_CATEGORIES.filter(c => bpFilter === 'All' || bpFilter === c.key).map(cat => {
              const items = filteredBP.filter(i => i.category === cat.key)
              if (items.length === 0 && bpFilter !== cat.key) return null
              return (
                <div key={cat.key} className="card" style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '15px' }}>{cat.emoji}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600 }}>{cat.key}</span>
                    <span style={{
                      marginLeft: 'auto', background: cat.bg, border: `1px solid ${cat.border}`,
                      borderRadius: '5px', color: cat.color, fontSize: '10px', fontWeight: 600, padding: '2px 6px',
                    }}>
                      {items.filter(i => i.completed).length}/{items.length}
                    </span>
                  </div>

                  {items.length === 0 && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>
                      Nothing added yet
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {items.map(item => (
                      <div key={item.id} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '8px',
                        padding: '6px 0', borderBottom: '1px solid var(--border)',
                      }}>
                        <button onClick={() => toggleBPItem(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, marginTop: '1px' }}>
                          {item.completed
                            ? <CheckCircle2 size={15} color={cat.color} />
                            : <Circle size={15} color="var(--border-strong)" />}
                        </button>
                        <span style={{
                          flex: 1, fontSize: '13px',
                          textDecoration: item.completed ? 'line-through' : 'none',
                          color: item.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                          lineHeight: 1.4,
                        }}>{item.text}</span>
                        <button onClick={() => deleteBPItem(item.id)} style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--text-muted)', opacity: 0.4, padding: 0, flexShrink: 0,
                        }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-muted)', fontSize: '12px' }}>
          Focus — Quarter View
        </div>
      </div>
    </div>
  )
}
