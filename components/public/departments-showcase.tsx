"use client";

import * as React from "react";
import Link from "next/link";
import { Layers, AlertCircle, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDepartments } from "@/lib/hooks/use-departments";

export function DepartmentsShowcase() {
  const { departments, loading, error, refresh } = useDepartments();

  return (
    <section id="departments" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-neutral-300 text-xs font-medium mb-2">
          <Layers className="h-3.5 w-3.5 text-neutral-400" /> Five Core Pillars
        </div>
        <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-100">
          Society <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">Departments</span>
        </h2>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="glass-panel border-white/[0.06] p-6 space-y-4 animate-pulse bg-neutral-950">
              <div className="h-6 w-3/4 bg-neutral-800 rounded" />
              <div className="h-12 w-full bg-neutral-800 rounded" />
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>Failed to load live department records: {error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} className="text-xs h-7">
            Retry
          </Button>
        </div>
      )}

      {/* Live Data Grid */}
      {!loading && departments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <Link
              key={dept.id}
              href={`/members?department=${encodeURIComponent(dept.name)}`}
              className="block group"
            >
              <Card className="h-full glass-card border border-white/[0.06] hover:border-white/20 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between cursor-pointer group-hover:shadow-[0_8px_30px_rgba(255,255,255,0.04)] rounded-3xl">
                <CardHeader className="space-y-2.5 p-6 sm:p-8">
                  <CardTitle className="text-xl font-bold text-neutral-100 group-hover:text-neutral-300 transition-colors tracking-tight">
                    {dept.name}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm leading-relaxed text-neutral-400 line-clamp-3">
                    {dept.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 pt-0">
                  <div className="text-xs font-medium text-neutral-400 group-hover:text-neutral-200 inline-flex items-center gap-1.5 pt-4 border-t border-white/[0.06] w-full justify-between transition-colors">
                    <span>View Department Members</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform text-neutral-300" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}


      {/* Empty State */}
      {!loading && departments.length === 0 && (
        <div className="glass-panel p-8 rounded-2xl border border-white/10 text-center space-y-2 max-w-lg mx-auto">
          <Layers className="h-8 w-8 text-neutral-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Departments Being Configured</h3>
          <p className="text-xs text-neutral-400">
            Society departments will appear here once configured by administrators.
          </p>
        </div>
      )}
    </section>
  );
}
