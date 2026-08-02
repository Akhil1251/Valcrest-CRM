import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

async function handleSignOut(request: Request) {
  const supabase = await createClient()

  // Check if a user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    await supabase.auth.signOut()
  }

  return NextResponse.redirect(new URL('/login', request.url), 303)
}

export async function POST(request: Request) {
  return handleSignOut(request)
}

export async function GET(request: Request) {
  return handleSignOut(request)
}
