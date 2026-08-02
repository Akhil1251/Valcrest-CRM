import Link from 'next/link'
import { ReactNode } from 'react'
import {
  Shield,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SidebarNavigation from '@/components/SidebarNavigation'
import RealtimeNotifications from '@/components/RealtimeNotifications'
import MobileBottomBar from '@/components/MobileBottomBar'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }
  
  // STRICT SECURITY: Prevent users from bypassing the MFA screen by navigating directly to /dashboard
  const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (mfaError || (mfaData.nextLevel === 'aal2' && mfaData.nextLevel !== mfaData.currentLevel)) {
    redirect('/login/mfa')
  }
  
  // Fetch user profile role
  let role = 'user'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile) role = profile.role
  }
  
  const isAdmin = role === 'admin'
  const displayUser = user || { email: 'demo@valcrest.com' }

  // Fetch pending inquiries count
  const { count, error } = await supabase
    .from('inquiries')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Pending')

  const unreadInquiries = count || 0

  // Fetch unread leaves count
  let unreadLeaves = 0
  if (isAdmin) {
    // Admins see count of all Pending leaves
    const { count: leavesCount } = await supabase
      .from('leaves')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Pending')
    unreadLeaves = leavesCount || 0
  } else {
    // Users see count of their own leaves that have been updated (Approved/Rejected) but not read
    const { count: leavesCount } = await supabase
      .from('leaves')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id)
      .neq('status', 'Pending')
      .eq('is_read', false)
    unreadLeaves = leavesCount || 0
  }

  // Fetch unread DWRs count
  let unreadDWRs = 0
  if (isAdmin) {
    // Admins see count of all Pending DWRs
    const { count: dwrCount } = await supabase
      .from('daily_work_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Pending')
    unreadDWRs = dwrCount || 0
  } else {
    // Users see count of their own DWRs that have been updated but not read
    const { count: dwrCount } = await supabase
      .from('daily_work_reports')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id)
      .neq('status', 'Pending')
      .eq('is_read', false)
    unreadDWRs = dwrCount || 0
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <RealtimeNotifications />
      
      {/* Sidebar (Desktop Only) */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col hidden md:flex sticky top-0 h-screen">
        <div className="h-20 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-white py-2">
            <img src="/logo.png" alt="Valcrest Logo" className="h-16 w-auto object-contain" />
          </Link>
        </div>
        
        <SidebarNavigation 
          initialUnreadInquiries={unreadInquiries} 
          initialUnreadLeaves={unreadLeaves}
          initialUnreadDWRs={unreadDWRs}
          isAdmin={isAdmin} 
        />

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 font-bold">
              {displayUser.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{displayUser.email}</p>
              <p className="text-xs text-slate-500 truncate">{isAdmin ? 'Admin' : 'Employee'}</p>
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md transition-colors">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 md:hidden sticky top-0 z-30">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-white py-2">
            <img src="/logo.png" alt="Valcrest Logo" className="h-16 w-auto object-contain" />
          </Link>
        </header>
        
        {/* Content Area - Added pb-20 on mobile to account for the fixed bottom bar */}
        <div className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomBar 
        unreadInquiries={unreadInquiries} 
        unreadLeaves={unreadLeaves}
        unreadDWRs={unreadDWRs}
        isAdmin={isAdmin} 
        displayUser={displayUser} 
      />
    </div>
  )
}
