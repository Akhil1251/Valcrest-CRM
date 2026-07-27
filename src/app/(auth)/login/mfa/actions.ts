'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function verifyMfa(formData: FormData) {
  const supabase = await createClient()

  const code = formData.get('code') as string

  const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
  if (factorsError || !factors.totp || factors.totp.length === 0) {
    return redirect('/login/mfa?message=No MFA factors found')
  }

  const factorId = factors.totp[0].id

  const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
  if (challengeError) {
    return redirect('/login/mfa?message=Failed to create challenge')
  }

  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challengeData.id,
    code,
  })

  if (error) {
    return redirect('/login/mfa?message=Invalid code')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
