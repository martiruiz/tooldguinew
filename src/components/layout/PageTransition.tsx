'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useNavigation } from '@/contexts/NavigationContext'

export function PageTransition() {
  const pathname = usePathname()
  const prevPath = useRef(pathname)
  const { loading, stopLoading } = useNavigation()

  // Stop loading when pathname actually changes (new page mounted)
  useEffect(() => {
    if (pathname !== prevPath.current) {
      prevPath.current = pathname
      stopLoading()
    }
  }, [pathname, stopLoading])

  if (!loading) return null

  return (
    <>
      <div className="pt-overlay" />
      <div className="pt-center">
        <div className="pt-logo-wrap">
          <img src="/logo-plata.png" alt="" className="pt-logo" />
          <div className="pt-shimmer" />
        </div>
      </div>
      <div className="pt-bar" />

      <style>{`
        .pt-overlay {
          position: fixed; inset: 0; z-index: 99990;
          background: #F8F8F8;
          animation: pt-fade-in 0.08s ease forwards;
        }
        .pt-center {
          position: fixed; inset: 0; z-index: 99991;
          display: flex; align-items: center; justify-content: center;
          animation: pt-fade-in 0.08s ease forwards;
        }
        .pt-logo-wrap { position: relative; overflow: hidden; border-radius: 4px; }
        .pt-logo {
          display: block; height: 52px; width: auto; opacity: 0.5;
          animation: pt-breathe 0.7s ease-in-out infinite alternate;
        }
        .pt-shimmer {
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%);
          background-size: 200% 100%;
          animation: pt-shimmer-sweep 1s ease infinite;
        }
        .pt-bar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 99992;
          height: 2px;
          background: linear-gradient(90deg, #1B2B4B, #4A7FC1, #7ab4e8);
          transform-origin: left;
          animation: pt-bar-grow 0.6s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        @keyframes pt-fade-in  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pt-breathe  { from { opacity: 0.35; transform: scale(0.97) } to { opacity: 0.6; transform: scale(1.03) } }
        @keyframes pt-shimmer-sweep { 0% { background-position: -100% 0 } 100% { background-position: 200% 0 } }
        @keyframes pt-bar-grow { from { transform: scaleX(0) } to { transform: scaleX(0.85) } }
      `}</style>
    </>
  )
}
