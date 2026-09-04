'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useNavigation } from '@/contexts/NavigationContext'

export function PageTransition() {
  const pathname = usePathname()
  const prevPath = useRef(pathname)
  const { loading, stopLoading } = useNavigation()

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
      <div className="pt-bar" />

      <style>{`
        .pt-overlay {
          position: fixed; inset: 0; z-index: 99990;
          background: #F8F8F8;
          animation: pt-in 0.05s ease forwards;
        }
        .pt-bar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 99992;
          height: 2px;
          background: linear-gradient(90deg, #1B2B4B, #4A7FC1, #7ab4e8);
          transform-origin: left;
          animation: pt-bar-grow 1.2s cubic-bezier(0.1,0,0.2,1) forwards;
        }
        @keyframes pt-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pt-bar-grow { from { transform: scaleX(0) } to { transform: scaleX(0.92) } }
      `}</style>
    </>
  )
}
