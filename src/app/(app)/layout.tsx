import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { MobileSidebarWrapper } from '@/components/layout/MobileSidebarWrapper'
import { MentionNotifier } from '@/components/layout/MentionNotifier'
import { PresenceNotifier } from '@/components/layout/PresenceNotifier'
import { GlobalActivityPanel } from '@/components/layout/GlobalActivityPanel'
import { TeamChat } from '@/components/layout/TeamChat'
import { ChatFab } from '@/components/layout/ChatFab'
import { JarvisOrb } from '@/components/layout/JarvisOrb'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { NavigationProvider } from '@/contexts/NavigationContext'
import { PageTransition } from '@/components/layout/PageTransition'
import type { Profile } from '@/types'
import './app-layout.css'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: allProfiles }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('profiles').select('id, full_name, avatar_url').eq('is_active', true),
  ])

  if (!profile || !profile.is_active) redirect('/login')

  return (
    <LanguageProvider>
    <NavigationProvider>
      <div className="app-shell">
        {/* Desktop sidebar */}
        <div className="app-sidebar">
          <Sidebar user={profile as Profile} />
        </div>
        {/* Mobile swipe sidebar */}
        <MobileSidebarWrapper user={profile as Profile} />
        <main className="app-main">
          {children}
        </main>
        <div className="app-mobile-nav">
          <MobileNav />
        </div>
        <PageTransition />
        <MentionNotifier currentUserId={user.id} currentUserName={profile.full_name} />
        <PresenceNotifier currentUserId={user.id} currentUserName={profile.full_name} currentUserAvatar={profile.avatar_url ?? undefined} />
        <GlobalActivityPanel currentUserId={user.id} profiles={allProfiles || []} />
        <TeamChat currentUserId={user.id} currentUserName={profile.full_name} profiles={allProfiles || []} />
        <ChatFab currentUserId={user.id} profiles={allProfiles || []} />
        {profile.role === 'superadmin' && <JarvisOrb />}
      </div>
    </NavigationProvider>
    </LanguageProvider>
  )
}
