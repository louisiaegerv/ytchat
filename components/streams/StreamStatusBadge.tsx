"use client";

import { Badge } from "@/components/ui/badge";
import type { StreamStatus } from "@/types/streams";
import { cn } from "@/lib/utils";

interface StreamStatusBadgeProps {
  status: StreamStatus;
  lastRunAt?: string;
}

export function StreamStatusBadge({ status, lastRunAt }: StreamStatusBadgeProps) {
  const getStatusConfig = (status: StreamStatus) => {
    switch (status) {
      case "active":
        return {
          label: "Active",
          variant: "default" as const,
          className: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20",
          dotClass: "bg-emerald-500",
        };
      case "paused":
        return {
          label: "Paused",
          variant: "secondary" as const,
          className: "bg-gray-500/10 text-gray-600 hover:bg-gray-500/20",
          dotClass: "bg-gray-500",
        };
      case "error":
        return {
          label: "Error",
          variant: "destructive" as const,
          className: "bg-red-500/10 text-red-600 hover:bg-red-500/20",
          dotClass: "bg-red-500",
        };
      default:
        return {
          label: status,
          variant: "secondary" as const,
          className: "",
          dotClass: "bg-gray-500",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      variant={config.variant}
      className={cn("flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium", config.className)}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dotClass)} />
      {config.label}
    </Badge>
  );
}
