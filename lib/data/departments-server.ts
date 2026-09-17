/**
 * Server-side departments fetcher.
 * Must NOT be imported by client components — uses the server-only Supabase client.
 *
 * Merges Supabase descriptions into OFFICIAL_DEPARTMENTS (same logic as useDepartments).
 * Returns OFFICIAL_DEPARTMENTS on any error — they are the source of truth for names/structure.
 *
 * Revalidate: departments change only via admin console — 1 hour ISR is safe.
 */
import { createClient } from "@/lib/supabase/server";
import { Department, OFFICIAL_DEPARTMENTS } from "@/lib/mock-data";

export async function fetchDepartmentsServer(): Promise<Department[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("departments") as any)
      .select("id, name, description")
      .order("name", { ascending: true });

    if (error || !data || data.length === 0) {
      return OFFICIAL_DEPARTMENTS;
    }

    // Merge DB metadata into the hardcoded official list (same logic as the client hook)
    const merged = OFFICIAL_DEPARTMENTS.map((official) => {
      const match = data.find(
        (d: any) =>
          d.name?.toLowerCase().includes(official.name.toLowerCase().split(" ")[0]) ||
          official.name.toLowerCase().includes(d.name?.toLowerCase() || "")
      );
      if (match) {
        return {
          ...official,
          id: match.id || official.id,
          description: match.description || official.description,
        };
      }
      return official;
    });

    return merged;
  } catch {
    return OFFICIAL_DEPARTMENTS;
  }
}
