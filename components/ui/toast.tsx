"use client";

import { useEffect, useRef } from "react";
import { toast as sonnerToast } from "sonner";
import type { YouTubeMetadata } from "@/utils/youtubeMetadata";

export interface ToastProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  videoMetadata?: YouTubeMetadata;
}

/**
 * Custom toast component with animated progress bar
 * The progress bar animates from left to right to show remaining time
 */
export function ToastWithProgress({
  title,
  description,
  action,
  duration = 5000,
  videoMetadata,
}: ToastProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  const startTime = useRef<number>(Date.now());
  const remainingTime = useRef<number>(duration);

  useEffect(() => {
    const progress = progressRef.current;
    if (!progress) return;

    const animate = () => {
      const elapsed = Date.now() - startTime.current;
      remainingTime.current = Math.max(0, duration - elapsed);
      const progressPercent = (remainingTime.current / duration) * 100;

      progress.style.width = `${progressPercent}%`;

      if (remainingTime.current > 0) {
        requestAnimationFrame(animate);
      }
    };

    const animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [duration]);

  // Truncate title if too long
  const truncateTitle = (text: string, maxLength: number = 45): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  return (
    <div className="relative overflow-hidden rounded-lg bg-background border border-border shadow-lg">
      {/* Toast content */}
      <div className="p-4">
        {videoMetadata ? (
          <div className="flex gap-3">
            {/* Thumbnail */}
            <div className="flex-shrink-0">
              <img
                src={videoMetadata.youtube_thumbnail}
                alt={videoMetadata.title}
                className="w-20 h-11 object-cover rounded-md border border-border"
                onError={(e) => {
                  // Hide image if it fails to load
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Video title */}
              {videoMetadata.title && (
                <div
                  className="text-sm font-medium text-foreground mb-1"
                  title={videoMetadata.title}
                >
                  {truncateTitle(videoMetadata.title)}
                </div>
              )}
              {/* Toast message */}
              {title && (
                <div className="font-semibold text-foreground">{title}</div>
              )}
              {description && (
                <div className="mt-1 text-sm text-muted-foreground">
                  {description}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Original layout without metadata
          <>
            {title && (
              <div className="font-semibold text-foreground">{title}</div>
            )}
            {description && (
              <div className="mt-1 text-sm text-muted-foreground">
                {description}
              </div>
            )}
          </>
        )}
        {action && (
          <button
            onClick={() => {
              action.onClick();
              sonnerToast.dismiss();
            }}
            className="mt-3 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>

      {/* Animated progress bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted overflow-hidden">
        <div
          ref={progressRef}
          className="h-full bg-primary transition-all ease-linear"
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}

/**
 * Helper function to show a toast with animated progress bar
 */
export function toast(props: ToastProps) {
  const { duration = 5000, ...rest } = props;

  return sonnerToast.custom(
    () => <ToastWithProgress {...rest} duration={duration} />,
    {
      duration,
    },
  );
}

/**
 * Helper function to show a success toast with animated progress bar
 */
export function toastSuccess(
  props: Omit<ToastProps, "title"> & { message: string },
) {
  return toast({
    title: props.message,
    description: props.description,
    action: props.action,
    duration: props.duration,
    videoMetadata: props.videoMetadata,
  });
}

/**
 * Helper function to show a loading toast with animated progress bar
 */
export function toastLoading(
  message: string,
  options?: { id?: string; videoMetadata?: YouTubeMetadata },
) {
  return sonnerToast.custom(
    () => (
      <ToastWithProgress
        title={message}
        videoMetadata={options?.videoMetadata}
        duration={Infinity}
      />
    ),
    { id: options?.id, duration: Infinity },
  );
}

/**
 * Helper function to show an error toast
 */
export function toastError(message: string, options?: { id?: string }) {
  return sonnerToast.error(message, options);
}

/**
 * Helper function to dismiss a toast by ID
 */
export function toastDismiss(id?: string) {
  sonnerToast.dismiss(id);
}
