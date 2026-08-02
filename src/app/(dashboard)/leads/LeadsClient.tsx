'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Megaphone, Upload, Plus, X, Settings2, ArrowRight, MoreVertical } from 'lucide-react'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useDroppable } from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import { createLead, updateLeadStage, createPipeline } from './actions'

// --- Mobile Components ---
function MobileLeadCard({ lead, onMoveClick }: { lead: any, onMoveClick: (lead: any) => void }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex justify-between items-start mb-1">
        <div className="font-medium text-slate-900 dark:text-white">{lead.name}</div>
        <button 
          onClick={() => onMoveClick(lead)}
          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <div className="text-xs text-slate-500 mb-2 truncate">{lead.email}</div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-400">{lead.source || 'Website'}</span>
        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
          {new Date(lead.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}

// --- Drag & Drop Subcomponents ---
function KanbanCard({ lead }: { lead: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { ...lead },
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-colors ${
        isDragging ? 'opacity-50 ring-2 ring-indigo-500' : ''
      }`}
    >
      <div className="font-medium text-slate-900 dark:text-white mb-1">{lead.name}</div>
      <div className="text-xs text-slate-500 mb-2 truncate">{lead.email}</div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-400">{lead.source || 'Website'}</span>
        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
          {new Date(lead.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}

function KanbanColumn({ stage, leads }: { stage: any, leads: any[] }) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  })

  return (
    <div className="flex flex-col bg-slate-50 dark:bg-slate-900/50 rounded-xl min-w-[300px] w-[300px] border border-slate-200 dark:border-slate-800 h-full flex-shrink-0">
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-100/50 dark:bg-slate-800/50 rounded-t-xl">
        <h3 className="font-semibold text-slate-700 dark:text-slate-300">{stage.name}</h3>
        <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full font-medium">
          {leads.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 p-3 flex flex-col gap-3 min-h-[150px] transition-colors ${
          isOver ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
        }`}
      >
        {leads.map(lead => (
          <KanbanCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  )
}


export default function LeadsClient({ initialLeads, pipelines, stages }: { initialLeads: any[], pipelines: any[], stages: any[] }) {
  const [leads, setLeads] = useState(initialLeads)
  const [activePipelineId, setActivePipelineId] = useState(pipelines[0]?.id || '')
  
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false)
  const [isNewPipelineModalOpen, setIsNewPipelineModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const activeDragLead = useMemo(() => leads.find(l => l.id === activeDragId), [activeDragId, leads])
  
  const [activeMobileStageId, setActiveMobileStageId] = useState('')
  const [mobileLeadToMove, setMobileLeadToMove] = useState<any>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px drag distance before firing
      },
    })
  )

  // Derived state
  const currentStages = stages.filter(s => s.pipeline_id === activePipelineId).sort((a, b) => a.order_index - b.order_index)

  useEffect(() => {
    if (currentStages.length > 0 && !currentStages.find(s => s.id === activeMobileStageId)) {
      setActiveMobileStageId(currentStages[0].id)
    }
  }, [currentStages, activeMobileStageId])

  // Handlers
  async function handleCreateLead(formData: FormData) {
    setIsSubmitting(true)
    setError('')
    formData.append('pipeline_id', activePipelineId)
    formData.append('stage_id', currentStages[0]?.id || '')

    const result = await createLead(formData)
    setIsSubmitting(false)
    
    if (result.error) {
      setError(result.error)
    } else {
      setIsNewLeadModalOpen(false)
      window.location.reload() // Quick refresh to get new leads, or we could optimistic update
    }
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

  function handleDragStart(event: any) {
    setActiveDragId(event.active.id)
  }

  async function handleDragEnd(event: any) {
    const { active, over } = event
    setActiveDragId(null)

    if (!over) return

    const leadId = active.id
    const newStageId = over.id

    const lead = leads.find(l => l.id === leadId)
    if (lead && lead.stage_id !== newStageId) {
      // Optimistic update
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage_id: newStageId } : l))
      // Backend update
      await updateLeadStage(leadId, newStageId)
    }
  }

  async function handleMobileMove(newStageId: string) {
    if (!mobileLeadToMove) return
    const leadId = mobileLeadToMove.id
    if (mobileLeadToMove.stage_id !== newStageId) {
      // Optimistic update
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage_id: newStageId } : l))
      // Backend update
      await updateLeadStage(leadId, newStageId)
    }
    setMobileLeadToMove(null)
  }

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-120px)] pb-24 md:pb-0">
      {/* Mobile Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-indigo-600" />
            Leads Management
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Drag and drop leads across your custom pipelines.</p>
        </div>
        
        {/* Mobile Action Controls */}
        <div className="md:hidden flex items-center gap-2 w-full min-w-0">
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
            <button 
              onClick={() => setIsNewPipelineModalOpen(true)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-500 transition-colors shrink-0"
              title="Create new pipeline"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile 3-dots Menu for Actions */}
          <div className="relative shrink-0">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center justify-center p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors h-[42px] w-[42px]"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {isMobileMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMobileMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                  <button 
                    onClick={() => { setIsNewLeadModalOpen(true); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    New Lead
                  </button>
                  <div className="border-t border-slate-100 dark:border-slate-800"></div>
                  <button 
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Upload CSV
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-1">
            <select 
              className="bg-transparent border-none text-sm font-medium focus:ring-0 text-slate-700 dark:text-slate-300 cursor-pointer pl-2 pr-8"
              value={activePipelineId}
              onChange={e => setActivePipelineId(e.target.value)}
            >
              {pipelines.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button 
              onClick={() => setIsNewPipelineModalOpen(true)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-500 transition-colors"
              title="Create new pipeline"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
            <Upload className="w-4 h-4" />
            Upload CSV
          </button>
          <button 
            onClick={() => setIsNewLeadModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Lead
          </button>
        </div>
      </div>

      {/* Mobile Kanban Board (Vertical List) */}
      <div className="md:hidden flex-1 overflow-y-auto flex flex-col items-center pb-4 w-full">
        <div className="w-full flex flex-col gap-3">
          {leads.filter(l => l.stage_id === activeMobileStageId).map(lead => (
            <MobileLeadCard key={lead.id} lead={lead} onMoveClick={setMobileLeadToMove} />
          ))}
          {leads.filter(l => l.stage_id === activeMobileStageId).length === 0 && (
            <div className="text-center py-10 text-slate-500 text-sm">
              No leads in this stage.
            </div>
          )}
        </div>
      </div>

      {/* Mobile Stages Tab Bar (Fixed above main bottom navigation) */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-3 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex overflow-x-auto gap-2 snap-x" style={{ scrollbarWidth: 'none' }}>
          {currentStages.map(stage => (
            <button
              key={stage.id}
              onClick={() => setActiveMobileStageId(stage.id)}
              className={`snap-start whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                activeMobileStageId === stage.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {stage.name} ({leads.filter(l => l.stage_id === stage.id).length})
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Kanban Board */}
      <div className="hidden md:flex flex-1 overflow-x-auto pb-4">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full items-start">
            {currentStages.map(stage => (
              <KanbanColumn 
                key={stage.id} 
                stage={stage} 
                leads={leads.filter(l => l.stage_id === stage.id)} 
              />
            ))}
            
            {currentStages.length === 0 && (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                <p>This pipeline has no stages.</p>
                <button onClick={() => setIsNewPipelineModalOpen(true)} className="text-indigo-600 hover:underline mt-2">
                  Create a new pipeline with stages
                </button>
              </div>
            )}
          </div>
          <DragOverlay>
            {activeDragLead ? <KanbanCard lead={activeDragLead} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Mobile Move Lead Modal */}
      {mobileLeadToMove && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setMobileLeadToMove(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom-full duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Move Lead</h2>
              <button onClick={() => setMobileLeadToMove(null)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-2 pb-8">
              <p className="text-sm text-slate-500 mb-2">Move <span className="font-bold text-slate-900 dark:text-white">{mobileLeadToMove.name}</span> to stage:</p>
              {currentStages.map(stage => (
                <button
                  key={stage.id}
                  onClick={() => handleMobileMove(stage.id)}
                  className={`w-full text-left flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    mobileLeadToMove.stage_id === stage.id
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800/50 dark:text-indigo-400'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <span className="font-medium">{stage.name}</span>
                  {mobileLeadToMove.stage_id === stage.id && <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full dark:bg-indigo-900/50 dark:text-indigo-400">Current</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Lead Modal */}
      {isNewLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Lead</h2>
              <button onClick={() => setIsNewLeadModalOpen(false)} className="text-slate-400 hover:text-slate-500">
                <X className="w-5 h-5" />
              </button>
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
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                <input type="tel" name="phone" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Lead Source</label>
                <input name="source" placeholder="e.g. Website, Referral, Cold Call" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              </div>
              
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

      {/* New Pipeline Modal */}
      {isNewPipelineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Pipeline</h2>
              <button onClick={() => setIsNewPipelineModalOpen(false)} className="text-slate-400 hover:text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form action={handleCreatePipeline} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Pipeline Name *</label>
                <input required name="name" placeholder="e.g. B2B Sales" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Stages (Comma separated) *</label>
                <input required name="stages" placeholder="New, Contacted, Meeting, Closed" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                <p className="text-xs text-slate-500 mt-1">Example: Lead In, Discovery Call, Proposal Sent, Won</p>
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
    </div>
  )
}
