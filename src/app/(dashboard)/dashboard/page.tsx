import { createClient } from '@/utils/supabase/server'

import { Users, Megaphone, FileText, CalendarDays } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Here we would fetch real stats from the database
  // For now we use placeholders
  const stats = [
    {
      title: 'Total Leads',
      value: '142',
      icon: Megaphone,
      description: '+12% from last month',
    },
    {
      title: 'Active Inquiries',
      value: '28',
      icon: Users,
      description: '14 need immediate attention',
    },
    {
      title: 'DWRs Pending',
      value: '5',
      icon: FileText,
      description: 'Waiting for approval',
    },
    {
      title: 'Leaves Approvals',
      value: '2',
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
