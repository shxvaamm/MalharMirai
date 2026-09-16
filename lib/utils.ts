import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * Computes the effective event status dynamically at render time.
 * - Manual admin status ("completed", "ongoing", "cancelled") takes priority.
 * - For events still in "upcoming" (or default), if NOW() > registration_deadline
 *   (or NOW() > date_time), auto-classifies as "completed" (Past).
 */
export function getEffectiveEventStatus(event?: {
  status?: string | null;
  registration_deadline?: string | null;
  date_time?: string | null;
} | null): "upcoming" | "ongoing" | "completed" | string {
  if (!event) return "upcoming";

  // Manual admin statuses take priority
  if (event.status === "completed" || event.status === "ongoing" || event.status === "cancelled") {
    return event.status;
  }

  const now = Date.now();

  // If registration_deadline has passed, auto-classify as completed (past)
  if (event.registration_deadline) {
    const deadlineTime = new Date(event.registration_deadline).getTime();
    if (!isNaN(deadlineTime) && deadlineTime < now) {
      return "completed";
    }
  }

  // If event date_time itself has passed, auto-classify as completed (past)
  if (event.date_time) {
    const eventTime = new Date(event.date_time).getTime();
    if (!isNaN(eventTime) && eventTime < now) {
      return "completed";
    }
  }

  return event.status || "upcoming";
}

