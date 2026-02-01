"use client";

import { cn } from "@/lib/utils";

interface SentimentBarProps {
  distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export function SentimentBar({ distribution }: SentimentBarProps) {
  const total = distribution.positive + distribution.neutral + distribution.negative;
  
  if (total === 0) {
    return (
      <div className="w-full h-2 bg-muted rounded-full" />
    );
  }

  const positivePercent = (distribution.positive / total) * 100;
  const neutralPercent = (distribution.neutral / total) * 100;
  const negativePercent = (distribution.negative / total) * 100;

  return (
    <div className="space-y-2">
      {/* Bar */}
      <div className="flex h-3 w-full rounded-full overflow-hidden">
        {positivePercent > 0 && (
          <div
            className="bg-emerald-500 transition-all"
            style={{ width: `${positivePercent}%` }}
          />
        )}
        {neutralPercent > 0 && (
          <div
            className="bg-gray-400 transition-all"
            style={{ width: `${neutralPercent}%` }}
          />
        )}
        {negativePercent > 0 && (
          <div
            className="bg-rose-500 transition-all"
            style={{ width: `${negativePercent}%` }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        {distribution.positive > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">
              😊 Positive ({distribution.positive})
            </span>
          </div>
        )}
        {distribution.neutral > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-muted-foreground">
              😐 Neutral ({distribution.neutral})
            </span>
          </div>
        )}
        {distribution.negative > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-muted-foreground">
              😠 Negative ({distribution.negative})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
