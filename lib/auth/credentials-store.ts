"use client";

import { UserRole, SUPER_ADMIN_EMAILS, VALID_SUPER_ADMIN_PASSWORDS } from "@/lib/auth/rbac";
import { getSyncedData, setSyncedData, STORAGE_KEYS } from "@/lib/store/sync-store";
import { ClubMember, MOCK_MEMBERS } from "@/lib/mock-data";

export interface RegisteredCredential {
  email: string;
  password: string;
  role: UserRole;
  fullName: string;
  department?: string;
  createdAt: string;
}

const CREDENTIALS_KEY = "malhar_registered_credentials";
const ACTIVE_SUPER_ADMIN_KEY = "malhar_current_super_admin_email";

/**
 * Gets the exclusive Super Admin email.
 */
export function getActiveSuperAdminEmail(): string {
  if (typeof window === "undefined") return "shvxamkumar@gmail.com";
  try {
    const stored = localStorage.getItem(ACTIVE_SUPER_ADMIN_KEY);
    if (stored) return stored.toLowerCase().trim();
  } catch {
    // fallback
  }
  return "shvxamkumar@gmail.com";
}

let inMemoryCredentials: RegisteredCredential[] = [];

/**
 * Gets all locally registered credentials/user accounts.
 * Strictly enforces only ONE Super Admin.
 */
export function getRegisteredCredentials(): RegisteredCredential[] {
  let list = inMemoryCredentials;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(CREDENTIALS_KEY);
      if (raw) list = JSON.parse(raw) as RegisteredCredential[];
    } catch {
      list = inMemoryCredentials;
    }
  }

  const superEmail = getActiveSuperAdminEmail().toLowerCase();
  return list.map((c) => {
    const isSuper = c.email.toLowerCase() === superEmail;
    if (isSuper) {
      return { ...c, role: "super_admin" as UserRole };
    }
    if (c.role === "super_admin") {
      return { ...c, role: "admin" as UserRole };
    }
    return c;
  });
}

/**
 * Checks if an email is designated as an Admin chosen by the Super Admin.
 */
export function isDesignatedAdmin(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (normalized === "shvxamkumar@gmail.com") return true;

  // Check if member roster has role === 'admin'
  const members = typeof window !== "undefined"
    ? getSyncedData<ClubMember[]>(STORAGE_KEYS.MEMBERS, MOCK_MEMBERS)
    : MOCK_MEMBERS;
  const member = members.find((m) => m.email.toLowerCase() === normalized);
  if (member && member.role === "admin") return true;

  // Check registered credentials with admin role
  const creds = getRegisteredCredentials();
  const cred = creds.find((c) => c.email.toLowerCase() === normalized);
  if (cred && (cred.role === "admin" || cred.role === "super_admin")) return true;

  return false;
}

/**
 * Atomically updates a user's role across client credential store and synced members.
 */
