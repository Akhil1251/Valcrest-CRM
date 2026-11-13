'use client'

import { useState, useMemo, useRef } from 'react'
import { 
  Megaphone, Upload, Plus, X, ArrowRight, 
  Download, Edit2, User, Loader2, CheckCircle2, Trash2, 
  Phone, MessageSquare, Save, Search, LayoutGrid, GitBranch, 
  Layers, AlertTriangle, ChevronRight, RefreshCw, FileSpreadsheet, 
  ExternalLink
} from 'lucide-react'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { useDroppable } from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import { 
  createLead, updateLeadStage, updateLeadDetails, 
  createPipeline, updatePipeline, deletePipeline,
  importLeadsBulk, deleteLeadsBulk, updateLeadsBulk,
  getLeadsForPipeline, getLeadNotes, addLeadNote
} from './actions'
import Papa from 'papaparse'
import { useRouter } from 'next/navigation'

type Profile = { id: string; email: string; full_name?: string; role: string }
type Lead = { 
  id: string
  name: string
  email?: string | null
  phone?: string | null
  source?: string | null
  pipeline_id: string
  stage_id: string
  assigned_to?: string | null
  created_at: string 
}
type Pipeline = { id: string; name: string; created_at: string }
type Stage = { id: string; pipeline_id: string; name: string; order_index: number; created_at?: string }

