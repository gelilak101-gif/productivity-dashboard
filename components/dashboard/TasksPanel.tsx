'use client'

import { useState } from 'react'
import { Plus, Trash2, CheckCircle2, Circle, Calendar } from 'lucide-react'
import { format, isToday, isTomorrow, isPast, parseISO, isWithinInterval } from 'date-fns'
import type { Task } from '@/lib/schema'

interface TasksPanelProps {
  tasks: Task[]
  onTasksChange: (tasks: Task[]) => void
}

const PRIORITIES = [
  { value: 'high', label: 'High', color: '#a86c50' },
  { value: 'medium', label: 'Med', color: '#c9896a' },
  { value: 'low', label: 'Low', color: '#5a6e50' },
]

function getDateLabel(task: Task) {
  const start = task.startDate ? new Date(task.startDate) : task.dueDate ? new Date(task.dueDate) : null
  const end = task.endDate ? new Date(task.endDate) : null

  if (!start) return null

  if (end && format(start, 'yyyy-MM-dd') !== format(end, 'yyyy-MM-dd')) {
    return { label: `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`, color: 'var(--accent-terra)' }
  }

  if (isToday(start)) return { label: 'Today', color: '#c9896a' }
  if (isTomorrow(start)) return { label: 'Tomorrow', color: '#a86c50' }
  if (isPast(start)) return { label: format(start, 'MMM d'), color: '#a86c50' }
  return { label: format(start, 'MMM d'), color: 'var(--text-muted)' }
}

