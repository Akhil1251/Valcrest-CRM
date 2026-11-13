'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const getAdminClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function getPipelines() {
  const supabase = await createClient()
  
  const { data: pipelines, error: pipelinesError } = await supabase
    .from('pipelines')
    .select('*')
    .order('created_at', { ascending: true })

  if (pipelinesError) return { error: pipelinesError.message }

  const { data: stages, error: stagesError } = await supabase
    .from('pipeline_stages')
    .select('*')
    .order('order_index', { ascending: true })

  if (stagesError) return { error: stagesError.message }

  return { pipelines, stages }
}

/**
 * Fetch leads ONLY for a specific pipeline with optional user / stage / search filtering.
 * Uses range pagination to bypass Supabase's default 1000 row max limit,
 * ensuring all 8k+ leads for the pipeline are retrieved.
 */
export async function getLeadsForPipeline(
  pipelineId: string, 
  filters?: { userFilter?: string; searchQuery?: string; stageId?: string }
) {
  const supabase = await createClient()
  
  let allLeads: Array<{
    id: string
    name: string
    email?: string | null
    phone?: string | null
    source?: string | null
    pipeline_id: string
    stage_id: string
    assigned_to?: string | null
    created_at: string
  }> = []
  let from = 0
  const step = 1000

  while (true) {
    let query = supabase
      .from('leads')
      .select('id, name, email, phone, source, pipeline_id, stage_id, assigned_to, created_at')
      .eq('pipeline_id', pipelineId)
      .order('created_at', { ascending: false })
      .range(from, from + step - 1)

    if (filters?.userFilter && filters.userFilter !== 'all') {
      if (filters.userFilter === 'unassigned') {
        query = query.is('assigned_to', null)
      } else {
        query = query.eq('assigned_to', filters.userFilter)
      }
    }

    if (filters?.stageId && filters.stageId !== 'all') {
      query = query.eq('stage_id', filters.stageId)
    }

    if (filters?.searchQuery) {
      const q = filters.searchQuery.trim()
      if (q) {
        query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching leads for pipeline:', error.message)
      return { error: error.message, leads: allLeads }
    }

    if (data && data.length > 0) {
      allLeads = [...allLeads, ...data]
    }

    if (!data || data.length < step) {
      break
    }

    from += step
  }

  return { leads: allLeads }
}

/**
 * Exact lead counts per pipeline using fast HEAD queries (bypasses 1000 row max limit).
 */
export async function getPipelineLeadCounts() {
  const supabase = await createClient()
  const { data: pipelines, error: pipeError } = await supabase
    .from('pipelines')
    .select('id')
  
  if (pipeError || !pipelines) {
    console.error('Error fetching pipelines for count:', pipeError?.message)
    return { counts: {} }
  }

  const counts: Record<string, number> = {}
  await Promise.all(
    pipelines.map(async (p) => {
      const { count, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('pipeline_id', p.id)

      if (!error && count !== null) {
        counts[p.id] = count
      }
    })
  )

  return { counts }
}

export async function createLead(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const source = formData.get('source') as string
  const pipeline_id = formData.get('pipeline_id') as string
  const stage_id = formData.get('stage_id') as string
  const assigned_to = formData.get('assigned_to') as string

  if (!name || !pipeline_id || !stage_id) {
    return { error: 'Name, Pipeline, and Stage are required' }
  }

  const { data, error } = await supabase.from('leads').insert([
    {
      name,
      email: email || null,
      phone: phone || null,
      source: source || 'Direct',
      pipeline_id,
      stage_id,
      assigned_to: assigned_to || null,
    }
  ]).select().single()

  if (error) {
    console.error('Create Lead Error:', error.message)
    return { error: error.message }
  }

  revalidatePath('/leads')
  return { success: true, lead: data }
}

export async function updateLeadStage(leadId: string, stageId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('leads')
    .update({ stage_id: stageId })
    .eq('id', leadId)

  if (error) {
    console.error('Update Lead Stage Error:', error.message)
    return { error: error.message }
  }

  revalidatePath('/leads')
  return { success: true }
}

export async function createPipeline(name: string, stages: string[]) {
  const supabase = await createClient()

  // 1. Create pipeline
  const { data: pipeline, error: pipelineError } = await supabase
    .from('pipelines')
    .insert([{ name }])
    .select()
    .single()

  if (pipelineError) return { error: pipelineError.message }

  // 2. Create stages
  const stageInserts = stages.map((stageName, index) => ({
    pipeline_id: pipeline.id,
    name: stageName,
    order_index: index + 1
  }))

  const { data: createdStages, error: stagesError } = await supabase
    .from('pipeline_stages')
    .insert(stageInserts)
    .select()

  if (stagesError) return { error: stagesError.message }

  // Log activity
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('activity_logs').insert({
      action_type: 'PIPELINE_CREATE',
      description: `Created pipeline "${name}" with ${stages.length} stages.`,
      user_id: user.id
    })
  }

  revalidatePath('/leads')
  return { success: true, pipeline, stages: createdStages }
}

export async function updatePipeline(pipelineId: string, name: string, stages: { id?: string, name: string }[]) {
  const supabase = await createClient()

  // 1. Update pipeline name
  const { data: updatedPipeline, error: pipelineError } = await supabase
    .from('pipelines')
    .update({ name })
    .eq('id', pipelineId)
    .select()
    .single()

  if (pipelineError) return { error: pipelineError.message }

  // 2. Fetch existing stages to know what to delete
  const { data: existingStages } = await supabase
    .from('pipeline_stages')
    .select('id')
    .eq('pipeline_id', pipelineId)
    
  const existingStageIds = existingStages?.map(s => s.id) || []
  const newStageIds = stages.filter(s => s.id).map(s => s.id as string)
  
  // 3. Delete stages that were removed
  const stagesToDelete = existingStageIds.filter(id => !newStageIds.includes(id))
  
  if (stagesToDelete.length > 0) {
    // Check if any leads are in these stages
    const { data: leadsInStages } = await supabase
      .from('leads')
      .select('id')
      .in('stage_id', stagesToDelete)
      .limit(1)
      
    if (leadsInStages && leadsInStages.length > 0) {
      return { error: 'Cannot delete stages that contain leads. Please move the leads first.' }
    }
    
    const { error: deleteError } = await supabase
      .from('pipeline_stages')
      .delete()
      .in('id', stagesToDelete)
      
    if (deleteError) return { error: deleteError.message }
  }

  // 4. Update or insert stages
  const savedStages: { id: string; name: string; order_index: number; pipeline_id: string }[] = []
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i]
    if (stage.id) {
      // Update existing
      const { data, error: updateError } = await supabase
        .from('pipeline_stages')
        .update({ name: stage.name, order_index: i + 1 })
        .eq('id', stage.id)
        .select()
        .single()
      if (updateError) return { error: updateError.message }
      if (data) savedStages.push(data)
    } else {
      // Insert new
      const { data, error: insertError } = await supabase
        .from('pipeline_stages')
        .insert({ pipeline_id: pipelineId, name: stage.name, order_index: i + 1 })
        .select()
        .single()
      if (insertError) return { error: insertError.message }
      if (data) savedStages.push(data)
    }
  }

  // Log activity
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('activity_logs').insert({
      action_type: 'PIPELINE_EDIT',
      description: `Updated pipeline "${name}".`,
      user_id: user.id
    })
  }

  revalidatePath('/leads')
  return { success: true, pipeline: updatedPipeline, stages: savedStages }
}

