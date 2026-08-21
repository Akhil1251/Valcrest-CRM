'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { LayoutDashboard, Megaphone, MessageSquare, FileText, CalendarDays, Users, ShoppingCart } from 'lucide-react'

type NavItemProps = {
  href: string
  icon: any
  label: string
  badge?: number
}

function NavItem({ href, icon: Icon, label, badge }: NavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
        isActive 
          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' 
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`} />
        {label}
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
          {badge}
        </span>
      )}
    </Link>
  )
}

export default function SidebarNavigation({ 
  initialUnreadInquiries, 
  initialUnreadLeaves = 0,
  initialUnreadDWRs = 0,
  isAdmin 
}: { 
  initialUnreadInquiries: number
  initialUnreadLeaves?: number
  initialUnreadDWRs?: number
  isAdmin?: boolean 
}) {
  const [unreadInquiries, setUnreadInquiries] = useState(initialUnreadInquiries)
  const [unreadPurchases, setUnreadPurchases] = useState(0)
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()

    const fetchCount = async () => {
      const { count } = await supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending')
        
      if (count !== null) setUnreadInquiries(count)

      const { count: purchaseCount } = await supabase
        .from('purchases')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Successful')
        
      if (purchaseCount !== null) setUnreadPurchases(purchaseCount)
    }

    fetchCount()
    const interval = setInterval(fetchCount, 5000)

    const channel = supabase.channel('sidebar_badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries' }, () => {
        fetchCount()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases' }, () => {
        fetchCount()
      })
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
      <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
      <NavItem href="/leads" icon={Megaphone} label="Leads" />
      <NavItem href="/inquiries" icon={MessageSquare} label="Inquiries" badge={unreadInquiries} />
      <NavItem href="/dwr" icon={FileText} label="Daily Work Report" badge={initialUnreadDWRs} />
      <NavItem href="/leaves" icon={CalendarDays} label="Leaves" badge={initialUnreadLeaves} />
      
      {isAdmin && (
        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Admin</p>
          <NavItem href="/users" icon={Users} label="Manage Users" />
          <NavItem href="/purchases" icon={ShoppingCart} label="Purchases" badge={unreadPurchases} />
        </div>
      )}
    </nav>
  )
}
