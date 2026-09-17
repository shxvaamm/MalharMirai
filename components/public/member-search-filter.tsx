"use client";

import * as React from "react";
import Image from "next/image";
import { Search, Users, Sparkles, Crown, Instagram, Linkedin, Layers, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMembers } from "@/lib/hooks/use-members";
import { useDepartments } from "@/lib/hooks/use-departments";
import { isSuperAdminEmail } from "@/lib/auth/rbac";
import { isLeadershipRole } from "@/lib/leadership";

export function MemberSearchFilter() {
  const [roleTab, setRoleTab] = React.useState<string>("all");
  const [deptFilter, setDeptFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const { departments } = useDepartments();

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryDept = params.get("department") || params.get("dept");
      if (queryDept) {
        const match = departments.find(
          (d) =>
            d.name.toLowerCase() === queryDept.toLowerCase() ||
            d.name.toLowerCase().includes(queryDept.toLowerCase()) ||
            queryDept.toLowerCase().includes(d.name.toLowerCase().split(" ")[0])
        );
        if (match) {
          setDeptFilter(match.name);
        } else {
          setDeptFilter(queryDept);
        }
      }
    }
  }, [departments]);

  const { members: rawMembers, loading } = useMembers(roleTab, deptFilter, searchQuery);

  // Exclude executive leaders (President, Vice President, Treasurer, Media Head, Faculty Coordinator)
  const members = React.useMemo(() => {
    return rawMembers.filter((m) => !isLeadershipRole(m.specialty, m.department));
  }, [rawMembers]);

  return (
    <div className="space-y-8">
      {/* Search & Filter Controls Bar */}
      <div className="glass-card p-4 sm:p-6 rounded-3xl border border-white/[0.08] space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search by member name, specialty, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-11 bg-black/60 border-white/15 text-sm rounded-full text-white placeholder:text-neutral-500"
            />
          </div>

          {/* Role Filters & Department Select */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Role Filter Tabs */}
            <div className="flex items-center p-1 rounded-full bg-black border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setRoleTab("all")}
                className={`px-3.5 py-1.5 rounded-full font-medium transition-colors ${
                  roleTab === "all"
                    ? "bg-neutral-200 text-neutral-950 font-semibold shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setRoleTab("admin")}
                className={`px-3.5 py-1.5 rounded-full font-medium transition-colors ${
                  roleTab === "admin"
                    ? "bg-neutral-200 text-neutral-950 font-semibold shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                Admins
              </button>
              <button
                type="button"
                onClick={() => setRoleTab("member")}
                className={`px-3.5 py-1.5 rounded-full font-medium transition-colors ${
                  roleTab === "member"
                    ? "bg-neutral-200 text-neutral-950 font-semibold shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                Members
              </button>
              <button
                type="button"
                onClick={() => setRoleTab("volunteer")}
                className={`px-3.5 py-1.5 rounded-full font-medium transition-colors ${
                  roleTab === "volunteer"
                    ? "bg-neutral-200 text-neutral-950 font-semibold shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                Volunteers
              </button>
            </div>

            {/* Department Select (Kept for members) */}
            <div className="w-full sm:w-60">
              <select
                className="flex h-11 w-full rounded-full border border-white/10 bg-black/60 px-4 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 text-neutral-200 appearance-none cursor-pointer"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Member Cards Grid */}
      {members.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-3 bg-[#0D0D0D]/75 border border-white/[0.06]">
          <Users className="mx-auto h-12 w-12 text-neutral-600" />
          <h3 className="text-lg font-bold text-neutral-100">No Members Found</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Try adjusting your search query or reset the department filter.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setDeptFilter("all");
              setRoleTab("all");
            }}
            className="rounded-full border-white/10 text-neutral-300 hover:bg-white/[0.06]"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {members.map((member) => {
            const isAdminRole = member.role === "admin" || isSuperAdminEmail(member.email);
            const hasInstagram = !!member.socials?.instagram;
            const hasLinkedIn = !!member.socials?.linkedin;

            return (
              <Card
                key={member.id}
                className="glass-card border border-white/[0.06] hover:border-white/20 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between group shadow-xl bg-[#0D0D0D]/85"
              >
                <div>
                  {/* Member Photo or Stylized Initials */}
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
                        /* Monochromatic fallback avatar */
                        <div className="relative h-full w-full flex items-center justify-center bg-neutral-900">
                          <div className="h-32 w-32 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-200 font-bold text-5xl shadow-xl border border-white/15 group-hover:scale-105 transition-transform duration-300">
                            {member.avatar_initials}
                          </div>
                        </div>
                      )}

                      {/* Ambient Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20 pointer-events-none" />

                      {/* Floating Badges: role label left, admin star + year right */}
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
                          {/* Admin Star Badge — shown whenever role === 'admin' or super-admin */}
                          {isAdminRole && (
                            <span
                              title="Admin"
                              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-200 shadow-[0_0_8px_rgba(255,255,255,0.25)] border border-white/20"
                            >
                              <Star className="h-3 w-3 fill-neutral-950 text-neutral-950" />
                            </span>
                          )}
                          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-black/85 border border-white/10 text-neutral-400 backdrop-blur-md shadow-sm">
                            {member.year || "1st Year"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Member Details: Name & Department */}
                  <div className="px-4 py-4 text-center space-y-2">
                    <h3 className="text-lg sm:text-xl font-bold text-neutral-100 tracking-tight group-hover:text-neutral-300 transition-colors line-clamp-1">
                      {member.full_name}
                    </h3>


                    {/* Department Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-neutral-300 text-xs font-medium shadow-sm">
                      <Layers className="h-3 w-3 text-neutral-400" />
                      <span>{member.department}</span>
                    </div>

                    {/* Specialty Designation */}
                    {member.specialty && (
                      <div className="text-xs text-neutral-300 font-medium pt-0.5 line-clamp-1">
                        {member.specialty}
                      </div>
                    )}

                    {/* Bio Snippet */}
                    {member.bio && (
                      <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed pt-0.5">
                        {member.bio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Social Media Links (Instagram & LinkedIn) */}
                <div className="p-3 border-t border-white/[0.06] flex items-center justify-center gap-2 bg-black/40">
                  {hasInstagram ? (
                    <a
                      href={member.socials!.instagram}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-white/[0.03] border border-white/10 text-neutral-300 hover:bg-white/[0.06] hover:text-white hover:border-white/20 transition-all text-xs font-medium shadow-sm"
                      title={`Instagram of ${member.full_name}`}
                    >
                      <Instagram className="h-3.5 w-3.5 text-neutral-300" />
                      <span>Instagram</span>
                    </a>
                  ) : null}

                  {hasLinkedIn ? (
                    <a
                      href={member.socials!.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-white/[0.03] border border-white/10 text-neutral-300 hover:bg-white/[0.06] hover:text-white hover:border-white/20 transition-all text-xs font-medium shadow-sm"
                      title={`LinkedIn of ${member.full_name}`}
                    >
                      <Linkedin className="h-3.5 w-3.5 text-neutral-300" />
                      <span>LinkedIn</span>
                    </a>
                  ) : null}
                </div>
              </Card>

            );
          })}
        </div>
      )}
    </div>
  );
}
