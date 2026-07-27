import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, message, source = 'Website Form' } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required fields' },
        { status: 400 }
      )
    }

    // Because this API will be called by your external website (which doesn't have the user logged in),
    // we use the Supabase Service Role Key (if available) or standard anon key to insert.
    // If you haven't added the service_role_key, this relies on RLS policies allowing inserts.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    const finalMessage = source ? `[Source: ${source}]\n\n${message || ''}` : message;

    const { error } = await supabase
      .from('inquiries')
      .insert([
        {
          name,
          email,
          phone,
          message: finalMessage,
          status: 'Pending'
        }
      ])

    if (error) {
      throw error
    }

    // CORS Headers to allow your external website to call this API
    return NextResponse.json(
      { success: true, message: 'Inquiry received successfully!' },
      { 
        status: 201,
        headers: {
          'Access-Control-Allow-Origin': '*', // Replace * with your actual website URL in production
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    )
  } catch (error: any) {
    console.error('Error receiving inquiry:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    )
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
