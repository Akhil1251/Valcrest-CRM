'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

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
