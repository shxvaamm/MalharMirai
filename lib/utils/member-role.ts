/**
 * getMemberRole — canonical role-designation resolver for members.
 *
 * Rules:
 *   - If `role` is a non-empty, non-whitespace string → return trimmed value.
 *   - Otherwise (null, undefined, "", "   ") → return "Member".
 *
 * Used on both the save side (server actions, dialog submit handlers) and the
 * display side (public cards, mapRowToMember, leadership section) so the logic
 * lives in exactly one place.
 */
export function getMemberRole(role?: string | null): string {
  const trimmed = (role ?? "").trim();
  return trimmed.length > 0 ? trimmed : "Member";
}
