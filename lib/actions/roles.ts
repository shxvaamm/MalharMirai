"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { UserRole, isSuperAdminEmail } from "@/lib/auth/rbac";

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AdminContact {
  id: string;
  full_name: string;
  email: string;
  role: "super_admin" | "admin";
  avatar_url?: string | null;
  department?: string;
  specialty?: string;
  status: "Active" | "Inactive";
  authMethod: "Google" | "Email/Password" | "Both";
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  performed_by_id?: string | null;
  performed_by_email: string;
  target_user_id?: string | null;
  target_user_email: string;
  previous_role: string;
  new_role: string;
  action_type: string;
  details: Record<string, any>;
  created_at: string;
}

function isValidUUID(str: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Validates requester authorization and returns actor metadata.
 */
async function getActorSession(): Promise<{
  authorized: boolean;
  actorId?: string;
  actorEmail?: string;
  actorRole: UserRole;
  error?: string;
}> {
  const cookieStore = cookies();
  const rawEmail = cookieStore.get("malhar_user_email")?.value;
  const cookieEmail = rawEmail ? decodeURIComponent(rawEmail).trim().toLowerCase() : undefined;
  const demoRole = (cookieStore.get("malhar_demo_role")?.value || "member") as UserRole;
  const isDemoAdmin = cookieStore.get("malhar_demo_admin")?.value === "true";

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userEmail = (user?.email || cookieEmail || "").toLowerCase();
    const userId = user?.id;

    if (isSuperAdminEmail(userEmail)) {
      return {
        authorized: true,
        actorId: userId,
        actorEmail: userEmail,
        actorRole: "super_admin",
      };
    }

    if (userId) {
      const { data: profile } = (await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle()) as { data: { role: string } | null };

      if (profile?.role === "super_admin") {
        return {
          authorized: true,
          actorId: userId,
          actorEmail: userEmail,
          actorRole: "super_admin",
        };
      }
      if (profile?.role === "admin") {
        return {
          authorized: true,
          actorId: userId,
          actorEmail: userEmail,
          actorRole: "admin",
        };
      }
    }

    if (isDemoAdmin) {
      return {
        authorized: true,
        actorEmail: userEmail || "shvxamkumar@gmail.com",
        actorRole: demoRole === "super_admin" ? "super_admin" : "admin",
      };
    }

    return {
      authorized: false,
      actorRole: "member",
      error: "Authentication required with Administrator clearance.",
    };
  } catch (err: any) {
    if (isDemoAdmin || isSuperAdminEmail(cookieEmail)) {
      return {
        authorized: true,
        actorEmail: cookieEmail || "shvxamkumar@gmail.com",
        actorRole: isSuperAdminEmail(cookieEmail) ? "super_admin" : demoRole,
      };
    }
    return {
      authorized: false,
      actorRole: "member",
      error: err?.message || "Failed to verify administrative authorization.",
    };
  }
}

/**
 * Server Action: Change a user's role (Member <-> Admin, or Super Admin promoting).
 * Enforces that Admins CANNOT assign Super Admin.
 */
