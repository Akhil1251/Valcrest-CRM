import { createClient } from '@/utils/supabase/server'
import LeavesClient from './LeavesClient'

export default async function LeavesPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()
    
  const isAdmin = profile?.role === 'admin'

  let allUsers: any[] = []
  
  let query = supabase
    .from('leaves')
    .select('*, profiles(email)')
    .order('created_at', { ascending: false })

  if (isAdmin) {
    const { data: profiles } = await supabase.from('profiles').select('id, email').order('email')
    if (profiles) allUsers = profiles
  } else {
    query = query.eq('user_id', user?.id)
  }

  const { data: leaves, error } = await query

  if (error) {
    console.error('Error fetching leaves:', error)
  }

  return (
    <LeavesClient 
      leaves={leaves || []} 
      isAdmin={isAdmin} 
      users={allUsers}
      currentUserId={user?.id}
    />
  )
}
