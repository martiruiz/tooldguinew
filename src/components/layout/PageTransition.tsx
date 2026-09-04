'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function PageTransition() {
  const pathname = usePathname()
  const [phase, setPhase] = useState<'hidden' | 'in' | 'out'>('hidden')
  const prevPath = useRef(pathname)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (pathname === prevPath.current) return
    prevPath.current = pathname

    setPhase('in')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setPhase('out')
      timerRef.current = setTimeout(() => setPhase('hidden'), 350)
    }, 500)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [pathname])

  if (phase === 'hidden') return null

  return (
    <>
      <div className={`pt-overlay ${phase}`} />
      <div className={`pt-center ${phase}`}>
        <div className="pt-logo-wrap">
          <img src="/logo-plata.png" alt="" className="pt-logo" />
          <div className="pt-shimmer" />
        </div>
      </div>
      <div className={`pt-bar ${phase}`} />

      <style>{`
        .pt-overlay {
          position: fixed; inset: 0; z-index: 99990;
          background: rgba(248,248,248,0.92);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          transition: opacity 0.3s ease;
        }
        .pt-overlay.in  { opacity: 1; }
        .pt-overlay.out { opacity: 0; }

        .pt-center {
          position: fixed; inset: 0; z-index: 99991;
          display: flex; align-items: center; justify-content: center;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .pt-center.in  { opacity: 1; transform: scale(1); }
        .pt-center.out { opacity: 0; transform: scale(0.92); }

        .pt-logo-wrap {
          position: relative; overflow: hidden;
          border-radius: 4px;
        }

        .pt-logo {
          display: block;
          height: 52px; width: auto;
          opacity: 0.5;
          animation: pt-breathe 0.7s ease-in-out infinite alternate;
        }

        .pt-shimmer {
          position: absolute; inset: 0;
          background: linear-gradient(
            105deg,
            transparent 30%,
            rgba(255,255,255,0.55) 50%,
            transparent 70%
          );
          background-size: 200% 100%;
          animation: pt-shimmer-sweep 1s ease infinite;
        }

        .pt-bar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 99992;
          height: 2px;
          background: linear-gradient(90deg, #1B2B4B, #4A7FC1, #7ab4e8);
          background-size: 200% 100%;
          transform-origin: left;
          transition: opacity 0.3s ease;
        }
        .pt-bar.in  { opacity: 1; animation: pt-bar-grow 0.55s cubic-bezier(0.4,0,0.2,1) forwards, pt-bar-shimmer 1s linear infinite; }
        .pt-bar.out { opacity: 0; }

        @keyframes pt-breathe {
          from { opacity: 0.35; transform: scale(0.97); }
          to   { opacity: 0.6;  transform: scale(1.03); }
        }
        @keyframes pt-shimmer-sweep {
          0%   { background-position: -100% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pt-bar-grow {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes pt-bar-shimmer {
          0%   { background-position: 0% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </>
  )
}
