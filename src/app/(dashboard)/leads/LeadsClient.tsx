'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Megaphone, Upload, Plus, X, Settings2, ArrowRight, MoreVertical, Download, Edit2, User, Loader2, CheckCircle2, Trash2, Phone, MessageSquare, Save } from 'lucide-react'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useDroppable } from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import { createLead, updateLeadStage, updateLeadDetails, createPipeline, importLeadsBulk } from './actions'
import Papa from 'papaparse'
import { useRouter } from 'next/navigation'

type Profile = { id: string, email: string, full_name?: string, role: string }
type Lead = { id: string, name: string, email?: string, phone?: string, source?: string, pipeline_id: string, stage_id: string, assigned_to?: string, created_at: string }

// --- Subcomponents ---
function LeadAssignedBadge({ assignedTo, users }: { assignedTo?: string, users: Profile[] }) {
  if (!assignedTo) return null
  const user = users.find(u => u.id === assignedTo)
  if (!user) return null
  return (
    <div className="flex items-center gap-1.5 mt-2 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 w-fit">
      <User className="w-3 h-3 text-indigo-500" />
      <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
        {user.full_name || user.email}
      </span>
    </div>
  )
}

function KanbanCard({ lead, users, onLeadClick, isSelected, toggleSelect }: { lead: Lead, users: Profile[], onLeadClick: (l: Lead) => void, isSelected: boolean, toggleSelect: (id: string, checked: boolean) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { ...lead },
  })

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-colors relative flex gap-3 h-[124px] ${
        isDragging ? 'opacity-50 ring-2 ring-indigo-500' : ''
      }`}
      onClick={(e) => {
        if (isDragging) return
        onLeadClick(lead)
      }}
    >
      <div className="pt-0.5 shrink-0 z-10" onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={e => toggleSelect(lead.id, e.target.checked)}
          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
        />
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col h-full">
        <div className="font-medium text-slate-900 dark:text-white flex items-start justify-between gap-2 leading-tight mb-1.5">
          <span className="truncate">{lead.name}</span>
          {lead.phone && (
            <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()} className="p-1 text-slate-400 hover:text-green-500 transition-colors shrink-0 -mt-1 -mr-1">
              <Phone className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
        
        <div className="text-xs text-slate-500 truncate mb-1.5 h-4">
          {lead.email || ''}
        </div>
        
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="text-slate-400 truncate pr-2">{lead.source || 'Website'}</span>
          <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 shrink-0">
            {new Date(lead.created_at).toLocaleDateString()}
          </span>
        </div>
        
        <div className="mt-auto h-6">
          <LeadAssignedBadge assignedTo={lead.assigned_to} users={users} />
        </div>
      </div>
    </div>
  )
}

function KanbanColumn({ stage, leads, users, onLeadClick, selectedLeadIds, toggleSelect, toggleSelectAll }: { stage: any, leads: Lead[], users: Profile[], onLeadClick: (l: Lead) => void, selectedLeadIds: Set<string>, toggleSelect: (id: string, checked: boolean) => void, toggleSelectAll: (leads: Lead[], checked: boolean) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })
  
  const allSelected = leads.length > 0 && leads.every(l => selectedLeadIds.has(l.id))
  const someSelected = leads.length > 0 && leads.some(l => selectedLeadIds.has(l.id))

  return (
    <div className="flex flex-col bg-slate-50 dark:bg-slate-900/50 rounded-xl min-w-[300px] w-[300px] border border-slate-200 dark:border-slate-800 h-full flex-shrink-0">
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-100/50 dark:bg-slate-800/50 rounded-t-xl gap-2">
        <input 
          type="checkbox" 
          checked={allSelected}
          ref={input => { if (input) input.indeterminate = someSelected && !allSelected }}
          onChange={e => toggleSelectAll(leads, e.target.checked)}
          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
        />
        <h3 className="font-semibold text-slate-700 dark:text-slate-300 flex-1 truncate">{stage.name}</h3>
        <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full font-medium">
          {leads.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 p-3 flex flex-col gap-3 min-h-[150px] overflow-y-auto transition-colors ${
          isOver ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
        }`}
      >
        {leads.map(lead => (
          <KanbanCard key={lead.id} lead={lead} users={users} onLeadClick={onLeadClick} isSelected={selectedLeadIds.has(lead.id)} toggleSelect={toggleSelect} />
        ))}
      </div>
    </div>
  )
}

