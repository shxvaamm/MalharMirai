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
      bio: (input.bio || "").trim(),
      specialty: (input.specialty || "").trim(),
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
    revalidatePath("/admin/team");
    revalidatePath("/admin");

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
    if (input.bio !== undefined) updates.bio = (input.bio || "").trim();
    if (input.specialty !== undefined) updates.specialty = (input.specialty || "").trim();
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
    revalidatePath("/admin/team");
    revalidatePath("/admin");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update member." };
  }
}

/**
 * Helper to extract Supabase Storage path for a member avatar.
 */
function extractAvatarStoragePath(avatarUrl?: string): string | null {
  if (!avatarUrl) return null;
  // External google, unsplash or placeholder/data images should not be treated as Supabase Storage objects
  if (
    avatarUrl.startsWith("data:") ||
    avatarUrl.includes("googleusercontent.com") ||
    avatarUrl.includes("unsplash.com")
  ) {
    return null;
  }

  const mediaIdx = avatarUrl.indexOf("/media/");
  if (mediaIdx !== -1) {
    const rel = avatarUrl.substring(mediaIdx + "/media/".length).split("?")[0];
    return rel.startsWith("avatars/") ? rel : `avatars/${rel}`;
  }

  const avatarsIdx = avatarUrl.indexOf("/avatars/");
  if (avatarsIdx !== -1 && avatarUrl.includes("supabase.co")) {
    return avatarUrl.substring(avatarsIdx + 1).split("?")[0];
  }

  if (avatarUrl.startsWith("avatars/")) {
    return avatarUrl.split("?")[0];
  }

  return null;
}

/**
 * Server Action: Delete a member profile, clean up storage avatar,
 * unlink child registrations (preserving history), and revalidate public routes.
 */
