'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Megaphone, 
  MessageSquare, 
  FileText, 
  CalendarDays, 
  Users, 
  MoreHorizontal,
  X,
  LogOut
} from 'lucide-react'

type MobileBottomBarProps = {
  unreadInquiries: number
  unreadLeaves?: number
  unreadDWRs?: number
  isAdmin: boolean
  displayUser: { email?: string }
}

export default function MobileBottomBar({ unreadInquiries, unreadLeaves = 0, unreadDWRs = 0, isAdmin, displayUser }: MobileBottomBarProps) {
  const pathname = usePathname()
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  const tabs = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dash' },
    { href: '/leads', icon: Megaphone, label: 'Leads' },
    { href: '/inquiries', icon: MessageSquare, label: 'Inquiries', badge: unreadInquiries },
    { href: '/dwr', icon: FileText, label: 'DWR', badge: unreadDWRs },
  ]

  return (
    <>
      {/* Fixed Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around pb-safe z-40 px-2 h-16">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          const Icon = tab.icon
          return (
            <Link 
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 relative ${
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'fill-indigo-50 dark:fill-indigo-900/30' : ''}`} />
              <span className="text-[10px] font-medium tracking-tight">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute top-1 right-2 bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full min-w-[16px] text-center shadow-sm">
                  {tab.badge}
                </span>
              )}
            </Link>
          )
        })}

        {/* More Button */}
        <button 
          onClick={() => setIsMoreOpen(true)}
          className="flex flex-col items-center justify-center w-full h-full gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 relative"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight">More</span>
          {unreadLeaves > 0 && (
            <span className="absolute top-1 right-2 bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full min-w-[16px] text-center shadow-sm">
              {unreadLeaves}
            </span>
          )}
        </button>
      </div>

      {/* More Menu Drawer */}
      {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in"
            onClick={() => setIsMoreOpen(false)}
          />
          
          {/* Drawer Content */}
          <div className="relative bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom-full duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">More Options</h2>
              <button 
                onClick={() => setIsMoreOpen(false)}
                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-1">
              <Link
                href="/leaves"
                onClick={() => setIsMoreOpen(false)}
                className="flex items-center justify-between p-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-5 h-5 text-indigo-600" />
                  <span className="font-medium">Leaves</span>
                </div>
                {unreadLeaves > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadLeaves}
                  </span>
                )}
              </Link>
              
              {isAdmin && (
                <Link
                  href="/users"
                  onClick={() => setIsMoreOpen(false)}
                  className="flex items-center gap-3 p-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                >
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span className="font-medium">Manage Users</span>
                </Link>
              )}
            </div>

            {/* Profile Section */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 pb-8">
              <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 font-bold text-lg">
                  {displayUser.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{displayUser.email}</p>
                  <p className="text-xs text-slate-500 font-medium truncate">{isAdmin ? 'Admin' : 'Employee'}</p>
                </div>
              </div>
              <form action="/auth/signout" method="post" className="px-2">
                <button className="w-full flex items-center justify-center gap-2 p-3 text-sm font-bold text-red-600 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl transition-colors border border-red-100 dark:border-red-900/30">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
