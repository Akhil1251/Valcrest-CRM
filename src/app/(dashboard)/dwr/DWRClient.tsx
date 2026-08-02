'use client'

import { useEffect, useState } from 'react'
import { FileText, Plus, X, Send, Filter, CheckCircle2, XCircle, Clock, ChevronDown, ChevronRight, User } from 'lucide-react'
import { submitDWR, updateDWRFeedback, markDWRsAsRead } from './actions'

type DWR = {
  id: string
  user_id: string
  date: string
  content: string
  status: string
  feedback?: string
  created_at: string
  is_read?: boolean
  profiles?: {
    email: string
  }
}
type User = {
  id: string
  email: string
}

type DWRClientProps = {
  reports: DWR[]
  isAdmin: boolean
  users: User[]
  currentUserId?: string
}

export default function DWRClient({ reports, isAdmin, users, currentUserId }: DWRClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  // Filtering
  const [filterUserId, setFilterUserId] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all') // 'all', 'today', 'yesterday', 'custom'
  const [customDate, setCustomDate] = useState<string>('')
  
  // Feedback Modal
  const [feedbackDWR, setFeedbackDWR] = useState<DWR | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackStatus, setFeedbackStatus] = useState('Approved')
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)

  // Expand
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin) {
      markDWRsAsRead()
    }
  }, [isAdmin])

  // Parse JSON content securely
  const parseContent = (contentStr: string) => {
    try {
      return JSON.parse(contentStr)
    } catch (e) {
      // Fallback for legacy plain text data
      return { tasks_completed: contentStr, tasks_planned: '', blockers: '' }
    }
  }

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError('')
    
    const result = await submitDWR(formData)
    
    setIsSubmitting(false)
    
    if (result?.error) {
      setError(result.error)
    } else {
      setIsModalOpen(false)
      window.location.reload()
    }
  }

  async function handleFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!feedbackDWR) return

    setIsSubmittingFeedback(true)
    
    const result = await updateDWRFeedback(feedbackDWR.id, feedbackText, feedbackStatus)
    
    setIsSubmittingFeedback(false)
    
    if (!result?.error) {
      setFeedbackDWR(null)
      window.location.reload()
    }
  }

  const filteredReports = reports.filter(r => {
    // 1. User Filter
    const userMatch = filterUserId === 'all' || r.user_id === filterUserId;
    
    // 2. Date Filter
    let dateMatch = true;
    if (dateFilter !== 'all') {
      const reportDate = r.date; // assuming YYYY-MM-DD
      const today = new Date();
      
      if (dateFilter === 'today') {
        const todayStr = today.toISOString().split('T')[0];
        dateMatch = reportDate === todayStr;
      } else if (dateFilter === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        dateMatch = reportDate === yesterdayStr;
      } else if (dateFilter === 'custom' && customDate) {
        dateMatch = reportDate === customDate;
      }
    }
    
    return userMatch && dateMatch;
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Daily Work Report
          </h1>
          <p className="text-slate-500 mt-1">Submit your daily progress and view past reports.</p>
        </div>
        
        <div className="flex flex-row w-full xl:w-auto items-center gap-2">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            Submit DWR
          </button>

          {/* Admin User Filter - Compact Icon with hidden select */}
          {isAdmin && (
            <div className="relative flex items-center justify-center w-10 h-10 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm shrink-0 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
              <User className="w-4 h-4 text-slate-500" />
              <select 
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                title="Filter by User"
              >
                <option value="all">All Users</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.email}</option>
                ))}
              </select>
              {filterUserId !== 'all' && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm" />
              )}
            </div>
          )}

          {/* Date Filter - Compact Icon with hidden select */}
          <div className="relative flex items-center justify-center w-10 h-10 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm shrink-0 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
            <Clock className="w-4 h-4 text-slate-500" />
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              title="Filter by Date"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="custom">Custom Date...</option>
            </select>
            {dateFilter !== 'all' && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm" />
            )}
          </div>
        </div>
      </div>
      
      {/* Custom Date Input (shows underneath if custom selected) */}
      {dateFilter === 'custom' && (
        <div className="flex justify-end">
          <input 
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="w-full sm:w-auto bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
          />
        </div>
      )}

      {filteredReports.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden min-h-[400px] flex items-center justify-center">
          <div className="text-center p-6 max-w-sm">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No reports found</h3>
            <p className="text-slate-500 text-sm mt-2">
              There are no Daily Work Reports matching this filter.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredReports.map(report => {
            const parsed = parseContent(report.content)
            const isExpanded = expandedId === report.id
            const isNew = isAdmin 
              ? report.status === 'Pending' 
              : (report.status !== 'Pending' && report.is_read === false);
            
            return (
              <div key={report.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden transition-all relative">
                {isNew && (
                  <>
                    <div className="absolute top-0 right-0 w-full h-full pointer-events-none rounded-xl border-2 border-red-500/20" />
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-bl-lg z-10 shadow-sm shadow-red-500/20 animate-pulse">
                      NEW
                    </div>
                  </>
                )}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                      ${report.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                        report.status === 'Rejected' ? 'bg-red-100 text-red-600' : 
                        'bg-amber-100 text-amber-600'}`}
                    >
                      {report.status === 'Approved' && <CheckCircle2 className="w-5 h-5" />}
                      {report.status === 'Rejected' && <XCircle className="w-5 h-5" />}
                      {report.status === 'Pending' && <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {new Date(report.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </h3>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border
                          ${report.status === 'Approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                            report.status === 'Rejected' ? 'bg-red-50 border-red-200 text-red-700' : 
                            'bg-amber-50 border-amber-200 text-amber-700'}`}
                        >
                          {report.status}
                        </span>
                      </div>
                      
                      {isAdmin && report.profiles && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                          <User className="w-3.5 h-3.5" />
                          {report.profiles.email}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto pl-12 sm:pl-0 justify-between sm:justify-end">
                    {isAdmin && report.status === 'Pending' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setFeedbackDWR(report);
                        }}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Review
                      </button>
                    )}
                    
                    <div className="text-slate-400">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-5">
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Completed Today</h4>
                        <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {parsed.tasks_completed}
                        </div>
                      </div>
                      
                      {parsed.tasks_planned && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Planned for Tomorrow</h4>
                          <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {parsed.tasks_planned}
                          </div>
                        </div>
                      )}
                      
                      {parsed.blockers && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Blockers / Challenges</h4>
                          <div className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap leading-relaxed">
                            {parsed.blockers}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      {/* Admin Feedback Display */}
                      {report.feedback ? (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-4">
                          <h4 className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Admin Feedback
                          </h4>
                          <p className="text-sm text-indigo-900 dark:text-indigo-200 whitespace-pre-wrap">
                            {report.feedback}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex flex-col items-center justify-center text-center h-full min-h-[120px]">
                          <p className="text-sm text-slate-500">No feedback provided yet.</p>
                          {isAdmin && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setFeedbackDWR(report);
                              }}
                              className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                            >
                              + Add Feedback
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* DWR Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Submit Daily Work Report
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form action={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date *</label>
                <input 
                  type="date" 
                  name="date" 
                  required 
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tasks Completed Today *</label>
                <textarea 
                  name="tasks_completed" 
                  required 
                  rows={4}
                  placeholder="1. Followed up with 5 leads&#10;2. Closed Acme Corp deal&#10;3. Attended team meeting"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none" 
                ></textarea>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tasks Planned for Tomorrow</label>
                <textarea 
                  name="tasks_planned" 
                  rows={3}
                  placeholder="1. Prepare proposal for Wayne Ent.&#10;2. Call 10 new prospects"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none" 
                ></textarea>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Blockers / Challenges (Optional)</label>
                <textarea 
                  name="blockers" 
                  rows={2}
                  placeholder="Waiting on legal approval for contract."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none" 
                ></textarea>
              </div>
              
              {error && <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>}
              
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="px-6 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {isSubmitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Feedback Modal */}
      {isAdmin && feedbackDWR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Review DWR
              </h2>
              <button onClick={() => setFeedbackDWR(null)} className="text-slate-400 hover:text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleFeedbackSubmit} className="p-6 flex flex-col gap-5">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Report from</p>
                <p className="font-bold text-slate-900 dark:text-white">
                  {feedbackDWR.profiles?.email}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(feedbackDWR.date).toLocaleDateString()}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFeedbackStatus('Approved')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors flex items-center justify-center gap-2
                      ${feedbackStatus === 'Approved' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600'}`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackStatus('Rejected')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors flex items-center justify-center gap-2
                      ${feedbackStatus === 'Rejected' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600'}`}
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Feedback Notes (Optional)</label>
                <textarea 
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={4}
                  placeholder="Great work on closing the deal! Let's discuss the blockers in our 1:1."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none" 
                ></textarea>
              </div>
              
              <div className="flex justify-end gap-3 mt-2">
                <button 
                  type="button" 
                  onClick={() => setFeedbackDWR(null)} 
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingFeedback} 
                  className="px-6 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
                >
                  {isSubmittingFeedback ? 'Saving...' : 'Save Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
