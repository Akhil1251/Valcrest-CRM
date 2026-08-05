import { createClient } from '@/utils/supabase/server'

import { Users, Megaphone, FileText, CalendarDays } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  let role = 'user'
  
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile) role = profile.role
  }

  const isAdmin = role === 'admin'

  // Fetch real stats
  const fetchCount = async (table: string, filters: Record<string, any> = {}) => {
    let query = supabase.from(table).select('*', { count: 'exact', head: true })
    
    for (const [key, value] of Object.entries(filters)) {
      if (value === null) {
        query = query.is(key, null)
      } else {
        query = query.eq(key, value)
      }
    }
    
    // Non-admins only see their own assigned/created items
    if (!isAdmin) {
      if (table === 'leads' || table === 'inquiries') {
        query = query.eq('assigned_to', user?.id)
      } else if (table === 'daily_work_reports' || table === 'leaves') {
        query = query.eq('user_id', user?.id)
      }
    }
    
    const { count, error } = await query
    if (error) console.error(`Error fetching count for ${table}:`, error)
    return count || 0
  }

  // Define counts fetching
  const leadsCount = await fetchCount('leads')
  const inquiriesCount = await fetchCount('inquiries', { status: 'Pending' })
  const dwrsCount = await fetchCount('daily_work_reports', { status: 'Pending' })
  const leavesCount = await fetchCount('leaves', { status: 'Pending' })

  const stats = [
    {
      title: isAdmin ? 'Total Leads' : 'My Leads',
      value: leadsCount.toString(),
      icon: Megaphone,
      description: isAdmin ? 'All leads in system' : 'Assigned to you',
    },
    {
      title: isAdmin ? 'Active Inquiries' : 'My Inquiries',
      value: inquiriesCount.toString(),
      icon: Users,
      description: 'Pending attention',
    },
    {
      title: isAdmin ? 'DWRs Pending' : 'My Pending DWRs',
      value: dwrsCount.toString(),
      icon: FileText,
      description: 'Waiting for review',
    },
    {
      title: isAdmin ? 'Leaves Approvals' : 'My Pending Leaves',
      value: leavesCount.toString(),
      icon: CalendarDays,
      description: 'Pending review',
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-slate-500 mt-2">Welcome to Valcrest CRM. Here is what is happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</h3>
              </div>
              <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md">{stat.description}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm min-h-[400px] flex items-center justify-center">
        <p className="text-slate-500 text-sm">Recent activity feed will be displayed here.</p>
      </div>
    </div>
  )
}