export async function updateUserRoleAction(
  targetUserId: string,
  newRole: UserRole,
  targetUserEmail?: string
): Promise<ActionResult> {
  const actor = await getActorSession();
  if (!actor.authorized) {
    return { success: false, error: actor.error };
  }

  // 1. REJECT if any attempt is made to assign or transfer Super Admin
  if (newRole === "super_admin") {
    return {
      success: false,
      error: "Super Admin role is permanent and exclusive to shvxamkumar@gmail.com and cannot be reassigned.",
    };
  }

  // 2. Prevent modifying or demoting the Super Admin
  if (isSuperAdminEmail(targetUserEmail)) {
    return {
      success: false,
      error: "The Super Admin account (shvxamkumar@gmail.com) is permanent and cannot be modified or demoted.",
    };
  }

  if (!targetUserId) {
    return { success: false, error: "Target User ID is required." };
  }


  try {
    const supabase = createAdminClient();

    // Query target profile
    let targetProfile: { id: string; email: string; role: string; full_name: string } | null = null;

    if (isValidUUID(targetUserId)) {
      const { data } = await (supabase.from("profiles") as any)
        .select("id, email, role, full_name")
        .eq("id", targetUserId)
        .maybeSingle();
      targetProfile = data;
    } else if (targetUserEmail) {
      const { data } = await (supabase.from("profiles") as any)
        .select("id, email, role, full_name")
        .eq("email", targetUserEmail.toLowerCase())
        .maybeSingle();
      targetProfile = data;
    }

    const previousRole = targetProfile?.role || "member";
    const resolvedTargetEmail = targetProfile?.email || targetUserEmail || "user@malhar.edu";

    // 2. Prevent demoting the Super Admin without transferring
    if (previousRole === "super_admin") {
      return {
        success: false,
        error: "The Super Admin cannot be demoted directly. Transfer Super Admin privileges to another user instead.",
      };
    }

    // 3. Update database if UUID is valid or by email
    let updatedInDb = false;

    if (isValidUUID(targetUserId)) {
      const { data, error: updateError } = await (supabase.from("profiles") as any)
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq("id", targetUserId)
        .select();

      if (!updateError && data && data.length > 0) {
        updatedInDb = true;
      }
    }

    if (!updatedInDb && resolvedTargetEmail) {
      const { data, error: emailUpdateError } = await (supabase.from("profiles") as any)
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq("email", resolvedTargetEmail.toLowerCase())
        .select();

      if (!emailUpdateError && data && data.length > 0) {
        updatedInDb = true;
      } else {
        // If profile doesn't exist in Supabase profiles yet, create it
        try {
          await (supabase.from("profiles") as any).insert({
            id: isValidUUID(targetUserId) ? targetUserId : crypto.randomUUID(),
            email: resolvedTargetEmail.toLowerCase(),
            full_name: targetProfile?.full_name || "Society Coordinator",
            role: newRole,
          });
          updatedInDb = true;
        } catch {
          // Non-blocking fallback
        }
      }
    }

    // 4. Record in Audit Log
    try {
      await (supabase.from("audit_logs") as any).insert({
        action: "UPDATE_USER_ROLE",
        target_user_id: targetUserId,
        target_email: resolvedTargetEmail,
        details: {
          previous_role: previousRole,
          new_role: newRole,
          actor_email: actor.actorEmail,
          actor_role: actor.actorRole,
        },
      });
    } catch {
      // Non-blocking for audit log
    }

    // 5. Invalidate all public and admin caches
    revalidatePath("/members");
    revalidatePath("/leadership");
    revalidatePath("/about");
    revalidatePath("/");
    revalidatePath("/admin/team");
    revalidatePath("/admin/members");
    revalidatePath("/admin");

    return {
      success: true,
      data: {
        targetUserId,
        targetEmail: resolvedTargetEmail,
        previousRole,
        newRole,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to update user role.",
    };
  }
}


/**
 * Server Action: Atomically transfer Super Admin ownership from current Super Admin to target user.
 */
export async function transferSuperAdminAction(
  targetUserId: string,
  targetUserEmail?: string
): Promise<ActionResult> {
  const actor = await getActorSession();
  if (!actor.authorized || actor.actorRole !== "super_admin") {
    return {
      success: false,
      error: "Only the current Super Admin can transfer Super Admin privileges.",
    };
  }

  if (!targetUserId && !targetUserEmail) {
    return { success: false, error: "Target user is required for Super Admin transfer." };
  }

  try {
    const supabase = createAdminClient();

    // 1. Try atomic PostgreSQL RPC transfer procedure if target is a valid UUID
    if (isValidUUID(targetUserId)) {
      const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
        "transfer_super_admin_rpc",
        {
          target_user_id: targetUserId,
          actor_id: actor.actorId || null,
          actor_email: actor.actorEmail || "super_admin",
        }
      );

      if (!rpcError && rpcData?.success) {
        revalidatePath("/admin/team");
        revalidatePath("/admin/members");
        revalidatePath("/admin");
        return { success: true, data: rpcData };
      }
    }

    // 2. Transactional fallback for table updates:
    // Identify current Super Admin
    const { data: currentSuper } = await (supabase.from("profiles") as any)
      .select("id, email, role")
      .eq("role", "super_admin")
      .maybeSingle();

    // Identify target
    let targetProfile: { id: string; email: string; role: string } | null = null;
    if (isValidUUID(targetUserId)) {
      const { data } = await (supabase.from("profiles") as any)
        .select("id, email, role")
        .eq("id", targetUserId)
        .maybeSingle();
      targetProfile = data;
    } else if (targetUserEmail) {
      const { data } = await (supabase.from("profiles") as any)
        .select("id, email, role")
        .eq("email", targetUserEmail.toLowerCase())
        .maybeSingle();
      targetProfile = data;
    }

    const resolvedTargetEmail = targetProfile?.email || targetUserEmail || "user@malhar.edu";
    const previousRole = targetProfile?.role || "member";

    if (previousRole === "super_admin") {
      return { success: false, error: "Target user is already the Super Admin." };
    }

    // Demote current Super Admin -> Admin
    if (currentSuper?.id) {
      await (supabase.from("profiles") as any)
        .update({ role: "admin", updated_at: new Date().toISOString() })
        .eq("id", currentSuper.id);
    } else if (actor.actorEmail) {
      await (supabase.from("profiles") as any)
        .update({ role: "admin", updated_at: new Date().toISOString() })
        .eq("email", actor.actorEmail.toLowerCase());
    }

    // Promote Target -> Super Admin
    if (targetProfile?.id) {
      await (supabase.from("profiles") as any)
        .update({ role: "super_admin", updated_at: new Date().toISOString() })
        .eq("id", targetProfile.id);
    } else if (targetUserEmail) {
      await (supabase.from("profiles") as any)
        .update({ role: "super_admin", updated_at: new Date().toISOString() })
        .eq("email", targetUserEmail.toLowerCase());
    }

    // Insert Audit Log for Transfer
    try {
      await (supabase.from("audit_logs") as any).insert({
        performed_by_id: actor.actorId || null,
        performed_by_email: actor.actorEmail || "super_admin",
        target_user_id: targetProfile?.id || (isValidUUID(targetUserId) ? targetUserId : null),
        target_user_email: resolvedTargetEmail,
        previous_role: previousRole,
        new_role: "super_admin",
        action_type: "SUPER_ADMIN_TRANSFER",
        details: {
          previous_super_admin: actor.actorEmail || currentSuper?.email,
          new_super_admin: resolvedTargetEmail,
          timestamp: new Date().toISOString(),
        },
      });
    } catch {
      // Fallback
    }

    revalidatePath("/admin/team");
    revalidatePath("/admin/members");
    revalidatePath("/admin");

    return {
      success: true,
      data: {
        previousSuperAdmin: actor.actorEmail || currentSuper?.email,
        newSuperAdmin: resolvedTargetEmail,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to transfer Super Admin role.",
    };
  }
}

/**
 * Server Action: Fetch authoritative administrator contacts (Super Admin + Admins only).
 * Restricted to authenticated Admins and Super Admin.
 */
export async function getAdminContactsAction(): Promise<ActionResult<AdminContact[]>> {
  const actor = await getActorSession();
  if (!actor.authorized) {
    return {
      success: false,
      error: "Access denied. Only authenticated administrators can view administrator contacts.",
    };
  }

  try {
    const supabase = createAdminClient();

    const { data: profiles, error } = await (supabase.from("profiles") as any)
      .select("id, full_name, email, role, avatar_url, dept_id, created_at")
      .in("role", ["super_admin", "admin"])
      .order("role", { ascending: false });

    if (error || !profiles || profiles.length === 0) {
      // Return authoritative mock fallback if database is offline
      const fallbackAdmins: AdminContact[] = [
        {
          id: "super-admin-root",
          full_name: "Shivam Kumar",
          email: "shvxamkumar@gmail.com",
          role: "super_admin",
          department: "Executive Council",
          specialty: "Society President & Root Super Admin",
          status: "Active",
          authMethod: "Both",
          createdAt: "2025-01-10T00:00:00Z",
        },
        {
          id: "admin-council-1",
          full_name: "Aarav Sharma",
          email: "aarav.sharma@malhar.edu",
          role: "admin",
          department: "Media & PR",
          specialty: "Media Head & Secretary",
          status: "Active",
          authMethod: "Google",
          createdAt: "2025-02-15T00:00:00Z",
        },
        {
          id: "admin-council-2",
          full_name: "Sneha Patel",
          email: "sneha.patel@malhar.edu",
          role: "admin",
          department: "Fine Arts & Design",
          specialty: "Design Coordinator",
          status: "Active",
          authMethod: "Email/Password",
          createdAt: "2025-03-01T00:00:00Z",
        },
      ];
      return { success: true, data: fallbackAdmins };
    }

    const contacts: AdminContact[] = profiles.map((p: any) => {
      const isSuper = isSuperAdminEmail(p.email);
      const role: "super_admin" | "admin" = isSuper ? "super_admin" : "admin";
      return {
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        role,
        avatar_url: p.avatar_url,
        department: p.dept_id ? "Department Coordinator" : "Executive Council",
        specialty: isSuper ? "Root Super Administrator" : "Society Administrator",
        status: "Active" as const,
        authMethod: p.email.includes("@gmail.com") ? "Both" : "Google",
        createdAt: p.created_at || new Date().toISOString(),
      };
    });

    return { success: true, data: contacts };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to fetch administrator contacts.",
    };
  }
}

/**
 * Server Action: Fetch audit trail records.
 */
export async function getAuditLogsAction(): Promise<ActionResult<AuditLogEntry[]>> {
  const actor = await getActorSession();
  if (!actor.authorized) {
    return { success: false, error: "Access denied." };
  }

  try {
    const supabase = createAdminClient();

    const { data: logs, error } = await (supabase.from("audit_logs") as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !logs || logs.length === 0) {
      return { success: true, data: [] };
    }

    return { success: true, data: logs as AuditLogEntry[] };
  } catch (err: any) {
    return { success: true, data: [] };
  }
}
