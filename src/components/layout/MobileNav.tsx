'use client'

import { NavigationLink as Link } from '@/components/ui/NavigationLink'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckSquare, Users, Megaphone, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'

const sideItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/clients', icon: Users, label: 'Clients' },
  { href: '/projects', icon: Megaphone, label: 'Campanyes' },
  { href: '/check', icon: Camera, label: 'Sessions' },
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
          height: 64px;
          background: white;
          border-top: 1px solid #ECECEC;
          display: flex;
          align-items: center;
          z-index: 100;
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }

        :global(.mobile-nav-item) {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          color: #9A9A9A;
          text-decoration: none;
          font-size: 10px;
          font-weight: 500;
          transition: color 0.15s;
          min-height: 48px;
        }

        :global(.mobile-nav-item--active) {
          color: #1B2B4B;
        }

        :global(.mobile-nav-item:hover) {
          color: #0a0a0a;
        }

        :global(.mobile-nav-center) {
          flex: 0 0 64px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          text-decoration: none;
          font-size: 10px;
          font-weight: 700;
          margin: 0 4px;
          margin-bottom: 8px;
          width: 64px;
          height: 56px;
          border-radius: 16px;
          background: #1B2B4B;
          color: white;
          box-shadow: 0 4px 12px rgba(27,43,75,0.35);
          transition: transform 0.15s, box-shadow 0.15s;
        }

        :global(.mobile-nav-center--active) {
          background: #254067;
          box-shadow: 0 4px 16px rgba(27,43,75,0.5);
        }

        :global(.mobile-nav-center:hover) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(27,43,75,0.4);
        }
      `}</style>
    </nav>
  )
}
