'use client'

import { useState, useMemo } from 'react'
import { Settings2, Upload, Edit2, Calendar, Search, ArrowLeft } from 'lucide-react'
import { formatDistanceToNow, format, isSameDay } from 'date-fns'

type ActivityLog = { 
  id: string, 
  action_type: string, 
  description: string, 
  created_at: string, 
  profiles?: { full_name: string, email: string } 
}

export default function LogsClient({ initialLogs }: { initialLogs: ActivityLog[] }) {
  const [filterDate, setFilterDate] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredLogs = useMemo(() => {
    return initialLogs.filter(log => {
      let matchesDate = true
      if (filterDate) {
        const logDate = new Date(log.created_at)
        const selectedDate = new Date(filterDate)
        // Adjust for timezone differences by matching year, month, date strictly in local
        matchesDate = 
          logDate.getFullYear() === selectedDate.getFullYear() &&
          logDate.getMonth() === selectedDate.getMonth() &&
          logDate.getDate() === selectedDate.getDate()
      }

      let matchesSearch = true
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        matchesSearch = 
          log.description.toLowerCase().includes(query) ||
          (log.profiles?.full_name?.toLowerCase().includes(query) ?? false) ||
          (log.profiles?.email?.toLowerCase().includes(query) ?? false)
      }

      return matchesDate && matchesSearch
    })
  }, [initialLogs, filterDate, searchQuery])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <a href="/leads" className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Leads
          </a>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-indigo-600" />
            Activity & Bulk Logs
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Track bulk uploads and lead edits across the system.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by action or user..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input 
              type="date" 
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
            />
            {filterDate && (
              <button 
                onClick={() => setFilterDate('')}
                className="text-xs text-indigo-600 hover:underline ml-2"
              >
                Clear Date
              </button>
            )}
          </div>
        </div>

        <div className="overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No activity logs found for the selected filters.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredLogs.map(log => (
                <div key={log.id} className="p-4 flex gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors rounded-lg">
                  <div className="shrink-0 mt-1">
                    {log.action_type === 'BULK_IMPORT' ? (
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Edit2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-slate-900 dark:text-white mb-1">
                      {log.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {log.profiles?.full_name || log.profiles?.email || 'Unknown User'}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span>{format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
