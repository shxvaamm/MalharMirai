export const OFFICIAL_LEADERSHIP_ROLES = [
  "President",
  "Vice President",
  "Treasurer",
  "Media Head",
  "Faculty Coordinator",
] as const;

export type OfficialLeadershipRole = (typeof OFFICIAL_LEADERSHIP_ROLES)[number];

/**
 * Hierarchy ranking rule:
 * 1. President
 * 2. Vice President
 * 3. Treasurer
 * 4. Media Head
 * 5. Faculty Coordinator
 * 6. Other Heads / Coordinators
 */
export function getLeadershipRank(specialty: string = ""): number {
  const s = specialty.toLowerCase().trim();
  if (s.includes("vice president") || s.includes("vice-president") || s === "vp") {
    return 2;
  }
  if (s.includes("president")) {
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
    s.includes("media lead") ||
    s.includes("head of media")
  ) {
    return 4;
  }
  if (
    s.includes("faculty") ||
    s.includes("faculty coordinator") ||
    s.includes("faculty advisor") ||
    s.includes("mentor")
  ) {
    return 5;
  }
  return 10;
}

export function isLeadershipRole(specialty: string = ""): boolean {
  return getLeadershipRank(specialty) < 10;
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
        bg: "bg-neutral-900",
        text: "text-neutral-300",
        border: "border-neutral-800",
        glow: "shadow-neutral-500/10",
        iconColor: "text-neutral-400",
      };
  }
}
