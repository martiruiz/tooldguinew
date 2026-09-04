import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { MobileSidebarWrapper } from '@/components/layout/MobileSidebarWrapper'
import { MentionNotifier } from '@/components/layout/MentionNotifier'
import { GlobalActivityPanel } from '@/components/layout/GlobalActivityPanel'
import { TeamChat } from '@/components/layout/TeamChat'
import { LanguageProvider } from '@/contexts/LanguageContext'
import type { Profile } from '@/types'
import './app-layout.css'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  console.log('[Layout] user:', user?.id ?? null, '| error:', userError?.message ?? null)
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  console.log('[Layout] profile:', profile?.id ?? null, 'is_active:', profile?.is_active ?? null, '| error:', profileError?.message ?? null)
  if (!profile || !profile.is_active) redirect('/login')

  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('is_active', true)

  return (
    <LanguageProvider>
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
        <MentionNotifier currentUserId={user.id} currentUserName={profile.full_name} />
        <GlobalActivityPanel currentUserId={user.id} profiles={allProfiles || []} />
        <TeamChat currentUserId={user.id} currentUserName={profile.full_name} profiles={allProfiles || []} />
      </div>
    </LanguageProvider>
  )
}
