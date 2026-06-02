'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, Pin, PinOff } from 'lucide-react'
import type { Note } from '@/lib/schema'

interface NotesPanelProps {
  notes: Note[]
  onNotesChange: (notes: Note[]) => void
}

const NOTE_COLORS = [
  { value: 'default', bg: '#ffffff', border: '#e8e2d9' },
  { value: 'amber', bg: '#fffbeb', border: '#fde68a' },
  { value: 'sage', bg: '#f2f4f0', border: '#c2ccb8' },
  { value: 'rust', bg: '#fff5f3', border: '#fecdc5' },
]

export default function NotesPanel({ notes, onNotesChange }: NotesPanelProps) {
  const [editing, setEditing] = useState<Note | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newColor, setNewColor] = useState('default')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (showNew) textareaRef.current?.focus()
  }, [showNew])

  const saveNew = async () => {
    if (!newTitle.trim() && !newContent.trim()) {
      setShowNew(false)
      return
    }
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle || 'Untitled', content: newContent, color: newColor }),
    })
    const note = await res.json()
    onNotesChange([note, ...notes])
    setNewTitle('')
    setNewContent('')
    setNewColor('default')
    setShowNew(false)
  }

  const updateNote = async (id: number, updates: Partial<Note>) => {
    const res = await fetch('/api/notes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    const updated = await res.json()
    onNotesChange(notes.map(n => n.id === updated.id ? updated : n).sort((a, b) =>
      Number(b.pinned) - Number(a.pinned)
    ))
  }

  const deleteNote = async (id: number) => {
    await fetch(`/api/notes?id=${id}`, { method: 'DELETE' })
    onNotesChange(notes.filter(n => n.id !== id))
    if (editing?.id === id) setEditing(null)
  }

  const getColorStyle = (color: string) => {
    return NOTE_COLORS.find(c => c.value === color) || NOTE_COLORS[0]
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600 }}>Notes</h2>
        <button className="btn btn-ghost" onClick={() => setShowNew(true)} style={{ padding: '6px 10px' }}>
          <Plus size={14} />
          New
        </button>
      </div>

      {/* New note form */}
      {showNew && (
        <div className="animate-scale-in" style={{
          background: 'white',
          border: '1px solid var(--accent-amber)',
          borderRadius: '10px',
          padding: '12px',
          boxShadow: '0 0 0 3px rgba(217,119,6,0.1)',
        }}>
          <input type="text" placeholder="Title..." value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            style={{ marginBottom: '8px', fontWeight: 600, fontSize: '14px' }} />
          <textarea ref={textareaRef} placeholder="Note content..." value={newContent}
            onChange={e => setNewContent(e.target.value)}
            rows={4}
            style={{ resize: 'none', fontSize: '13px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {NOTE_COLORS.map(c => (
                <button key={c.value} onClick={() => setNewColor(c.value)} style={{
                  background: c.bg,
                  border: `2px solid ${newColor === c.value ? '#d97706' : c.border}`,
                  borderRadius: '50%', cursor: 'pointer', height: '18px', width: '18px',
                }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn btn-ghost" onClick={() => setShowNew(false)} style={{ fontSize: '12px', padding: '4px 10px' }}>Cancel</button>
              <button className="btn btn-primary" onClick={saveNew} style={{ fontSize: '12px', padding: '4px 10px' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Notes grid */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {notes.length === 0 && (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0', fontSize: '13px' }}>
            Capture your thoughts and ideas
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {notes.map(note => {
            const cs = getColorStyle(note.color)
            const isEditing = editing?.id === note.id
            return (
              <div key={note.id} className="animate-slide-up" style={{
                background: cs.bg,
                border: `1px solid ${isEditing ? 'var(--accent-amber)' : cs.border}`,
                borderRadius: '10px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
                onClick={() => !isEditing && setEditing(note)}
              >
                {/* Note actions */}
                <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
                  <button onClick={e => { e.stopPropagation(); updateNote(note.id, { pinned: !note.pinned }) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: note.pinned ? 'var(--accent-amber)' : 'var(--text-muted)', opacity: 0.7, padding: '2px' }}>
                    {note.pinned ? <Pin size={12} /> : <PinOff size={12} />}
                  </button>
                  <button onClick={e => { e.stopPropagation(); deleteNote(note.id) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', opacity: 0.5, padding: '2px' }}>
                    <Trash2 size={12} />
                  </button>
                </div>

                {isEditing ? (
                  <div onClick={e => e.stopPropagation()}>
                    <input type="text" value={editing.title}
                      onChange={e => setEditing({ ...editing, title: e.target.value })}
                      style={{ marginBottom: '6px', fontWeight: 600, fontSize: '13px', background: 'transparent', border: '1px solid var(--border)' }}
                    />
                    <textarea value={editing.content}
                      onChange={e => setEditing({ ...editing, content: e.target.value })}
                      rows={5}
                      style={{ resize: 'none', fontSize: '12px', background: 'transparent', border: '1px solid var(--border)' }}
                    />
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost" onClick={() => setEditing(null)} style={{ fontSize: '11px', padding: '3px 8px' }}>Cancel</button>
                      <button className="btn btn-primary" onClick={async () => {
                        await updateNote(editing.id, { title: editing.title, content: editing.content })
                        setEditing(null)
                      }} style={{ fontSize: '11px', padding: '3px 8px' }}>Save</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px', marginRight: '40px', lineHeight: 1.3 }}>
                      {note.title}
                    </div>
                    {note.content && (
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.5,
                      }}>
                        {note.content}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
