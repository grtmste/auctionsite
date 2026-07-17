"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  endsAt: string | Date;
  onExpire?: () => void;
  className?: string;
  compact?: boolean;
}

function diffParts(endsAt: Date) {
  const total = Math.max(0, endsAt.getTime() - Date.now());
  return {
    total,
    days: Math.floor(total / 86_400_000),
    hours: Math.floor((total % 86_400_000) / 3_600_000),
    minutes: Math.floor((total % 3_600_000) / 60_000),
    seconds: Math.floor((total % 60_000) / 1000),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Live countdown synced to the server timestamp; turns red under 1 hour */
export function CountdownTimer({
  endsAt,
  onExpire,
  className,
  compact = false,
}: CountdownTimerProps) {
  const end = typeof endsAt === "string" ? new Date(endsAt) : endsAt;
  const [parts, setParts] = useState(() => diffParts(end));
  const [expired, setExpired] = useState(parts.total <= 0);

  useEffect(() => {
    const interval = setInterval(() => {
      const next = diffParts(end);
      setParts(next);
      if (next.total <= 0) {
        setExpired(true);
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [end.getTime()]);

  const urgent = parts.total < 3_600_000; // < 1 hour

  if (expired) {
    return (
      <span
        suppressHydrationWarning
        className={cn("font-mono text-sm font-semibold text-muted", className)}
      >
        00:00:00
      </span>
    );
  }

  const timeString =
    parts.days > 0
      ? `${parts.days}p ${pad(parts.hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}`
      : `${pad(parts.hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}`;

  return (
    <span
      suppressHydrationWarning
      className={cn(
        "inline-flex items-center gap-1.5 font-mono font-semibold tabular-nums",
        compact ? "text-sm" : "text-lg",
        urgent ? "text-danger" : "text-foreground",
        className
      )}
    >
      <Clock className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      {timeString}
    </span>
  );
}
