import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      `Supabase configuration missing: URL=${!!supabaseUrl}, KEY=${!!supabaseKey}`
    );
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      return NextResponse.json(
        { success: false, error: "NEXT_PUBLIC_SUPABASE_URL is not set in environment" },
        { status: 500, headers }
      );
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("purchases").select("id").limit(1);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          supabaseUrl,
          hasServiceRole,
          hasAnonKey,
          error: error.message,
          details: error.details,
          code: error.code,
        },
        { status: 500, headers }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "CRM Purchases API is healthy and connected to Supabase",
        supabaseUrl,
        hasServiceRole,
        hasAnonKey,
      },
      { status: 200, headers }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.cause ? String(error.cause) : undefined,
      },
      { status: 500, headers }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers, status: 200 });
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const data = await request.json();

    if (!data.email || !data.plan_name) {
      return NextResponse.json(
        { success: false, error: "Email and plan_name are required" },
        { status: 400, headers }
      );
    }

    // Check if there is a pending purchase for this email and plan to update
    const { data: existing, error: selectError } = await supabase
      .from("purchases")
      .select("id, payment_id")
      .eq("email", data.email)
      .eq("plan_name", data.plan_name)
      .eq("status", "Pending")
      .order("created_at", { ascending: false })
      .limit(1);

    if (selectError) {
      console.warn("Could not query existing pending purchase:", selectError.message);
    }

    if (existing && existing.length > 0) {
      // Update existing pending record
      const { error: updateError } = await supabase
        .from("purchases")
        .update({
          payment_id: data.payment_id,
          status: data.payment_status || "Successful",
        })
        .eq("id", existing[0].id);

      if (updateError) {
        throw updateError;
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from("purchases")
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
            status: data.payment_status || "Successful",
          },
        ]);

      if (insertError) {
        throw insertError;
      }
    }

    return NextResponse.json(
      { success: true, message: "Purchase logged" },
      { status: 201, headers }
    );
  } catch (error: any) {
    console.error("Error logging purchase:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.details || (error.cause ? String(error.cause) : undefined),
      },
      { status: 500, headers }
    );
  }
}