export async function deletePipeline(pipelineId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Only administrators can delete pipelines' }
  }

  // Ensure at least one pipeline remains
  const { count } = await supabase
    .from('pipelines')
    .select('*', { count: 'exact', head: true })

  if (count && count <= 1) {
    return { error: 'Cannot delete the last pipeline. At least one pipeline is required.' }
  }

  // Get pipeline name
  const { data: pipeline } = await supabase
    .from('pipelines')
    .select('name')
    .eq('id', pipelineId)
    .single()

  const pipelineName = pipeline?.name || 'Pipeline'

  // Count affected leads
  const { count: affectedLeadsCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('pipeline_id', pipelineId)

  // Delete pipeline (cascade deletes pipeline_stages and leads)
  const { error } = await supabase
    .from('pipelines')
    .delete()
    .eq('id', pipelineId)

  if (error) {
    console.error('Delete Pipeline Error:', error.message)
    return { error: error.message }
  }

  await supabase.from('activity_logs').insert({
    action_type: 'PIPELINE_DELETE',
    description: `Deleted pipeline "${pipelineName}" (contained ${affectedLeadsCount || 0} leads).`,
    user_id: user.id
  })

  revalidatePath('/leads')
  return { success: true }
}

export async function updateLeadDetails(leadId: string, updates: Record<string, unknown>) {
  const supabase = await createClient()

  // Convert empty string to null for assigned_to
  if (updates.assigned_to === "") {
    updates.assigned_to = null
  }

  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', leadId)
    .select()
    .single()

  if (error) {
    console.error('Update Lead Error:', error.message)
    return { error: error.message }
  }

  // Log the activity
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('activity_logs').insert({
      action_type: 'LEAD_EDIT',
      description: `Updated lead details for "${data.name}".`,
      user_id: user.id
    })
  }

  revalidatePath('/leads')
  return { success: true, lead: data }
}

