'use client'

import { useState, useCallback, useRef } from 'react'
import { format, addDays, parseISO, startOfWeek, endOfWeek } from 'date-fns'
import {
  CheckCircle2, Circle, Dumbbell, Target, BookOpen,
  CalendarDays, ArrowLeft, Plus, Trash2, Flame
} from 'lucide-react'
import Link from 'next/link'
import type { Task, WeeklyPlan, GymSession } from '@/lib/schema'

interface WeeklyDashboardProps {
  initialTasks: Task[]
  initialPlan: WeeklyPlan | null
  initialGymSessions: GymSession[]
  weekStart: string
  weekEnd: string
}

const GYM_TYPES = ['💪 Strength', '🏃 Cardio', '🧘 Yoga', '🚴 Cycling', '🏊 Swim', '🥊 Boxing', '🔥 HIIT']

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function useDebounce(fn: (...args: unknown[]) => void, delay: number) {
  const timer = useRef<NodeJS.Timeout>()
  return useCallback((...args: unknown[]) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => fn(...args), delay)
  }, [fn, delay])
}

// Reusable task row for weekly view
function TaskRow({ task, onToggle, onDelete, onDateChange, weekDays, priorityColors }: {
  task: Task
  onToggle: (t: Task) => void
  onDelete: (id: number) => void
  onDateChange: (t: Task, date: string) => Promise<void>
  weekDays: { date: string; label: string; dayNum: string }[]
  priorityColors: Record<string, string>
}) {
  const [editingDate, setEditingDate] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [saving, setSaving] = useState(false)

  // Derive current date from task each render so it stays fresh
  const currentTaskDate = task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : ''
  const hasDate = !!task.dueDate
  const dateLabel = task.dueDate ? format(new Date(task.dueDate), 'EEE d') : 'Set day'

  const openEdit = () => {
    setSelectedDate(currentTaskDate)
    setEditingDate(true)
  }

  const saveDate = async () => {
    setSaving(true)
    await onDateChange(task, selectedDate)
    setSaving(false)
    setEditingDate(false)
  }

  const cancelEdit = () => {
    setSelectedDate(currentTaskDate)
    setEditingDate(false)
  }

  return (
    <div style={{
      background: task.completed ? 'transparent' : 'white',
      border: '1px solid var(--border)', borderRadius: '7px',
      padding: '7px 10px', opacity: task.completed ? 0.55 : 1, transition: 'all 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button onClick={() => onToggle(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
          {task.completed ? <CheckCircle2 size={15} color="var(--accent-sage)" /> : <Circle size={15} color="var(--border-strong)" />}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '13px', fontWeight: 500,
            textDecoration: task.completed ? 'line-through' : 'none',
            color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{task.title}</div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: priorityColors[task.priority] }}>{task.priority}</span>
            {!editingDate && (
              <button onClick={openEdit} style={{
                background: hasDate ? 'var(--accent-terra-light)' : 'var(--bg-parchment)',
                border: `1px solid ${hasDate ? 'rgba(201,137,106,0.3)' : 'var(--border)'}`,
                borderRadius: '4px', cursor: 'pointer', padding: '2px 7px',
                fontSize: '10px', color: hasDate ? 'var(--accent-terra)' : 'var(--text-muted)',
                fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: '3px',
              }}>
                📅 {dateLabel}
              </button>
            )}
          </div>
        </div>
        <button onClick={() => onDelete(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--border-strong)', opacity: 0.4, padding: 0, flexShrink: 0 }}>
          <Trash2 size={11} />
        </button>
      </div>

      {/* Inline date editor — shown below the task when editing */}
      {editingDate && (
        <div style={{
          marginTop: '8px', paddingTop: '8px',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap',
        }}>
          <select
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '5px', border: '1px solid var(--accent-terra)', flex: 1 }}
          >
            <option value="">— No specific day —</option>
            {weekDays.map(d => <option key={d.date} value={d.date}>{d.label} {d.dayNum}</option>)}
          </select>
          <button
            onClick={saveDate}
            disabled={saving}
            style={{
              background: 'var(--accent-sage)', color: 'white', border: 'none',
              borderRadius: '5px', cursor: 'pointer', fontSize: '11px',
              fontWeight: 600, padding: '4px 10px', fontFamily: 'var(--font-sans)',
            }}
          >
            {saving ? '...' : 'Save'}
          </button>
          <button
            onClick={cancelEdit}
            style={{
              background: 'var(--bg-parchment)', color: 'var(--text-muted)',
              border: '1px solid var(--border)', borderRadius: '5px',
              cursor: 'pointer', fontSize: '11px', padding: '4px 10px', fontFamily: 'var(--font-sans)',
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

export default function WeeklyDashboard({
  initialTasks, initialPlan, initialGymSessions, weekStart, weekEnd
}: WeeklyDashboardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [gymSessions, setGymSessions] = useState<GymSession[]>(initialGymSessions)
  const [newTask, setNewTask] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('medium')
  const [newTaskDay, setNewTaskDay] = useState('')

  // Weekly plan state
  const [focus, setFocus] = useState(initialPlan?.weeklyFocus || '')
  const [reflections, setReflections] = useState(initialPlan?.reflections || '')
  const [plans, setPlans] = useState(initialPlan?.plans || '')
  const [gymTypeModal, setGymTypeModal] = useState<string | null>(null) // date string
  const [saved, setSaved] = useState(false)

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(parseISO(weekStart), i)
    return { date: format(d, 'yyyy-MM-dd'), label: DAYS[i], dayNum: format(d, 'd'), full: d }
  })
  const today = format(new Date(), 'yyyy-MM-dd')

  // Save plan to DB
  const savePlan = useCallback(async (overrides: Partial<{
    focus: string, goals: string[], reflections: string, plans: string, reminders: string[]
  }> = {}) => {
    const payload = {
      weekStart,
      weeklyFocus: overrides.focus ?? focus,
      goals: '[]',
      reflections: overrides.reflections ?? reflections,
      plans: overrides.plans ?? plans,
      reminders: '[]',
    }
    await fetch('/api/weekly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [weekStart, focus, goals, reflections, plans, reminders])

  const debouncedSave = useDebounce(savePlan as (...args: unknown[]) => void, 1200)

  // Tasks
  const addTask = async () => {
    if (!newTask.trim()) return
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTask, priority: newTaskPriority, dueDate: newTaskDay ? newTaskDay + 'T12:00:00' : null }),
    })
    const task = await res.json()
    setTasks([task, ...tasks])
    setNewTask('')
    setNewTaskDay('')
  }

  const toggleTask = async (task: Task) => {
    const res = await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, completed: !task.completed }),
    })
    const updated = await res.json()
    setTasks(tasks.map(t => t.id === updated.id ? updated : t))
  }

  const deleteTask = async (id: number) => {
    await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' })
    setTasks(tasks.filter(t => t.id !== id))
  }

  // Gym
  const toggleGym = async (date: string, type?: string) => {
    const res = await fetch('/api/gym', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionDate: date, type }),
    })
    const data = await res.json()
    if (data.logged) {
      setGymSessions(prev => [...prev, data.session])
    } else {
      setGymSessions(prev => prev.filter(s => s.sessionDate !== date))
    }
    setGymTypeModal(null)
  }

  const updateTaskDate = async (task: Task, date: string): Promise<void> => {
    const res = await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, dueDate: date ? date + 'T12:00:00' : null }),
    })
    const updated = await res.json()
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
  }

  const gymOnDate = (date: string) => gymSessions.find(s => s.sessionDate === date)

  // Goals
  const addGoal = () => {
    if (!newGoal.trim()) return
    const updated = [...goals, newGoal.trim()]
    setGoals(updated)
    setNewGoal('')
    savePlan({ goals: updated })
  }

  const removeGoal = (i: number) => {
    const updated = goals.filter((_, idx) => idx !== i)
    setGoals(updated)
    savePlan({ goals: updated })
  }

  // Reminders
  const addReminder = () => {
    if (!newReminder.trim()) return
    const updated = [...reminders, newReminder.trim()]
    setReminders(updated)
    setNewReminder('')
    savePlan({ reminders: updated })
  }

  const removeReminder = (i: number) => {
    const updated = reminders.filter((_, idx) => idx !== i)
    setReminders(updated)
    savePlan({ reminders: updated })
  }

  const completedTasks = tasks.filter(t => t.completed).length
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0
  const gymCount = gymSessions.length

  const PRIORITY_COLOR: Record<string, string> = {
    high: '#c9614a', medium: '#d97706', low: '#566d49'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      backgroundImage: `
        radial-gradient(ellipse at 10% 0%, rgba(217,119,6,0.07) 0%, transparent 50%),
        radial-gradient(ellipse at 90% 100%, rgba(86,109,73,0.05) 0%, transparent 50%)
      `,
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '28px 24px' }}>

        {/* Top nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/" style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              color: 'var(--text-muted)', textDecoration: 'none', fontSize: '13px',
              background: 'white', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '6px 12px',
              transition: 'all 0.15s',
            }}>
              <ArrowLeft size={13} /> Dashboard
            </Link>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 600, letterSpacing: '-0.5px' }}>
                Weekly View
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
                {format(parseISO(weekStart), 'MMM d')} – {format(parseISO(weekEnd), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {saved && (
              <span style={{ fontSize: '12px', color: 'var(--accent-sage)', fontWeight: 500, animation: 'fadeIn 0.3s ease' }}>
                ✓ Saved
              </span>
            )}
            {[
              { label: 'Tasks done', value: `${completedTasks}/${tasks.length}`, icon: '✓', color: 'var(--accent-sage)' },
              { label: 'Gym sessions', value: `${gymCount}×`, icon: '💪', color: 'var(--accent-amber)' },
              { label: 'Goals set', value: `${goals.length}`, icon: '🎯', color: 'var(--accent-rust)' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'white', border: '1px solid var(--border)', borderRadius: '10px',
                padding: '8px 14px', textAlign: 'center',
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 500 }}>{s.icon} {s.value}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Week strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '20px',
        }}>
          {weekDays.map(day => {
            const gym = gymOnDate(day.date)
            const isToday = day.date === today
            const dayTasks = tasks.filter(t => {
              const start = t.startDate ? format(new Date(t.startDate), 'yyyy-MM-dd') : t.dueDate ? format(new Date(t.dueDate), 'yyyy-MM-dd') : null
              const end = t.endDate ? format(new Date(t.endDate), 'yyyy-MM-dd') : start
              if (!start) return false
              return day.date >= start && day.date <= (end || start)
            })
            return (
              <div key={day.date} style={{
                background: isToday ? 'var(--text-primary)' : 'white',
                border: `1px solid ${isToday ? 'var(--text-primary)' : 'var(--border)'}`,
                borderRadius: '10px',
                padding: '12px',
                transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: isToday ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {day.label}
                    </div>
                    <div style={{ fontSize: '22px', fontFamily: 'var(--font-display)', fontWeight: 600, color: isToday ? 'white' : 'var(--text-primary)', lineHeight: 1.2 }}>
                      {day.dayNum}
                    </div>
                  </div>
                  {/* Gym toggle */}
                  <button
                    onClick={() => gym ? toggleGym(day.date) : setGymTypeModal(day.date)}
                    title={gym ? `${gym.type} — click to remove` : 'Log gym session'}
                    style={{
                      background: gym ? '#d97706' : isToday ? 'rgba(255,255,255,0.15)' : 'var(--bg-base)',
                      border: `1px solid ${gym ? '#d97706' : isToday ? 'rgba(255,255,255,0.2)' : 'var(--border)'}`,
                      borderRadius: '6px', cursor: 'pointer', fontSize: '14px',
                      height: '28px', width: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    {gym ? '💪' : <Dumbbell size={13} color={isToday ? 'white' : 'var(--text-muted)'} />}
                  </button>
                </div>

                {/* Day tasks preview */}
                {dayTasks.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {dayTasks.slice(0, 2).map(t => (
                      <div key={t.id} style={{
                        fontSize: '10px',
                        color: isToday ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)',
                        background: isToday ? 'rgba(255,255,255,0.1)' : 'var(--bg-base)',
                        borderRadius: '4px', padding: '2px 6px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        textDecoration: t.completed ? 'line-through' : 'none',
                      }}>
                        {t.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div style={{ fontSize: '10px', color: isToday ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)', paddingLeft: '6px' }}>
                        +{dayTasks.length - 2} more
                      </div>
                    )}
                  </div>
                )}

                {/* Gym type label */}
                {gym && (
                  <div style={{ marginTop: '6px', fontSize: '10px', color: '#d97706', fontWeight: 500 }}>
                    {gym.type}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Gym type modal */}
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
                    background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '8px',
                    cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500,
                    padding: '10px 14px', textAlign: 'left', transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-amber-light)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-base)')}
                  >
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

        {/* Main 3-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 0.9fr', gap: '16px', alignItems: 'start' }}>

          {/* LEFT: Tasks grouped by day */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <CheckCircle2 size={16} color="var(--accent-sage)" />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600 }}>This Week's Tasks</h2>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>
                <span>{completedTasks} of {tasks.length} complete</span>
                <span style={{ fontWeight: 600 }}>{progress}%</span>
              </div>
              <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent-sage)', borderRadius: '2px', transition: 'width 0.4s ease' }} />
              </div>
            </div>

            {/* Add task with day picker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input type="text" placeholder="Add a task..." value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                  style={{ flex: 1, fontSize: '13px' }} />
                <select value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value)}
                  style={{ width: '60px', fontSize: '12px', padding: '8px 4px' }}>
                  <option value="high">High</option>
                  <option value="medium">Med</option>
                  <option value="low">Low</option>
                </select>
                <button className="btn btn-primary" onClick={addTask} style={{ padding: '8px 10px' }}>
                  <Plus size={14} />
                </button>
              </div>
              <select value={newTaskDay} onChange={e => setNewTaskDay(e.target.value)}
                style={{ fontSize: '12px', padding: '6px 10px', color: newTaskDay ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                <option value="">No specific day (anytime this week)</option>
                {weekDays.map(d => (
                  <option key={d.date} value={d.date}>{d.label} {d.dayNum}</option>
                ))}
              </select>
            </div>

            {/* Tasks grouped by day */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '520px', overflowY: 'auto' }}>


              {/* Day-grouped tasks */}
              {weekDays.map(day => {
                const dayTasks = tasks.filter(t => {
                  const start = t.startDate ? format(new Date(t.startDate), 'yyyy-MM-dd') : t.dueDate ? format(new Date(t.dueDate), 'yyyy-MM-dd') : null
                  const end = t.endDate ? format(new Date(t.endDate), 'yyyy-MM-dd') : start
                  if (!start) return false
                  return day.date >= start && day.date <= (end || start)
                })
                if (dayTasks.length === 0) return null
                const isToday = day.date === today
                return (
                  <div key={day.date}>
                    <div style={{
                      fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.06em', marginBottom: '6px',
                      color: isToday ? 'var(--accent-terra)' : 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                      {day.label} {day.dayNum}
                      {isToday && <span style={{ background: 'var(--accent-terra-light)', color: 'var(--accent-terra)', borderRadius: '4px', padding: '1px 6px', fontSize: '10px' }}>Today</span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {[...dayTasks.filter(t => !t.completed), ...dayTasks.filter(t => t.completed)].map(task => (
                        <TaskRow key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} onDateChange={(t, date) => updateTaskDate(t, date)} weekDays={weekDays} priorityColors={PRIORITY_COLOR} />
                      ))}
                    </div>
                  </div>
                )
              })}

              {tasks.length === 0 && (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0', fontSize: '13px', fontStyle: 'italic' }}>
                  No tasks yet — add one above
                </div>
              )}
            </div>
          </div>

          {/* MIDDLE: Focus + Goals + Gym summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Weekly focus */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Target size={16} color="var(--accent-amber)" />
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600 }}>Weekly Focus</h2>
              </div>
              <textarea
                value={focus}
                onChange={e => {
                  setFocus(e.target.value);
                  (debouncedSave as (...args: unknown[]) => void)({ focus: e.target.value })
                }}
                placeholder="What's your main focus this week? e.g. 'Ship the new feature' or 'Rest and recover'"
                rows={3}
                style={{ resize: 'none', fontSize: '14px', fontStyle: focus ? 'normal' : 'italic', lineHeight: 1.6 }}
              />
            </div>

            {/* Gym summary */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Dumbbell size={16} color="var(--accent-amber)" />
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600 }}>Gym This Week</h2>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 600, color: gymCount > 0 ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
                  {gymCount}<span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)' }}>/wk</span>
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {weekDays.map(day => {
                  const gym = gymOnDate(day.date)
                  const isToday = day.date === today
                  return (
                    <div key={day.date} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: isToday ? 700 : 400 }}>
                        {day.label}
                      </div>
                      <button
                        onClick={() => gym ? toggleGym(day.date) : setGymTypeModal(day.date)}
                        style={{
                          background: gym ? '#d97706' : 'var(--bg-base)',
                          border: `1.5px solid ${gym ? '#d97706' : isToday ? '#d97706' : 'var(--border)'}`,
                          borderRadius: '7px', cursor: 'pointer', fontSize: '14px',
                          height: '34px', width: '100%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}
                        title={gym?.type}
                      >
                        {gym ? '💪' : ''}
                      </button>
                    </div>
                  )
                })}
              </div>
              {gymSessions.length > 0 && (
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {gymSessions.map(s => (
                    <span key={s.id} style={{
                      fontSize: '11px', background: 'var(--accent-amber-light)',
                      color: '#92400e', borderRadius: '5px', padding: '3px 8px', fontWeight: 500,
                    }}>
                      {s.type}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Reflections + Plans + Reminders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Reflections */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <BookOpen size={16} color="var(--accent-sage)" />
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600 }}>Reflections</h2>
              </div>
              <textarea
                value={reflections}
                onChange={e => {
                  setReflections(e.target.value);
                  (debouncedSave as (...args: unknown[]) => void)({ reflections: e.target.value })
                }}
                placeholder="How is the week going? What's working? What could be better?"
                rows={5}
                style={{ resize: 'none', fontSize: '13px', lineHeight: 1.7 }}
              />
            </div>

            {/* Plans */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <CalendarDays size={16} color="#a855f7" />
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600 }}>Plans for the Week</h2>
              </div>
              <textarea
                value={plans}
                onChange={e => {
                  setPlans(e.target.value);
                  (debouncedSave as (...args: unknown[]) => void)({ plans: e.target.value })
                }}
                placeholder="Appointments, events, trips, or anything scheduled this week..."
                rows={4}
                style={{ resize: 'none', fontSize: '13px', lineHeight: 1.7 }}
              />
            </div>

          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-muted)', fontSize: '12px' }}>
          Changes save automatically · Focus — Weekly View
        </div>
      </div>
    </div>
  )
}
