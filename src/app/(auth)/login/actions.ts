'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login Error:', error.message)
    return redirect('/login?message=' + encodeURIComponent(error.message))
  }

  // Check MFA status
  const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
  
  if (factorsError) {
    return redirect('/login?message=Could not verify MFA status')
  }

  const totpFactors = factors.totp || []

  if (totpFactors.length === 0) {
    // User has not set up MFA yet, force them to set it up
    return redirect('/login/mfa/setup')
  }

  // User has set up MFA, now we need to check if they have completed the AAL2 login for this session
  const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (mfaError || (mfaData.nextLevel === 'aal2' && mfaData.nextLevel !== mfaData.currentLevel)) {
    // Redirect to verification
    return redirect('/login/mfa')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
