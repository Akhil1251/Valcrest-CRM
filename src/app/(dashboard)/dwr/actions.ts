'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitDWR(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const date = formData.get('date') as string
  const tasks_completed = formData.get('tasks_completed') as string
  const tasks_planned = formData.get('tasks_planned') as string
  const blockers = formData.get('blockers') as string

  const content = JSON.stringify({
    tasks_completed,
    tasks_planned,
    blockers
  })

  // Insert into daily_work_reports table
  const { error } = await supabase
    .from('daily_work_reports')
    .insert({
      user_id: user.id,
      date,
      content,
      status: 'Pending'
    })

  if (error) {
    console.error('Error submitting DWR:', error)
    if (error.code === '42P01') {
      return { error: 'Database table for DWRs is not setup yet. Please contact admin.' }
    }
    return { error: 'Failed to submit report. Please try again.' }
  }

  revalidatePath('/dwr')
  return { success: true }
}

export async function updateDWRFeedback(id: string, feedback: string, status: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify admin status
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('daily_work_reports')
    .update({ 
      feedback,
      status 
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating DWR:', error)
    return { error: 'Failed to update report. Please try again.' }
  }

  revalidatePath('/dwr')
  return { success: true }
}

export async function markDWRsAsRead() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('daily_work_reports')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .neq('status', 'Pending')
    .eq('is_read', false)

  if (error) {
    console.error('Error marking DWRs as read:', error)
    return { error: 'Failed to mark read' }
  }

  return { success: true }
}
