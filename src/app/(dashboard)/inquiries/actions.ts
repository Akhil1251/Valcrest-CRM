'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateInquiryStatus(id: string, status: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('inquiries')
    .update({ status })
    .eq('id', id)

  if (error) {
    console.error('Failed to update status', error)
  }
  
  revalidatePath('/inquiries')
}

export async function assignInquiry(id: string, userId: string | null) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('inquiries')
    .update({ assigned_to: userId })
    .eq('id', id)

  if (error) {
    console.error('Failed to assign inquiry', error)
  }
  
  revalidatePath('/inquiries')
}

export async function addInquiryNote(inquiryId: string, content: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  
  const { error } = await supabase
    .from('inquiry_notes')
    .insert([{
      inquiry_id: inquiryId,
      user_id: user.id,
      content
    }])

  if (error) {
    console.error('Failed to add note', error)
  }
  
  revalidatePath('/inquiries')
}

export async function getInquiryNotes(inquiryId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('inquiry_notes')
    .select('*, profiles(email, role)')
    .eq('inquiry_id', inquiryId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to get notes', error)
    return []
  }
  
  return data || []
}

export async function bulkAssignInquiries(ids: string[], userId: string | null) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('inquiries')
    .update({ assigned_to: userId })
    .in('id', ids)

  if (error) {
    console.error('Failed to bulk assign', error)
  }
  
  revalidatePath('/inquiries')
}

export async function bulkDeleteInquiries(ids: string[]) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('inquiries')
    .delete()
    .in('id', ids)

  if (error) {
    console.error('Failed to bulk delete', error)
  }
  
  revalidatePath('/inquiries')
}
