'use client'

import { useState, useRef, useEffect } from 'react'
import type { Profile } from '@/types'
import { Sidebar } from './Sidebar'

interface Props {
  user: Profile
}

export function MobileSidebarWrapper({ user }: Props) {
  const [open, setOpen] = useState(false)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
    }

    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current)

      // Swipe right from left edge (<= 40px) → open
      if (!open && touchStartX.current <= 40 && dx > 60 && dy < 80) {
        setOpen(true)
      }
      // Swipe left on open sidebar → close
      if (open && dx < -60 && dy < 80) {
        setOpen(false)
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [open])

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="mobile-sidebar-overlay"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar drawer */}
      <div className={`mobile-sidebar-drawer${open ? ' open' : ''}`}>
        <Sidebar user={user} />
      </div>

      <style jsx>{`
        .mobile-sidebar-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.4);
          z-index: 199; backdrop-filter: blur(2px);
        }

        .mobile-sidebar-drawer {
          position: fixed; top: 0; left: 0; bottom: 0;
          z-index: 200; transform: translateX(-100%);
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform;
        }

        .mobile-sidebar-drawer.open {
          transform: translateX(0);
        }

        @media (min-width: 1024px) {
          .mobile-sidebar-drawer { display: none; }
          .mobile-sidebar-overlay { display: none; }
        }
      `}</style>
    </>
  )
}
