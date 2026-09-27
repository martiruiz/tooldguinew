'use client'

import { NavigationLink as Link } from '@/components/ui/NavigationLink'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckSquare, Users, Layers, ClipboardList, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/clients',   icon: Users,           label: 'Clients'   },
  { href: '/tasks',     icon: CheckSquare,     label: 'Tasques'   },
  { href: '/check',     icon: ClipboardList,   label: 'Sessions'  },
  { href: '/contingut', icon: Layers,          label: 'Contingut' },
]

export function MobileNav() {
  const pathname = usePathname()
  const [chatUnread, setChatUnread] = useState(0)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      setChatUnread(detail?.unread ?? 0)
    }
    window.addEventListener('chat-unread-update', handler)
    return () => window.removeEventListener('chat-unread-update', handler)
  }, [])

  const openChat = () => window.dispatchEvent(new CustomEvent('mobile-open-chat'))

  return (
    <nav className="mobile-nav">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn('mn-item', active && 'mn-item--active')}
          >
            <span className={cn('mn-pill', active && 'mn-pill--active')}>
              <item.icon size={20} strokeWidth={active ? 2.2 : 1.6} />
            </span>
            <span className="mn-label">{item.label}</span>
          </Link>
        )
      })}

      {/* Chat button */}
      <button className="mn-item mn-chat-btn" onClick={openChat}>
        <span className="mn-pill" style={{ position: 'relative' }}>
          <MessageCircle size={20} strokeWidth={1.6} />
          {chatUnread > 0 && (
            <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 14, height: 14, background: '#EF4444', borderRadius: 7, fontSize: 8, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', border: '1.5px solid white' }}>
              {chatUnread > 9 ? '9+' : chatUnread}
            </span>
          )}
        </span>
        <span className="mn-label">Xat</span>
      </button>

      <style jsx>{`
        .mobile-nav {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          background: rgba(255,255,255,0.94);
          backdrop-filter: blur(20px) saturate(1.8);
          -webkit-backdrop-filter: blur(20px) saturate(1.8);
          border-top: 1px solid rgba(0,0,0,0.08);
          display: flex;
          align-items: center;
          justify-content: space-around;
          z-index: 100;
          padding: 6px 4px env(safe-area-inset-bottom, 6px);
          height: calc(64px + env(safe-area-inset-bottom, 0px));
          box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
        }

        :global(.mn-item) {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          text-decoration: none;
          color: #9CA3AF;
          background: none;
          border: none;
          font-family: inherit;
          cursor: pointer;
          padding: 0;
          min-height: 52px;
        }

        :global(.mn-item--active) {
          color: #1B2B4B;
        }

        :global(.mn-chat-btn) {
          color: #9CA3AF;
        }

        :global(.mn-pill) {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 30px;
          border-radius: 15px;
          transition: background 0.18s, box-shadow 0.18s;
        }

        :global(.mn-pill--active) {
          background: linear-gradient(145deg, #1B2B4B 0%, #2D4F8A 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(27,43,75,0.35);
        }

        :global(.mn-item--active .mn-pill--active svg) {
          color: white;
          stroke: white;
        }

        :global(.mn-label) {
          font-size: 9.5px;
          font-weight: 600;
          letter-spacing: 0.01em;
          line-height: 1;
        }
      `}</style>
    </nav>
  )
}
