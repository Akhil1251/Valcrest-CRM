'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { createClient as createServerClient } from '@/utils/supabase/server'

// Helper to get an Admin client that bypasses RLS and can manage auth users
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Verify that the caller is an admin
async function verifyAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Forbidden: Admin access required')
  }
}

export async function createUser(data: FormData) {
  await verifyAdmin()
  const adminClient = getAdminClient()

  const email = data.get('email') as string
  const password = data.get('password') as string
  const role = data.get('role') as string

  if (!email || !password || !role) {
    return { error: 'Missing required fields' }
  }

  // 1. Create the Auth User (This triggers the database trigger to create the profile)
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // Auto-confirm email so they can log in immediately
  })

  if (authError) {
    return { error: authError.message }
  }

  // 2. Wait a moment for the database trigger to create the profile
  await new Promise(resolve => setTimeout(resolve, 500))

  // 3. Update the role in the profiles table if they are an admin
  // (The trigger defaults to 'user', which maps to 'Employee' in UI logic)
  if (role === 'admin') {
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', authData.user.id)

    if (updateError) {
      console.error('Failed to update role:', updateError)
    }
  }

  revalidatePath('/users')
  return { success: true }
}

export async function updateUser(id: string, data: FormData) {
  await verifyAdmin()
  const adminClient = getAdminClient()

  const email = data.get('email') as string
  const password = data.get('password') as string
  const role = data.get('role') as string

  // 1. Update Auth User (Email/Password)
  const updates: any = {}
  if (email) updates.email = email
  if (password) updates.password = password

  if (Object.keys(updates).length > 0) {
    const { error: authError } = await adminClient.auth.admin.updateUserById(id, updates)
    if (authError) {
      return { error: authError.message }
    }
  }

  // 2. Update Role
  if (role) {
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ role: role === 'admin' ? 'admin' : 'user' })
      .eq('id', id)

    if (updateError) {
      return { error: updateError.message }
    }
  }

  revalidatePath('/users')
  return { success: true }
}

export async function deleteUser(id: string) {
  await verifyAdmin()
  const adminClient = getAdminClient()

  // Prevent self-deletion
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.id === id) {
    return { error: 'You cannot delete your own account' }
  }

  // Deleting the auth user cascades to delete the profile automatically
  const { error } = await adminClient.auth.admin.deleteUser(id)
  
  if (error) {
    return { error: error.message }
  }

  revalidatePath('/users')
  return { success: true }
}
