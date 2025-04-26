import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number in YouTube style (e.g., 1.3K, 548K, 1.9M).
 * - Shows full number up to 999.
 * - Uses "K" for thousands, "M" for millions, "B" for billions.
 * - One decimal place for non-integers, no decimal for exact values.
 */
export function formatNumberShort(num: number): string {
  if (num < 1000) return num.toString();
  const units = [
    { value: 1e9, symbol: "B" },
    { value: 1e6, symbol: "M" },
    { value: 1e3, symbol: "K" },
  ];
  for (const unit of units) {
    if (num >= unit.value) {
      const short = num / unit.value;
      // Show one decimal if not an integer, else no decimal
      return short % 1 === 0
        ? `${short.toFixed(0)}${unit.symbol}`
        : `${short.toFixed(1).replace(/\.0$/, "")}${unit.symbol}`;
    }
  }
  return num.toString();
}

export const formatCompactDate = (date: Date): string => {
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 60) return `${diffInMinutes}min`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}hr`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}wk`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo`;

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}yr`;
};

export const formatTooltipDate = (date: Date): string => {
  return `${formatDistanceToNow(date)} ago - ${format(date, "PPP")}`;
};
