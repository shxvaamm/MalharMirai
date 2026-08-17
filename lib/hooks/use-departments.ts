"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Department, OFFICIAL_DEPARTMENTS, MOCK_DEPARTMENTS } from "@/lib/mock-data";

import {
  getSyncedData,
  setSyncedData,
  STORAGE_KEYS,
  subscribeSync,
} from "@/lib/store/sync-store";

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>(OFFICIAL_DEPARTMENTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = useCallback(async () => {
    try {
      // 1. Immediately enforce official departments in storage & state
      setDepartments(OFFICIAL_DEPARTMENTS);
      setSyncedData(STORAGE_KEYS.DEPARTMENTS, OFFICIAL_DEPARTMENTS);

      // 2. Query Supabase in background (if needed to sync dynamic descriptions/leads)
      const supabase = createClient();
      const queryPromise = (supabase.from("departments") as any)
        .select("id, name, description")
        .order("name", { ascending: true });

      const timeoutPromise = new Promise<{ data: null }>((resolve) =>
        setTimeout(() => resolve({ data: null }), 1000)
      );

      const { data } = await Promise.race([queryPromise, timeoutPromise]);

      if (data && data.length > 0) {
        // Merge Supabase metadata only for official department names
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
        setDepartments(merged);
        setSyncedData(STORAGE_KEYS.DEPARTMENTS, merged);
      }
    } catch (err: any) {
      setDepartments(OFFICIAL_DEPARTMENTS);
      setSyncedData(STORAGE_KEYS.DEPARTMENTS, OFFICIAL_DEPARTMENTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // Realtime instant cross-tab & in-tab synchronization listener
  useEffect(() => {
    return subscribeSync<Department[]>(STORAGE_KEYS.DEPARTMENTS, OFFICIAL_DEPARTMENTS, (updated) => {
      setDepartments(updated);
    });
  }, []);

  return { departments, loading, error, refresh: fetchDepartments };
}
