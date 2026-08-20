"use client";

import * as React from "react";
import {
  Crown,
  ShieldCheck,
  Instagram,
  Linkedin,
  Sparkles,
  Award,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { getLeadershipRank, getLeadershipBadgeColor, isLeadershipRole } from "@/lib/leadership";
import { isSuperAdminEmail } from "@/lib/auth/rbac";
import { ClubMember, MOCK_MEMBERS } from "@/lib/mock-data";
import { getSyncedData, STORAGE_KEYS } from "@/lib/store/sync-store";
import Image from "next/image";
import { ScrollReveal } from "@/components/public/scroll-reveal";

export default function LeadershipPage() {
  const [members, setMembers] = React.useState<ClubMember[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;

    async function loadLeadershipProfiles() {
      try {
        // Fast initial render from synced storage
        const cached = getSyncedData<ClubMember[]>(STORAGE_KEYS.MEMBERS, MOCK_MEMBERS);
        const cachedCore = cached.filter((c) =>
          isLeadershipRole(c.specialty, c.department)
        );
        if (cachedCore.length > 0 && isMounted) {
          setMembers(cachedCore);
        }

        const supabase = createClient();

        // Dual-source fetch: club_members (admin-managed) + profiles (auth users)
        const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));
        const [clubResult, profilesResult] = await Promise.all([
          Promise.race([
            (supabase.from("club_members") as any).select("*"),
            timeout.then(() => ({ data: null })),
          ]),
          Promise.race([
            (supabase.from("profiles") as any).select("*"),
            timeout.then(() => ({ data: null })),
          ]),
        ]);

        const clubRows: any[] = clubResult?.data || [];
        const profileRows: any[] = profilesResult?.data || [];

        // Deduplicate & merge
        const seenIds = new Set<string>();
        const seenEmails = new Set<string>();
        const rawMerged: any[] = [];

        for (const row of clubRows) {
          const email = (row.email || "").toLowerCase().trim();
          if (!seenIds.has(row.id) && !seenEmails.has(email)) {
            seenIds.add(row.id);
            if (email) seenEmails.add(email);
            rawMerged.push(row);
          }
        }

        for (const row of profileRows) {
          const email = (row.email || "").toLowerCase().trim();
          if (!seenIds.has(row.id) && !seenEmails.has(email)) {
            seenIds.add(row.id);
            if (email) seenEmails.add(email);
            rawMerged.push(row);
          }
        }

        // Include any locally cached members
        for (const c of cached) {
          const email = (c.email || "").toLowerCase().trim();
          if (!seenIds.has(c.id) && !seenEmails.has(email)) {
            seenIds.add(c.id);
            if (email) seenEmails.add(email);
            rawMerged.push(c);
          }
        }

        // Filter only leadership roles
        const coreProfiles = rawMerged.filter((p: any) => {
          const specialty = (p.specialty || p.leadership_role || p.position || "").trim();
          const department = (p.department || "").trim();
          return isLeadershipRole(specialty, department);
        });

        if (isMounted) {
          if (coreProfiles.length > 0) {
            const mapped: ClubMember[] = coreProfiles.map((d: any) => {
              const initials = d.full_name
                ? d.full_name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "MC";

              const resolvedSpecialty =
                d.specialty ||
                d.leadership_role ||
                d.position ||
                (isSuperAdminEmail(d.email)
                  ? "President"
                  : d.role === "admin" || d.role === "super_admin"
                  ? "Lead Coordinator"
                  : "Core Member");

              return {
                id: d.id,
                full_name: d.full_name || (isSuperAdminEmail(d.email) ? "Shivam Kumar" : "Core Leader"),
                email: d.email || "",
                role:
                  d.role === "admin" || d.role === "super_admin" || isSuperAdminEmail(d.email)
                    ? "admin"
                    : "member",
                department: d.department || "Core Committee",
                phone: d.phone || "",
                avatar_url: d.avatar_url || null,
                avatar_initials: initials,
                bio: d.bio || `${resolvedSpecialty} leading MALHAR cultural initiatives.`,
                year: d.year || "3rd Year",
                specialty: resolvedSpecialty,
                socials: {
                  instagram: d.instagram || d.socials?.instagram || null,
                  linkedin: d.linkedin || d.socials?.linkedin || null,
                },
              };
            });

            // Sort by leadership hierarchy rank
            mapped.sort((a, b) => {
              const rankA = getLeadershipRank(a.specialty);
              const rankB = getLeadershipRank(b.specialty);
              if (rankA !== rankB) return rankA - rankB;
              return a.full_name.localeCompare(b.full_name);
            });

            setMembers(mapped);
          } else {
            setMembers([]);
          }
        }
      } catch (err) {
        console.warn("Leadership public fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadLeadershipProfiles();

    // Supabase Realtime — cross-device sync on club_members & profiles
    let channel: any = null;
    try {
      const supabase = createClient();
      channel = supabase
        .channel("public_leadership_sync_v2")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "club_members" },
          () => {
            loadLeadershipProfiles();
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles" },
          () => {
            loadLeadershipProfiles();
          }
        )
        .subscribe();
    } catch {}

    return () => {
      isMounted = false;
      if (channel) {
        try {
          const supabase = createClient();
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header Banner */}
      <ScrollReveal variant="reveal" className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-100">
          Core <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">Committee</span>
        </h1>

        <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
          Meet the student executives and core committee steering the cultural productions, operations, and legacy of MALHAR at Mirai School of Technology.
        </p>
      </ScrollReveal>

      {/* Leadership Grid */}
      {loading && members.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-white/[0.06] text-center space-y-3 max-w-md mx-auto">
          <div className="h-8 w-8 rounded-full border-2 border-neutral-400 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-neutral-400">Loading core committee...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-white/[0.06] text-center space-y-3 max-w-md mx-auto bg-[#0D0D0D]">
          <Crown className="h-10 w-10 text-neutral-500 mx-auto" />
          <h3 className="text-lg font-bold text-neutral-100">No Core Committee Listed Yet</h3>
          <p className="text-xs text-neutral-400">
            President, Vice President, Treasurer, Media Head, and Faculty Coordinator appointed in the Admin Portal will appear live here.
          </p>
        </div>
      ) : (
        <ScrollReveal variant="reveal" stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {members.map((leader) => {
            const rank = getLeadershipRank(leader.specialty);
            const badgeStyle = getLeadershipBadgeColor(leader.specialty);

            const hasInstagram = !!leader.socials?.instagram;
            const hasLinkedIn = !!leader.socials?.linkedin;
            const isAdmin = leader.role === "admin" || isSuperAdminEmail(leader.email);

            return (
              <Card
                key={leader.id}
                className="glass-card border border-white/[0.06] hover:border-white/20 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between group shadow-xl bg-[#0D0D0D]/85"
              >
                <div>
                  {/* Member Photo in Rectangular Format matching Members card */}
                  <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-black rounded-t-3xl">
                    <div className="h-full w-full relative">
                      {leader.avatar_url ? (
                        <Image
                          src={leader.avatar_url}
                          alt={leader.full_name}
                          fill
                          unoptimized
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="relative h-full w-full flex items-center justify-center bg-neutral-900">
                          <div className="h-32 w-32 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-200 font-bold text-5xl shadow-xl border border-white/15 group-hover:scale-105 transition-transform duration-300">
                            {leader.avatar_initials}
                          </div>
                        </div>
                      )}

                      {/* Ambient Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20 pointer-events-none" />

                      {/* Official Role Badge + Admin Star + Year overlay on photo */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                        <Badge
                          className={`text-[10px] uppercase font-semibold tracking-wider px-3 py-0.5 rounded-full border shadow-sm flex items-center gap-1.5 backdrop-blur-md ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                        >
                          {rank === 1 ? (
                            <Crown className="h-3 w-3 text-neutral-300" />
                          ) : rank === 2 ? (
                            <Award className="h-3 w-3 text-neutral-300" />
                          ) : rank === 3 ? (
                            <ShieldCheck className="h-3 w-3 text-neutral-400" />
                          ) : (
                            <Sparkles className="h-3 w-3 text-neutral-400" />
                          )}
                          <span>{leader.specialty}</span>
                        </Badge>

                        <div className="flex items-center gap-1.5">
                          {/* Admin Star Badge — shown only when this core member is also an admin */}
                          {isAdmin && (
                            <span
                              title="Admin Access"
                              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-200 shadow-[0_0_8px_rgba(255,255,255,0.25)] border border-white/20"
                            >
                              <Star className="h-3 w-3 fill-neutral-950 text-neutral-950" />
                            </span>
                          )}
                          <span className="text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-black/85 border border-white/10 text-neutral-400 backdrop-blur-md shadow-sm">
                            {leader.year || "3rd Year"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Leader Details */}
                  <div className="px-5 py-4 text-center space-y-2">
                    <h3 className="text-lg sm:text-xl font-bold text-neutral-100 tracking-tight group-hover:text-neutral-300 transition-colors line-clamp-1">
                      {leader.full_name}
                    </h3>

                    <p className="text-xs text-neutral-400 leading-relaxed min-h-[38px] line-clamp-2 px-1">
                      {leader.bio || `${leader.specialty} leading MALHAR cultural initiatives.`}
                    </p>
                  </div>
                </div>

                {/* Social Links Footer */}
                <div className="p-4 border-t border-white/[0.06] flex items-center justify-center gap-2.5 bg-black/40">
                  {hasInstagram ? (
                    <a
                      href={leader.socials!.instagram}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-neutral-200 hover:text-white hover:bg-white/10 hover:border-white/25 transition-all font-semibold text-xs shadow-sm"
                    >
                      <Instagram className="h-3.5 w-3.5" />
                      <span>Instagram</span>
                    </a>
                  ) : null}

                  {hasLinkedIn ? (
                    <a
                      href={leader.socials!.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-neutral-200 hover:text-white hover:bg-white/10 hover:border-white/25 transition-all font-semibold text-xs shadow-sm"
                    >
                      <Linkedin className="h-3.5 w-3.5" />
                      <span>LinkedIn</span>
                    </a>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </ScrollReveal>
      )}
    </div>
  );
}
