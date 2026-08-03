import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import LogsClient from './LogsClient'

export default async function LogsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: rawLogs } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000)

  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')

  const activityLogs = (rawLogs || []).map(log => {
    const profile = allProfiles?.find(p => p.id === log.user_id)
    return {
      ...log,
      profiles: profile || null
    }
  })

  return <LogsClient initialLogs={activityLogs} />
}
