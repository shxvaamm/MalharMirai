export type UserRole =
  | "super_admin"
  | "admin"
  | "member"
  | "volunteer";

export type AdminPermission =
  | "transfer_super_admin"
  | "promote_to_admin"
  | "demote_admin"
  | "manage_user_roles"
  | "view_admin_contacts"
  | "view_audit_logs"
  | "create_department"
  | "edit_department"
  | "delete_department"
  | "configure_leadership"
  | "create_event"
  | "edit_event"
  | "delete_event"
  | "assign_winners"
  | "export_registrations"
  | "send_broadcast"
  | "upload_gallery"
  | "view_admin_panel";

const ROLE_PERMISSIONS: Record<UserRole, AdminPermission[]> = {
  super_admin: [
    "transfer_super_admin",
    "promote_to_admin",
    "demote_admin",
    "manage_user_roles",
    "view_admin_contacts",
    "view_audit_logs",
    "create_department",
    "edit_department",
    "delete_department",
    "configure_leadership",
    "create_event",
    "edit_event",
    "delete_event",
    "assign_winners",
    "export_registrations",
    "send_broadcast",
    "upload_gallery",
    "view_admin_panel",
  ],
  admin: [
    "promote_to_admin",
    "demote_admin",
    "manage_user_roles",
    "view_admin_contacts",
    "create_department",
    "edit_department",
    "configure_leadership",
    "create_event",
    "edit_event",
    "assign_winners",
    "export_registrations",
    "send_broadcast",
    "upload_gallery",
    "view_admin_panel",
  ],
  member: [],
  volunteer: [],
};

/**
 * Designated Single Exclusive Super Admin.
 * Strictly only one Super Admin exists across the entire application.
 */
export const SUPER_ADMIN_EMAIL = "shvxamkumar@gmail.com";

export const SUPER_ADMIN_EMAILS = [
  SUPER_ADMIN_EMAIL,
];

export const VALID_SUPER_ADMIN_PASSWORDS = [
  "Shivam@2026",
];

export const VALID_ADMIN_PASSWORDS = [
  "Admin@2026",
  "admin123",
];

/**
 * Checks if a specific email belongs to the single exclusive Super Admin.
 */
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

/**
 * Resolves the effective UserRole from an email and database role.
 * Strictly enforces that ONLY the single Super Admin email can hold the 'super_admin' role.
 * All other administrators receive 'admin' role.
 */
export function resolveUserRole(email?: string | null, assignedRole?: string | null): UserRole {
  if (isSuperAdminEmail(email)) {
    return "super_admin";
  }
  if (assignedRole) {
    const normalized = assignedRole.toLowerCase();
    // Non-super-admin users are strictly capped at 'admin'
    if (normalized === "super_admin" || normalized === "admin") return "admin";
    if (normalized === "volunteer") return "volunteer";
  }
  return "member";
}

/**
 * Checks if a given role possesses a specific permission.
 */
export function hasPermission(role: string | null | undefined, permission: AdminPermission): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase() as UserRole;
  const permissions = ROLE_PERMISSIONS[normalizedRole] || [];
  return permissions.includes(permission);
}

/**
 * Returns formatted display title for roles.
 */
export function getRoleDisplayName(role: string | null | undefined): string {
  switch (role?.toLowerCase()) {
    case "super_admin":
      return "Super Admin";
    case "admin":
      return "Administrator";
    case "member":
      return "Official Member";
    case "volunteer":
      return "Volunteer";
    default:
      return "Official Member";
  }
}

/**
 * Returns color variant token for role badges.
 */
export function getRoleBadgeColor(role: string | null | undefined): string {
  switch (role?.toLowerCase()) {
    case "super_admin":
      return "bg-rose-500/20 text-rose-300 border-rose-500/40";
    case "admin":
      return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    case "volunteer":
      return "bg-teal-500/20 text-teal-300 border-teal-500/40";
    default:
      return "bg-slate-800 text-slate-300 border-slate-700";
  }
}

