"use server";

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// updateClubStatsAction() removed — dynamic stats are now computed live from canonical database collections.
