"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SentimentLabel } from "@/types/sentiment";

interface SentimentBadgeProps {
  score: number;
  label?: SentimentLabel;
  size?: "sm" | "md" | "lg";
}

export function SentimentBadge({ score, label, size = "md" }: SentimentBadgeProps) {
  const getSentimentConfig = (score: number) => {
    if (score > 0.3) {
      return {
        emoji: "😊",
        label: "positive" as SentimentLabel,
        className: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20",
      };
    } else if (score < -0.3) {
      return {
        emoji: "😠",
        label: "negative" as SentimentLabel,
        className: "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20",
      };
    } else {
      return {
        emoji: "😐",
        label: "neutral" as SentimentLabel,
        className: "bg-gray-500/10 text-gray-600 hover:bg-gray-500/20",
      };
    }
  };

  const config = getSentimentConfig(score);
  const displayLabel = label || config.label;

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0",
    md: "text-sm px-2 py-0.5",
    lg: "text-base px-3 py-1",
  };

  return (
    <Badge
      variant="secondary"
      className={cn("font-medium capitalize", config.className, sizeClasses[size])}
    >
      <span className="mr-1">{config.emoji}</span>
      <span>{displayLabel}</span>
      {size !== "sm" && (
        <span className="ml-1 opacity-75">
          {score > 0 ? "+" : ""}
          {score.toFixed(1)}
        </span>
      )}
    </Badge>
  );
}
