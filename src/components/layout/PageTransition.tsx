'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function PageTransition() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const prevPath = useRef(pathname)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (pathname === prevPath.current) return
    prevPath.current = pathname

    setVisible(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setVisible(false), 500)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [pathname])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(248,248,248,0.85)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'pt-fade-in 0.15s ease',
    }}>
      <img
        src="/logo-plata.png"
        alt="Guinew"
        style={{ height: 48, width: 'auto', opacity: 0.5, animation: 'pt-pulse 0.6s ease infinite alternate' }}
      />
      <style>{`
        @keyframes pt-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pt-pulse { from { opacity: 0.35 } to { opacity: 0.6 } }
      `}</style>
    </div>
  )
}
