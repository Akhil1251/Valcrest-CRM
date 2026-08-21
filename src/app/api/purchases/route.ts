import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Using service role to bypass RLS for updates
);

export async function POST(request: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return NextResponse.json({}, { headers, status: 200 });
  }

  try {
    const data = await request.json();

    // Check if there's a pending purchase for this email and plan to update
    const { data: existing } = await supabase
      .from('purchases')
      .select('id, payment_id')
      .eq('email', data.email)
      .eq('plan_name', data.plan_name)
      .eq('status', 'Pending')
      .order('created_at', { ascending: false })
      .limit(1);

    if (existing && existing.length > 0) {
      // Update existing pending record
      const { error } = await supabase
        .from('purchases')
        .update({
          payment_id: data.payment_id,
          status: data.payment_status || 'Successful',
        })
        .eq('id', existing[0].id);

      if (error) throw error;
    } else {
      // Insert new record
      const { error } = await supabase
        .from('purchases')
        .insert([
          {
            plan_name: data.plan_name,
            amount: data.amount,
            customer_name: data.customer_name,
            email: data.email,
            phone: data.phone,
            neet_score: data.neet_score,
            rank: data.rank,
            category: data.category,
            sub_category: data.sub_category,
            college_pref: data.college_pref,
            state_pref: data.state_pref,
            father_name: data.father_name,
            father_phone: data.father_phone,
            father_email: data.father_email,
            payment_id: data.payment_id,
            status: data.payment_status || 'Successful',
          }
        ]);

      if (error) throw error;
    }

    return NextResponse.json({ success: true, message: 'Purchase logged' }, { status: 201, headers });
  } catch (error: any) {
    console.error('Error logging purchase:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers });
  }
}
