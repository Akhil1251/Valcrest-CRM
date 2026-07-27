import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import UsersClient from './UsersClient'

export default async function UsersManagementPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch user role to ensure only admins can view this page
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch all user profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching profiles:', error)
    return (
      <div className="p-8 text-center text-slate-500">
        You do not have permission to view this page.
      </div>
    )
  }

  return (
    <UsersClient users={profiles || []} currentUserId={user.id} />
  )
}
