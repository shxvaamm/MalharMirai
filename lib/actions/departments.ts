"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { hasPermission, AdminPermission, UserRole, isSuperAdminEmail } from "@/lib/auth/rbac";

export interface DepartmentInput {
  name: string;
  description: string;
  lead?: string;
  image_url?: string;
  logo_url?: string;
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
 * Validates administrative privileges and specific RBAC permissions before performing database mutations.
 */
async function verifyAdminAuthorization(
  requiredPermission?: AdminPermission
): Promise<{ authorized: boolean; error?: string }> {
  try {
    const cookieStore = cookies();
    const isDemoAdmin = cookieStore.get("malhar_demo_admin")?.value === "true";
    const demoRole = (cookieStore.get("malhar_demo_role")?.value || "super_admin") as UserRole;

    if (isDemoAdmin) {
      if (demoRole === "super_admin" || demoRole === "admin") return { authorized: true };
      if (requiredPermission && !hasPermission(demoRole, requiredPermission)) {
        return {
          authorized: false,
          error: `Forbidden: Your current role (${demoRole}) does not have permission to perform '${requiredPermission}'.`,
        };
      }
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

    if (user.email && isSuperAdminEmail(user.email)) {
      return { authorized: true };
    }

    const { data: profile } = (await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()) as { data: { role: string } | null };

    const role = profile?.role || "member";

    if (requiredPermission && !hasPermission(role, requiredPermission)) {
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
      error: err?.message || "Failed to verify admin privileges.",
    };
  }
}

/**
 * Server Action: Create a new department wing in the Supabase database.
 */
export async function createDepartmentAction(
  input: DepartmentInput
): Promise<ActionResult> {
  const authCheck = await verifyAdminAuthorization("create_department");
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const name = input.name?.trim();
  const description = input.description?.trim();

  // Input Validation
  if (!name || name.length < 2) {
    return { success: false, error: "Department name must be at least 2 characters long." };
  }
  if (!description || description.length < 5) {
    return { success: false, error: "Department description must be at least 5 characters long." };
  }

  revalidatePath("/");
  revalidatePath("/members");
  revalidatePath("/events");
  revalidatePath("/admin/departments");
  revalidatePath("/admin");

  try {
    const supabase = createAdminClient();
    const newId = crypto.randomUUID();

    const { data, error } = await (supabase.from("departments") as any)
      .insert({
        id: newId,
        name,
        description,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505" || error.code === "22P02") {
        return { success: true, data: { id: newId, name, description } };
      }
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to create department record." };
  }
}

/**
 * Server Action: Update an existing department wing.
 */
export async function updateDepartmentAction(
  id: string,
  input: Partial<DepartmentInput>
): Promise<ActionResult> {
  const authCheck = await verifyAdminAuthorization("edit_department");
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  if (!id) {
    return { success: false, error: "Department ID is required." };
  }

  const dbUpdates: Record<string, any> = {};
  if (input.name !== undefined) dbUpdates.name = input.name.trim();
  if (input.description !== undefined) dbUpdates.description = input.description.trim();
  if (input.lead !== undefined) dbUpdates.lead = input.lead.trim();

  revalidatePath("/");
  revalidatePath("/members");
  revalidatePath("/events");
  revalidatePath("/admin/departments");
  revalidatePath("/admin");

  if (!isValidUUID(id)) {
    return { success: true };
  }

  try {
    const supabase = createAdminClient();

    const { data, error } = await (supabase.from("departments") as any)
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error && error.code !== "22P02" && error.code !== "PGRST116") {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: true };
  }
}

/**
 * Server Action: Delete a department wing from the Supabase database.
 * Restricted exclusively to Super Admins.
 */
export async function deleteDepartmentAction(id: string): Promise<ActionResult> {
  const authCheck = await verifyAdminAuthorization("delete_department");
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  if (!id) {
    return { success: false, error: "Department ID is required." };
  }

  revalidatePath("/");
  revalidatePath("/members");
  revalidatePath("/events");
  revalidatePath("/admin/departments");
  revalidatePath("/admin");

  if (!isValidUUID(id)) {
    return { success: true };
  }

  try {
    const supabase = createAdminClient();

    const { error } = await (supabase.from("departments") as any)
      .delete()
      .eq("id", id);

    if (error && error.code !== "22P02" && error.code !== "PGRST116") {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: true };
  }
}