export async function importLeadsBulk(leadsData: Record<string, unknown>[]) {
  const supabase = await createClient()

  const chunkSize = 500;
  for (let i = 0; i < leadsData.length; i += chunkSize) {
    const chunk = leadsData.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('leads')
      .insert(chunk)

    if (error) {
      console.error('Import Leads Error:', error.message)
      return { error: error.message }
    }
  }

  // Log the activity
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('activity_logs').insert({
      action_type: 'BULK_IMPORT',
      description: `Bulk imported ${leadsData.length} leads via CSV.`,
      user_id: user.id
    })
  }

  revalidatePath('/leads')
  return { success: true, importedCount: leadsData.length }
}

export async function deleteLeadsBulk(leadIds: string[]) {
  const supabase = await createClient()
  
  if (!leadIds || leadIds.length === 0) return { error: 'No leads provided' }

  let leadsToDelete: { email?: string | null }[] = [];
  const chunkSize = 200;

  for (let i = 0; i < leadIds.length; i += chunkSize) {
    const chunk = leadIds.slice(i, i + chunkSize);
    
    // Fetch emails to clear purchases assignment later
    const { data } = await supabase
      .from('leads')
      .select('email')
      .in('id', chunk)
      
    if (data) {
      leadsToDelete = [...leadsToDelete, ...data];
    }

    const { error } = await supabase
      .from('leads')
      .delete()
      .in('id', chunk)

    if (error) {
      console.error('Delete Leads Bulk Error:', error.message)
      return { error: error.message }
    }
  }

  // Clear purchases assigned_to for these emails
  if (leadsToDelete && leadsToDelete.length > 0) {
    const emails = leadsToDelete.map((l: { email?: string | null }) => l.email).filter(Boolean) as string[]
    if (emails.length > 0) {
      const supabaseAdmin = getAdminClient()
      for (let i = 0; i < emails.length; i += chunkSize) {
        const emailChunk = emails.slice(i, i + chunkSize);
        await supabaseAdmin
          .from('purchases')
          .update({ assigned_to: null })
          .in('email', emailChunk)
      }
    }
  }

  // Log the activity
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('activity_logs').insert({
      action_type: 'BULK_DELETE',
      description: `Bulk deleted ${leadIds.length} leads.`,
      user_id: user.id
    })
  }

  revalidatePath('/leads')
  revalidatePath('/purchases')
  return { success: true, count: leadIds.length }
}

export async function updateLeadsBulk(leadIds: string[], updates: { pipeline_id?: string, stage_id?: string, assigned_to?: string | null }) {
  const supabase = await createClient()

  if (!leadIds || leadIds.length === 0) return { error: 'No leads provided' }

  const chunkSize = 200;
  for (let i = 0; i < leadIds.length; i += chunkSize) {
    const chunk = leadIds.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('leads')
      .update(updates)
      .in('id', chunk)

    if (error) {
      console.error('Update Leads Bulk Error:', error.message)
      return { error: error.message }
    }
  }

  // Log the activity
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    let actionDesc = `Bulk updated ${leadIds.length} leads.`
    if (updates.stage_id) actionDesc = `Bulk moved ${leadIds.length} leads to a new stage.`
    if (updates.assigned_to !== undefined) actionDesc = `Bulk assigned ${leadIds.length} leads to a new owner.`

    await supabase.from('activity_logs').insert({
      action_type: 'BULK_EDIT',
      description: actionDesc,
      user_id: user.id
    })
  }

  revalidatePath('/leads')
  return { success: true, count: leadIds.length }
}

export async function getLeadNotes(leadId: string) {
  const supabase = await createClient()

  const { data: rawNotes, error } = await supabase
    .from('lead_notes')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message, notes: [] }

  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')

  const notes = (rawNotes || []).map(note => {
    const profile = allProfiles?.find(p => p.id === note.user_id)
    return {
      ...note,
      profiles: profile || null
    }
  })

  return { notes }
}

export async function addLeadNote(leadId: string, content: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: newNote, error } = await supabase.from('lead_notes').insert({
    lead_id: leadId,
    content,
    user_id: user.id
  }).select('*, profiles(full_name, email)').single()

  if (error) {
    // If the join profiles doesn't work directly via select on insert, fetch or construct
    const { error: insertError } = await supabase.from('lead_notes').insert({
      lead_id: leadId,
      content,
      user_id: user.id
    })
    if (insertError) {
      console.error('Add Lead Note Error:', insertError.message)
      return { error: insertError.message }
    }
  }

  // Also log it as a general activity
  await supabase.from('activity_logs').insert({
    action_type: 'ADD_NOTE',
    description: `Added a note to a lead.`,
    user_id: user.id
  })

  revalidatePath('/leads')
  return { success: true, note: newNote }
}
