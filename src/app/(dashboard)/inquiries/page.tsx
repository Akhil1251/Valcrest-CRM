import { createClient } from '@/utils/supabase/server'
import InquiriesClient from './InquiriesClient'

export default async function InquiriesPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch current user's profile to check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()
    
  const isAdmin = profile?.role === 'admin'

  // Fetch all profiles for the assignment dropdown (only if admin)
  let allUsers: any[] = []
  if (isAdmin) {
    const { data: profiles, error: usersError } = await supabase
      .from('profiles')
      .select('id, email')
      .order('email')
    
    if (usersError) console.error('Error fetching profiles:', usersError)
    if (profiles) allUsers = profiles
  }

  // Fetch inquiries from database, ordering by newest first
  const { data: inquiries, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching inquiries:', error)
  }

  return <InquiriesClient inquiries={inquiries || []} isAdmin={isAdmin} users={allUsers} currentUserId={user?.id} />
}
