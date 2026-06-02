'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CheckCircle2, Dumbbell, CalendarDays, Target, LayoutDashboard } from 'lucide-react'

export default function MobileNav() {
  const pathname = usePathname()

  const tabs = [
    { href: '/', icon: LayoutDashboard, label: 'Home' },
    { href: '/weekly', icon: CalendarDays, label: 'Weekly' },
    { href: '/quarter', icon: Target, label: 'Quarter' },
  ]

  return (
    <nav className="mobile-nav" style={{
      display: 'flex',
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      background: 'var(--bg-card)',
      borderTop: '1px solid var(--border)',
      zIndex: 50,
      paddingBottom: 'env(safe-area-inset-bottom, 8px)',
    }}>
      <div className="mobile-nav-inner" style={{
        display: 'flex', justifyContent: 'space-around',
        alignItems: 'center', width: '100%', padding: '6px 0',
      }}>
        {tabs.map(tab => {
          const active = pathname === tab.href
          const Icon = tab.icon
          return (
            <Link key={tab.href} href={tab.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              color: active ? 'var(--accent-terra)' : 'var(--text-muted)',
              textDecoration: 'none', padding: '6px 20px',
              fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 500,
              transition: 'color 0.15s',
            }}>
              <Icon size={22} />
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
