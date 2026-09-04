'use client'

import { NavigationLink as Link } from '@/components/ui/NavigationLink'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckSquare, Users, Calendar, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

const mobileNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/tasks', icon: CheckSquare, label: 'Tasques' },
  { href: '/clients', icon: Users, label: 'Clients' },
  { href: '/calendar', icon: Calendar, label: 'Calendari' },
  { href: '/more', icon: MoreHorizontal, label: 'Més' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="mobile-nav">
      {mobileNav.map((item) => {
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
          align-items: stretch;
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
      `}</style>
    </nav>
  )
}
