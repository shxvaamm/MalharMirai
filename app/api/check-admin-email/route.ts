import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client with service role key (bypasses RLS)
function createServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";
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

    // Check club_members table for admin role
    const { data: member, error } = await (supabase.from("club_members") as any)
      .select("email, role, full_name, department, specialty")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("[check-admin-email] Supabase error:", error.message);
    }

    const isAdmin =
      member &&
      (member.role === "admin" || member.role === "super_admin");

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