function MobileLeadCard({ lead, users, onMoveClick, onLeadClick, isSelected, toggleSelect }: { lead: Lead, users: Profile[], onMoveClick: (l: Lead) => void, onLeadClick: (l: Lead) => void, isSelected: boolean, toggleSelect: (id: string, checked: boolean) => void }) {
  return (
    <div 
      className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 relative cursor-pointer flex gap-3"
      onClick={() => onLeadClick(lead)}
    >
      <div className="pt-0.5 shrink-0 z-10" onClick={e => e.stopPropagation()}>
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={e => toggleSelect(lead.id, e.target.checked)}
          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
        />
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col gap-1.5 pr-8">
        <div className="font-medium text-slate-900 dark:text-white flex items-start gap-2 leading-tight">
          <span className="truncate">{lead.name}</span>
          {lead.phone && (
            <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()} className="text-slate-400 hover:text-green-500 transition-colors shrink-0">
              <Phone className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
        
        {lead.email && <div className="text-xs text-slate-500 truncate">{lead.email}</div>}
        
        <div className="flex justify-between items-center text-xs mt-1">
          <span className="text-slate-400 truncate pr-2">{lead.source || 'Website'}</span>
          <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 shrink-0">
            {new Date(lead.created_at).toLocaleDateString()}
          </span>
        </div>
        
        <div className="mt-0.5">
          <LeadAssignedBadge assignedTo={lead.assigned_to} users={users} />
        </div>
      </div>

      <button 
        onClick={(e) => { e.stopPropagation(); onMoveClick(lead); }}
        className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm z-10"
      >
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function LeadsClient({ initialLeads, pipelines, stages, users, isAdmin, currentUserId }: { initialLeads: Lead[], pipelines: any[], stages: any[], users: Profile[], isAdmin: boolean, currentUserId: string }) {
  const [leads, setLeads] = useState(initialLeads)
  const [activePipelineId, setActivePipelineId] = useState(pipelines[0]?.id || '')
  const [userFilter, setUserFilter] = useState('all')
  const router = useRouter()
  
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false)
  const [isNewPipelineModalOpen, setIsNewPipelineModalOpen] = useState(false)
  
  // Unified Lead Details/Edit Modal
  const [activeLeadDetails, setActiveLeadDetails] = useState<Lead | null>(null)
  const [leadNotes, setLeadNotes] = useState<any[]>([])
  const [isFetchingNotes, setIsFetchingNotes] = useState(false)
  const [newNoteContent, setNewNoteContent] = useState('')
  
  // Bulk Actions State
  const [bulkProgressModal, setBulkProgressModal] = useState<{isOpen: boolean, status: 'uploading'|'saving'|'done', total: number, current: number, error?: string}>({ isOpen: false, status: 'done', total: 0, current: 0 })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set())
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [bulkEditPipelineId, setBulkEditPipelineId] = useState<string>('')

  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const activeDragLead = useMemo(() => leads.find(l => l.id === activeDragId), [activeDragId, leads])
  
  const [activeMobileStageId, setActiveMobileStageId] = useState('')
  const [mobileLeadToMove, setMobileLeadToMove] = useState<Lead | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // Derived state
  const currentStages = stages.filter(s => s.pipeline_id === activePipelineId).sort((a, b) => a.order_index - b.order_index)
  
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      if (l.pipeline_id !== activePipelineId) return false
      if (isAdmin && userFilter !== 'all') {
        if (userFilter === 'unassigned') return !l.assigned_to
        return l.assigned_to === userFilter
      }
      return true
    })
  }, [leads, activePipelineId, isAdmin, userFilter])

  const newLeadCountsByUserId = useMemo(() => {
    const counts: Record<string, number> = {}
    const newStageId = currentStages[0]?.id
    if (newStageId) {
      leads.forEach(l => {
        if (l.pipeline_id === activePipelineId && l.stage_id === newStageId) {
          if (l.assigned_to) {
            counts[l.assigned_to] = (counts[l.assigned_to] || 0) + 1
          } else {
            counts['unassigned'] = (counts['unassigned'] || 0) + 1
          }
        }
      })
    }
    return counts
  }, [leads, activePipelineId, currentStages])

  useEffect(() => {
    if (currentStages.length > 0 && !currentStages.find(s => s.id === activeMobileStageId)) {
      setActiveMobileStageId(currentStages[0].id)
    }
  }, [currentStages, activeMobileStageId])

  // --- Handlers ---
  async function handleCreateLead(formData: FormData) {
    setIsSubmitting(true)
    setError('')
    
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    
    // Uniqueness validation
    const isDuplicate = leads.some(l => 
      l.name.toLowerCase() === name.trim().toLowerCase() ||
      (email && l.email?.toLowerCase() === email.trim().toLowerCase())
    )
    
    if (isDuplicate) {
      setError('A lead with this name or email already exists. Please use a unique name and email.')
      setIsSubmitting(false)
      return
    }

    formData.append('pipeline_id', activePipelineId)
    formData.append('stage_id', currentStages[0]?.id || '')

    const result = await createLead(formData)
    setIsSubmitting(false)
    
    if (result.error) {
      setError(result.error)
    } else {
      setIsNewLeadModalOpen(false)
      window.location.reload()
    }
  }

  const openLeadDetails = async (lead: Lead) => {
    setActiveLeadDetails(lead)
    setIsFetchingNotes(true)
    const { getLeadNotes } = await import('./actions')
    const res = await getLeadNotes(lead.id)
    if (!res.error) setLeadNotes(res.notes)
    setIsFetchingNotes(false)
  }

  async function handleEditLeadSubmit(formData: FormData) {
    if (!activeLeadDetails || !isAdmin) return
    setIsSubmitting(true)
    setError('')
    
    const updates = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      pipeline_id: formData.get('pipeline_id'),
      stage_id: formData.get('stage_id'),
      assigned_to: formData.get('assigned_to')
    }

    const result = await updateLeadDetails(activeLeadDetails.id, updates)
    setIsSubmitting(false)
    
    if (result.error) {
      setError(result.error)
    } else {
      setActiveLeadDetails(null)
      window.location.reload()
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!activeLeadDetails || !newNoteContent.trim()) return
    
    setIsSubmitting(true)
    const { addLeadNote, getLeadNotes } = await import('./actions')
    await addLeadNote(activeLeadDetails.id, newNoteContent)
    
    setNewNoteContent('')
    const res = await getLeadNotes(activeLeadDetails.id)
    if (!res.error) setLeadNotes(res.notes)
    setIsSubmitting(false)
  }

  async function handleCreatePipeline(formData: FormData) {
    setIsSubmitting(true)
    setError('')
    const name = formData.get('name') as string
    const stageStr = formData.get('stages') as string
    const stageNames = stageStr.split(',').map(s => s.trim()).filter(s => s)

    if (stageNames.length === 0) {
      setError('Please add at least one stage')
      setIsSubmitting(false)
      return
    }

    const result = await createPipeline(name, stageNames)
    setIsSubmitting(false)

    if (result.error) {
      setError(result.error)
    } else {
      setIsNewPipelineModalOpen(false)
      window.location.reload()
    }
  }

  async function handleDragEnd(event: any) {
    const { active, over } = event
    setActiveDragId(null)
    if (!over) return

    const leadId = active.id
    const newStageId = over.id
    const lead = leads.find(l => l.id === leadId)

    if (lead && lead.stage_id !== newStageId) {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage_id: newStageId } : l))
      await updateLeadStage(leadId, newStageId)
    }
  }

  async function handleMobileMove(newStageId: string) {
    if (!mobileLeadToMove) return
    const leadId = mobileLeadToMove.id
    if (mobileLeadToMove.stage_id !== newStageId) {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage_id: newStageId } : l))
      await updateLeadStage(leadId, newStageId)
    }
    setMobileLeadToMove(null)
  }

  // --- Checkbox & Bulk Handlers ---
  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedLeadIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const toggleSelectAll = (stageLeads: Lead[], checked: boolean) => {
    setSelectedLeadIds(prev => {
      const next = new Set(prev)
      stageLeads.forEach(l => {
        if (checked) next.add(l.id)
        else next.delete(l.id)
      })
      return next
    })
  }

  const clearSelection = () => setSelectedLeadIds(new Set())

  // --- CSV Logic ---
  const handleDownloadTemplate = () => {
    // Generate headers with valid stages for hints
    const stagesHint = currentStages.map(s => s.name).join(' | ')
    const csvContent = "Name,Email,Phone,Source,Stage,Assigned User\n" + 
                       `John Doe,john@example.com,555-1234,Website,${currentStages[0]?.name || 'New Lead'},Jane Doe\n`
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `Leads_Template_${activePipelineId}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsMobileMenuOpen(false)
    setBulkProgressModal({ isOpen: true, status: 'uploading', total: 0, current: 0 })

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[]
        const uniqueNewLeads: any[] = []
        const skippedNames: string[] = []
        
        rows.forEach(row => {
          const rowName = (row['Name'] || '').trim()
          const rowEmail = (row['Email'] || '').trim()
          
          if (!rowName) return
          
          // Check against existing system leads
          const existsInSystem = leads.some(l => 
            l.name.toLowerCase() === rowName.toLowerCase() || 
            (rowEmail && l.email?.toLowerCase() === rowEmail.toLowerCase())
          )
          
          // Check against leads already processed in this batch
          const existsInBatch = uniqueNewLeads.some(l => 
            l.name.toLowerCase() === rowName.toLowerCase() ||
            (rowEmail && l.email?.toLowerCase() === rowEmail.toLowerCase())
          )
          
          if (existsInSystem || existsInBatch) {
            skippedNames.push(rowName)
            return
          }
          
          // Find matching stage by name (case insensitive)
          const targetStageName = row['Stage']?.trim().toLowerCase()
          const matchedStage = currentStages.find(s => s.name.toLowerCase() === targetStageName)
          const stage_id = matchedStage?.id || currentStages[0]?.id

          // Find matching assigned user by full_name or email
          const assignedInput = row['Assigned User']?.trim().replace(/\s+/g, ' ').toLowerCase()
          let assigned_to = null
          if (assignedInput) {
            const matchedUser = users.find(u => 
              (u.full_name && u.full_name.trim().replace(/\s+/g, ' ').toLowerCase() === assignedInput) || 
              (u.email.trim().toLowerCase() === assignedInput) ||
              (u.email.split('@')[0].toLowerCase() === assignedInput)
            )
            if (matchedUser) {
              assigned_to = matchedUser.id
            }
          }

          uniqueNewLeads.push({
            name: rowName,
            email: rowEmail || null,
            phone: row['Phone'] || null,
            source: row['Source'] || 'CSV Import',
            pipeline_id: activePipelineId,
            stage_id: stage_id,
            assigned_to: assigned_to,
          })
        })

        if (uniqueNewLeads.length > 0) {
          setBulkProgressModal({ isOpen: true, status: 'saving', total: uniqueNewLeads.length, current: 0 })
          const res = await importLeadsBulk(uniqueNewLeads)
          if (res.error) {
            setBulkProgressModal(prev => ({ ...prev, status: 'done', error: res.error }))
          } else {
            let errorMsg = undefined
            if (skippedNames.length > 0) {
              errorMsg = `Saved ${uniqueNewLeads.length} leads. Skipped ${skippedNames.length} duplicates.`
            }
            setBulkProgressModal(prev => ({ ...prev, status: 'done', current: uniqueNewLeads.length, error: errorMsg }))
          }
        } else if (skippedNames.length > 0) {
          setBulkProgressModal(prev => ({ ...prev, status: 'done', error: `All ${skippedNames.length} leads were skipped because they already exist.` }))
        } else {
          setBulkProgressModal(prev => ({ ...prev, status: 'done', error: 'No valid rows found.' }))
        }
      },
      error: (err) => {
        setBulkProgressModal({ isOpen: true, status: 'done', total: 0, current: 0, error: err.message })
      }
    })
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const closeBulkModal = () => {
    setBulkProgressModal({ isOpen: false, status: 'done', total: 0, current: 0 })
    window.location.reload()
  }

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-120px)] pb-24 md:pb-0">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div className="w-full sm:w-auto flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-indigo-600" />
              Leads Management
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Drag and drop leads across your pipelines.</p>
          </div>
        </div>
        
        {/* Mobile Action Controls */}
        <div className="md:hidden flex flex-col gap-2 w-full min-w-0">
          <div className="flex items-center gap-2 w-full min-w-0">
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-1 flex-1 min-w-0">
              <select 
                className="bg-transparent border-none text-sm font-medium focus:ring-0 text-slate-700 dark:text-slate-300 cursor-pointer pl-2 pr-6 w-full min-w-0 truncate"
                value={activePipelineId}
                onChange={e => setActivePipelineId(e.target.value)}
              >
                {pipelines.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {isAdmin && (
                <button onClick={() => setIsNewPipelineModalOpen(true)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-500 transition-colors shrink-0">
                  <Settings2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="relative shrink-0">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="flex items-center justify-center p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 h-[42px] w-[42px]">
                <MoreVertical className="w-5 h-5" />
              </button>
              {isMobileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMobileMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    <button onClick={() => { setIsNewLeadModalOpen(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors text-left">
                      <Plus className="w-4 h-4 text-indigo-600" /> New Lead
                    </button>
                    {isAdmin && (
                      <>
                        <div className="border-t border-slate-100 dark:border-slate-800"></div>
                        <button onClick={() => { handleDownloadTemplate(); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors text-left">
                          <Download className="w-4 h-4 text-slate-500" /> Download Template
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors text-left">
                          <Upload className="w-4 h-4 text-indigo-600" /> Upload CSV
                        </button>
                        <button onClick={() => router.push('/logs')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors text-left">
                          <Settings2 className="w-4 h-4 text-slate-500" /> Activity Logs
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          {isAdmin && (
            <select 
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="all">View: All Users</option>
              <option value="unassigned">View: Unassigned {newLeadCountsByUserId['unassigned'] ? `(${newLeadCountsByUserId['unassigned']})` : ''}</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email.split('@')[0]} {newLeadCountsByUserId[u.id] ? `(${newLeadCountsByUserId[u.id]})` : ''}</option>)}
            </select>
          )}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {isAdmin && (
            <select 
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
            >
              <option value="all">View: All Users</option>
              <option value="unassigned">View: Unassigned {newLeadCountsByUserId['unassigned'] ? `(${newLeadCountsByUserId['unassigned']})` : ''}</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email.split('@')[0]} {newLeadCountsByUserId[u.id] ? `(${newLeadCountsByUserId[u.id]})` : ''}</option>)}
            </select>
          )}
          
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-1">
            <select 
              className="bg-transparent border-none text-sm font-medium focus:ring-0 text-slate-700 dark:text-slate-300 cursor-pointer pl-2 pr-8"
              value={activePipelineId}
              onChange={e => setActivePipelineId(e.target.value)}
            >
              {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {isAdmin && (
              <button onClick={() => setIsNewPipelineModalOpen(true)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-500 transition-colors">
                <Settings2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {isAdmin && (
            <>
              <button onClick={handleDownloadTemplate} className="flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 shadow-sm">
                <Download className="w-4 h-4" /> Template
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 shadow-sm">
                <Upload className="w-4 h-4 text-indigo-600" /> Upload CSV
              </button>
              <button onClick={() => router.push('/logs')} className="flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 shadow-sm">
                <Settings2 className="w-4 h-4 text-slate-500" /> Logs
              </button>
            </>
          )}

          <button onClick={() => setIsNewLeadModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> New Lead
          </button>
          
          <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
        </div>
      </div>

      {/* Kanban Boards */}
      <div className="md:hidden flex-1 overflow-y-auto flex flex-col items-center pb-4 w-full">
        <div className="w-full flex flex-col gap-3">
          {filteredLeads.filter(l => l.stage_id === activeMobileStageId).map(lead => (
            <MobileLeadCard key={lead.id} lead={lead} users={users} onMoveClick={setMobileLeadToMove} onLeadClick={openLeadDetails} isSelected={selectedLeadIds.has(lead.id)} toggleSelect={toggleSelect} />
          ))}
          {filteredLeads.filter(l => l.stage_id === activeMobileStageId).length === 0 && (
            <div className="text-center py-10 text-slate-500 text-sm">No leads in this stage.</div>
          )}
        </div>
      </div>

      <div className="md:hidden fixed bottom-16 left-0 right-0 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-3 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex overflow-x-auto gap-2 snap-x" style={{ scrollbarWidth: 'none' }}>
          {currentStages.map(stage => (
            <button key={stage.id} onClick={() => setActiveMobileStageId(stage.id)} className={`snap-start whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border ${activeMobileStageId === stage.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-900 text-slate-600 border-slate-200'}`}>
              {stage.name} ({filteredLeads.filter(l => l.stage_id === stage.id).length})
            </button>
          ))}
        </div>
      </div>

      <div className="hidden md:flex flex-1 overflow-x-auto pb-4 h-[calc(100vh-220px)]">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={(e) => setActiveDragId(e.active.id as string)} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 h-full items-start">
            {currentStages.map(stage => (
              <KanbanColumn key={stage.id} stage={stage} leads={filteredLeads.filter(l => l.stage_id === stage.id)} users={users} onLeadClick={openLeadDetails} selectedLeadIds={selectedLeadIds} toggleSelect={toggleSelect} toggleSelectAll={toggleSelectAll} />
            ))}
            {currentStages.length === 0 && (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                <p>This pipeline has no stages.</p>
                {isAdmin && <button onClick={() => setIsNewPipelineModalOpen(true)} className="text-indigo-600 hover:underline mt-2">Create a new pipeline</button>}
              </div>
            )}
          </div>
          <DragOverlay>{activeDragLead ? <KanbanCard lead={activeDragLead} users={users} onLeadClick={() => {}} isSelected={selectedLeadIds.has(activeDragLead.id)} toggleSelect={toggleSelect} /> : null}</DragOverlay>
        </DndContext>
      </div>

      {/* Unified Lead Details Modal */}
      {activeLeadDetails && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 sm:p-6 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-500" /> {isAdmin ? 'Edit Lead Details' : 'Lead Details'}
              </h2>
              <button onClick={() => setActiveLeadDetails(null)} className="text-slate-400 hover:text-slate-500"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
              
              {/* Left Side: Lead Info */}
              <div className="w-full lg:w-1/2 p-4 sm:p-6 bg-white dark:bg-slate-950">
                {isAdmin ? (
                  <form action={handleEditLeadSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                      <input required name="name" defaultValue={activeLeadDetails.name} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                        <input type="email" name="email" defaultValue={activeLeadDetails.email || ''} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                        <input type="tel" name="phone" defaultValue={activeLeadDetails.phone || ''} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 mt-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Pipeline</label>
                      <select name="pipeline_id" defaultValue={activeLeadDetails.pipeline_id} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50">
                        {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Stage</label>
                      <select name="stage_id" defaultValue={activeLeadDetails.stage_id} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50">
                        {stages.filter(s => s.pipeline_id === activeLeadDetails.pipeline_id || s.pipeline_id === activePipelineId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Assigned User</label>
                      <select name="assigned_to" defaultValue={activeLeadDetails.assigned_to || ""} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50">
                        <option value="">-- Unassigned --</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email.split('@')[0]}</option>)}
                      </select>
                    </div>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    <div className="flex justify-end mt-2">
                      <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50">
                        <Save className="w-4 h-4" /> {isSubmitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-6">
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Lead Name</h3>
                      <p className="text-lg font-medium text-slate-900 dark:text-white">{activeLeadDetails.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</h3>
                        <p className="text-sm text-slate-800 dark:text-slate-300 break-all">{activeLeadDetails.email || 'N/A'}</p>
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone</h3>
                        {activeLeadDetails.phone ? (
                          <a href={`tel:${activeLeadDetails.phone}`} className="text-sm font-medium text-indigo-600 hover:underline">{activeLeadDetails.phone}</a>
                        ) : (
                          <p className="text-sm text-slate-800 dark:text-slate-300">N/A</p>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Current Stage</h3>
                        <p className="text-sm text-slate-800 dark:text-slate-300">{stages.find(s => s.id === activeLeadDetails.stage_id)?.name || 'Unknown'}</p>
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Assigned To</h3>
                        <p className="text-sm text-slate-800 dark:text-slate-300">
                          {activeLeadDetails.assigned_to 
                            ? (users.find(u => u.id === activeLeadDetails.assigned_to)?.full_name || 'User')
                            : 'Unassigned'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side: Notes */}
              <div className="w-full lg:w-1/2 flex flex-col bg-slate-50 dark:bg-slate-900">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-500" /> Notes History
                  </h3>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-[300px]">
                  {isFetchingNotes ? (
                    <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-slate-400 animate-spin" /></div>
                  ) : leadNotes.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-sm">No notes recorded for this lead yet.</div>
                  ) : (
                    leadNotes.map(note => (
                      <div key={note.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-sm text-slate-800 dark:text-slate-200">
                            {note.profiles?.full_name || note.profiles?.email || 'Unknown User'}
                          </span>
                          <span className="text-xs text-slate-500">{new Date(note.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shrink-0">
                  <form onSubmit={handleAddNote} className="flex flex-col gap-2">
                    <textarea 
                      required 
                      value={newNoteContent}
                      onChange={e => setNewNoteContent(e.target.value)}
                      placeholder="Add a new note..." 
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50 resize-none h-20"
                    />
                    <div className="flex justify-end">
                      <button type="submit" disabled={isSubmitting || !newNoteContent.trim()} className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50">
                        {isSubmitting ? 'Saving...' : 'Add Note'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Progress Modal */}
      {bulkProgressModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 md:p-8 text-center animate-in zoom-in-95">
            {bulkProgressModal.status === 'uploading' && (
              <>
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Reading CSV...</h3>
                <p className="text-slate-500 text-sm">Please wait while we parse your file.</p>
              </>
            )}
            {bulkProgressModal.status === 'saving' && (
              <>
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Importing Leads</h3>
                <p className="text-slate-500 text-sm mb-4">Saving mapped leads to database.</p>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 mb-2">
                  <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${(bulkProgressModal.current / bulkProgressModal.total) * 100}%` }}></div>
                </div>
                <p className="text-xs font-bold text-indigo-600">{bulkProgressModal.current} / {bulkProgressModal.total}</p>
              </>
            )}
            {bulkProgressModal.status === 'done' && (
              <>
                {bulkProgressModal.error ? (
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><X className="w-6 h-6 text-red-600" /></div>
                ) : (
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-6 h-6 text-green-600" /></div>
                )}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {bulkProgressModal.error ? 'Import Failed' : 'Import Complete!'}
                </h3>
                <p className="text-slate-500 text-sm mb-6">
                  {bulkProgressModal.error || `Successfully imported ${bulkProgressModal.current} leads and assigned owners based on matching names.`}
                </p>
                <button onClick={() => router.push('/logs')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors">
                  View Bulk Action Logs
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* New Lead Modal & Pipeline Modal Code (Existing layout) */}
      {/* For brevity, retaining standard modals */}
      {isNewLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Lead</h2>
              <button onClick={() => setIsNewLeadModalOpen(false)} className="text-slate-400 hover:text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            <form action={handleCreateLead} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name *</label>
                <input required name="name" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                <input type="email" name="email" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              </div>
              {isAdmin && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Assign To</label>
                  <select name="assigned_to" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                    <option value="">-- Unassigned --</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email.split('@')[0]}</option>)}
                  </select>
                </div>
              )}
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsNewLeadModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Creating...' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isNewPipelineModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Pipeline</h2>
              <button onClick={() => setIsNewPipelineModalOpen(false)} className="text-slate-400 hover:text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            <form action={handleCreatePipeline} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Pipeline Name *</label>
                <input required name="name" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Stages (Comma separated) *</label>
                <input required name="stages" placeholder="New, Contacted, Meeting, Closed" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              </div>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsNewPipelineModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Creating...' : 'Create Pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Mobile Move Modal */}
      {mobileLeadToMove && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setMobileLeadToMove(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom-full duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Move Lead</h2>
              <button onClick={() => setMobileLeadToMove(null)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-2 pb-8">
              <p className="text-sm text-slate-500 mb-2">Move <span className="font-bold text-slate-900 dark:text-white">{mobileLeadToMove.name}</span> to stage:</p>
              {currentStages.map(stage => (
                <button key={stage.id} onClick={() => handleMobileMove(stage.id)} className={`w-full text-left flex items-center justify-between p-3 rounded-xl border transition-colors ${mobileLeadToMove.stage_id === stage.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-700'}`}>
                  <span className="font-medium">{stage.name}</span>
                  {mobileLeadToMove.stage_id === stage.id && <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">Current</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedLeadIds.size > 0 && isAdmin && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-500 text-xs flex items-center justify-center font-bold">
              {selectedLeadIds.size}
            </span>
            <span className="text-sm font-medium">selected</span>
          </div>
          
          <div className="w-px h-6 bg-slate-700"></div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => { setIsBulkEditModalOpen(true); setBulkEditPipelineId(''); }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition-colors">
              <Edit2 className="w-3.5 h-3.5" /> Edit Selection
            </button>
            <button 
              onClick={() => setIsDeleteModalOpen(true)} 
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white text-sm font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
          
          <button onClick={clearSelection} className="ml-2 p-1 text-slate-400 hover:text-white rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {isBulkEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Bulk Edit {selectedLeadIds.size} Leads</h2>
              <button onClick={() => setIsBulkEditModalOpen(false)} className="text-slate-400 hover:text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            <form 
              onSubmit={async (e) => {
                e.preventDefault()
                setIsSubmitting(true)
                const formData = new FormData(e.currentTarget)
                const pipeline_id = formData.get('pipeline_id') as string
                const stage_id = formData.get('stage_id') as string
                const assigned_to = formData.get('assigned_to') as string
                
                const updates: any = {}
                if (pipeline_id) updates.pipeline_id = pipeline_id
                
                if (stage_id) {
                  updates.stage_id = stage_id
                } else if (pipeline_id) {
                  // If pipeline changed but no stage selected, default to first stage of new pipeline
                  const firstStage = stages.filter(s => s.pipeline_id === pipeline_id).sort((a,b) => a.order_index - b.order_index)[0]
                  if (firstStage) updates.stage_id = firstStage.id
                }
                
                if (assigned_to !== undefined && assigned_to !== "no_change") {
                  updates.assigned_to = assigned_to === "" ? null : assigned_to
                }
                
                if (Object.keys(updates).length > 0) {
                  const { updateLeadsBulk } = await import('./actions')
                  await updateLeadsBulk(Array.from(selectedLeadIds), updates)
                }
                
                window.location.reload()
              }} 
              className="p-6 flex flex-col gap-4"
            >
              <p className="text-sm text-slate-500 mb-2">Leave a field blank to keep the current value for all selected leads.</p>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Move to Pipeline</label>
                <select 
                  name="pipeline_id" 
                  value={bulkEditPipelineId}
                  onChange={(e) => setBulkEditPipelineId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="">-- No Change --</option>
                  {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Move to Stage</label>
                <select name="stage_id" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                  <option value="">-- No Change --</option>
                  {stages.filter(s => bulkEditPipelineId ? s.pipeline_id === bulkEditPipelineId : s.pipeline_id === activePipelineId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Assign To Owner</label>
                <select name="assigned_to" defaultValue="no_change" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                  <option value="no_change">-- No Change --</option>
                  <option value="">-- Unassigned --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email.split('@')[0]}</option>)}
                </select>
              </div>
              
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsBulkEditModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Updating...' : 'Update Selected'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800 overflow-hidden text-center p-6 animate-in zoom-in-95">
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete {selectedLeadIds.size} leads?</h2>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete these leads permanently? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors w-full"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  setIsSubmitting(true)
                  const { deleteLeadsBulk } = await import('./actions')
                  await deleteLeadsBulk(Array.from(selectedLeadIds))
                  window.location.reload()
                }} 
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 w-full"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
