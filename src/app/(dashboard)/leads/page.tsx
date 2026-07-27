import { createClient } from '@/utils/supabase/server'
import LeadsClient from './LeadsClient'

export default async function LeadsPage() {
  const supabase = await createClient()

  // Fetch all leads
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch pipelines
  const { data: pipelines, error: pipelinesError } = await supabase
    .from('pipelines')
    .select('*')
    .order('created_at', { ascending: true })

  // Fetch pipeline stages
  const { data: stages, error: stagesError } = await supabase
    .from('pipeline_stages')
    .select('*')
    .order('order_index', { ascending: true })

  if (leadsError) console.error('Error fetching leads:', leadsError.message)
  if (pipelinesError) console.error('Error fetching pipelines:', pipelinesError.message)
  if (stagesError) console.error('Error fetching stages:', stagesError.message)

  return (
    <LeadsClient 
      initialLeads={leads || []} 
      pipelines={pipelines || []}
      stages={stages || []}
    />
  )
}
