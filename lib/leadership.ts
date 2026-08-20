export const OFFICIAL_LEADERSHIP_ROLES = [
  "President",
  "Vice President",
  "Treasurer",
  "Media Head",
  "Faculty Coordinator",
] as const;

export type OfficialLeadershipRole = (typeof OFFICIAL_LEADERSHIP_ROLES)[number];

/**
 * Hierarchy ranking rule for Core Committee:
 * 1. President / Founder
 * 2. Vice President
 * 3. Treasurer / Finance
 * 4. Media Head
 * 5. Faculty Coordinator
 */
export function getLeadershipRank(specialty: string = ""): number {
  const s = specialty.toLowerCase().trim();
  if (s.includes("vice president") || s.includes("vice-president") || s === "vp") {
    return 2;
  }
  if (s.includes("president") || s.includes("founder")) {
    return 1;
  }
  if (
    s.includes("treasurer") ||
    s.includes("treaturer") ||
    s.includes("finance head") ||
    s.includes("treasury")
  ) {
    return 3;
  }
  if (
    s.includes("media head") ||
    s.includes("head of media") ||
    s.includes("media")
  ) {
    return 4;
  }
  if (
    s.includes("tech") ||
    s.includes("technical")
  ) {
    return 5;
  }
  if (
    s.includes("design") ||
    s.includes("creative")
  ) {
    return 6;
  }
  if (
    s.includes("management") ||
    s.includes("coordinator")
  ) {
    return 7;
  }
  if (
    s.includes("specialist")
  ) {
    return 8;
  }
  if (
    s.includes("faculty coordinator") ||
    s.includes("faculty advisor") ||
    s.includes("mentor")
  ) {
    return 9;
  }
  return 10;
}

/**
 * Clean & strict separation:
 * Only returns true if the member belongs to the Core Committee / Leadership Board.
 * Department contributors, coordinators, and volunteers remain in Society Members.
 */
export function isLeadershipRole(specialty: string = "", department: string = ""): boolean {
  const d = (department || "").toLowerCase().trim();
  if (
    d === "leadership board" ||
    d === "core committee" ||
    d === "core" ||
    d === "leadership"
  ) {
    return true;
  }

  const s = (specialty || "").toLowerCase().trim();
  if (!s) return false;

  // Strict leadership roles
  if (
    s === "president" ||
    s === "vice president" ||
    s === "vice-president" ||
    s === "vp" ||
    s === "treasurer" ||
    s === "media head" ||
    s === "faculty coordinator" ||
    s === "faculty advisor" ||
    s === "founder" ||
    s === "club president" ||
    s === "society president" ||
    s === "club treasurer"
  ) {
    return true;
  }

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
      return {
        bg: "bg-white/[0.06]",
        text: "text-neutral-200",
        border: "border-white/20",
        glow: "shadow-white/5",
        iconColor: "text-neutral-300",
      };
    case 5: // Faculty Coordinator
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
