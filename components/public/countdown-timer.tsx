"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  targetDate: string | Date;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CountdownTimer({
  targetDate,
  label = "Starts in",
  size = "md",
  className,
}: CountdownTimerProps) {
  const [mounted, setMounted] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  React.useEffect(() => {
    setMounted(true);
    function calculateTime() {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
        });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false,
      });
    }

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!mounted) {
    return (
      <div className={cn("inline-flex items-center gap-1.5 text-xs text-neutral-400 font-mono", className)}>
        <Clock className="h-3.5 w-3.5 text-neutral-400" />
        <span>Loading countdown...</span>
      </div>
    );
  }

  if (timeLeft.isExpired) {
    return (
      <div className={cn("inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-300 bg-white/[0.04] px-3 py-1 rounded-full border border-white/10", className)}>
        <Clock className="h-3.5 w-3.5 text-neutral-400" />
        <span>Registration Closed / In Session</span>
      </div>
    );
  }

  if (size === "sm") {
    return (
      <div className={cn("flex items-center gap-1.5 text-xs text-neutral-200 font-mono font-medium", className)}>
        <Clock className="h-3.5 w-3.5 text-neutral-400 animate-pulse" />
        <span>
          {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
        </span>
      </div>
    );
  }

  if (size === "lg") {
    return (
      <div className={cn("flex flex-col items-center gap-2.5", className)}>
        {label && <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">{label}</span>}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
          {[
            { label: "Days", value: timeLeft.days },
            { label: "Hours", value: timeLeft.hours },
            { label: "Mins", value: timeLeft.minutes },
            { label: "Secs", value: timeLeft.seconds },
          ].map((item, i) => (
            <div
              key={i}
              className="glass-panel px-3.5 py-2.5 sm:px-5 sm:py-3.5 rounded-2xl border border-white/10 bg-[#0D0D0D]/75 backdrop-blur-xl flex flex-col items-center justify-center min-w-[64px] sm:min-w-[76px] shadow-lg"
            >
              <span className="text-xl sm:text-3xl font-bold text-neutral-100 font-mono">
                {String(item.value).padStart(2, "0")}
              </span>
              <span className="text-[10px] uppercase font-semibold text-neutral-400 mt-0.5">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default "md" size
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1.5 text-xs font-mono">
        <div className="bg-white/[0.06] border border-white/10 px-2.5 py-1 rounded-xl text-neutral-200 font-semibold shadow-sm">
          {timeLeft.days}d
        </div>
        <div className="bg-white/[0.06] border border-white/10 px-2.5 py-1 rounded-xl text-neutral-200 font-semibold shadow-sm">
          {String(timeLeft.hours).padStart(2, "0")}h
        </div>
        <div className="bg-white/[0.06] border border-white/10 px-2.5 py-1 rounded-xl text-neutral-200 font-semibold shadow-sm">
          {String(timeLeft.minutes).padStart(2, "0")}m
        </div>
        <div className="bg-white/[0.06] border border-white/10 px-2.5 py-1 rounded-xl text-neutral-200 font-semibold shadow-sm">
          {String(timeLeft.seconds).padStart(2, "0")}s
        </div>
      </div>
    </div>
  );
}
