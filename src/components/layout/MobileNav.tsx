'use client'

import { NavigationLink as Link } from '@/components/ui/NavigationLink'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckSquare, Users, Layers, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'

const sideItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/clients',   icon: Users,           label: 'Clients'   },
  { href: '/check',     icon: ClipboardList,   label: 'Sessions'  },
  { href: '/contingut', icon: Layers,          label: 'Contingut' },
]

export function MobileNav() {
  const pathname = usePathname()
  const taskActive = pathname === '/tasks' || pathname.startsWith('/tasks/')

  return (
    <nav className="mobile-nav">
      {/* Left two items */}
      {sideItems.slice(0, 2).map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn('mobile-nav-item', active && 'mobile-nav-item--active')}
          >
            <item.icon size={20} strokeWidth={active ? 2.2 : 1.6} />
            <span>{item.label}</span>
          </Link>
        )
      })}

      {/* Center: Tasques destacat */}
      <Link href="/tasks" className={cn('mobile-nav-center', taskActive && 'mobile-nav-center--active')}>
        <CheckSquare size={22} strokeWidth={taskActive ? 2.4 : 2} />
        <span>Tasques</span>
      </Link>

      {/* Right two items */}
      {sideItems.slice(2).map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn('mobile-nav-item', active && 'mobile-nav-item--active')}
          >
            <item.icon size={20} strokeWidth={active ? 2.2 : 1.6} />
            <span>{item.label}</span>
          </Link>
        )
      })}

      <style jsx>{`
        .mobile-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(20px) saturate(1.8);
          -webkit-backdrop-filter: blur(20px) saturate(1.8);
          border-top: 1px solid rgba(0,0,0,0.08);
          display: flex;
          align-items: center;
          z-index: 100;
          padding-bottom: env(safe-area-inset-bottom, 0px);
          height: calc(60px + env(safe-area-inset-bottom, 0px));
          box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
        }

        :global(.mobile-nav-item) {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          color: #B0B8C8;
          text-decoration: none;
          font-size: 10px;
          font-weight: 600;
          transition: color 0.15s;
          min-height: 52px;
          letter-spacing: 0.01em;
        }

        :global(.mobile-nav-item--active) {
          color: #1B2B4B;
        }

        :global(.mobile-nav-center) {
          flex: 0 0 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          text-decoration: none;
          font-size: 10px;
          font-weight: 700;
          margin: 0 2px;
          margin-bottom: 6px;
          width: 60px;
          height: 54px;
          border-radius: 18px;
          background: linear-gradient(145deg, #1B2B4B 0%, #2D4F8A 100%);
          color: white;
          box-shadow: 0 6px 18px rgba(27,43,75,0.4), 0 2px 6px rgba(27,43,75,0.2);
          transition: transform 0.15s, box-shadow 0.15s;
          letter-spacing: 0.01em;
        }

        :global(.mobile-nav-center--active) {
          background: linear-gradient(145deg, #162238 0%, #254067 100%);
          box-shadow: 0 6px 22px rgba(27,43,75,0.55);
        }

        :global(.mobile-nav-center:active) {
          transform: scale(0.95);
        }
      `}</style>
    </nav>
  )
}
