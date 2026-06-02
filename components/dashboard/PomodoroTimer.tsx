'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw, Coffee } from 'lucide-react'
import type { PomodoroSession } from '@/lib/schema'

interface PomodoroTimerProps {
  sessions: PomodoroSession[]
  onSessionComplete: (session: PomodoroSession) => void
}

const MODES = {
  work: { label: 'Focus', duration: 25, color: 'var(--accent-amber)' },
  shortBreak: { label: 'Short Break', duration: 5, color: 'var(--accent-sage)' },
  longBreak: { label: 'Long Break', duration: 15, color: 'var(--accent-rust)' },
}

type Mode = keyof typeof MODES

export default function PomodoroTimer({ sessions, onSessionComplete }: PomodoroTimerProps) {
  const [mode, setMode] = useState<Mode>('work')
  const [timeLeft, setTimeLeft] = useState(MODES.work.duration * 60)
  const [running, setRunning] = useState(false)
  const [cycles, setCycles] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout>()
  const startTimeRef = useRef<number>(0)

  const totalDuration = MODES[mode].duration * 60

  useEffect(() => {
    setTimeLeft(MODES[mode].duration * 60)
    setRunning(false)
    clearInterval(intervalRef.current)
  }, [mode])

  const handleComplete = useCallback(async () => {
    setRunning(false)
    clearInterval(intervalRef.current)

    const res = await fetch('/api/pomodoro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        duration: MODES[mode].duration,
        type: mode === 'work' ? 'work' : 'break',
      }),
    })
    const session = await res.json()
    onSessionComplete(session)

    if (mode === 'work') {
      const newCycles = cycles + 1
      setCycles(newCycles)
      setMode(newCycles % 4 === 0 ? 'longBreak' : 'shortBreak')
    } else {
      setMode('work')
    }
  }, [mode, cycles, onSessionComplete])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, handleComplete])

  const reset = () => {
    setRunning(false)
    clearInterval(intervalRef.current)
    setTimeLeft(MODES[mode].duration * 60)
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100

  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference - (progress / 100) * circumference

  // Today's work minutes
  const todayStr = new Date().toDateString()
  const todayWorkMins = sessions
    .filter(s => s.type === 'work' && new Date(s.completedAt).toDateString() === todayStr)
    .reduce((sum, s) => sum + s.duration, 0)

  const weekWorkSessions = sessions.filter(s => s.type === 'work').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600, alignSelf: 'flex-start' }}>
        Pomodoro
      </h2>

      {/* Mode selector */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--border)', borderRadius: '8px', padding: '3px' }}>
        {(Object.keys(MODES) as Mode[]).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            background: mode === m ? 'white' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            boxShadow: mode === m ? 'var(--shadow-sm)' : 'none',
            color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: mode === m ? 600 : 400,
            padding: '5px 10px',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}>
            {MODES[m].label}
          </button>
        ))}
      </div>

      {/* Timer circle */}
      <div style={{ position: 'relative', width: '140px', height: '140px' }}>
        <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx="70" cy="70" r="54" fill="none" stroke="var(--border)" strokeWidth="6" />
          {/* Progress */}
          <circle cx="70" cy="70" r="54" fill="none"
            stroke={MODES[mode].color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        {/* Time display */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '32px',
            fontWeight: 500,
            letterSpacing: '-1px',
            color: 'var(--text-primary)',
            ...(running ? { animation: 'none' } : {}),
          }}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {MODES[mode].label}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button onClick={reset} className="btn btn-ghost" style={{ borderRadius: '50%', padding: '10px', width: '40px', height: '40px', justifyContent: 'center' }}>
          <RotateCcw size={16} />
        </button>
        <button
          onClick={() => setRunning(!running)}
          style={{
            alignItems: 'center',
            background: running ? 'var(--text-primary)' : MODES[mode].color,
            border: 'none',
            borderRadius: '50%',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            height: '56px',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            width: '56px',
            boxShadow: running ? 'none' : `0 4px 16px ${MODES[mode].color}60`,
          }}
          className={running ? '' : 'timer-pulse'}
        >
          {running ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: '2px' }} />}
        </button>
        <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Coffee size={16} color="var(--text-muted)" />
        </div>
      </div>

      {/* Cycle dots */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: i < (cycles % 4) ? 'var(--accent-amber)' : 'var(--border)',
            transition: 'background 0.2s ease',
          }} />
        ))}
      </div>

      {/* Stats */}
      <div style={{
        background: 'white',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1px',
        overflow: 'hidden',
        width: '100%',
      }}>
        {[
          { label: 'Today', value: `${todayWorkMins}m` },
          { label: 'This week', value: `${weekWorkSessions} sessions` },
        ].map(stat => (
          <div key={stat.label} style={{ padding: '12px', textAlign: 'center', background: 'white' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 500, color: 'var(--text-primary)' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