export function updateRegisteredUserRole(
  email: string,
  newRole: UserRole
): boolean {
  const normalized = email.trim().toLowerCase();

  // Super admin account is permanently locked
  if (normalized === "shvxamkumar@gmail.com" && newRole !== "super_admin") {
    return false;
  }

  // Prevent any other user from becoming super_admin
  const assignedRole: UserRole = (newRole === "super_admin" && normalized !== "shvxamkumar@gmail.com")
    ? "admin"
    : newRole;

  const allCreds = getRegisteredCredentials();
  const credIdx = allCreds.findIndex((c) => c.email.toLowerCase() === normalized);

  if (credIdx >= 0) {
    allCreds[credIdx].role = assignedRole;
  } else {
    allCreds.push({
      email: normalized,
      password: "",
      role: assignedRole,
      fullName: normalized.split("@")[0],
      createdAt: new Date().toISOString(),
    });
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(allCreds));
    } catch {
      // ignore
    }
  } else {
    inMemoryCredentials = allCreds;
  }

  // Sync with member store
  const members = getSyncedData<ClubMember[]>(STORAGE_KEYS.MEMBERS, MOCK_MEMBERS);
  const memberIdx = members.findIndex((m) => m.email.toLowerCase() === normalized);
  if (memberIdx >= 0) {
    members[memberIdx].role = newRole === "super_admin" || newRole === "admin" ? "admin" : newRole === "volunteer" ? "volunteer" : "member";
    setSyncedData(STORAGE_KEYS.MEMBERS, members);
  } else {
    members.push({
      id: `member-${normalized.replace(/[^a-zA-Z0-9]/g, "-")}`,
      full_name: normalized.split("@")[0],
      email: normalized,
      role: newRole === "super_admin" || newRole === "admin" ? "admin" : newRole === "volunteer" ? "volunteer" : "member",
      department: "Management Department",
      phone: "+91 98765 00000",
      avatar_initials: normalized.substring(0, 2).toUpperCase(),
      specialty: newRole === "admin" ? "Society Administrator" : newRole === "volunteer" ? "Society Volunteer" : "Society Member",
      bio: "Active contributor to MALHAR.",
    });
    setSyncedData(STORAGE_KEYS.MEMBERS, members);
  }

  return true;
}

/**
 * Deletes a registered credential / user by email and syncs members list.
 */
export function deleteRegisteredCredential(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (normalized === "shvxamkumar@gmail.com") {
    return false; // Root super admin cannot be deleted
  }

  const allCreds = getRegisteredCredentials().filter(
    (c) => c.email.toLowerCase() !== normalized
  );

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(allCreds));
    } catch {
      // ignore
    }
  } else {
    inMemoryCredentials = allCreds;
  }

  // Also remove from members synced store
  const members = getSyncedData<ClubMember[]>(STORAGE_KEYS.MEMBERS, MOCK_MEMBERS).filter(
    (m) => m.email.toLowerCase() !== normalized
  );
  setSyncedData(STORAGE_KEYS.MEMBERS, members);

  return true;
}

/**
 * Atomically transfers Super Admin ownership in client storage:
 * - Demotes old Super Admin -> Admin
 * - Promotes new Super Admin -> Super Admin
 * - Stores active super admin email
 */
export function transferSuperAdminInStore(
  targetEmail: string,
  currentSuperAdminEmail?: string
): { success: boolean; previousSuperAdmin: string; newSuperAdmin: string } {
  const newSuper = targetEmail.trim().toLowerCase();
  const prevSuper = (currentSuperAdminEmail || getActiveSuperAdminEmail()).trim().toLowerCase();

  if (typeof window !== "undefined") {
    // 1. Update Active Super Admin key
    localStorage.setItem(ACTIVE_SUPER_ADMIN_KEY, newSuper);

    // 2. Demote previous Super Admin in credentials
    const allCreds = getRegisteredCredentials();
    const prevCredIdx = allCreds.findIndex((c) => c.email.toLowerCase() === prevSuper);
    if (prevCredIdx >= 0) {
      allCreds[prevCredIdx].role = "admin";
    }

    // 3. Promote target to Super Admin
    const targetCredIdx = allCreds.findIndex((c) => c.email.toLowerCase() === newSuper);
    if (targetCredIdx >= 0) {
      allCreds[targetCredIdx].role = "super_admin";
    } else {
      allCreds.push({
        email: newSuper,
        password: "Admin@2026",
        role: "super_admin",
        fullName: "Super Administrator",
        department: "Executive Council",
        createdAt: new Date().toISOString(),
      });
    }

    try {
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(allCreds));
    } catch {
      // ignore
    }

    // 4. Update member roster
    const members = getSyncedData<ClubMember[]>(STORAGE_KEYS.MEMBERS, MOCK_MEMBERS);
    const prevMemIdx = members.findIndex((m) => m.email.toLowerCase() === prevSuper);
    if (prevMemIdx >= 0) {
      members[prevMemIdx].role = "admin";
    }

    const targetMemIdx = members.findIndex((m) => m.email.toLowerCase() === newSuper);
    if (targetMemIdx >= 0) {
      members[targetMemIdx].role = "admin";
    }

    setSyncedData(STORAGE_KEYS.MEMBERS, members);
  }

  return {
    success: true,
    previousSuperAdmin: prevSuper,
    newSuperAdmin: newSuper,
  };
}

