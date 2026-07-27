'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function verifySetup(formData: FormData) {
  const supabase = await createClient()

  const code = formData.get('code') as string
  const factorId = formData.get('factorId') as string

  if (!code || !factorId) {
    return redirect('/login/mfa/setup?message=Missing required fields')
  }

  const { data, error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code,
  })

  if (error) {
    console.error('MFA Setup Verification Error:', error.message)
    return redirect('/login/mfa/setup?message=' + encodeURIComponent(error.message))
  }

  // Successfully verified and enrolled. User is now AAL2.
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
