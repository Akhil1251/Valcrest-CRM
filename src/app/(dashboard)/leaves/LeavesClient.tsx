'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, Plus, X, Send, Filter, CheckCircle2, XCircle, Clock, User, ChevronRight, ChevronDown } from 'lucide-react'
import { applyForLeave, updateLeaveStatus, markLeavesAsRead } from './actions'

type Leave = {
  id: string
  user_id: string
  start_date: string
  end_date: string
  reason: string
  status: string
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

type LeavesClientProps = {
  leaves: Leave[]
  isAdmin: boolean
  users: User[]
  currentUserId?: string
}

export default function LeavesClient({ leaves, isAdmin, users, currentUserId }: LeavesClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  // Filtering
  const [filterUserId, setFilterUserId] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all') // 'all', 'upcoming', 'past'
  
  // Feedback Modal
  const [reviewLeave, setReviewLeave] = useState<Leave | null>(null)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  // Expand
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin) {
      markLeavesAsRead()
    }
  }, [isAdmin])

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError('')
    
    const result = await applyForLeave(formData)
    
    setIsSubmitting(false)
    
    if (result?.error) {
      setError(result.error)
    } else {
      setIsModalOpen(false)
      window.location.reload()
    }
  }

  async function handleReviewSubmit(status: string) {
    if (!reviewLeave) return

    setIsSubmittingReview(true)
    
    const result = await updateLeaveStatus(reviewLeave.id, status)
    
    setIsSubmittingReview(false)
    
    if (!result?.error) {
      setReviewLeave(null)
      window.location.reload()
    }
  }

  const filteredLeaves = leaves.filter(l => {
    // 1. User Filter
    const userMatch = filterUserId === 'all' || l.user_id === filterUserId;
    
    // 2. Date Filter
    let dateMatch = true;
    if (dateFilter !== 'all') {
      const today = new Date().toISOString().split('T')[0];
      if (dateFilter === 'upcoming') {
        dateMatch = l.start_date >= today;
      } else if (dateFilter === 'past') {
        dateMatch = l.start_date < today;
      }
    }
    
    return userMatch && dateMatch;
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-indigo-600" />
            Leave Management
          </h1>
          <p className="text-slate-500 mt-1">Apply for time off and check your leave request status.</p>
        </div>
        
        <div className="flex flex-row w-full xl:w-auto items-center gap-2">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            Apply for Leave
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
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
            {dateFilter !== 'all' && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm" />
            )}
          </div>
        </div>
      </div>

      {filteredLeaves.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden min-h-[400px] flex items-center justify-center">
          <div className="text-center p-6 max-w-sm">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No leave requests</h3>
            <p className="text-slate-500 text-sm mt-2">
              There are no leave requests matching this filter.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredLeaves.map(leave => {
            const isExpanded = expandedId === leave.id
            const isNew = isAdmin 
              ? leave.status === 'Pending' 
              : (leave.status !== 'Pending' && leave.is_read === false);
            
            return (
              <div key={leave.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden transition-all relative">
                {isNew && (
                  <>
                    <div className="absolute top-0 right-0 w-full h-full pointer-events-none rounded-xl border-2 border-red-500/20" />
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-bl-lg z-10 shadow-sm shadow-red-500/20 animate-pulse">
                      NEW
                    </div>
                  </>
                )}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : leave.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                      ${leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                        leave.status === 'Rejected' ? 'bg-red-100 text-red-600' : 
                        'bg-amber-100 text-amber-600'}`}
                    >
                      {leave.status === 'Approved' && <CheckCircle2 className="w-5 h-5" />}
                      {leave.status === 'Rejected' && <XCircle className="w-5 h-5" />}
                      {leave.status === 'Pending' && <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                        </h3>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border
                          ${leave.status === 'Approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                            leave.status === 'Rejected' ? 'bg-red-50 border-red-200 text-red-700' : 
                            'bg-amber-50 border-amber-200 text-amber-700'}`}
                        >
                          {leave.status}
                        </span>
                      </div>
                      
                      {isAdmin && leave.profiles && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                          <User className="w-3.5 h-3.5" />
                          {leave.profiles.email}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto pl-12 sm:pl-0 justify-between sm:justify-end">
                    {isAdmin && leave.status === 'Pending' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setReviewLeave(leave);
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
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Reason for Leave</h4>
                        <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {leave.reason}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      {/* Admin Actions Inline if they don't want to use modal */}
                      {isAdmin && leave.status === 'Pending' && (
                         <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex flex-col justify-center h-full min-h-[120px]">
                           <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 text-center">Quick Action</h4>
                           <div className="flex gap-2 justify-center">
                             <button
                               onClick={() => { setReviewLeave(leave); handleReviewSubmit('Approved'); }}
                               className="px-3 py-1.5 text-xs font-bold bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors"
                             >
                               Approve
                             </button>
                             <button
                               onClick={() => { setReviewLeave(leave); handleReviewSubmit('Rejected'); }}
                               className="px-3 py-1.5 text-xs font-bold bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                             >
                               Reject
                             </button>
                           </div>
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

      {/* Leave Application Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-600" />
                Apply for Leave
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form action={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Start Date *</label>
                  <input 
                    type="date" 
                    name="start_date" 
                    required 
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">End Date *</label>
                  <input 
                    type="date" 
                    name="end_date" 
                    required 
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Reason *</label>
                <textarea 
                  name="reason" 
                  required 
                  rows={4}
                  placeholder="I need to take time off for medical reasons..."
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
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Review Modal */}
      {isAdmin && reviewLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Review Leave Request
              </h2>
              <button onClick={() => setReviewLeave(null)} className="text-slate-400 hover:text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-5">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Request from</p>
                <p className="font-bold text-slate-900 dark:text-white">
                  {reviewLeave.profiles?.email}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(reviewLeave.start_date).toLocaleDateString()} to {new Date(reviewLeave.end_date).toLocaleDateString()}
                </p>
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Action</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleReviewSubmit('Approved')}
                    disabled={isSubmittingReview}
                    className="px-4 py-2 rounded-lg text-sm font-bold border transition-colors flex items-center justify-center gap-2 bg-emerald-50 border-emerald-500 text-emerald-700 hover:bg-emerald-100"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReviewSubmit('Rejected')}
                    disabled={isSubmittingReview}
                    className="px-4 py-2 rounded-lg text-sm font-bold border transition-colors flex items-center justify-center gap-2 bg-red-50 border-red-500 text-red-700 hover:bg-red-100"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