/**
 * Appoints a new Administrator by email.
 * Allows the Super Admin to add as many Administrators as desired without any limit.
 */
export function appointNewAdmin(input: {
  email: string;
  fullName: string;
  department?: string;
  specialty?: string;
  initialPassword?: string;
}): { success: boolean; error?: string } {
  const normalized = input.email.trim().toLowerCase();
  if (!normalized) return { success: false, error: "Email is required." };

  const allCreds = getRegisteredCredentials();
  const existingIdx = allCreds.findIndex((c) => c.email.toLowerCase() === normalized);

  const credRecord: RegisteredCredential = {
    email: normalized,
    password: input.initialPassword?.trim() || "Admin@2026",
    role: "admin",
    fullName: input.fullName.trim() || normalized.split("@")[0],
    department: input.department?.trim() || "Executive Council",
    createdAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    allCreds[existingIdx] = {
      ...allCreds[existingIdx],
      ...credRecord,
      password: input.initialPassword?.trim() || allCreds[existingIdx].password || "Admin@2026",
    };
  } else {
    allCreds.push(credRecord);
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(allCreds));
    } catch {
      // ignore
    }
  }

  // Also sync with member store
  const members = getSyncedData<ClubMember[]>(STORAGE_KEYS.MEMBERS, MOCK_MEMBERS);
  const memberIdx = members.findIndex((m) => m.email.toLowerCase() === normalized);
  if (memberIdx >= 0) {
    members[memberIdx].role = "admin";
    if (input.fullName) members[memberIdx].full_name = input.fullName.trim();
    if (input.department) members[memberIdx].department = input.department.trim();
    setSyncedData(STORAGE_KEYS.MEMBERS, members);
  } else {
    members.push({
      id: `member-${normalized.replace(/[^a-zA-Z0-9]/g, "-")}`,
      full_name: input.fullName.trim() || normalized.split("@")[0],
      email: normalized,
      role: "admin",
      department: input.department?.trim() || "Executive Council",
      phone: "+91 98765 00000",
      avatar_initials: (input.fullName || normalized).substring(0, 2).toUpperCase(),
      specialty: input.specialty?.trim() || "Society Administrator",
      bio: "Appointed Administrator of MALHAR.",
    });
    setSyncedData(STORAGE_KEYS.MEMBERS, members);
  }

  return { success: true };
}

/**
 * Registers an administrator password and account.
 * ONLY the Super Admin (shvxamkumar@gmail.com) and Admins chosen by the Super Admin can register!
 */
