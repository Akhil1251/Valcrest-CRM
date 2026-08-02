'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function applyForLeave(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const start_date = formData.get('start_date') as string
  const end_date = formData.get('end_date') as string
  const reason = formData.get('reason') as string

  const { error } = await supabase
    .from('leaves')
    .insert({
      user_id: user.id,
      start_date,
      end_date,
      reason,
      status: 'Pending'
    })

  if (error) {
    console.error('Error submitting Leave Request:', error)
    if (error.code === '42P01') {
      return { error: 'Database table for leaves is not setup yet. Please contact admin.' }
    }
    return { error: 'Failed to submit request. Please try again.' }
  }

  revalidatePath('/leaves')
  return { success: true }
}

export async function updateLeaveStatus(id: string, status: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify admin status
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('leaves')
    .update({ status })
    .eq('id', id)

  if (error) {
    console.error('Error updating leave status:', error)
    return { error: 'Failed to update status. Please try again.' }
  }

  revalidatePath('/leaves')
  return { success: true }
}

export async function markLeavesAsRead() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Mark all leaves belonging to the user as read where is_read is false and status is not Pending
  const { error } = await supabase
    .from('leaves')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .neq('status', 'Pending')
    .eq('is_read', false)

  if (error) {
    console.error('Error marking leaves as read:', error)
    return { error: 'Failed to mark read' }
  }

  return { success: true }
}
