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
  try {
    await verifyAdmin()
    const adminClient = getAdminClient()

    const email = data.get('email') as string
    const password = data.get('password') as string
    const role = data.get('role') as string
    const full_name = data.get('full_name') as string

    if (!email || !password || !role || !full_name) {
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

    // 3. Update the profile (role and full_name)
    const profileUpdates: any = {}
    if (role === 'admin') profileUpdates.role = 'admin'
    if (full_name) profileUpdates.full_name = full_name

    if (Object.keys(profileUpdates).length > 0) {
      const { error: updateError } = await adminClient
        .from('profiles')
        .update(profileUpdates)
        .eq('id', authData.user.id)

      if (updateError) {
        console.error('Failed to update profile:', updateError)
      }
    }

    revalidatePath('/users')
    return { success: true }
  } catch (err: any) {
    console.error('Unhandled error in createUser:', err)
    return { error: err.message || 'An unexpected error occurred.' }
  }
}

export async function updateUser(id: string, data: FormData) {
  try {
    await verifyAdmin()
    const adminClient = getAdminClient()

    const email = data.get('email') as string
    const password = data.get('password') as string
    const role = data.get('role') as string
    const full_name = data.get('full_name') as string

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

    // 2. Update Role and Full Name
    const profileUpdates: any = {}
    if (role) profileUpdates.role = role === 'admin' ? 'admin' : 'user'
    if (full_name) profileUpdates.full_name = full_name

    if (Object.keys(profileUpdates).length > 0) {
      const { error: updateError } = await adminClient
        .from('profiles')
        .update(profileUpdates)
        .eq('id', id)

      if (updateError) {
        return { error: updateError.message }
      }
    }

    revalidatePath('/users')
    return { success: true }
  } catch (err: any) {
    console.error('Unhandled error in updateUser:', err)
    return { error: err.message || 'An unexpected error occurred.' }
  }
}

export async function deleteUser(id: string) {
  try {
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
  } catch (err: any) {
    console.error('Unhandled error in deleteUser:', err)
    return { error: err.message || 'An unexpected error occurred.' }
  }
}
