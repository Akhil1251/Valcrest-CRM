import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import LeadsClient from './LeadsClient'

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

export default async function LeadsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role?.toLowerCase()?.trim() === 'admin'

  // Fetch all users for assignment mapping
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
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

  if (pipelinesError) console.error('Error fetching pipelines:', pipelinesError.message)
  if (stagesError) console.error('Error fetching stages:', stagesError.message)

  // Fetch exact count of leads per pipeline using fast HEAD requests (bypasses 1000 row max limit)
  const initialPipelineLeadCounts: Record<string, number> = {}
  if (pipelines && pipelines.length > 0) {
    await Promise.all(
      pipelines.map(async (p) => {
        const { count, error } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('pipeline_id', p.id)

        if (!error && count !== null) {
          initialPipelineLeadCounts[p.id] = count
        }
      })
    )
  }

  // Fetch initial leads ONLY for the default/active pipeline using range pagination to retrieve all rows (bypassing 1000 row limit)
  const defaultPipelineId = pipelines?.[0]?.id || ''
  let initialLeads: Lead[] = []

  if (defaultPipelineId) {
    let from = 0
    const step = 1000
    while (true) {
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('id, name, email, phone, source, pipeline_id, stage_id, assigned_to, created_at')
        .eq('pipeline_id', defaultPipelineId)
        .order('created_at', { ascending: false })
        .range(from, from + step - 1)

      if (leadsError) {
        console.error('Error fetching initial leads:', leadsError.message)
        break
      }

      if (leadsData && leadsData.length > 0) {
        initialLeads = [...initialLeads, ...(leadsData as Lead[])]
      }

      if (!leadsData || leadsData.length < step) {
        break
      }

      from += step
    }
  }

  return (
    <LeadsClient
      initialLeads={initialLeads}
      pipelines={pipelines || []}
      stages={stages || []}
      users={allUsers || []}
      isAdmin={isAdmin}
      currentUserId={user.id}
      initialPipelineLeadCounts={initialPipelineLeadCounts}
    />
  )
}
