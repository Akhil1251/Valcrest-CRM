'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, IndianRupee, XCircle, Clock, RefreshCw, Search, Trash2, ArrowRightCircle, TrendingUp, AlertCircle, Wallet } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { deletePurchases, convertToLead } from './actions'

export default function PurchasesClient({ 
  initialPurchases, 
  profiles, 
  pipelines, 
  stages 
}: { 
  initialPurchases: any[],
  profiles: any[],
  pipelines: any[],
  stages: any[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // State
  const purchases = initialPurchases
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate 2-3 seconds loading as requested
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    startTransition(() => {
      router.refresh()
      setIsRefreshing(false)
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredPurchases.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredPurchases.map(p => p.id))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  // Modals state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false)
  const [assignedTo, setAssignedTo] = useState('')
  const [selectedPipeline, setSelectedPipeline] = useState(pipelines?.[0]?.id || '')
  const [selectedStage, setSelectedStage] = useState(stages?.filter((s: any) => s.pipeline_id === selectedPipeline)?.[0]?.id || '')

  const handleDelete = () => setIsDeleteModalOpen(true)

  const confirmDelete = async () => {
    setIsRefreshing(true)
    const result = await deletePurchases(selectedIds)
    if (result.error) {
      alert('Failed to delete purchases: ' + result.error)
    } else {
      setSelectedIds([])
      setIsDeleteModalOpen(false)
    }
    setIsRefreshing(false)
  }

  const handleMarkAsLead = () => setIsLeadModalOpen(true)

  const confirmLead = async () => {
    if (!selectedPipeline || !selectedStage) {
      alert("Please select a pipeline and stage.")
      return
    }
    setIsRefreshing(true)
    const result = await convertToLead(selectedIds, assignedTo, selectedPipeline, selectedStage)
    if (result.error) {
      alert('Failed to convert to lead: ' + result.error)
    } else {
      setSelectedIds([])
      setIsLeadModalOpen(false)
    }
    setIsRefreshing(false)
  }

  const filteredPurchases = purchases?.filter(purchase => {
    const matchesSearch = purchase.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          purchase.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          purchase.phone?.includes(searchQuery);
                          
    let matchesStatus = true;
    if (statusFilter !== 'all') {
       if (statusFilter === 'success') {
         matchesStatus = purchase.status === 'Successful' || purchase.status === 'success'
       } else if (statusFilter === 'pending') {
         matchesStatus = purchase.status === 'Pending'
       } else {
         matchesStatus = purchase.status !== 'Successful' && purchase.status !== 'success' && purchase.status !== 'Pending'
       }
    }
    
    let matchesDate = true;
    if (dateFilter) {
      try {
        const purchaseDate = new Date(purchase.created_at).toISOString().split('T')[0];
        matchesDate = purchaseDate === dateFilter;
      } catch (e) {
        matchesDate = false;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  }) || []

  // Calculate Metrics
  const dateFilteredPurchases = purchases?.filter(purchase => {
    if (!dateFilter) return true;
    try {
      const purchaseDate = new Date(purchase.created_at).toISOString().split('T')[0];
      return purchaseDate === dateFilter;
    } catch (e) {
      return false;
    }
  }) || [];

  const successPurchases = dateFilteredPurchases.filter(p => p.status === 'Successful' || p.status === 'success');
  const pendingOrFailedPurchases = dateFilteredPurchases.filter(p => p.status !== 'Successful' && p.status !== 'success');
  
  const totalSuccessCount = successPurchases.length;
  const totalSuccessAmount = successPurchases.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;
  const totalPendingFailedCount = pendingOrFailedPurchases.length;

  const formatAmount = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString('en-IN');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Purchases</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">View all package purchases from the website.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, email, phone..." 
              className="pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <select 
            className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          
          <input
            type="date"
            className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-500 dark:text-slate-400"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />

          <button 
            onClick={handleRefresh}
            disabled={isRefreshing || isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${(isRefreshing || isPending) ? 'animate-spin' : ''}`} />
            {isRefreshing || isPending ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Success Payments</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{totalSuccessCount}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Revenue</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
              <IndianRupee className="w-5 h-5 mr-1" />
              {formatAmount(totalSuccessAmount)}
            </h3>
          </div>
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Pending & Failed</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{totalPendingFailedCount}</h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
            {selectedIds.length} item(s) selected
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleMarkAsLead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium shadow-sm transition-colors"
            >
              <ArrowRightCircle className="w-3.5 h-3.5" /> Convert to Lead
            </button>
            <button 
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 rounded-md text-xs font-medium shadow-sm transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    checked={filteredPurchases.length > 0 && selectedIds.length === filteredPurchases.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Student Details</th>
                <th className="px-6 py-4 font-semibold">Package & Payment</th>
                <th className="px-6 py-4 font-semibold">Academic Profile</th>
                <th className="px-6 py-4 font-semibold">Parent Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredPurchases && filteredPurchases.length > 0 ? (
                filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.includes(purchase.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                    <td className="px-4 py-4 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        checked={selectedIds.includes(purchase.id)}
                        onChange={() => toggleSelect(purchase.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {new Date(purchase.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata'
                      })}
                      <div className="text-xs mt-1">{new Date(purchase.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">{purchase.customer_name}</div>
                      <div className="text-slate-500 dark:text-slate-400">{purchase.email}</div>
                      <div className="text-slate-500 dark:text-slate-400">{purchase.phone}</div>
                      {purchase.assigned_to && (
                        <div className="mt-2 text-xs font-semibold text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300 inline-block px-2 py-1 rounded-md">
                          Lead assigned to: {(() => {
                            const p = profiles?.find((p: any) => p.id === purchase.assigned_to);
                            return p ? (p.full_name || p.email) : 'Unknown';
                          })()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 mb-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium text-xs">
                          {purchase.plan_name}
                        </div>
                        {purchase.status === 'Successful' || purchase.status === 'success' ? (
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                                <CheckCircle2 className="w-3 h-3" /> SUCCESS
                            </div>
                        ) : purchase.status === 'Pending' ? (
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                                <Clock className="w-3 h-3" /> PENDING
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider">
                                <XCircle className="w-3 h-3" /> FAILED
                            </div>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center">
                        <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                        {(purchase.amount / 100).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[150px]" title={purchase.payment_id}>
                        TXN: {purchase.payment_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div><span className="text-slate-400">Score:</span> {purchase.neet_score}</div>
                        <div><span className="text-slate-400">Rank:</span> {purchase.rank}</div>
                        <div><span className="text-slate-400">Cat:</span> {purchase.category} {purchase.sub_category !== 'None' ? `(${purchase.sub_category})` : ''}</div>
                        <div className="col-span-2 mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-slate-400">Pref:</span> {purchase.college_pref} in {purchase.state_pref}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-xs">
                      <div className="font-medium">{purchase.father_name}</div>
                      <div>{purchase.father_phone}</div>
                      <div>{purchase.father_email}</div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No purchases found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Confirm Delete</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
              Are you sure you want to delete {selectedIds.length} purchase(s)? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={confirmDelete} disabled={isRefreshing} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50">Delete</button>
            </div>
          </div>
        </div>
      )}

      {isLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Convert to Lead</h3>
            
            {(() => {
              const hasAlreadyConverted = selectedIds.some(id => {
                const p = purchases.find((purchase: any) => purchase.id === id);
                return p && p.assigned_to;
              });

              return (
                <>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                    Convert {selectedIds.length} purchase(s) to leads and assign them.
                  </p>
                  
                  {hasAlreadyConverted && (
                    <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-3 rounded-lg text-sm flex items-start gap-2 border border-amber-200 dark:border-amber-800/30">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <div>One or more selected purchases are already assigned. Proceeding will reassign them.</div>
                    </div>
                  )}

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assign To</label>
                      <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">Unassigned</option>
                        {profiles?.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pipeline</label>
                      <select value={selectedPipeline} onChange={(e) => {
                        setSelectedPipeline(e.target.value)
                        setSelectedStage(stages?.filter((s: any) => s.pipeline_id === e.target.value)?.[0]?.id || '')
                      }} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        {pipelines?.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stage</label>
                      <select value={selectedStage} onChange={(e) => setSelectedStage(e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        {stages?.filter((s: any) => s.pipeline_id === selectedPipeline).map((s: any) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button onClick={() => setIsLeadModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                    <button onClick={confirmLead} disabled={isRefreshing} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50">
                      {hasAlreadyConverted ? "Reassign & Convert" : "Convert"}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  )
}