export function registerAccountCredential(input: {
  fullName: string;
  email: string;
  password: string;
  department?: string;
  specialty?: string;
}): { success: boolean; role: UserRole; error?: string } {
  const normalizedEmail = input.email.trim().toLowerCase();
  const trimmedPass = input.password.trim();


  if (!normalizedEmail || !trimmedPass) {
    return { success: false, role: "member", error: "Email and password are required." };
  }

  const isSuper = normalizedEmail === "shvxamkumar@gmail.com";

  // Check if this user was chosen / promoted to Admin by the Super Admin
  const currentMembers = getSyncedData<ClubMember[]>(STORAGE_KEYS.MEMBERS, MOCK_MEMBERS);
  const existingMember = currentMembers.find((m) => m.email.toLowerCase() === normalizedEmail);
  const isApprovedAdmin = (existingMember && existingMember.role === "admin") || isDesignatedAdmin(normalizedEmail);

  // ONLY Super Admin and chosen Admins can register
  if (!isSuper && !isApprovedAdmin) {
    return {
      success: false,
      role: "member",
      error: "Registration Restricted: Only designated Administrators chosen and authorized by the Super Admin (shvxamkumar@gmail.com) can register.",
    };
  }

  const assignedRole: UserRole = isSuper ? "super_admin" : "admin";

  // Save registered account credentials in local storage
  const allCreds = getRegisteredCredentials();
  const existingIdx = allCreds.findIndex((c) => c.email.toLowerCase() === normalizedEmail);

  const newRecord: RegisteredCredential = {
    email: normalizedEmail,
    password: trimmedPass,
    role: assignedRole,
    fullName: input.fullName.trim() || existingMember?.full_name || (isSuper ? "Shivam Kumar" : "Administrator"),
    department: input.department || existingMember?.department || "Executive Council",
    createdAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    allCreds[existingIdx] = newRecord;
  } else {
    allCreds.push(newRecord);
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(allCreds));
      if (isSuper) {
        localStorage.setItem("malhar_custom_superadmin_password", trimmedPass);
      }
    } catch (e: any) {
      return { success: false, role: assignedRole, error: e?.message || "Failed to save credentials." };
    }
  } else {
    inMemoryCredentials = allCreds;
  }

  return { success: true, role: assignedRole };
}


/**
 * Validates sign-in credentials.
 * ONLY Super Admin and chosen Admins can log in! Other members are rejected.
 */
export function verifyCredentials(
  email: string,
  password: string
): { valid: boolean; role: UserRole; fullName?: string; error?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedPass = password.trim();

  const isSuper = normalizedEmail === "shvxamkumar@gmail.com";

  // 1. Super Admin Login Check (pass: Shivam@2026 or custom)
  if (isSuper) {
    const customSuperPass = typeof window !== "undefined"
      ? localStorage.getItem("malhar_custom_superadmin_password")
      : null;

    const allSuperPasswords = customSuperPass
      ? [...VALID_SUPER_ADMIN_PASSWORDS, customSuperPass]
      : VALID_SUPER_ADMIN_PASSWORDS;

    if (allSuperPasswords.includes(trimmedPass)) {
      return { valid: true, role: "super_admin", fullName: "Shivam Kumar (Super Admin)" };
    }

    return {
      valid: false,
      role: "super_admin",
      error: "Incorrect password for Super Admin account (default: Shivam@2026).",
    };
  }

  // 2. Check if this email is a chosen Administrator
  const currentMembers = getSyncedData<ClubMember[]>(STORAGE_KEYS.MEMBERS, MOCK_MEMBERS);
  const member = currentMembers.find((m) => m.email.toLowerCase() === normalizedEmail);
  const isApprovedAdmin = member && member.role === "admin";

  const registered = getRegisteredCredentials().find(
    (c) => c.email.toLowerCase() === normalizedEmail
  );

  // If user is a registered Admin
  if (registered && (registered.role === "admin" || isApprovedAdmin)) {
    if (registered.password === trimmedPass) {
      return { valid: true, role: "admin", fullName: registered.fullName || member?.full_name || "Administrator" };
    }
    return {
      valid: false,
      role: "admin",
      error: "Incorrect password. Please verify your administrator password.",
    };
  }

  // If user is designated as Admin in member roster but has not registered custom pass yet
  if (isApprovedAdmin) {
    if (trimmedPass === "Admin@2026" || trimmedPass === "admin123") {
      return {
        valid: true,
        role: "admin",
        fullName: member.full_name || "Administrator",
      };
    }
    return {
      valid: false,
      role: "admin",
      error: "Please enter your administrator password or set your password in Sign Up.",
    };
  }

  // 3. Other members and unauthorized users CANNOT log in
  return {
    valid: false,
    role: "member",
    error: "Access Restricted: Only designated Administrators and the Super Admin are permitted to log in. Other members cannot log in through the portal.",
  };
}
