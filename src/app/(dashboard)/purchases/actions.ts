'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const getAdminClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function deletePurchases(ids: string[]) {
  const supabase = await createClient()
  const supabaseAdmin = getAdminClient()

  if (!ids || ids.length === 0) return { error: 'No purchases selected' }

  const { error } = await supabaseAdmin
    .from('purchases')
    .delete()
    .in('id', ids)

  if (error) {
    console.error('Delete Purchases Error:', error.message)
    return { error: error.message }
  }

  // Log activity
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('activity_logs').insert({
      action_type: 'DELETE',
      description: `Deleted ${ids.length} purchase(s).`,
      user_id: user.id
    })
  }

  revalidatePath('/purchases')
  return { success: true }
}

export async function convertToLead(purchaseIds: string[], assignedTo: string, pipelineId: string, stageId: string) {
  const supabase = await createClient()
  const supabaseAdmin = getAdminClient()

  if (!purchaseIds || purchaseIds.length === 0) return { error: 'No purchases selected' }

  // 1. Fetch the purchases
  const { data: purchasesToConvert, error: fetchError } = await supabaseAdmin
    .from('purchases')
    .select('*')
    .in('id', purchaseIds)

  if (fetchError) return { error: fetchError.message }
  if (!purchasesToConvert || purchasesToConvert.length === 0) return { error: 'Purchases not found' }

  // 1.5 Process each purchase to either update existing lead or insert new one
  for (const p of purchasesToConvert) {
    // Check if lead already exists by email
    const { data: existingLead } = await supabaseAdmin
      .from('leads')
      .select('id')
      .eq('email', p.email)
      .single()

    if (existingLead) {
      // Update existing lead
      await supabaseAdmin
        .from('leads')
        .update({
          pipeline_id: pipelineId,
          stage_id: stageId,
          assigned_to: assignedTo || null
        })
        .eq('id', existingLead.id)
    } else {
      // Insert new lead
      await supabaseAdmin
        .from('leads')
        .insert({
          name: p.customer_name,
          email: p.email,
          phone: p.phone,
          source: 'Purchase Conversion',
          pipeline_id: pipelineId,
          stage_id: stageId,
          assigned_to: assignedTo || null
        })
    }
  }

  // 4. Update purchases table with assignment (if schema supports it, we'll try)
  // We'll ignore errors here in case assigned_to doesn't exist on purchases
  await supabaseAdmin
    .from('purchases')
    .update({ assigned_to: assignedTo || null })
    .in('id', purchaseIds)

  // Log activity
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('activity_logs').insert({
      action_type: 'CONVERT_TO_LEAD',
      description: `Converted ${purchaseIds.length} purchase(s) to leads and assigned them.`,
      user_id: user.id
    })
  }

  revalidatePath('/purchases')
  revalidatePath('/leads')
  return { success: true }
}
