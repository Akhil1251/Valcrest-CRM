'use client'

import { useState, useEffect, Fragment } from 'react'
import { MessageSquare, RefreshCcw, UserPlus, FileText, ChevronDown, ChevronRight, Send, CheckCircle2, Trash2, AlertTriangle, X } from 'lucide-react'
import { updateInquiryStatus, assignInquiry, addInquiryNote, getInquiryNotes, bulkAssignInquiries, bulkDeleteInquiries } from './actions'

type Inquiry = {
  id: string
  name: string
  email: string
  phone: string
  message: string
  status: string
  created_at: string
  assigned_to: string | null
}

export default function InquiriesClient({ 
  inquiries, 
  isAdmin, 
  users, 
  currentUserId 
}: { 
  inquiries: Inquiry[], 
  isAdmin: boolean, 
  users: any[], 
  currentUserId?: string 
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, any[]>>({})
  const [newNote, setNewNote] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  async function handleRefresh() {
    window.location.reload()
  }

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
    } else {
      setExpandedId(id)
      const inquiryNotes = await getInquiryNotes(id)
      setNotes(prev => ({ ...prev, [id]: inquiryNotes }))
    }
  }

  const handleAddNote = async (e: React.FormEvent, inquiryId: string) => {
    e.preventDefault()
    if (!newNote.trim()) return
    
    await addInquiryNote(inquiryId, newNote)
    setNewNote('')
    const inquiryNotes = await getInquiryNotes(inquiryId)
    setNotes(prev => ({ ...prev, [inquiryId]: inquiryNotes }))
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(inquiries.map(i => i.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    if (e.target.checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id))
    }
  }

  const handleBulkAssign = async (userId: string | null) => {
    if (selectedIds.length === 0) return
    await bulkAssignInquiries(selectedIds, userId)
    setSelectedIds([])
  }

  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0) return
    await bulkDeleteInquiries(selectedIds)
    setSelectedIds([])
    setShowDeleteModal(false)
  }

  const statuses = [
    'Pending', 'Connected', 'Not Connected', 'Hot', 'Warm', 'Cold', 'Not Interested', 'Lost', 'Resolved'
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-600" />
            Website Inquiries
          </h1>
          <p className="text-slate-500 mt-1">Manage leads coming directly from the Valcrest website.</p>
        </div>
        <button 
          onClick={handleRefresh}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">
            {selectedIds.length} {selectedIds.length === 1 ? 'inquiry' : 'inquiries'} selected
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isAdmin && (
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 shadow-sm">
                <UserPlus className="w-4 h-4 text-slate-500" />
                <select 
                  onChange={(e) => handleBulkAssign(e.target.value || null)}
                  className="bg-transparent text-sm font-medium outline-none cursor-pointer text-slate-700 dark:text-slate-300"
                  value=""
                >
                  <option value="" disabled>Bulk Assign To...</option>
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.email}</option>
                  ))}
                </select>
              </div>
            )}
            
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 dark:border-red-900/50 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {inquiries.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden min-h-[400px] flex items-center justify-center">
          <div className="text-center p-6 max-w-sm">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No inquiries yet</h3>
            <p className="text-slate-500 text-sm mt-2">
              When potential clients contact you via the website, they will appear here for assignment.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                      checked={inquiries.length > 0 && selectedIds.length === inquiries.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4 w-10"></th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Status</th>
                  {isAdmin && <th className="px-6 py-4">Assigned To</th>}
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {inquiries.map((inquiry) => (
                  <Fragment key={inquiry.id}>
                    <tr 
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/25 transition-colors cursor-pointer ${expandedId === inquiry.id ? 'bg-slate-50 dark:bg-slate-800/25' : ''} ${selectedIds.includes(inquiry.id) ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
                      onClick={(e) => {
                        // Prevent expanding if clicking on interactive elements
                        const target = e.target as HTMLElement
                        if (target.tagName !== 'SELECT' && target.tagName !== 'INPUT') {
                          toggleExpand(inquiry.id)
                        }
                      }}
                    >
                      <td className="px-6 py-4 align-top w-10" onClick={e => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                          checked={selectedIds.includes(inquiry.id)}
                          onChange={(e) => handleSelectOne(e, inquiry.id)}
                        />
                      </td>
                      <td className="px-6 py-4 align-top w-10">
                        <div className="flex items-center gap-2 mt-0.5">
                          {inquiry.status === 'Pending' && (
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                            </span>
                          )}
                          {expandedId === inquiry.id ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white align-top">
                        {inquiry.name}
                        <div className="text-xs font-normal text-slate-500 mt-1 max-w-[200px] truncate" title={inquiry.message}>
                          {inquiry.message.substring(0, 40)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 align-top">
                        <div>{inquiry.email}</div>
                        <div className="text-xs mt-1">{inquiry.phone || 'No phone'}</div>
                      </td>
                      <td className="px-6 py-4 align-top" onClick={e => e.stopPropagation()}>
                        <select 
                          defaultValue={inquiry.status}
                          onChange={(e) => updateInquiryStatus(inquiry.id, e.target.value)}
                          className={`bg-transparent border rounded-md py-1 px-2 text-xs font-medium cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none
                            ${inquiry.status === 'Pending' ? 'border-red-200 text-red-700 bg-red-50' :
                            ['Connected', 'Hot', 'Warm'].includes(inquiry.status) ? 'border-orange-200 text-orange-700 bg-orange-50' :
                            ['Not Connected', 'Cold', 'Lost', 'Not Interested'].includes(inquiry.status) ? 'border-slate-200 text-slate-700 bg-slate-100' :
                            'border-emerald-200 text-emerald-700 bg-emerald-50'
                          }`}
                        >
                          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 align-top" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-slate-400" />
                            <select 
                              defaultValue={inquiry.assigned_to || ''}
                              onChange={(e) => assignInquiry(inquiry.id, e.target.value || null)}
                              className="bg-transparent border border-slate-200 dark:border-slate-700 rounded-md py-1 px-2 text-xs font-medium cursor-pointer"
                            >
                              <option value="">Unassigned</option>
                              {users.map(u => (
                                <option key={u.id} value={u.id}>{u.email}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 text-slate-500 align-top">
                        {new Date(inquiry.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                    </tr>
                    
                    {/* Expanded Row for Notes and Details */}
                    {expandedId === inquiry.id && (
                      <tr>
                        <td colSpan={isAdmin ? 7 : 6} className="p-0 border-b-0">
                          <div className="bg-slate-50/50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-8 shadow-inner">
                            {/* Message Details */}
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-500" /> Original Message
                              </h4>
                              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed shadow-sm">
                                {inquiry.message}
                              </div>
                            </div>

                            {/* Audit Notes */}
                            <div className="flex-1 flex flex-col h-full">
                              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-indigo-500" /> Activity & Notes
                              </h4>
                              
                              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col flex-1 overflow-hidden min-h-[200px]">
                                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 max-h-[300px]">
                                  {(!notes[inquiry.id] || notes[inquiry.id].length === 0) ? (
                                    <p className="text-xs text-slate-400 text-center my-auto">No notes added yet.</p>
                                  ) : (
                                    notes[inquiry.id].map((note, idx) => (
                                      <div key={idx} className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                          <span className="font-bold text-slate-700 dark:text-slate-300">
                                            {note.profiles?.email || 'Unknown User'}
                                            {note.profiles?.role === 'admin' && <span className="ml-1 text-indigo-500">(Admin)</span>}
                                          </span>
                                          <span>•</span>
                                          <span>{new Date(note.created_at).toLocaleString()}</span>
                                        </div>
                                        <div className="text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 p-2 rounded-md border border-slate-100 dark:border-slate-700 inline-block w-fit">
                                          {note.content}
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                                
                                {/* Add Note Input */}
                                <form onSubmit={(e) => handleAddNote(e, inquiry.id)} className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex gap-2">
                                  <input 
                                    type="text" 
                                    placeholder="Add a note..." 
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                  />
                                  <button 
                                    type="submit"
                                    disabled={!newNote.trim()}
                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md px-3 py-1.5 flex items-center justify-center transition-colors shadow-sm"
                                  >
                                    <Send className="w-4 h-4" />
                                  </button>
                                </form>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Beautiful Custom Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 mx-auto">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Delete Inquiries?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-center text-sm">
                Are you absolutely sure you want to permanently delete <strong>{selectedIds.length}</strong> selected {selectedIds.length === 1 ? 'inquiry' : 'inquiries'}? This action cannot be undone.
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmBulkDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Yes, delete {selectedIds.length === 1 ? 'it' : 'them'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
