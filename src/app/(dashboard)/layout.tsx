import Link from 'next/link'
import { ReactNode } from 'react'
import {
  Shield,
  LayoutDashboard,
  Users,
  Megaphone,
  MessageSquare,
  FileText,
  CalendarDays,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }
  const displayUser = user || { email: 'demo@valcrest.com' }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col hidden md:flex sticky top-0 h-screen">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-white">
            <Shield className="w-6 h-6 text-indigo-600" />
            Valcrest CRM
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem href="/leads" icon={Megaphone} label="Leads" />
          <NavItem href="/inquiries" icon={MessageSquare} label="Inquiries" />
          <NavItem href="/dwr" icon={FileText} label="Daily Work Report" />
          <NavItem href="/leaves" icon={CalendarDays} label="Leaves" />
          
          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Admin</p>
            <NavItem href="/users" icon={Users} label="Manage Users" />
          </div>
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 font-bold">
              {displayUser.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{displayUser.email}</p>
              <p className="text-xs text-slate-500 truncate">Employee</p>
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
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 md:hidden">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-white">
            <Shield className="w-6 h-6 text-indigo-600" />
            Valcrest
          </Link>
        </header>
        <div className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  )
}

function NavItem({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
    >
      <Icon className="w-4 h-4 text-slate-500" />
      {label}
    </Link>
  )
}