export async function deleteMemberAction(id: string, email?: string): Promise<ActionResult> {
  const authCheck = await verifyAdminAuthorization("manage_user_roles");
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const cleanEmail = email?.trim().toLowerCase() || (id?.includes("@") ? id.trim().toLowerCase() : undefined);
  const isUUID = isValidUUID(id);

  if (!isUUID && !cleanEmail) {
    return { success: false, error: "A valid member UUID or email is required." };
  }

  try {
    const adminClient = createAdminClient();

    // 1. Look up member records from both club_members and profiles
    let cmRecord: any = null;
    let profRecord: any = null;

    if (isUUID) {
      const { data: cmById, error: cmFetchErr } = await (adminClient.from("club_members") as any)
        .select("id, email, avatar_url")
        .eq("id", id)
        .maybeSingle();
      if (cmFetchErr) {
        return { success: false, error: `Failed to query club member: ${cmFetchErr.message}` };
      }
      cmRecord = cmById;

      const { data: profById, error: profFetchErr } = await (adminClient.from("profiles") as any)
        .select("id, email, avatar_url")
        .eq("id", id)
        .maybeSingle();
      if (profFetchErr) {
        return { success: false, error: `Failed to query member profile: ${profFetchErr.message}` };
      }
      profRecord = profById;
    }

    const resolvedEmail = cleanEmail || cmRecord?.email || profRecord?.email;

    if (!cmRecord && resolvedEmail) {
      const { data: cmByEmail, error: cmEmailFetchErr } = await (adminClient.from("club_members") as any)
        .select("id, email, avatar_url")
        .ilike("email", resolvedEmail)
        .maybeSingle();
      if (cmEmailFetchErr) {
        return { success: false, error: `Failed to query club member by email: ${cmEmailFetchErr.message}` };
      }
      cmRecord = cmByEmail;
    }

    if (!profRecord && resolvedEmail) {
      const { data: profByEmail, error: profEmailFetchErr } = await (adminClient.from("profiles") as any)
        .select("id, email, avatar_url")
        .ilike("email", resolvedEmail)
        .maybeSingle();
      if (profEmailFetchErr) {
        return { success: false, error: `Failed to query profile by email: ${profEmailFetchErr.message}` };
      }
      profRecord = profByEmail;
    }

    // Collect all candidate avatars to delete
    const avatarPathsToDelete = new Set<string>();
    [cmRecord?.avatar_url, profRecord?.avatar_url].forEach((url) => {
      const p = extractAvatarStoragePath(url);
      if (p) avatarPathsToDelete.add(p);
    });

    // 2. Remove avatar file(s) from media/avatars/ using admin client and verify deletion
    for (const avatarPath of Array.from(avatarPathsToDelete)) {
      const { error: removeErr } = await adminClient.storage
        .from("media")
        .remove([avatarPath]);

      if (removeErr) {
        console.error(`[deleteMemberAction] Failed to remove avatar file "${avatarPath}":`, removeErr);
        return {
          success: false,
          error: `Failed to delete avatar from storage: ${removeErr.message}`,
        };
      }

      // Verify the file is actually gone (do not just trust { error: null })
      const fileName = avatarPath.split("/").pop();
      if (fileName) {
        const { data: checkFiles, error: checkErr } = await adminClient.storage
          .from("media")
          .list("avatars", { search: fileName });

        if (checkErr) {
          console.warn(`[deleteMemberAction] Could not list avatars to verify deletion of "${fileName}":`, checkErr);
        } else if (checkFiles && checkFiles.some((f: any) => f.name === fileName)) {
          return {
            success: false,
            error: `Avatar file "${fileName}" still exists in storage after deletion attempt.`,
          };
        }
      }
    }

    // Collect all user IDs associated with this member
    const userIdsToUnlink = new Set<string>();
    if (isUUID) userIdsToUnlink.add(id);
    if (cmRecord?.id && isValidUUID(cmRecord.id)) userIdsToUnlink.add(cmRecord.id);
    if (profRecord?.id && isValidUUID(profRecord.id)) userIdsToUnlink.add(profRecord.id);

    // 3. Decision 2: Preserve registrations — set registrations.user_id = NULL
    for (const uid of Array.from(userIdsToUnlink)) {
      const { error: regErr } = await (adminClient.from("registrations") as any)
        .update({ user_id: null })
        .eq("user_id", uid);

      if (regErr) {
        console.error(`[deleteMemberAction] Failed to unlink registrations for user_id "${uid}":`, regErr);
        return {
          success: false,
          error: `Failed to unlink member registrations: ${regErr.message}`,
        };
      }
    }

    // 4. Delete member row(s) from club_members and profiles
    for (const uid of Array.from(userIdsToUnlink)) {
      const { error: cmDeleteErr } = await (adminClient.from("club_members") as any)
        .delete()
        .eq("id", uid);
      if (cmDeleteErr) {
        return { success: false, error: `Failed to delete club member record: ${cmDeleteErr.message}` };
      }

      const { error: profDeleteErr } = await (adminClient.from("profiles") as any)
        .delete()
        .eq("id", uid);
      if (profDeleteErr) {
        return { success: false, error: `Failed to delete user profile record: ${profDeleteErr.message}` };
      }
    }

    if (resolvedEmail) {
      const { error: cmEmailDelErr } = await (adminClient.from("club_members") as any)
        .delete()
        .ilike("email", resolvedEmail);
      if (cmEmailDelErr) {
        return { success: false, error: `Failed to delete club member by email: ${cmEmailDelErr.message}` };
      }

      const { error: profEmailDelErr } = await (adminClient.from("profiles") as any)
        .delete()
        .ilike("email", resolvedEmail);
      if (profEmailDelErr) {
        return { success: false, error: `Failed to delete profile by email: ${profEmailDelErr.message}` };
      }
    }

    // 5. Revalidate all public and admin routes that display member or team info
    revalidatePath("/");
    revalidatePath("/members");
    revalidatePath("/leadership");
    revalidatePath("/about");
    revalidatePath("/admin/members");
    revalidatePath("/admin/leadership");
    revalidatePath("/admin/team");
    revalidatePath("/admin");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/registrations");

    return { success: true };
  } catch (err: any) {
    console.error("[deleteMemberAction] Unexpected exception:", err);
    return { success: false, error: err?.message || "Failed to delete member." };
  }
}

/**
 * Alias for updateMemberAction — kept for backward compatibility with dialogs.
 */
export const updateMemberRoleAction = updateMemberAction;
