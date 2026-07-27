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
    console.error('Update Inquiry Error:', error.message)
    return { error: error.message }
  }

  revalidatePath('/inquiries')
  return { success: true }
}
