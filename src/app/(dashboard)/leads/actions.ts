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

  const { error } = await supabase.from('leads').insert([
    {
      name,
      email,
      phone,
      source,
      pipeline_id,
      stage_id,
      assigned_to: assigned_to || null,
    }
  ])

  if (error) {
    console.error('Create Lead Error:', error.message)
    return { error: error.message }
  }

  revalidatePath('/leads')
  return { success: true }
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

  const { error: stagesError } = await supabase
    .from('pipeline_stages')
    .insert(stageInserts)

  if (stagesError) return { error: stagesError.message }

  revalidatePath('/leads')
  return { success: true, pipelineId: pipeline.id }
}

export async function updateLeadDetails(leadId: string, updates: any) {
  const supabase = await createClient()

  // Convert empty string to null for assigned_to
  if (updates.assigned_to === "") {
    updates.assigned_to = null
  }

  const { error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', leadId)

  if (error) {
    console.error('Update Lead Error:', error.message)
    return { error: error.message }
  }

  // Log the activity
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('activity_logs').insert({
      action_type: 'LEAD_EDIT',
      description: `Updated lead owner/pipeline details.`,
      user_id: user.id
    })
  }

  revalidatePath('/leads')
  return { success: true }
}

export async function importLeadsBulk(leadsData: any[]) {
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
  return { success: true }
}

export async function deleteLeadsBulk(leadIds: string[]) {
  const supabase = await createClient()
  
  if (!leadIds || leadIds.length === 0) return { error: 'No leads provided' }

  // Fetch emails to clear purchases assignment later
  const { data: leadsToDelete } = await supabase
    .from('leads')
    .select('email')
    .in('id', leadIds)

  const { error } = await supabase
    .from('leads')
    .delete()
    .in('id', leadIds)

  if (error) {
    console.error('Delete Leads Bulk Error:', error.message)
    return { error: error.message }
  }

  // Clear purchases assigned_to for these emails
  if (leadsToDelete && leadsToDelete.length > 0) {
    const emails = leadsToDelete.map((l: any) => l.email).filter(Boolean)
    if (emails.length > 0) {
      const supabaseAdmin = getAdminClient()
      await supabaseAdmin
        .from('purchases')
        .update({ assigned_to: null })
        .in('email', emails)
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
  return { success: true }
}

export async function updateLeadsBulk(leadIds: string[], updates: { pipeline_id?: string, stage_id?: string, assigned_to?: string | null }) {
  const supabase = await createClient()

  if (!leadIds || leadIds.length === 0) return { error: 'No leads provided' }

  const { error } = await supabase
    .from('leads')
    .update(updates)
    .in('id', leadIds)

  if (error) {
    console.error('Update Leads Bulk Error:', error.message)
    return { error: error.message }
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
  return { success: true }
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

  const { error } = await supabase.from('lead_notes').insert({
    lead_id: leadId,
    content,
    user_id: user.id
  })

  if (error) {
    console.error('Add Lead Note Error:', error.message)
    return { error: error.message }
  }

  // Also log it as a general activity
  await supabase.from('activity_logs').insert({
    action_type: 'ADD_NOTE',
    description: `Added a note to a lead.`,
    user_id: user.id
  })

  revalidatePath('/leads')
  return { success: true }
}
