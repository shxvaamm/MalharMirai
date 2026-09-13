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
  Layers,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { ScrollReveal } from "@/components/public/scroll-reveal";
import { EmptyState } from "@/components/public/empty-state";
import { useMembers } from "@/lib/hooks/use-members";
import { isSuperAdminEmail } from "@/lib/auth/rbac";
import {
  isLeadershipRole,
  getLeadershipRank,
  getLeadershipBadgeColor,
} from "@/lib/leadership";
import { ClubMember } from "@/lib/mock-data";

// ─────────────────────────────────────────────────────────
// Year ordering helper
// Parses strings like "4th Year", "3rd Year", "2nd Year", "1st Year"
// and returns a numeric value used for descending sort.
// Unknown / missing years sort to the bottom (0).
// ─────────────────────────────────────────────────────────
function parseYearOrder(year: string = ""): number {
  const match = year.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// ─────────────────────────────────────────────────────────
// Loading skeleton — shared between the two sections
// ─────────────────────────────────────────────────────────
function CardSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl border border-white/[0.06] bg-neutral-900/80 animate-pulse h-80"
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Core Committee card
// ─────────────────────────────────────────────────────────
function CoreCard({ leader }: { leader: ClubMember }) {
  const rank = getLeadershipRank(leader.specialty);
  const badgeStyle = getLeadershipBadgeColor(leader.specialty);
  const hasInstagram = !!leader.socials?.instagram;
  const hasLinkedIn = !!leader.socials?.linkedin;
  const isAdmin = leader.role === "admin" || isSuperAdminEmail(leader.email);

  return (
    <Card className="glass-card border border-white/[0.06] hover:border-white/20 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between group shadow-xl bg-[#0D0D0D]/85">
      <div>
        {/* Photo / Initials */}
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

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20 pointer-events-none" />

            {/* Badges: role left, admin star + year right */}
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
                {isAdmin && (
                  <span
                    title="Admin Access"
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-200 shadow-[0_0_8px_rgba(255,255,255,0.25)] border border-white/20"
                  >
                    <Star className="h-3 w-3 fill-neutral-950 text-neutral-950" />
                  </span>
                )}
                <span className="text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-black/85 border border-white/10 text-neutral-400 backdrop-blur-md shadow-sm">
                  {leader.year || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Name + bio */}
        <div className="px-5 py-4 text-center space-y-2">
          <h3 className="text-lg sm:text-xl font-bold text-neutral-100 tracking-tight group-hover:text-neutral-300 transition-colors line-clamp-1">
            {leader.full_name}
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed min-h-[38px] line-clamp-2 px-1">
            {leader.bio || `${leader.specialty} leading MALHAR cultural initiatives.`}
          </p>
        </div>
      </div>

      {/* Social links */}
      <div className="p-4 border-t border-white/[0.06] flex items-center justify-center gap-2.5 bg-black/40">
        {hasInstagram && (
          <a
            href={leader.socials!.instagram!}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-neutral-200 hover:text-white hover:bg-white/10 hover:border-white/25 transition-all font-semibold text-xs shadow-sm"
          >
            <Instagram className="h-3.5 w-3.5" />
            <span>Instagram</span>
          </a>
        )}
        {hasLinkedIn && (
          <a
            href={leader.socials!.linkedin!}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-neutral-200 hover:text-white hover:bg-white/10 hover:border-white/25 transition-all font-semibold text-xs shadow-sm"
          >
            <Linkedin className="h-3.5 w-3.5" />
            <span>LinkedIn</span>
          </a>
        )}
        {!hasInstagram && !hasLinkedIn && (
          <span className="text-[10px] text-neutral-600 py-1">No socials listed</span>
        )}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────
// Regular member card
// ─────────────────────────────────────────────────────────
function MemberCard({ member }: { member: ClubMember }) {
  const isAdminRole = member.role === "admin" || isSuperAdminEmail(member.email);
  const hasInstagram = !!member.socials?.instagram;
  const hasLinkedIn = !!member.socials?.linkedin;

  return (
    <Card className="glass-card border border-white/[0.06] hover:border-white/20 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between group shadow-xl bg-[#0D0D0D]/85">
      <div>
        {/* Photo / Initials */}
        <div className="relative h-64 w-full overflow-hidden bg-black rounded-t-3xl">
          <div className="h-full w-full relative">
            {member.avatar_url ? (
              <Image
                src={member.avatar_url}
                alt={member.full_name}
                fill
                unoptimized
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="relative h-full w-full flex items-center justify-center bg-neutral-900">
                <div className="h-32 w-32 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-200 font-bold text-5xl shadow-xl border border-white/15 group-hover:scale-105 transition-transform duration-300">
                  {member.avatar_initials}
                </div>
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20 pointer-events-none" />

            {/* Badges */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
              {isAdminRole ? (
                <Badge className="bg-neutral-200 text-neutral-950 font-semibold text-[10px] px-2.5 py-0.5 shadow-sm flex items-center gap-1 backdrop-blur-md border-transparent rounded-full">
                  <Crown className="h-3 w-3" />
                  <span>Admin</span>
                </Badge>
              ) : member.role === "volunteer" ? (
                <Badge className="bg-neutral-800/80 text-neutral-300 font-medium text-[10px] px-2.5 py-0.5 shadow-sm backdrop-blur-md border-white/10 rounded-full">
                  Volunteer
                </Badge>
              ) : (
                <Badge className="bg-black/80 text-neutral-400 border border-white/10 font-medium text-[10px] px-2.5 py-0.5 shadow-sm backdrop-blur-md rounded-full">
                  Member
                </Badge>
              )}

              <div className="flex items-center gap-1.5">
                {isAdminRole && (
                  <span
                    title="Admin"
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-200 shadow-[0_0_8px_rgba(255,255,255,0.25)] border border-white/20"
                  >
                    <Star className="h-3 w-3 fill-neutral-950 text-neutral-950" />
                  </span>
                )}
                {/* Year badge — the key sorting signal, shown on every card */}
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-black/85 border border-white/10 text-neutral-400 backdrop-blur-md shadow-sm">
                  {member.year || "1st Year"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Name, dept, specialty, bio */}
        <div className="px-4 py-4 text-center space-y-2">
          <h3 className="text-lg sm:text-xl font-bold text-neutral-100 tracking-tight group-hover:text-neutral-300 transition-colors line-clamp-1">
            {member.full_name}
          </h3>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-neutral-300 text-xs font-medium shadow-sm">
            <Layers className="h-3 w-3 text-neutral-400" />
            <span>{member.department}</span>
          </div>

          {member.specialty && (
            <div className="text-xs text-neutral-300 font-medium pt-0.5 line-clamp-1">
              {member.specialty}
            </div>
          )}

          {member.bio && (
            <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed pt-0.5">
              {member.bio}
            </p>
          )}
        </div>
      </div>

      {/* Social links */}
      <div className="p-3 border-t border-white/[0.06] flex items-center justify-center gap-2 bg-black/40">
        {hasInstagram && (
          <a
            href={member.socials!.instagram!}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-white/[0.03] border border-white/10 text-neutral-300 hover:bg-white/[0.06] hover:text-white hover:border-white/20 transition-all text-xs font-medium shadow-sm"
          >
            <Instagram className="h-3.5 w-3.5 text-neutral-300" />
            <span>Instagram</span>
          </a>
        )}
        {hasLinkedIn && (
          <a
            href={member.socials!.linkedin!}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-white/[0.03] border border-white/10 text-neutral-300 hover:bg-white/[0.06] hover:text-white hover:border-white/20 transition-all text-xs font-medium shadow-sm"
          >
            <Linkedin className="h-3.5 w-3.5 text-neutral-300" />
            <span>LinkedIn</span>
          </a>
        )}
        {!hasInstagram && !hasLinkedIn && (
          <span className="text-[10px] text-neutral-600 py-1">No socials listed</span>
        )}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────
export default function TeamPage() {
  const { members: allMembers, loading } = useMembers("all", "all", "");

  // ── Derive core committee & regular members ───────────────────────
  const { coreMembers, regularMembers } = React.useMemo(() => {
    // 1. Split on leadership role
    const core = allMembers.filter((m) =>
      isLeadershipRole(m.specialty, m.department)
    );
    const regular = allMembers.filter(
      (m) => !isLeadershipRole(m.specialty, m.department)
    );

    // 2. Sort core by defined hierarchy rank
    const sortedCore = [...core].sort((a, b) => {
      const ra = getLeadershipRank(a.specialty);
      const rb = getLeadershipRank(b.specialty);
      return ra !== rb ? ra - rb : a.full_name.localeCompare(b.full_name);
    });

    // 3. Sort regular members: descending year order (4th → 3rd → 2nd → 1st)
    //    Within the same year, preserve original DB order (stable sort).
    const sortedRegular = [...regular].sort(
      (a, b) => parseYearOrder(b.year) - parseYearOrder(a.year)
    );

    return { coreMembers: sortedCore, regularMembers: sortedRegular };
  }, [allMembers]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24 space-y-20">

      {/* ── Page Header ───────────────────────────────────────────── */}
      <ScrollReveal variant="reveal" className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-100">
          The{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">
            Team
          </span>{" "}
          of MALHAR
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
          Meet the Core Committee that leads MALHAR and every member who brings our events,
          productions, and cultural moments to life.
        </p>
      </ScrollReveal>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 1 — Core Committee
          Fixed order: President → Vice President → Treasurer →
                       Media Head → Faculty Coordinator
      ══════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="core-committee-heading">
        <ScrollReveal variant="reveal" className="mb-8">
          <h2
            id="core-committee-heading"
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-100"
          >
            Core{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">
              Committee
            </span>
          </h2>
        </ScrollReveal>

        {loading && coreMembers.length === 0 ? (
          <CardSkeleton count={5} />
        ) : coreMembers.length === 0 ? (
          <div className="glass-panel p-10 rounded-3xl border border-white/[0.06] text-center space-y-3 max-w-lg mx-auto bg-[#0D0D0D]">
            <Crown className="h-10 w-10 text-neutral-500 mx-auto" />
            <h3 className="text-base font-bold text-neutral-100">
              No Core Committee Listed Yet
            </h3>
            <p className="text-xs text-neutral-400">
              President, Vice President, Treasurer, Media Head, and Faculty Coordinator
              appointed in the Admin Portal will appear here automatically.
            </p>
          </div>
        ) : (
          <ScrollReveal
            variant="reveal"
            stagger
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {coreMembers.map((leader) => (
              <CoreCard key={leader.id} leader={leader} />
            ))}
          </ScrollReveal>
        )}
      </section>

      {/* Divider */}
      <div className="border-t border-white/[0.06]" />

      {/* ══════════════════════════════════════════════════════════════
          SECTION 2 — All Members (year-sorted, no sub-headings)
      ══════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="members-heading">
        <ScrollReveal variant="reveal" className="mb-8">
          <h2
            id="members-heading"
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-100"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">
              Members
            </span>
          </h2>
        </ScrollReveal>

        {/* Members grid */}
        {loading && regularMembers.length === 0 ? (
          <CardSkeleton count={8} />
        ) : regularMembers.length === 0 ? (
          <EmptyState
            icon={<Users className="h-7 w-7" />}
            headline="Society members will appear here"
            subtext="Members added through the Admin Portal are listed here automatically."
            showInstagramCta={true}
          />
        ) : (
          <ScrollReveal
            variant="reveal"
            stagger
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {regularMembers.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </ScrollReveal>
        )}
      </section>
    </div>
  );
}
