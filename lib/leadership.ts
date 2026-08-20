import { isSuperAdminEmail } from "@/lib/auth/rbac";

export const OFFICIAL_LEADERSHIP_ROLES = [
  "President",
  "Vice President",
  "Treasurer",
  "Media Head",
  "Tech Head",
  "Design Head",
  "Management Head",
  "PR Head",
  "Faculty Coordinator",
] as const;

export type OfficialLeadershipRole = (typeof OFFICIAL_LEADERSHIP_ROLES)[number];

/**
 * Hierarchy ranking rule:
 * 1. President / Founder / Super Admin
 * 2. Vice President
 * 3. Treasurer / Finance
 * 4. Media Head
 * 5. Tech Head
 * 6. Design Head
 * 7. Management Head
 * 8. PR Head
 * 9. Faculty Coordinator
 * 10. Other Heads / Leads / Coordinators
 */
export function getLeadershipRank(specialty: string = ""): number {
  const s = specialty.toLowerCase().trim();
  if (s.includes("vice president") || s.includes("vice-president") || s === "vp") {
    return 2;
  }
  if (s.includes("president") || s.includes("founder") || s.includes("super admin")) {
    return 1;
  }
  if (
    s.includes("treasurer") ||
    s.includes("treaturer") ||
    s.includes("finance") ||
    s.includes("treasury")
  ) {
    return 3;
  }
  if (
    s.includes("media") ||
    s.includes("social media")
  ) {
    return 4;
  }
  if (
    s.includes("tech") ||
    s.includes("technical") ||
    s.includes("web") ||
    s.includes("developer")
  ) {
    return 5;
  }
  if (
    s.includes("design") ||
    s.includes("creative") ||
    s.includes("graphics")
  ) {
    return 6;
  }
  if (
    s.includes("management") ||
    s.includes("operations") ||
    s.includes("event")
  ) {
    return 7;
  }
  if (
    s.includes("pr") ||
    s.includes("public relations") ||
    s.includes("outreach") ||
    s.includes("sponsorship")
  ) {
    return 8;
  }
  if (
    s.includes("faculty") ||
    s.includes("faculty coordinator") ||
    s.includes("faculty advisor") ||
    s.includes("mentor")
  ) {
    return 9;
  }
  if (
    s.includes("head") ||
    s.includes("lead") ||
    s.includes("secretary") ||
    s.includes("joint") ||
    s.includes("executive") ||
    s.includes("convenor") ||
    s.includes("coordinator") ||
    s.includes("core")
  ) {
    return 10;
  }
  return 15;
}

export function isLeadershipRole(
  specialty: string = "",
  department: string = "",
  role: string = "",
  email: string = ""
): boolean {
  if (email && isSuperAdminEmail(email)) return true;
  if (role === "super_admin" || role === "admin") return true;

  const d = (department || "").toLowerCase().trim();
  if (
    d.includes("leadership") ||
    d.includes("core") ||
    d.includes("executive") ||
    d.includes("board") ||
    d.includes("council")
  ) {
    return true;
  }

  const s = (specialty || "").toLowerCase().trim();
  if (!s) return false;
  if (getLeadershipRank(s) <= 15) return true;
  if (s !== "member" && s !== "general" && s !== "official member") return true;
  return false;
}

export function getLeadershipBadgeColor(specialty: string = ""): {
  bg: string;
  text: string;
  border: string;
  glow: string;
  iconColor: string;
} {
  const rank = getLeadershipRank(specialty);
  switch (rank) {
    case 1: // President
      return {
        bg: "bg-white/15",
        text: "text-white font-bold",
        border: "border-white/40",
        glow: "shadow-white/10",
        iconColor: "text-white",
      };
    case 2: // Vice President
      return {
        bg: "bg-white/10",
        text: "text-neutral-100 font-bold",
        border: "border-white/30",
        glow: "shadow-white/5",
        iconColor: "text-neutral-200",
      };
    case 3: // Treasurer
      return {
        bg: "bg-white/[0.08]",
        text: "text-neutral-200",
        border: "border-white/20",
        glow: "shadow-white/5",
        iconColor: "text-neutral-300",
      };
    case 4: // Media Head
    case 5: // Tech Head
    case 6: // Design Head
    case 7: // Management Head
    case 8: // PR Head
      return {
        bg: "bg-white/[0.06]",
        text: "text-neutral-200",
        border: "border-white/20",
        glow: "shadow-white/5",
        iconColor: "text-neutral-300",
      };
    case 9: // Faculty Coordinator
      return {
        bg: "bg-white/[0.06]",
        text: "text-neutral-200",
        border: "border-white/20",
        glow: "shadow-white/5",
        iconColor: "text-neutral-300",
      };
    default:
      return {
        bg: "bg-white/[0.06]",
        text: "text-neutral-300",
        border: "border-white/15",
        glow: "shadow-neutral-500/10",
        iconColor: "text-neutral-400",
      };
  }
}
