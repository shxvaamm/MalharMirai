"use client";

import {
  ClubEvent,
  ClubMember,
  Department,
  Announcement,
  GalleryMedia,
  ClubStats,
  MOCK_EVENTS,
  MOCK_MEMBERS,
  MOCK_DEPARTMENTS,
  MOCK_ANNOUNCEMENTS,
  MOCK_GALLERY,
  DEFAULT_CLUB_STATS,
} from "@/lib/mock-data";

export const STORAGE_KEYS = {
  EVENTS: "malhar_synced_events",
  DEPARTMENTS: "malhar_synced_departments",
  MEMBERS: "malhar_synced_members",
  ANNOUNCEMENTS: "malhar_synced_announcements",
  GALLERY: "malhar_synced_gallery",
  STATS: "malhar_synced_stats",
  REGISTRATIONS: "malhar_synced_registrations",
  HERO_SLIDES: "malhar_synced_hero_slides",
};


export const SYNC_EVENT_NAME = "malhar_state_synced";


const inMemoryCache = new Map<string, any>();

let sharedChannel: BroadcastChannel | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return null;
  if (!sharedChannel) {
    try {
      sharedChannel = new BroadcastChannel("malhar_data_channel");
      sharedChannel.onmessage = (event) => {
        if (event.data?.key) {
          if (event.data.data !== undefined) {
            inMemoryCache.set(event.data.key, event.data.data);
          } else {
            inMemoryCache.delete(event.data.key);
          }
          window.dispatchEvent(
            new CustomEvent(SYNC_EVENT_NAME, {
              detail: { key: event.data.key, data: event.data.data },
            })
          );
        }
      };
    } catch (e) {
      // ignore
    }
  }
  return sharedChannel;
}

// Initialize channel listener and storage listener eagerly on client
if (typeof window !== "undefined") {
  getBroadcastChannel();

  window.addEventListener("storage", (e) => {
    if (e.key && Object.values(STORAGE_KEYS).includes(e.key as any)) {
      try {
        const parsed = e.newValue ? JSON.parse(e.newValue) : null;
        if (parsed !== null) {
          inMemoryCache.set(e.key, parsed);
        } else {
          inMemoryCache.delete(e.key);
        }
        window.dispatchEvent(
          new CustomEvent(SYNC_EVENT_NAME, { detail: { key: e.key, data: parsed } })
        );
      } catch {}
    }
  });
}

/**
 * Broadcasts an update event across the browser so all open tabs and components re-render immediately.
 */
export function broadcastSync(key: string, data?: any) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME, { detail: { key, data } }));
    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage({ key, data, timestamp: Date.now() });
    }
  } catch (e) {
    // ignore
  }
}

/**
 * Gets cached synced data from in-memory cache, localStorage, or fallback.
 */
export function getSyncedData<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  if (inMemoryCache.has(key)) {
    return inMemoryCache.get(key) as T;
  }
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item) as T;
    inMemoryCache.set(key, parsed);
    return parsed;
  } catch {
    return fallback;
  }
}

/**
 * Saves synced data to cache, localStorage, and broadcasts update.
 */
export function setSyncedData<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  inMemoryCache.set(key, data);
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("[SyncStore] localStorage write warning:", e);
  }
  try {
    broadcastSync(key, data);
  } catch (e) {
    // ignore
  }
}

/**
 * Subscribes to real-time sync events for a specific storage key.
 */
export function subscribeSync<T>(
  key: string,
  fallback: T,
  onChange: (data: T) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const handleSync = (e: any) => {
    const eventKey = e?.detail?.key ?? e?.key;
    if (!eventKey || eventKey === key) {
      const data = e?.detail?.data !== undefined ? (e.detail.data as T) : getSyncedData<T>(key, fallback);
      onChange(data);
    }
  };

  window.addEventListener(SYNC_EVENT_NAME, handleSync);
  return () => {
    window.removeEventListener(SYNC_EVENT_NAME, handleSync);
  };
}



