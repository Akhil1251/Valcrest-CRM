import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import LeadsClient from './LeadsClient'

export default async function LeadsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  // Fetch all users for assignment mapping
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .order('created_at', { ascending: false })

  // Fetch activity logs (latest 50)
  const { data: activityLogs } = await supabase
    .from('activity_logs')
    .select('*, profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(50)

  // Fetch all leads using pagination to bypass the 1000 row max limit
  let allLeads: any[] = [];
  let from = 0;
  const step = 1000;
  let leadsError = null;
  
  while (true) {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(from, from + step - 1);
      
    if (error) {
      leadsError = error;
      break;
    }
    
    if (data) {
      allLeads = [...allLeads, ...data];
    }
    
    if (!data || data.length < step) {
      break;
    }
    
    from += step;
  }
  
  const leads = allLeads;

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
      users={allUsers || []}
      isAdmin={isAdmin}
      currentUserId={user.id}
    />
  )
}
