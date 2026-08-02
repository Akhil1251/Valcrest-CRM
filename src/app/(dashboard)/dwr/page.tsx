import { createClient } from '@/utils/supabase/server'
import DWRClient from './DWRClient'

export default async function DWRPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch current user's profile to check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()
    
  const isAdmin = profile?.role === 'admin'

  let allUsers: any[] = []
  
  // If admin, fetch all users and all DWRs. If normal user, fetch only their DWRs
  let query = supabase
    .from('daily_work_reports')
    .select('*, profiles(email)')
    .order('created_at', { ascending: false })

  if (isAdmin) {
    const { data: profiles } = await supabase.from('profiles').select('id, email').order('email')
    if (profiles) allUsers = profiles
  } else {
    query = query.eq('user_id', user?.id)
  }

  const { data: dwrs, error } = await query

  if (error) {
    console.error('Error fetching DWRs:', error)
  }

  return (
    <DWRClient 
      reports={dwrs || []} 
      isAdmin={isAdmin} 
      users={allUsers}
      currentUserId={user?.id}
    />
  )
}