// --- Subcomponents ---
function LeadAssignedBadge({ assignedTo, users }: { assignedTo?: string | null; users: Profile[] }) {
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

function KanbanCard({ 
  lead, 
  users, 
  onLeadClick, 
  isSelected, 
  toggleSelect 
}: { 
  lead: Lead
  users: Profile[]
  onLeadClick: (l: Lead) => void
  isSelected: boolean
  toggleSelect: (id: string, checked: boolean) => void 
}) {
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
      onClick={() => {
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
            {new Date(lead.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </span>
        </div>
        
        <div className="mt-auto h-6">
          <LeadAssignedBadge assignedTo={lead.assigned_to} users={users} />
        </div>
      </div>
    </div>
  )
}

function KanbanColumn({ 
  stage, 
  leads, 
  users, 
  onLeadClick, 
  selectedLeadIds, 
  toggleSelect, 
  toggleSelectAll 
}: { 
  stage: Stage
  leads: Lead[]
  users: Profile[]
  onLeadClick: (l: Lead) => void
  selectedLeadIds: Set<string>
  toggleSelect: (id: string, checked: boolean) => void
  toggleSelectAll: (leads: Lead[], checked: boolean) => void 
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })
  
  const allSelected = leads.length > 0 && leads.every(l => selectedLeadIds.has(l.id))
  const someSelected = leads.length > 0 && leads.some(l => selectedLeadIds.has(l.id))

  // Progressive rendering so 8k+ leads do not lag the DOM while header shows full exact count
  const [visibleCount, setVisibleCount] = useState(60)
  const displayedLeads = leads.slice(0, visibleCount)
  const remainingCount = leads.length - displayedLeads.length

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
        {displayedLeads.map(lead => (
          <KanbanCard 
            key={lead.id} 
            lead={lead} 
            users={users} 
            onLeadClick={onLeadClick} 
            isSelected={selectedLeadIds.has(lead.id)} 
            toggleSelect={toggleSelect} 
          />
        ))}

        {remainingCount > 0 && (
          <div className="pt-2 pb-1 flex flex-col gap-1 items-center">
            <button
              type="button"
              onClick={() => setVisibleCount(prev => Math.min(leads.length, prev + 100))}
              className="w-full py-2 px-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors shadow-sm"
            >
              Load 100 more ({remainingCount} remaining)
            </button>
            {leads.length > 200 && (
              <button
                type="button"
                onClick={() => setVisibleCount(leads.length)}
                className="text-[11px] text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer py-1"
              >
                Show all {leads.length} leads
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function MobileLeadCard({ 
  lead, 
  users, 
  onMoveClick, 
  onLeadClick, 
  isSelected, 
  toggleSelect 
}: { 
  lead: Lead
  users: Profile[]
  onMoveClick: (l: Lead) => void
  onLeadClick: (l: Lead) => void
  isSelected: boolean
  toggleSelect: (id: string, checked: boolean) => void 
}) {
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
            {new Date(lead.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
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

// --- Main LeadsClient Component ---
export default function LeadsClient({ 
  initialLeads, 
  pipelines: initialPipelines, 
  stages: initialStages, 
  users, 
  isAdmin, 
  initialPipelineLeadCounts = {}
}: { 
  initialLeads: Lead[]
  pipelines: Pipeline[]
  stages: Stage[]
  users: Profile[]
  isAdmin: boolean
  currentUserId?: string
  initialPipelineLeadCounts?: Record<string, number>
}) {
  const router = useRouter()

  // Tab State: 'opportunities' | 'pipelines' | 'bulk_actions'
  const [activeTab, setActiveTab] = useState<'opportunities' | 'pipelines' | 'bulk_actions'>('opportunities')

  // Pipelines & Stages State
  const [pipelines, setPipelines] = useState<Pipeline[]>(initialPipelines)
  const [stages, setStages] = useState<Stage[]>(initialStages)
  const [activePipelineId, setActivePipelineId] = useState(initialPipelines[0]?.id || '')
  const [pipelineLeadCounts, setPipelineLeadCounts] = useState<Record<string, number>>(initialPipelineLeadCounts)

  // Leads State (Only holds leads for the active pipeline, reducing memory & load times)
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [isLoadingLeads, setIsLoadingLeads] = useState(false)

  // Filter States
  const [userFilter, setUserFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals & Action States
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false)
  const [isNewPipelineModalOpen, setIsNewPipelineModalOpen] = useState(false)
  const [isEditPipelineModalOpen, setIsEditPipelineModalOpen] = useState(false)
  const [pipelineToEdit, setPipelineToEdit] = useState<Pipeline | null>(null)
  const [editStages, setEditStages] = useState<{ id?: string; name: string }[]>([])
  
  const [isDeletePipelineModalOpen, setIsDeletePipelineModalOpen] = useState(false)
  const [pipelineToDelete, setPipelineToDelete] = useState<Pipeline | null>(null)

  // Lead Details & Notes Modal
  const [activeLeadDetails, setActiveLeadDetails] = useState<Lead | null>(null)
  const [leadNotes, setLeadNotes] = useState<Array<{ id: string; content: string; created_at: string; profiles?: { full_name?: string; email?: string } | null }>>([])
  const [isFetchingNotes, setIsFetchingNotes] = useState(false)
  const [newNoteContent, setNewNoteContent] = useState('')

  // Drag & Drop State
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const activeDragLead = useMemo(() => leads.find(l => l.id === activeDragId), [activeDragId, leads])

  // Mobile Drawer State
  const [activeMobileStageId, setActiveMobileStageId] = useState('')
  const [mobileLeadToMove, setMobileLeadToMove] = useState<Lead | null>(null)
  const [mobileVisibleCount, setMobileVisibleCount] = useState(50)

  // Selection & Bulk State
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set())
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Bulk Actions Tab State
  const [bulkActionSubTab, setBulkActionSubTab] = useState<'import' | 'delete' | 'reassign'>('import')
  const [bulkTargetPipelineId, setBulkTargetPipelineId] = useState<string>(initialPipelines[0]?.id || '')
  const [bulkFilterStageId, setBulkFilterStageId] = useState<string>('all')
  const [bulkTableSearch, setBulkTableSearch] = useState<string>('')
  const [bulkTableSelectedIds, setBulkTableSelectedIds] = useState<Set<string>>(new Set())
  const [bulkTableLeads, setBulkTableLeads] = useState<Lead[]>(initialLeads)
  const [isLoadingBulkTable, setIsLoadingBulkTable] = useState(false)
  const [bulkReassignTargetStageId, setBulkReassignTargetStageId] = useState<string>('')
  const [bulkReassignTargetUserId, setBulkReassignTargetUserId] = useState<string>('no_change')

  // CSV Import Modal
  const [bulkProgressModal, setBulkProgressModal] = useState<{
    isOpen: boolean
    status: 'uploading' | 'saving' | 'done'
    total: number
    current: number
    error?: string
    message?: string
  }>({ isOpen: false, status: 'done', total: 0, current: 0 })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const bulkTabFileInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // Active pipeline stages sorted by order_index
  const currentStages = useMemo(() => {
    return stages
      .filter(s => s.pipeline_id === activePipelineId)
      .sort((a, b) => a.order_index - b.order_index)
  }, [stages, activePipelineId])

  // Client-side filtering of active pipeline leads
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      if (l.pipeline_id !== activePipelineId) return false
      if (isAdmin && userFilter !== 'all') {
        if (userFilter === 'unassigned') {
          if (l.assigned_to) return false
        } else {
          if (l.assigned_to !== userFilter) return false
        }
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchName = l.name.toLowerCase().includes(q)
        const matchEmail = l.email?.toLowerCase().includes(q)
        const matchPhone = l.phone?.toLowerCase().includes(q)
        if (!matchName && !matchEmail && !matchPhone) return false
      }
      return true
    })
  }, [leads, activePipelineId, isAdmin, userFilter, searchQuery])

  // New lead counts for user filter badge
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

  // Derived active mobile stage
  const currentMobileStageId = activeMobileStageId && currentStages.some(s => s.id === activeMobileStageId)
    ? activeMobileStageId
    : (currentStages[0]?.id || '')

  // Helper to open Edit Pipeline Modal without useEffect cascading renders
  const openEditPipelineModal = (p: Pipeline) => {
    setPipelineToEdit(p)
    setEditStages(
      stages
        .filter(s => s.pipeline_id === p.id)
        .sort((a, b) => a.order_index - b.order_index)
        .map(s => ({ id: s.id, name: s.name }))
    )
    setIsEditPipelineModalOpen(true)
  }

  // --- Targeted Database Fetching: Switch Pipeline On-Demand ---
  const handleSwitchPipeline = async (newPipelineId: string) => {
    if (newPipelineId === activePipelineId) return
    setActivePipelineId(newPipelineId)
    setSelectedLeadIds(new Set())
    setIsLoadingLeads(true)
    
    // Request ONLY the leads for this pipeline from database (paginates to retrieve all 8k+ rows)
    const res = await getLeadsForPipeline(newPipelineId)
    if (res.leads) {
      setLeads(res.leads)
      setPipelineLeadCounts(prev => ({
        ...prev,
        [newPipelineId]: res.leads.length
      }))
    }
    setIsLoadingLeads(false)
  }

  // --- Refresh Current Pipeline Leads ---
  const handleRefreshLeads = async () => {
    if (!activePipelineId) return
    setIsLoadingLeads(true)
    const res = await getLeadsForPipeline(activePipelineId)
    if (res.leads) {
      setLeads(res.leads)
      setPipelineLeadCounts(prev => ({
        ...prev,
        [activePipelineId]: res.leads.length
      }))
    }
    setIsLoadingLeads(false)
  }

  // --- Handlers: Lead CRUD ---
  async function handleCreateLead(formData: FormData) {
    setIsSubmitting(true)
    setError('')
    
    const name = (formData.get('name') as string)?.trim()
    const email = (formData.get('email') as string)?.trim()
    
    if (!name) {
      setError('Name is required.')
      setIsSubmitting(false)
      return
    }

    // Uniqueness validation against current leads
    const isDuplicate = leads.some(l => 
      l.name.toLowerCase() === name.toLowerCase() ||
      (email && l.email && l.email.toLowerCase() === email.toLowerCase())
    )
    
    if (isDuplicate) {
      setError('A lead with this name or email already exists in this pipeline.')
      setIsSubmitting(false)
      return
    }

    formData.append('pipeline_id', activePipelineId)
    formData.append('stage_id', currentStages[0]?.id || '')

    const result = await createLead(formData)
    setIsSubmitting(false)
    
    if (result.error) {
      setError(result.error)
    } else if (result.lead) {
      // Optimistically append without page reload
      setLeads(prev => [result.lead, ...prev])
      setPipelineLeadCounts(prev => ({
        ...prev,
        [activePipelineId]: (prev[activePipelineId] || 0) + 1
      }))
      setIsNewLeadModalOpen(false)
    }
  }

  const openLeadDetails = async (lead: Lead) => {
    setActiveLeadDetails(lead)
    setIsFetchingNotes(true)
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
      email: formData.get('email') || null,
      phone: formData.get('phone') || null,
      pipeline_id: formData.get('pipeline_id'),
      stage_id: formData.get('stage_id'),
      assigned_to: formData.get('assigned_to')
    }

    const result = await updateLeadDetails(activeLeadDetails.id, updates)
    setIsSubmitting(false)
    
    if (result.error) {
      setError(result.error)
    } else if (result.lead) {
      if (result.lead.pipeline_id !== activePipelineId) {
        // Lead moved to another pipeline: remove from current view
        setLeads(prev => prev.filter(l => l.id !== activeLeadDetails.id))
        setPipelineLeadCounts(prev => ({
          ...prev,
          [activePipelineId]: Math.max(0, (prev[activePipelineId] || 1) - 1),
          [result.lead.pipeline_id]: (prev[result.lead.pipeline_id] || 0) + 1
        }))
      } else {
        setLeads(prev => prev.map(l => l.id === activeLeadDetails.id ? result.lead : l))
      }
      setActiveLeadDetails(null)
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!activeLeadDetails || !newNoteContent.trim()) return
    
    setIsSubmitting(true)
    const res = await addLeadNote(activeLeadDetails.id, newNoteContent)
    
    if (!res.error) {
      setNewNoteContent('')
      const refreshNotes = await getLeadNotes(activeLeadDetails.id)
      if (!refreshNotes.error) setLeadNotes(refreshNotes.notes)
    }
    setIsSubmitting(false)
  }

  // --- Handlers: Drag & Drop Stage Update ---
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveDragId(null)
    if (!over) return

    const leadId = active.id as string
    const newStageId = over.id as string
    const lead = leads.find(l => l.id === leadId)

    if (lead && lead.stage_id !== newStageId) {
      // Optimistic instant UI update
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

  // --- Checkbox & Selection Handlers ---
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

  // --- Handlers: Pipeline CRUD ---
  async function handleCreatePipeline(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    const formData = new FormData(e.target as HTMLFormElement)
    const name = (formData.get('name') as string)?.trim()
    const stageStr = formData.get('stages') as string
    const stageNames = stageStr.split(',').map(s => s.trim()).filter(Boolean)

    if (!name) {
      setError('Pipeline name is required')
      setIsSubmitting(false)
      return
    }

    if (stageNames.length === 0) {
      setError('Please provide at least one stage (e.g. New Lead, In Progress, Won)')
      setIsSubmitting(false)
      return
    }

    const result = await createPipeline(name, stageNames)
    setIsSubmitting(false)

    if (result.error) {
      setError(result.error)
    } else if (result.pipeline && result.stages) {
      setPipelines(prev => [...prev, result.pipeline])
      setStages(prev => [...prev, ...result.stages])
      setPipelineLeadCounts(prev => ({ ...prev, [result.pipeline.id]: 0 }))
      setIsNewPipelineModalOpen(false)
    }
  }

  async function handleEditPipeline(e: React.FormEvent) {
    e.preventDefault()
    if (!pipelineToEdit) return
    setIsSubmitting(true)
    setError('')
    const formData = new FormData(e.target as HTMLFormElement)
    const name = (formData.get('name') as string)?.trim()
    
    if (!name) {
      setError('Pipeline name cannot be empty')
      setIsSubmitting(false)
      return
    }
    if (editStages.length === 0) {
      setError('At least one stage is required')
      setIsSubmitting(false)
      return
    }
    if (editStages.some(s => !s.name.trim())) {
      setError('Stage names cannot be empty')
      setIsSubmitting(false)
      return
    }

    const res = await updatePipeline(pipelineToEdit.id, name, editStages)
    setIsSubmitting(false)

    if (res.error) {
      setError(res.error)
    } else {
      setPipelines(prev => prev.map(p => p.id === pipelineToEdit.id ? { ...p, name } : p))
      if (res.stages) {
        setStages(prev => [
          ...prev.filter(s => s.pipeline_id !== pipelineToEdit.id),
          ...res.stages
        ])
      }
      setIsEditPipelineModalOpen(false)
      setPipelineToEdit(null)
    }
  }

  async function handleDeletePipeline() {
    if (!pipelineToDelete) return
    setIsSubmitting(true)
    setError('')

    const res = await deletePipeline(pipelineToDelete.id)
    setIsSubmitting(false)

    if (res.error) {
      setError(res.error)
    } else {
      const deletedId = pipelineToDelete.id
      const remainingPipelines = pipelines.filter(p => p.id !== deletedId)
      setPipelines(remainingPipelines)
      setStages(prev => prev.filter(s => s.pipeline_id !== deletedId))
      
      // Update pipeline counts
      setPipelineLeadCounts(prev => {
        const next = { ...prev }
        delete next[deletedId]
        return next
      })

      // If active pipeline was deleted, switch to first available
      if (activePipelineId === deletedId) {
        const nextId = remainingPipelines[0]?.id || ''
        setActivePipelineId(nextId)
        if (nextId) {
          setIsLoadingLeads(true)
          const leadsRes = await getLeadsForPipeline(nextId)
          if (leadsRes.leads) setLeads(leadsRes.leads)
          setIsLoadingLeads(false)
        } else {
          setLeads([])
        }
      }

      setIsDeletePipelineModalOpen(false)
      setPipelineToDelete(null)
    }
  }

  // --- Handlers: CSV Export / Download Template ---
  const handleDownloadTemplate = (targetPipeId?: string) => {
    const pipeId = targetPipeId || activePipelineId
    const pipeStages = stages.filter(s => s.pipeline_id === pipeId).sort((a,b) => a.order_index - b.order_index)
    
    const csvContent = "Name,Email,Phone,Source,Stage,Assigned User\n" + 
                       `John Doe,john@example.com,9876543210,Website,${pipeStages[0]?.name || 'New Lead'},${users[0]?.full_name || 'Admin'}\n`
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `Leads_Template_${pipelines.find(p => p.id === pipeId)?.name || 'Pipeline'}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // --- Handlers: CSV Bulk Import ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, customPipelineId?: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    const targetPipeId = customPipelineId || activePipelineId
    const pipeStages = stages.filter(s => s.pipeline_id === targetPipeId).sort((a,b) => a.order_index - b.order_index)

    setBulkProgressModal({ isOpen: true, status: 'uploading', total: 0, current: 0 })

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as Record<string, string>[]
        const uniqueNewLeads: Array<{
          name: string
          email: string | null
          phone: string | null
          source: string
          pipeline_id: string
          stage_id: string
          assigned_to: string | null
        }> = []
        const skippedNames: string[] = []
        
        rows.forEach(row => {
          const rowName = (row['Name'] || '').trim()
          const rowEmail = (row['Email'] || '').trim()
          const rowPhone = (row['Phone'] || '').trim()
          
          if (!rowName) return
          
          // Check duplicates against currently loaded leads
          const existsInSystem = leads.some(l => 
            l.name.toLowerCase() === rowName.toLowerCase() || 
            (rowEmail && l.email && l.email.toLowerCase() === rowEmail.toLowerCase()) ||
            (rowPhone && l.phone === rowPhone)
          )
          
          const existsInBatch = uniqueNewLeads.some(l => 
            l.name.toLowerCase() === rowName.toLowerCase() ||
            (rowEmail && l.email && l.email.toLowerCase() === rowEmail.toLowerCase()) ||
            (rowPhone && l.phone === rowPhone)
          )
          
          if (existsInSystem || existsInBatch) {
            skippedNames.push(rowName)
            return
          }
          
          // Match stage
          const targetStageName = row['Stage']?.trim().toLowerCase()
          const matchedStage = pipeStages.find(s => s.name.toLowerCase() === targetStageName)
          const stage_id = matchedStage?.id || pipeStages[0]?.id || ''

          // Match assigned user
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
            phone: rowPhone || null,
            source: row['Source'] || 'CSV Import',
            pipeline_id: targetPipeId,
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
            let infoMsg = undefined
            if (skippedNames.length > 0) {
              infoMsg = `Imported ${uniqueNewLeads.length} leads. Skipped ${skippedNames.length} duplicates.`
            }
            setBulkProgressModal(prev => ({ ...prev, status: 'done', current: uniqueNewLeads.length, message: infoMsg }))
            
            // If imported into currently active pipeline, refresh leads
            if (targetPipeId === activePipelineId) {
              handleRefreshLeads()
            }
            // Update pipeline counts
            setPipelineLeadCounts(prev => ({
              ...prev,
              [targetPipeId]: (prev[targetPipeId] || 0) + uniqueNewLeads.length
            }))
          }
        } else if (skippedNames.length > 0) {
          setBulkProgressModal({ isOpen: true, status: 'done', total: 0, current: 0, error: `All ${skippedNames.length} leads were skipped because they already exist.` })
        } else {
          setBulkProgressModal({ isOpen: true, status: 'done', total: 0, current: 0, error: 'No valid rows found in CSV file.' })
        }
      },
      error: (err) => {
        setBulkProgressModal({ isOpen: true, status: 'done', total: 0, current: 0, error: err.message })
      }
    })
    
    if (e.target) e.target.value = ''
  }

  // --- Bulk Action Tab: Fetch Leads for Bulk Table on Filter Change ---
  const [bulkTableVisibleCount, setBulkTableVisibleCount] = useState(100)

  // Bulk Table Selection Handlers
  const toggleBulkTableSelect = (id: string, checked: boolean) => {
    setBulkTableSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const toggleBulkTableSelectAll = (checked: boolean) => {
    if (checked) {
      setBulkTableSelectedIds(new Set(bulkTableLeads.map(l => l.id)))
    } else {
      setBulkTableSelectedIds(new Set())
    }
  }

  // Bulk Delete Execution
  const handleExecuteBulkDelete = async (idsToDelete: string[]) => {
    if (idsToDelete.length === 0) return
    setIsSubmitting(true)
    const res = await deleteLeadsBulk(idsToDelete)
    setIsSubmitting(false)

    if (!res.error) {
      // Remove deleted leads from local boards & tables
      setLeads(prev => prev.filter(l => !idsToDelete.includes(l.id)))
      setBulkTableLeads(prev => prev.filter(l => !idsToDelete.includes(l.id)))
      
      // Update pipeline counts
      setPipelineLeadCounts(prev => {
        const next = { ...prev }
        const currentCount = next[activePipelineId] || 0
        next[activePipelineId] = Math.max(0, currentCount - idsToDelete.length)
        return next
      })

      setSelectedLeadIds(new Set())
      setBulkTableSelectedIds(new Set())
      setIsDeleteModalOpen(false)
    }
  }

  // Bulk Reassign Execution
  const handleExecuteBulkReassign = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetIds = Array.from(bulkTableSelectedIds.size > 0 ? bulkTableSelectedIds : selectedLeadIds)
    if (targetIds.length === 0) return

    setIsSubmitting(true)
    const updates: { stage_id?: string; assigned_to?: string | null } = {}
    if (bulkReassignTargetStageId) updates.stage_id = bulkReassignTargetStageId
    if (bulkReassignTargetUserId !== 'no_change') {
      updates.assigned_to = bulkReassignTargetUserId === '' ? null : bulkReassignTargetUserId
    }

    if (Object.keys(updates).length > 0) {
      const res = await updateLeadsBulk(targetIds, updates)
      if (!res.error) {
        // Update in active leads
        setLeads(prev => prev.map(l => targetIds.includes(l.id) ? { ...l, ...updates } : l))
        setBulkTableLeads(prev => prev.map(l => targetIds.includes(l.id) ? { ...l, ...updates } : l))
        setSelectedLeadIds(new Set())
        setBulkTableSelectedIds(new Set())
        setIsBulkEditModalOpen(false)
      }
    }
    setIsSubmitting(false)
  }

  return (
    <div className="flex flex-col gap-5 h-[calc(100vh-110px)] pb-24 md:pb-0">
      
      {/* Top Header & Tab Navigation Bar */}
      <div className="flex flex-col gap-4 flex-shrink-0 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-indigo-600" />
              Leads & Opportunity Center
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Manage pipelines, track opportunities, and perform bulk lead actions.
            </p>
          </div>

          {/* Quick Action Button */}
          {activeTab === 'opportunities' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button 
                onClick={handleRefreshLeads}
                disabled={isLoadingLeads}
                title="Refresh current pipeline data"
                className="p-2 text-slate-500 hover:text-indigo-600 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingLeads ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
              <button 
                onClick={() => setIsNewLeadModalOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" /> New Lead
              </button>
            </div>
          )}

          {activeTab === 'pipelines' && isAdmin && (
            <button 
              onClick={() => setIsNewPipelineModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Pipeline
            </button>
          )}

          {activeTab === 'bulk_actions' && isAdmin && (
            <button 
              onClick={() => router.push('/logs')}
              className="flex items-center justify-center gap-2 px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-slate-500" /> View Bulk Logs
            </button>
          )}
        </div>

        {/* 3 Main View Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 -mb-4 pt-1 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('opportunities')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'opportunities'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Opportunities & Leads
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              activeTab === 'opportunities' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {leads.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pipelines')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'pipelines'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            Pipelines Management
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              activeTab === 'pipelines' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {pipelines.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('bulk_actions')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'bulk_actions'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            Bulk Actions & Data
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Tools
            </span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OPPORTUNITIES & LEADS (KANBAN BOARD)               */}
      {/* ======================================================== */}
      {activeTab === 'opportunities' && (
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              
              {/* Pipeline Dropdown (Queries ONLY this pipeline on change, fetching all rows) */}
              <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1">
                <span className="text-xs font-semibold uppercase text-slate-400 pl-2 pr-1">Pipeline:</span>
                <select 
                  className="bg-transparent border-none text-sm font-semibold focus:ring-0 text-slate-800 dark:text-slate-200 cursor-pointer pr-6 py-1 truncate max-w-[220px]"
                  value={activePipelineId}
                  onChange={e => handleSwitchPipeline(e.target.value)}
                  disabled={isLoadingLeads}
                >
                  {pipelines.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {pipelineLeadCounts[p.id] !== undefined ? `(${pipelineLeadCounts[p.id]})` : ''}
                    </option>
                  ))}
                </select>
                {isLoadingLeads && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin mr-2" />}
              </div>

              {/* User Filter Dropdown */}
              {isAdmin && (
                <select 
                  value={userFilter}
                  onChange={e => setUserFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="all">View: All Users</option>
                  <option value="unassigned">View: Unassigned {newLeadCountsByUserId['unassigned'] ? `(${newLeadCountsByUserId['unassigned']})` : ''}</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.full_name || u.email.split('@')[0]} {newLeadCountsByUserId[u.id] ? `(${newLeadCountsByUserId[u.id]})` : ''}
                    </option>
                  ))}
                </select>
              )}

              {/* Search Field */}
              <div className="relative flex-1 min-w-[160px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search name, phone, email..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            {/* Quick shortcuts to Pipeline edit & Lead counts */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-700 dark:text-slate-300">{filteredLeads.length} leads in view</span>
              {isAdmin && (
                <button 
                  onClick={() => {
                    const p = pipelines.find(item => item.id === activePipelineId)
                    if (p) openEditPipelineModal(p)
                  }}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                  title="Configure this pipeline stages"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Kanban Board (Desktop) */}
          <div className="hidden md:flex flex-1 overflow-x-auto pb-4 h-[calc(100vh-250px)]">
            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCorners} 
              onDragStart={(e) => setActiveDragId(e.active.id as string)} 
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 h-full items-start">
                {currentStages.map(stage => (
                  <KanbanColumn 
                    key={stage.id} 
                    stage={stage} 
                    leads={filteredLeads.filter(l => l.stage_id === stage.id)} 
                    users={users} 
                    onLeadClick={openLeadDetails} 
                    selectedLeadIds={selectedLeadIds} 
                    toggleSelect={toggleSelect} 
                    toggleSelectAll={toggleSelectAll} 
                  />
                ))}
                {currentStages.length === 0 && (
                  <div className="w-full h-64 flex flex-col items-center justify-center text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 p-8">
                    <p className="font-medium text-slate-700 dark:text-slate-300">This pipeline has no stages defined.</p>
                    <button 
                      onClick={() => setActiveTab('pipelines')} 
                      className="text-indigo-600 hover:underline mt-2 text-sm font-medium cursor-pointer"
                    >
                      Go to Pipelines Management to configure stages &rarr;
                    </button>
                  </div>
                )}
              </div>
              <DragOverlay>
                {activeDragLead ? (
                  <KanbanCard 
                    lead={activeDragLead} 
                    users={users} 
                    onLeadClick={() => {}} 
                    isSelected={selectedLeadIds.has(activeDragLead.id)} 
                    toggleSelect={toggleSelect} 
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>

          {/* Mobile Kanban View */}
          <div className="md:hidden flex-1 overflow-y-auto flex flex-col items-center pb-4 w-full">
            <div className="w-full flex flex-col gap-3">
              {filteredLeads
                .filter(l => l.stage_id === currentMobileStageId)
                .slice(0, mobileVisibleCount)
                .map(lead => (
                  <MobileLeadCard 
                    key={lead.id} 
                    lead={lead} 
                    users={users} 
                    onMoveClick={setMobileLeadToMove} 
                    onLeadClick={openLeadDetails} 
                    isSelected={selectedLeadIds.has(lead.id)} 
                    toggleSelect={toggleSelect} 
                  />
                ))}

              {filteredLeads.filter(l => l.stage_id === currentMobileStageId).length > mobileVisibleCount && (
                <button
                  type="button"
                  onClick={() => setMobileVisibleCount(prev => prev + 50)}
                  className="w-full py-2.5 text-xs font-semibold text-indigo-600 bg-white dark:bg-slate-800 border border-indigo-200 rounded-lg shadow-sm"
                >
                  Load 50 more leads
                </button>
              )}

              {filteredLeads.filter(l => l.stage_id === currentMobileStageId).length === 0 && (
                <div className="text-center py-10 text-slate-500 text-sm">No leads in this stage.</div>
              )}
            </div>
          </div>

          {/* Mobile Stage Selector Switcher */}
          <div className="md:hidden fixed bottom-16 left-0 right-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-3 z-30 shadow-lg">
            <div className="flex overflow-x-auto gap-2 snap-x" style={{ scrollbarWidth: 'none' }}>
              {currentStages.map(stage => (
                <button 
                  key={stage.id} 
                  onClick={() => { setActiveMobileStageId(stage.id); setMobileVisibleCount(50); }} 
                  className={`snap-start whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                    currentMobileStageId === stage.id 
                      ? 'bg-indigo-600 text-white border-indigo-600' 
                      : 'bg-white dark:bg-slate-900 text-slate-600 border-slate-200'
                  }`}
                >
                  {stage.name} ({filteredLeads.filter(l => l.stage_id === stage.id).length})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PIPELINES MANAGEMENT (CREATE, EDIT, DELETE)        */}
      {/* ======================================================== */}
      {activeTab === 'pipelines' && (
        <div className="flex-1 overflow-y-auto flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-indigo-600" />
                Sales Pipelines & Stages
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Customize your deal workflows, reorder stages, edit names, or delete obsolete pipelines.
              </p>
            </div>
            {isAdmin && (
              <button 
                onClick={() => setIsNewPipelineModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create Pipeline
              </button>
            )}
          </div>

          {/* Pipelines Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {pipelines.map(pipeline => {
              const pipeStages = stages
                .filter(s => s.pipeline_id === pipeline.id)
                .sort((a, b) => a.order_index - b.order_index)
              const leadCount = pipelineLeadCounts[pipeline.id] || 0
              const isActive = pipeline.id === activePipelineId

              return (
                <div 
                  key={pipeline.id} 
                  className={`bg-white dark:bg-slate-900 rounded-xl border p-5 shadow-sm transition-all flex flex-col justify-between ${
                    isActive ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div>
                    {/* Header: Title & Badges */}
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white">{pipeline.name}</h3>
                          {isActive && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                              Active Board
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Created on {new Date(pipeline.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                        <span className="text-indigo-600 dark:text-indigo-400">{leadCount} Leads</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-slate-600 dark:text-slate-300">{pipeStages.length} Stages</span>
                      </div>
                    </div>

                    {/* Stage Pipeline Flow Preview */}
                    <div className="mt-4 mb-5">
                      <p className="text-xs font-semibold uppercase text-slate-400 mb-2">Stage Progression Flow:</p>
                      <div className="flex flex-wrap items-center gap-2">
                        {pipeStages.map((st, idx) => (
                          <div key={st.id} className="flex items-center gap-2">
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 font-medium">
                              {idx + 1}. {st.name}
                            </span>
                            {idx < pipeStages.length - 1 && (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      onClick={() => {
                        handleSwitchPipeline(pipeline.id)
                        setActiveTab('opportunities')
                      }}
                      className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                    >
                      <LayoutGrid className="w-4 h-4" /> Open in Board &rarr;
                    </button>

                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => openEditPipelineModal(pipeline)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit Pipeline
                        </button>

                        <button 
                          onClick={() => {
                            setPipelineToDelete(pipeline)
                            setIsDeletePipelineModalOpen(true)
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-white hover:bg-red-600 bg-red-50 dark:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: BULK ACTIONS & DATA OPERATIONS                     */}
      {/* ======================================================== */}
      {activeTab === 'bulk_actions' && (
        <div className="flex-1 overflow-y-auto flex flex-col gap-6">
          
          {/* Sub Navigation */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Bulk Actions Hub
              </h2>
              <p className="text-slate-500 text-sm">
                Perform bulk CSV imports, mass lead deletions, and multi-record reassignments.
              </p>
            </div>

            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button 
                onClick={() => setBulkActionSubTab('import')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  bulkActionSubTab === 'import' ? 'bg-white dark:bg-slate-900 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                CSV Import
              </button>
              <button 
                onClick={() => setBulkActionSubTab('delete')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  bulkActionSubTab === 'delete' ? 'bg-white dark:bg-slate-900 shadow-sm text-red-600' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Bulk Delete
              </button>
              <button 
                onClick={() => setBulkActionSubTab('reassign')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  bulkActionSubTab === 'reassign' ? 'bg-white dark:bg-slate-900 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Bulk Reassign
              </button>
            </div>
          </div>

          {/* SUB-SECTION 1: CSV IMPORT */}
          {bulkActionSubTab === 'import' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Import Setup */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-5">
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                  Import Leads from CSV
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase text-slate-500">Target Pipeline *</label>
                    <select 
                      value={bulkTargetPipelineId}
                      onChange={e => setBulkTargetPipelineId(e.target.value)}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50"
                    >
                      {pipelines.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col justify-end">
                    <button 
                      onClick={() => handleDownloadTemplate(bulkTargetPipelineId)}
                      className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-slate-500" /> Download Pipeline Template
                    </button>
                  </div>
                </div>

                {/* Drag and Drop Upload Area */}
                <div 
                  onClick={() => bulkTabFileInputRef.current?.click()}
                  className="mt-2 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-50 dark:bg-slate-950/50 hover:bg-indigo-50/20 transition-all flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      Click to choose CSV file or drag and drop
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Supports comma-separated values (.csv) with headers: Name, Email, Phone, Source, Stage, Assigned User
                    </p>
                  </div>
                  <input 
                    type="file" 
                    accept=".csv" 
                    ref={bulkTabFileInputRef} 
                    className="hidden" 
                    onChange={e => handleFileUpload(e, bulkTargetPipelineId)} 
                  />
                </div>
              </div>

              {/* Right Column: Information & Guidelines */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4 text-sm">
                <h4 className="font-bold text-slate-900 dark:text-white">CSV Guidelines</h4>
                <ul className="space-y-3 text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Name</strong> is required for every row.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Duplicates:</strong> Existing leads with the same Name, Email, or Phone are automatically identified and safely skipped.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Stage:</strong> Matches the pipeline stage name. If blank, leads are placed in the pipeline&apos;s first stage.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Assigned User:</strong> Matches team members by full name or email address.</span>
                  </li>
                </ul>

                <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button 
                    onClick={() => router.push('/logs')}
                    className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    View previous bulk import logs &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUB-SECTION 2: BULK DELETE & DATA CLEANUP */}
          {(bulkActionSubTab === 'delete' || bulkActionSubTab === 'reassign') && (
            <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              
              {/* Filter Controls for Data Table */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase text-slate-400">Pipeline:</span>
                  <select 
                    value={bulkTargetPipelineId}
                    onChange={async (e) => {
                      const newId = e.target.value
                      setBulkTargetPipelineId(newId)
                      setIsLoadingBulkTable(true)
                      const res = await getLeadsForPipeline(newId)
                      if (res.leads) setBulkTableLeads(res.leads)
                      setIsLoadingBulkTable(false)
                    }}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500/50"
                  >
                    {pipelines.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase text-slate-400">Stage:</span>
                  <select 
                    value={bulkFilterStageId}
                    onChange={e => setBulkFilterStageId(e.target.value)}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="all">All Stages</option>
                    {stages.filter(s => s.pipeline_id === bulkTargetPipelineId).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search in table..." 
                    value={bulkTableSearch}
                    onChange={e => setBulkTableSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm"
                  />
                </div>

                {/* Bulk Action Buttons */}
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-xs font-medium text-slate-500">
                    {bulkTableSelectedIds.size} selected
                  </span>

                  {bulkActionSubTab === 'delete' && (
                    <button 
                      onClick={() => setIsDeleteModalOpen(true)}
                      disabled={bulkTableSelectedIds.size === 0 || isSubmitting}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({bulkTableSelectedIds.size})
                    </button>
                  )}

                  {bulkActionSubTab === 'reassign' && (
                    <button 
                      onClick={() => setIsBulkEditModalOpen(true)}
                      disabled={bulkTableSelectedIds.size === 0 || isSubmitting}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Reassign Selected ({bulkTableSelectedIds.size})
                    </button>
                  )}
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 text-xs font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3 w-10">
                        <input 
                          type="checkbox" 
                          checked={bulkTableLeads.length > 0 && bulkTableSelectedIds.size === bulkTableLeads.length}
                          onChange={e => toggleBulkTableSelectAll(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </th>
                      <th className="p-3">Lead Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Stage</th>
                      <th className="p-3">Assigned User</th>
                      <th className="p-3">Date Added</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {isLoadingBulkTable ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                          Loading leads...
                        </td>
                      </tr>
                    ) : bulkTableLeads.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          No matching leads found for this filter.
                        </td>
                      </tr>
                    ) : (
                      bulkTableLeads.slice(0, bulkTableVisibleCount).map(lead => {
                        const isSelected = bulkTableSelectedIds.has(lead.id)
                        const stageName = stages.find(s => s.id === lead.stage_id)?.name || 'Unknown'
                        const assignedUser = users.find(u => u.id === lead.assigned_to)

                        return (
                          <tr 
                            key={lead.id} 
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                              isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                            }`}
                          >
                            <td className="p-3">
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={e => toggleBulkTableSelect(lead.id, e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                            </td>
                            <td className="p-3 font-medium text-slate-900 dark:text-white">
                              {lead.name}
                            </td>
                            <td className="p-3 text-slate-500 text-xs">
                              {lead.email || '—'}
                            </td>
                            <td className="p-3 text-slate-500 text-xs">
                              {lead.phone || '—'}
                            </td>
                            <td className="p-3">
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs px-2 py-0.5 rounded font-medium">
                                {stageName}
                              </span>
                            </td>
                            <td className="p-3 text-xs text-slate-600 dark:text-slate-400">
                              {assignedUser?.full_name || assignedUser?.email || 'Unassigned'}
                            </td>
                            <td className="p-3 text-xs text-slate-400">
                              {new Date(lead.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {bulkTableLeads.length > bulkTableVisibleCount && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setBulkTableVisibleCount(prev => prev + 100)}
                    className="px-4 py-2 text-xs font-semibold text-indigo-600 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm cursor-pointer"
                  >
                    Load 100 more ({bulkTableLeads.length - bulkTableVisibleCount} remaining of {bulkTableLeads.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* FLOATING ACTION BAR FOR SELECTED LEADS (KANBAN VIEW)      */}
      {/* ======================================================== */}
      {selectedLeadIds.size > 0 && isAdmin && activeTab === 'opportunities' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-500 text-xs flex items-center justify-center font-bold">
              {selectedLeadIds.size}
            </span>
            <span className="text-sm font-medium">selected</span>
          </div>
          
          <div className="w-px h-6 bg-slate-700"></div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setIsBulkEditModalOpen(true); }} 
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" /> Reassign / Move
            </button>
            <button 
              onClick={() => setIsDeleteModalOpen(true)} 
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white text-sm font-medium transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
          
          <button onClick={clearSelection} className="ml-2 p-1 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: UNIFIED LEAD DETAILS & NOTES                      */}
      {/* ======================================================== */}
      {activeLeadDetails && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 sm:p-6 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-500" /> {isAdmin ? 'Edit Lead Details' : 'Lead Details'}
              </h2>
              <button onClick={() => setActiveLeadDetails(null)} className="text-slate-400 hover:text-slate-500 cursor-pointer"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:border-slate-800">
              {/* Left Side: Details / Edit Form */}
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
                      <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 cursor-pointer">
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
                      <button type="submit" disabled={isSubmitting || !newNoteContent.trim()} className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 cursor-pointer">
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

      {/* ======================================================== */}
      {/* MODAL: CREATE NEW LEAD                                   */}
      {/* ======================================================== */}
      {isNewLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Lead</h2>
              <button onClick={() => setIsNewLeadModalOpen(false)} className="text-slate-400 hover:text-slate-500 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form action={handleCreateLead} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name *</label>
                <input required name="name" placeholder="John Doe" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                <input type="email" name="email" placeholder="john@example.com" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                <input type="tel" name="phone" placeholder="+91 98765 43210" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Source</label>
                <input name="source" defaultValue="Manual Entry" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50" />
              </div>
              {isAdmin && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Assign To</label>
                  <select name="assigned_to" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50">
                    <option value="">-- Unassigned --</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email.split('@')[0]}</option>)}
                  </select>
                </div>
              )}
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsNewLeadModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 cursor-pointer">
                  {isSubmitting ? 'Creating...' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE PIPELINE                                   */}
      {/* ======================================================== */}
      {isNewPipelineModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Pipeline</h2>
              <button onClick={() => setIsNewPipelineModalOpen(false)} className="text-slate-400 hover:text-slate-500 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreatePipeline} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Pipeline Name *</label>
                <input required name="name" placeholder="e.g. Inbound Consultations" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Stages (Comma separated) *</label>
                <input required name="stages" defaultValue="New Lead, Contacted, Pitched, Interested, Closed Won" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50" />
                <p className="text-xs text-slate-400">Order stages from initial contact to close separated by commas.</p>
              </div>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsNewPipelineModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 cursor-pointer">
                  {isSubmitting ? 'Creating...' : 'Create Pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT PIPELINE                                     */}
      {/* ======================================================== */}
      {isEditPipelineModalOpen && isAdmin && pipelineToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Pipeline</h2>
              <button onClick={() => { setIsEditPipelineModalOpen(false); setPipelineToEdit(null); }} className="text-slate-400 hover:text-slate-500 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEditPipeline} className="p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Pipeline Name *</label>
                <input required name="name" defaultValue={pipelineToEdit.name} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50" />
              </div>
              
              <div className="flex flex-col gap-2 mt-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Stages (Order top to bottom)</label>
                {editStages.map((stage, idx) => (
                  <div key={idx} className="flex gap-2 items-center group">
                    <input 
                      required 
                      value={stage.name}
                      onChange={(e) => {
                        const newStages = [...editStages];
                        newStages[idx].name = e.target.value;
                        setEditStages(newStages);
                      }}
                      className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500/50" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setEditStages(editStages.filter((_, i) => i !== idx))}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors cursor-pointer"
                      title="Remove stage"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => setEditStages([...editStages, { name: '' }])}
                  className="mt-2 self-start flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Stage
                </button>
              </div>
              
              {error && <p className="text-red-500 text-sm mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md">{error}</p>}
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => { setIsEditPipelineModalOpen(false); setPipelineToEdit(null); }} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 cursor-pointer">
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DELETE PIPELINE CONFIRMATION                      */}
      {/* ======================================================== */}
      {isDeletePipelineModalOpen && pipelineToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800 overflow-hidden text-center p-6 animate-in zoom-in-95">
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Pipeline?</h2>
            <p className="text-sm text-slate-500 mb-2">
              Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-slate-200">{pipelineToDelete.name}</span>?
            </p>
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-lg mb-6">
              Warning: This will permanently delete the pipeline, its stages, and any leads associated with it. This action cannot be undone.
            </p>
            {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => { setIsDeletePipelineModalOpen(false); setPipelineToDelete(null); }} 
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition-colors w-full cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeletePipeline} 
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 w-full cursor-pointer"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: BULK PROGRESS (CSV IMPORT)                        */}
      {/* ======================================================== */}
      {bulkProgressModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 md:p-8 text-center animate-in zoom-in-95">
            {bulkProgressModal.status === 'uploading' && (
              <>
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Parsing CSV...</h3>
                <p className="text-slate-500 text-sm">Validating columns and matching pipeline stages.</p>
              </>
            )}
            {bulkProgressModal.status === 'saving' && (
              <>
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Importing Leads</h3>
                <p className="text-slate-500 text-sm mb-4">Saving mapped leads to database.</p>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 mb-2">
                  <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${bulkProgressModal.total > 0 ? (bulkProgressModal.current / bulkProgressModal.total) * 100 : 50}%` }}></div>
                </div>
              </>
            )}
            {bulkProgressModal.status === 'done' && (
              <>
                {bulkProgressModal.error ? (
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-950/40 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-6 h-6 text-red-600" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {bulkProgressModal.error ? 'Import Notice' : 'Import Complete!'}
                </h3>
                <p className="text-slate-500 text-sm mb-6">
                  {bulkProgressModal.error || bulkProgressModal.message || `Successfully imported ${bulkProgressModal.current} leads.`}
                </p>
                <button 
                  onClick={() => setBulkProgressModal({ isOpen: false, status: 'done', total: 0, current: 0 })} 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors cursor-pointer"
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: BULK REASSIGN & MOVE                              */}
      {/* ======================================================== */}
      {isBulkEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Bulk Update {bulkTableSelectedIds.size || selectedLeadIds.size} Leads
              </h2>
              <button onClick={() => setIsBulkEditModalOpen(false)} className="text-slate-400 hover:text-slate-500 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleExecuteBulkReassign} className="p-6 flex flex-col gap-4">
              <p className="text-sm text-slate-500 mb-2">Select new values for the selected leads. Blank values will remain unchanged.</p>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Move to Stage</label>
                <select 
                  value={bulkReassignTargetStageId} 
                  onChange={e => setBulkReassignTargetStageId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="">-- No Change --</option>
                  {stages.filter(s => s.pipeline_id === (bulkTargetPipelineId || activePipelineId)).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Assign To Owner</label>
                <select 
                  value={bulkReassignTargetUserId} 
                  onChange={e => setBulkReassignTargetUserId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="no_change">-- No Change --</option>
                  <option value="">-- Unassigned --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email.split('@')[0]}</option>)}
                </select>
              </div>
              
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsBulkEditModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 cursor-pointer">
                  {isSubmitting ? 'Updating...' : 'Update Selected'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DELETE SELECTED LEADS CONFIRMATION                */}
      {/* ======================================================== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800 overflow-hidden text-center p-6 animate-in zoom-in-95">
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Delete {bulkTableSelectedIds.size || selectedLeadIds.size} leads?
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete these leads permanently? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition-colors w-full cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const ids = Array.from(bulkTableSelectedIds.size > 0 ? bulkTableSelectedIds : selectedLeadIds)
                  handleExecuteBulkDelete(ids)
                }} 
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 w-full cursor-pointer"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER: MOBILE MOVE LEAD STAGE                           */}
      {/* ======================================================== */}
      {mobileLeadToMove && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setMobileLeadToMove(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom-full duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Move Lead</h2>
              <button onClick={() => setMobileLeadToMove(null)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-2 pb-8">
              <p className="text-sm text-slate-500 mb-2">Move <span className="font-bold text-slate-900 dark:text-white">{mobileLeadToMove.name}</span> to stage:</p>
              {currentStages.map(stage => (
                <button 
                  key={stage.id} 
                  onClick={() => handleMobileMove(stage.id)} 
                  className={`w-full text-left flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
                    mobileLeadToMove.stage_id === stage.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="font-medium">{stage.name}</span>
                  {mobileLeadToMove.stage_id === stage.id && (
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">Current</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
