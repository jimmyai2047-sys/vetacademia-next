"use client";

import { useEffect, useState } from "react";
import { Users, Eye } from "lucide-react";

export default function VisitorCounter() {
  const [stats, setStats] = useState<{ total: number; live: number } | null>(
    null
  );

  useEffect(() => {
    fetch("/api/visitors", { method: "POST" })
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
  }, []);

  if (!stats) return null;

  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <Eye className="h-4 w-4" />
        {stats.total.toLocaleString()} total visits
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        {stats.live} online
      </span>
    </div>
  );
}