export default function TasksPanel({ tasks, onTasksChange }: TasksPanelProps) {
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState('medium')
  const [newStartDate, setNewStartDate] = useState('')
  const [newEndDate, setNewEndDate] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [adding, setAdding] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'done' | 'today'>('all')
  const [editingDateId, setEditingDateId] = useState<number | null>(null)
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd] = useState('')

  const isTaskToday = (task: Task) => {
    const today = new Date()
    const start = task.startDate ? new Date(task.startDate) : task.dueDate ? new Date(task.dueDate) : null
    const end = task.endDate ? new Date(task.endDate) : start
    if (!start) return false
    try {
      return isWithinInterval(today, { start, end: end! })
    } catch { return isToday(start) }
  }

  const filtered = tasks.filter(t => {
    if (filter === 'done') return t.completed
    if (filter === 'active') return !t.completed
    if (filter === 'today') return !t.completed && isTaskToday(t)
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    const aDate = a.startDate || a.dueDate
    const bDate = b.startDate || b.dueDate
    if (aDate && bDate) return new Date(aDate).getTime() - new Date(bDate).getTime()
    if (aDate) return -1
    if (bDate) return 1
    return 0
  })

  const addTask = async () => {
    if (!newTitle.trim()) return
    setAdding(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle, priority: newPriority,
          startDate: newStartDate ? newStartDate + 'T12:00:00' : null,
          endDate: newEndDate ? newEndDate + 'T12:00:00' : null,
        }),
      })
      const task = await res.json()
      onTasksChange([task, ...tasks])
      setNewTitle('')
      setNewStartDate('')
      setNewEndDate('')
      setShowDatePicker(false)
    } finally { setAdding(false) }
  }

  const toggleTask = async (task: Task) => {
    const res = await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, completed: !task.completed }),
    })
    const updated = await res.json()
    onTasksChange(tasks.map(t => t.id === updated.id ? updated : t))
  }

  const openEditDate = (task: Task) => {
    setEditStart(task.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '')
    setEditEnd(task.endDate ? format(new Date(task.endDate), 'yyyy-MM-dd') : '')
    setEditingDateId(task.id)
  }

  const saveDateEdit = async (taskId: number) => {
    const res = await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: taskId,
        startDate: editStart ? editStart + 'T12:00:00' : null,
        endDate: editEnd ? editEnd + 'T12:00:00' : null,
      }),
    })
    const updated = await res.json()
    onTasksChange(tasks.map(t => t.id === updated.id ? updated : t))
    setEditingDateId(null)
  }

  const deleteTask = async (id: number) => {
    await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' })
    onTasksChange(tasks.filter(t => t.id !== id))
  }

  const completedCount = tasks.filter(t => t.completed).length
  const todayCount = tasks.filter(t => !t.completed && isTaskToday(t)).length
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '14px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600 }}>Tasks</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {todayCount > 0 && (
              <span style={{
                background: 'var(--accent-terra-light)', color: 'var(--accent-terra)',
                border: '1px solid rgba(201,137,106,0.3)',
                borderRadius: '5px', fontSize: '11px', fontWeight: 600, padding: '2px 7px',
              }}>{todayCount} today</span>
            )}
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{completedCount}/{tasks.length} done</span>
          </div>
        </div>
        <div style={{ height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent-sage)', borderRadius: '2px', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Add task */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input type="text" placeholder="Add a task..." value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()} style={{ flex: 1 }} />
          <select value={newPriority} onChange={e => setNewPriority(e.target.value)}
            style={{ width: '68px', padding: '8px 4px', fontSize: '12px' }}>
            {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <button onClick={() => setShowDatePicker(!showDatePicker)} title="Set date range"
            style={{
              background: (newStartDate || newEndDate) ? 'var(--accent-terra-light)' : 'var(--bg-parchment)',
              border: `1px solid ${(newStartDate || newEndDate) ? 'var(--accent-terra)' : 'var(--border)'}`,
              borderRadius: '6px', cursor: 'pointer', padding: '0 10px',
              color: (newStartDate || newEndDate) ? 'var(--accent-terra)' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 500,
            }}>
            <Calendar size={13} />
            {newStartDate ? (newEndDate ? `${format(parseISO(newStartDate), 'MMM d')}–${format(parseISO(newEndDate), 'd')}` : format(parseISO(newStartDate), 'MMM d')) : 'Date'}
          </button>
          <button className="btn btn-primary" onClick={addTask} disabled={adding} style={{ padding: '8px 10px' }}>
            <Plus size={14} />
          </button>
        </div>

        {showDatePicker && (
          <div className="animate-scale-in" style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'var(--bg-parchment)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
              <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>Start</label>
              <input type="date" value={newStartDate} onChange={e => setNewStartDate(e.target.value)} style={{ fontSize: '12px' }} />
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', paddingTop: '14px' }}>→</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
              <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>End (optional)</label>
              <input type="date" value={newEndDate} onChange={e => setNewEndDate(e.target.value)} min={newStartDate} style={{ fontSize: '12px' }} />
            </div>
            <button onClick={() => { setNewStartDate(''); setNewEndDate('') }}
              className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '11px', marginTop: '12px' }}>Clear</button>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '3px' }}>
        {(['all', 'today', 'active', 'done'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? 'var(--text-primary)' : 'transparent',
            color: filter === f ? 'white' : 'var(--text-muted)',
            border: 'none', borderRadius: '6px', cursor: 'pointer',
            fontSize: '12px', fontWeight: 500, padding: '4px 10px',
            textTransform: 'capitalize', transition: 'all 0.15s ease',
            fontFamily: 'var(--font-sans)',
          }}>{f}</button>
        ))}
      </div>

      {/* Task list */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {sorted.length === 0 && (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0', fontSize: '13px', fontStyle: 'italic' }}>
            {filter === 'today' ? 'No tasks for today' : filter === 'done' ? 'No completed tasks yet' : 'Nothing here — add a task above'}
          </div>
        )}
        {sorted.map(task => {
          const dateFmt = getDateLabel(task)
          const isEditing = editingDateId === task.id
          return (
            <div key={task.id} className="animate-slide-up" style={{
              background: task.completed ? 'transparent' : 'white',
              border: '1px solid var(--border)', borderRadius: '8px',
              padding: '9px 12px', transition: 'all 0.15s ease',
              opacity: task.completed ? 0.55 : 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <button onClick={() => toggleTask(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0, marginTop: '1px', padding: 0 }}>
                  {task.completed ? <CheckCircle2 size={16} color="var(--accent-sage)" /> : <Circle size={16} />}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)', fontSize: '13px', fontWeight: 500, wordBreak: 'break-word' }}>
                    {task.title}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: PRIORITIES.find(p => p.value === task.priority)?.color }}>
                      {task.priority}
                    </span>
                    {!isEditing && (
                      <button onClick={() => openEditDate(task)} style={{
                        background: dateFmt ? 'var(--accent-terra-light)' : 'var(--bg-parchment)',
                        border: `1px solid ${dateFmt ? 'rgba(201,137,106,0.3)' : 'var(--border)'}`,
                        borderRadius: '4px', cursor: 'pointer', padding: '2px 6px',
                        fontSize: '11px', color: dateFmt ? dateFmt.color : 'var(--text-muted)',
                        fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: '3px',
                      }}>
                        <Calendar size={9} />
                        {dateFmt ? dateFmt.label : 'Add date'}
                      </button>
                    )}
                  </div>
                </div>
                <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--border-strong)', flexShrink: 0, padding: 0, opacity: 0.4 }}>
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Inline date range editor */}
              {isEditing && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>Start</label>
                    <input type="date" value={editStart} onChange={e => setEditStart(e.target.value)} style={{ fontSize: '12px' }} />
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', paddingBottom: '8px' }}>→</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>End (optional)</label>
                    <input type="date" value={editEnd} onChange={e => setEditEnd(e.target.value)} min={editStart} style={{ fontSize: '12px' }} />
                  </div>
                  <button onClick={() => saveDateEdit(task.id)} style={{
                    background: 'var(--accent-sage)', color: 'white', border: 'none',
                    borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
                    fontWeight: 600, padding: '8px 12px', fontFamily: 'var(--font-sans)',
                  }}>Save</button>
                  <button onClick={() => setEditingDateId(null)} style={{
                    background: 'var(--bg-parchment)', color: 'var(--text-muted)',
                    border: '1px solid var(--border)', borderRadius: '6px',
                    cursor: 'pointer', fontSize: '12px', padding: '8px 10px', fontFamily: 'var(--font-sans)',
                  }}>Cancel</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
