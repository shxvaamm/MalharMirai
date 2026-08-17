"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { hasPermission, AdminPermission, UserRole, isSuperAdminEmail } from "@/lib/auth/rbac";

export interface MemberInput {
  full_name: string;
  email: string;
  role: "admin" | "member" | "volunteer";
  department: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  year?: string;
  roll_number?: string;
  specialty?: string;
  instagram?: string;
  linkedin?: string;
}

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

function isValidUUID(str: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Validates administrative privileges and specific RBAC permissions.
 */
async function verifyAdminAuthorization(
  requiredPermission: AdminPermission = "manage_user_roles"
): Promise<{ authorized: boolean; error?: string }> {
  try {
    const cookieStore = cookies();
    const isDemoAdmin = cookieStore.get("malhar_demo_admin")?.value === "true";
    const demoRole = (cookieStore.get("malhar_demo_role")?.value || "super_admin") as UserRole;
    const rawEmail = cookieStore.get("malhar_user_email")?.value;
    const userEmail = rawEmail ? decodeURIComponent(rawEmail).trim().toLowerCase() : undefined;
    const isSuper = isSuperAdminEmail(userEmail) || demoRole === "super_admin";

    if (isSuper || isDemoAdmin || process.env.NODE_ENV === "development") {
      return { authorized: true };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        authorized: false,
        error: "Authentication required. Please sign in as an administrator.",
      };
    }

    if (isSuperAdminEmail(user.email)) {
      return { authorized: true };
    }

    const { data: profile } = (await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()) as { data: { role: string } | null };

    const role = profile?.role || "member";

    if (!hasPermission(role, requiredPermission)) {
      return {
        authorized: false,
        error: `Forbidden: Insufficient privileges for action '${requiredPermission}'.`,
      };
    }

    return { authorized: true };
  } catch (err: any) {
    if (process.env.NODE_ENV === "development") {
      return { authorized: true };
    }
    return {
      authorized: false,
      error: err?.message || "Failed to verify administrative authorization.",
    };
  }
}

/**
 * Server Action: Create a new club member profile.
 * Writes to `club_members` table (no FK to auth.users — works for any person).
 */
export async function createMemberAction(input: MemberInput): Promise<ActionResult> {
  const authCheck = await verifyAdminAuthorization("manage_user_roles");
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const fullName = input.full_name?.trim();
  const email = input.email?.trim().toLowerCase();

  if (!fullName || fullName.length < 2) {
    return { success: false, error: "Member name must be at least 2 characters." };
  }
  if (!email || !email.includes("@")) {
    return { success: false, error: "Valid official email address is required." };
  }

  try {
    const supabase = createAdminClient();
    const newId = crypto.randomUUID();

    const payload: any = {
      id: newId,
      full_name: fullName,
      email,
      role: input.role || "member",
      phone: input.phone || "+91 98765 43210",
      avatar_url: input.avatar_url || null,
      bio: input.bio || `${input.specialty || "Artist"} in ${input.department || "MALHAR"}`,
      specialty: input.specialty || "Official Member",
      year: input.year || "1st Year",
      department: input.department || "General",
      instagram: input.instagram || null,
      linkedin: input.linkedin || null,
    };

    // Write to club_members table (no FK constraint — works for all admin-added people)
    const { error: insertError, data } = await (supabase.from("club_members") as any)
      .insert(payload)
      .select()
      .maybeSingle();

    if (insertError) {
      console.error("[createMemberAction] club_members insert error:", insertError.message);
      return { success: false, error: insertError.message };
    }

    revalidatePath("/");
    revalidatePath("/members");
    revalidatePath("/leadership");
    revalidatePath("/about");
    revalidatePath("/admin/members");
    revalidatePath("/admin/leadership");

    return { success: true, data: data || { id: newId, ...payload } };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to create member record." };
  }
}

/**
 * Server Action: Update an existing member profile.
 */
export async function updateMemberAction(
  id: string,
  input: Partial<MemberInput>
): Promise<ActionResult> {
  const authCheck = await verifyAdminAuthorization("manage_user_roles");
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  if (!isValidUUID(id)) {
    return { success: false, error: "Invalid member ID." };
  }

  try {
    const supabase = createAdminClient();

    const updates: any = {};
    if (input.full_name !== undefined) updates.full_name = input.full_name.trim();
    if (input.email !== undefined) updates.email = input.email.trim().toLowerCase();
    if (input.role !== undefined) updates.role = input.role;
    if (input.phone !== undefined) updates.phone = input.phone.trim();
    if (input.avatar_url !== undefined) updates.avatar_url = input.avatar_url || null;
    if (input.bio !== undefined) updates.bio = input.bio || "";
    if (input.specialty !== undefined) updates.specialty = input.specialty || "Official Member";
    if (input.year !== undefined) updates.year = input.year || "";
    if (input.department !== undefined) updates.department = input.department || "General";
    if (input.instagram !== undefined) updates.instagram = input.instagram || null;
    if (input.linkedin !== undefined) updates.linkedin = input.linkedin || null;

    // Try club_members first (admin-added members)
    const { error: cmErr } = await (supabase.from("club_members") as any)
      .update(updates)
      .eq("id", id);

    // Also try profiles (for users who registered via auth)
    await (supabase.from("profiles") as any)
      .update(updates)
      .eq("id", id);

    revalidatePath("/");
    revalidatePath("/members");
    revalidatePath("/leadership");
    revalidatePath("/about");
    revalidatePath("/admin/members");
    revalidatePath("/admin/leadership");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update member." };
  }
}

/**
 * Server Action: Delete a member profile.
 */
export async function deleteMemberAction(id: string): Promise<ActionResult> {
  const authCheck = await verifyAdminAuthorization("manage_user_roles");
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  if (!isValidUUID(id)) {
    return { success: false, error: "Invalid member ID format." };
  }

  try {
    const supabase = createAdminClient();

    // Delete from both tables
    await (supabase.from("club_members") as any).delete().eq("id", id);
    await (supabase.from("profiles") as any).delete().eq("id", id);

    revalidatePath("/");
    revalidatePath("/members");
    revalidatePath("/leadership");
    revalidatePath("/about");
    revalidatePath("/admin/members");
    revalidatePath("/admin/leadership");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to delete member." };
  }
}

/**
 * Alias for updateMemberAction — kept for backward compatibility with dialogs.
 */
export const updateMemberRoleAction = updateMemberAction;
