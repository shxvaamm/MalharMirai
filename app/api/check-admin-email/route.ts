import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client with fallback
function createServiceClient() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://lqaldejqwxtvbrqymkln.supabase.co";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_X_DukL0UshA3UVCIKPTSDg_H4Z_L5Oz";
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ isAdmin: false, error: "Email required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 1. Check profiles table for admin role
    const { data: profile } = await (supabase.from("profiles") as any)
      .select("email, role, full_name, department, specialty")
      .eq("email", email)
      .maybeSingle();

    let isAdmin = profile && (profile.role === "admin" || profile.role === "super_admin");
    let member = profile;

    // 2. Check club_members table for admin role
    if (!isAdmin) {
      const { data: cm } = await (supabase.from("club_members") as any)
        .select("email, role, full_name, department, specialty")
        .eq("email", email)
        .maybeSingle();

      if (cm && (cm.role === "admin" || cm.role === "super_admin")) {
        isAdmin = true;
        member = cm;
      }
    }

    return NextResponse.json({
      isAdmin: !!isAdmin,
      member: isAdmin
        ? {
            email: member.email,
            full_name: member.full_name,
            department: member.department,
            specialty: member.specialty,
            role: member.role,
          }
        : null,
    });
  } catch (err: any) {
    console.error("[check-admin-email] Error:", err);
    return NextResponse.json({ isAdmin: false, error: err.message }, { status: 500 });
  }
}
