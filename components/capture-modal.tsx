"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import {
  getUserPreferences,
  type UserPreferences,
} from "@/utils/userPreferences";
import { generateSummary } from "@/utils/summaryGenerator";
import { models } from "@/utils/openrouter";
import {
  Link,
  CheckCircle2,
  XCircle,
  ExternalLink,
  FolderPlus,
} from "lucide-react";
import {
  toast,
  toastLoading,
  toastError,
  toastSuccess,
  toastDismiss,
} from "@/components/ui/toast";
import CollectionSelectorDialog from "@/components/library/CollectionSelectorDialog";
import { addVideosToCollection } from "@/app/actions";
import {
  fetchYouTubeMetadata,
  extractYouTubeVideoId,
  type YouTubeMetadata,
} from "@/utils/youtubeMetadata";

export interface TranscriptEntry {
  start: number;
  text: string;
}

interface CaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (url: string) => Promise<void>;
}

interface BatchResult {
  success: boolean;
  videoId?: string;
  title?: string;
  thumbnail?: string;
  duration?: string;
  error?: string;
}

export function CaptureModal({
  open,
  onOpenChange,
  onSubmit,
}: CaptureModalProps) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userPreferences, setUserPreferences] =
    useState<UserPreferences | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<YouTubeMetadata | null>(
    null,
  );
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [showCollectionSelector, setShowCollectionSelector] = useState(false);
  const [isAddingToCollection, setIsAddingToCollection] = useState(false);

  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const supabase = createClient();
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError || !userData?.user) {
          console.error("Could not get current user");
          return;
        }

        const prefs = await getUserPreferences(userData.user.id);
        setUserPreferences(prefs);
      } catch (error) {
        console.error("Error loading preferences:", error);
      }
    };

    loadPreferences();
  }, []);

  // Helper functions
  const normalizeYouTubeUrl = (url: string): string | null => {
    try {
      const parsed = new URL(url.trim());
      let videoId: string | null = null;
      if (parsed.hostname === "youtu.be") {
        videoId = parsed.pathname.replace("/", "");
      } else if (
        parsed.hostname === "www.youtube.com" ||
        parsed.hostname === "youtube.com"
      ) {
        if (parsed.pathname === "/watch") {
          videoId = parsed.searchParams.get("v") ?? null;
        } else if (parsed.pathname.startsWith("/live/")) {
          videoId = parsed.pathname.split("/").pop() ?? null;
        }
      }
      if (!videoId) return null;
      return `https://www.youtube.com/watch?v=${videoId}`;
    } catch {
      return null;
    }
  };

  // Parse URLs from input (supports CSV and line-separated)
  const parseUrls = (input: string): string[] => {
    // Split by comma or newline
    const urls = input.split(/[,\n]/);
    // Filter and normalize
    return urls.map((url) => url.trim()).filter((url) => url.length > 0);
  };

  // Helper function to auto-generate summary if enabled
  const autoGenerateSummary = async (
    transcript: TranscriptEntry[],
    videoId: string,
    userId: string,
  ) => {
    try {
      const preferences = await getUserPreferences(userId);

      if (!preferences.auto_generate_summary) {
        return;
      }

      // Check if summary already exists
      const supabase = createClient();
      const { data: existingSummary } = await supabase
        .from("summaries")
        .select("content")
        .eq("video_id", videoId)
        .order("saved_at", { ascending: false })
        .limit(1)
        .single();

      if (existingSummary?.content) {
        return;
      }

      // Generate new summary
      await generateSummary(
        transcript,
        preferences.summary_model,
        videoId,
        userId,
      );
    } catch (error) {
      console.error("Error auto-generating summary:", error);
      // Don't show error to user, just log it
    }
  };

  // Process a single video
  const processSingleVideo = async (
    normalizedUrl: string,
    onProgress?: (step: string, metadata?: YouTubeMetadata) => void,
  ): Promise<BatchResult> => {
    const result: BatchResult = { success: false };

    try {
      const supabase = createClient();
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData?.user) {
        throw new Error("Could not get current user for transcript lookup.");
      }
      const user_id = userData.user.id;

      // Extract video ID and fetch metadata
      const extractedVideoId = extractYouTubeVideoId(normalizedUrl);
      let metadata: YouTubeMetadata | null = null;

      if (extractedVideoId) {
        metadata = await fetchYouTubeMetadata(extractedVideoId);
      }

      result.title = metadata?.title;
      result.thumbnail = metadata?.youtube_thumbnail;
      result.duration = metadata?.duration;

      // Check for existing video for this user and normalized URL
      const { data: videoData } = await supabase
        .from("videos")
        .select(
          "id, youtube_url, youtube_id, title, youtube_thumbnail, channel_id, published_at, description, duration, view_count, like_count, comment_count",
        )
        .eq("user_id", user_id)
        .eq("youtube_url", normalizedUrl)
        .single();

      let video_id: string | null = null;

      if (videoData?.id) {
        video_id = videoData.id;

        // Found video, check for transcript
        const { data: transcriptData } = await supabase
          .from("transcripts")
          .select("content")
          .eq("video_id", videoData.id)
          .order("saved_at", { ascending: false })
          .limit(1)
          .single();

        if (transcriptData?.content) {
          // Auto-generate summary if enabled
          if (userPreferences?.auto_generate_summary && video_id) {
            onProgress?.("Generating AI summary...", metadata || undefined);
            await autoGenerateSummary(
              JSON.parse(transcriptData.content),
              video_id,
              user_id,
            );
          }

          result.success = true;
          result.videoId = video_id || undefined;
          return result;
        }
      }

      // No existing transcript, fetch from API route
      onProgress?.("Loading transcript...", metadata || undefined);
      const response = await fetch("/api/transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch transcript");
      }

      const data = await response.json();

      // Upsert video with metadata
      if (metadata?.channel_id && metadata?.channel_title) {
        await supabase.from("channels").upsert(
          [
            {
              id: metadata.channel_id,
              title: metadata.channel_title,
            },
          ],
          { onConflict: "id" },
        );
      }

      const { data: upsertedVideo } = await supabase
        .from("videos")
        .upsert([
          {
            user_id,
            youtube_url: normalizedUrl,
            youtube_id: extractedVideoId,
            title: metadata?.title ?? null,
            youtube_thumbnail: metadata?.youtube_thumbnail ?? null,
            channel_id: metadata?.channel_id ?? null,
            published_at: metadata?.published_at ?? null,
            description: metadata?.description ?? null,
            duration: metadata?.duration ?? null,
            view_count: metadata?.view_count ?? null,
            like_count: metadata?.like_count ?? null,
            comment_count: metadata?.comment_count ?? null,
          },
        ])
        .select("id, youtube_url, youtube_id")
        .single();

      if (!upsertedVideo?.id) {
        throw new Error("Could not save video record.");
      }

      video_id = upsertedVideo.id;

      // Insert transcript
      await supabase.from("transcripts").insert([
        {
          video_id,
          content: JSON.stringify(data.transcript),
        },
      ]);

      // Auto-generate summary if enabled
      if (userPreferences?.auto_generate_summary && video_id) {
        onProgress?.("Generating AI summary...", metadata || undefined);
        await autoGenerateSummary(data.transcript, video_id, user_id);
      }

      result.success = true;
      result.videoId = video_id || undefined;
    } catch (error) {
      console.error("Failed to process video:", error);
      result.error = error instanceof Error ? error.message : "Unknown error";
    }

    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Parse URLs from input
    const urls = parseUrls(url);
    const isBulk = urls.length > 1;

    // Validate URLs
    const validUrls = urls
      .map((u) => normalizeYouTubeUrl(u))
      .filter(Boolean) as string[];

    if (validUrls.length === 0) {
      toastError("Invalid YouTube URL(s).");
      setIsLoading(false);
      return;
    }

    // Close modal immediately
    onOpenChange(false);

    // Handle single URL processing (backward compatibility)
    if (!isBulk) {
      const normalizedUrl = validUrls[0];

      // Extract video ID and fetch metadata early
      const extractedVideoId = extractYouTubeVideoId(normalizedUrl);
      let metadata: YouTubeMetadata | null = null;

      if (extractedVideoId) {
        metadata = await fetchYouTubeMetadata(extractedVideoId);
        setVideoMetadata(metadata);
      }

      // Show loading toast with metadata
      toastLoading("Loading transcript...", {
        id: "capture-toast",
        videoMetadata: metadata || undefined,
      });

      try {
        const supabase = createClient();
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError || !userData?.user) {
          throw new Error("Could not get current user for transcript lookup.");
        }
        const user_id = userData.user.id;

        // Check for existing video for this user and normalized URL
        const { data: videoData } = await supabase
          .from("videos")
          .select(
            "id, youtube_url, youtube_id, title, youtube_thumbnail, channel_id, published_at, description, duration, view_count, like_count, comment_count",
          )
          .eq("user_id", user_id)
          .eq("youtube_url", normalizedUrl)
          .single();

        let video_id: string | null = null;

        if (videoData?.id) {
          video_id = videoData.id;

          // Found video, check for transcript
          const { data: transcriptData } = await supabase
            .from("transcripts")
            .select("content")
            .eq("video_id", videoData.id)
            .order("saved_at", { ascending: false })
            .limit(1)
            .single();

          if (transcriptData?.content) {
            // Use metadata from existing video if available
            const existingMetadata: YouTubeMetadata = {
              title: videoData.title || "",
              description: videoData.description || "",
              youtube_thumbnail: videoData.youtube_thumbnail || "",
              channel_id: videoData.channel_id || "",
              channel_title: "",
              published_at: videoData.published_at || "",
              duration: videoData.duration || "",
              view_count: videoData.view_count || null,
              like_count: videoData.like_count || null,
              comment_count: videoData.comment_count || null,
              tags: [],
            };

            // Auto-generate summary if enabled
            if (userPreferences?.auto_generate_summary && video_id) {
              toastLoading("Generating AI summary...", {
                id: "capture-toast",
                videoMetadata: existingMetadata,
              });
              await autoGenerateSummary(
                JSON.parse(transcriptData.content),
                video_id,
                user_id,
              );
            }

            // Dismiss loading toast before showing success toast
            toastDismiss("capture-toast");

            // Show success toast with View button and metadata
            toastSuccess({
              message: "Summary ready!",
              action: {
                label: "View",
                onClick: () => router.push(`/videos/${video_id}`),
              },
              videoMetadata: existingMetadata,
            });
            setIsLoading(false);
            setUrl("");
            return;
          }
        }

        // No existing transcript, fetch from API route
        const response = await fetch("/api/transcript", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: normalizedUrl }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch transcript");
        }

        const data = await response.json();

        // Use metadata if available, otherwise use null
        const meta = metadata;

        // Upsert video with metadata
        try {
          if (meta?.channel_id && meta?.channel_title) {
            await supabase.from("channels").upsert(
              [
                {
                  id: meta.channel_id,
                  title: meta.channel_title,
                },
              ],
              { onConflict: "id" },
            );
          }

          const { data: upsertedVideo } = await supabase
            .from("videos")
            .upsert([
              {
                user_id,
                youtube_url: normalizedUrl,
                youtube_id: extractedVideoId,
                title: meta?.title ?? null,
                youtube_thumbnail: meta?.youtube_thumbnail ?? null,
                channel_id: meta?.channel_id ?? null,
                published_at: meta?.published_at ?? null,
                description: meta?.description ?? null,
                duration: meta?.duration ?? null,
                view_count: meta?.view_count ?? null,
                like_count: meta?.like_count ?? null,
                comment_count: meta?.comment_count ?? null,
              },
            ])
            .select("id, youtube_url, youtube_id")
            .single();

          if (!upsertedVideo?.id) {
            throw new Error("Could not save video record.");
          }

          video_id = upsertedVideo.id;

          // Insert transcript
          await supabase.from("transcripts").insert([
            {
              video_id,
              content: JSON.stringify(data.transcript),
            },
          ]);

          // Auto-generate summary if enabled
          if (userPreferences?.auto_generate_summary && video_id) {
            toastLoading("Generating AI summary...", {
              id: "capture-toast",
              videoMetadata: meta || undefined,
            });
            await autoGenerateSummary(data.transcript, video_id, user_id);
          }

          // Dismiss loading toast before showing success toast
          toastDismiss("capture-toast");

          // Show success toast with View button and metadata
          toastSuccess({
            message: "Summary ready!",
            action: {
              label: "View",
              onClick: () => router.push(`/videos/${video_id}`),
            },
            videoMetadata: meta || undefined,
          });
        } catch (saveError) {
          console.error("Failed to save to Supabase:", saveError);
          toastError("Failed to process video", { id: "capture-toast" });
        }
      } catch (err) {
        console.error("Failed to get transcript:", err);
        toastError("Failed to process video", { id: "capture-toast" });
      } finally {
        setIsLoading(false);
        setUrl("");
        setVideoMetadata(null);
      }
      return;
    }

    // Handle bulk processing
    const results: BatchResult[] = [];
    const total = validUrls.length;

    // Show initialization toast
    toastLoading(`Preparing to process ${total} videos...`, {
      id: "bulk-processing-toast",
    });

    // Process videos sequentially
    for (let index = 0; index < validUrls.length; index++) {
      const normalizedUrl = validUrls[index];

      // Extract video ID and fetch metadata first
      const extractedVideoId = extractYouTubeVideoId(normalizedUrl);
      let metadata: YouTubeMetadata | null = null;

      if (extractedVideoId) {
        metadata = await fetchYouTubeMetadata(extractedVideoId);
      }

      // Process the video with progress callback
      const result = await processSingleVideo(normalizedUrl, (step, meta) => {
        // Update toast with current step and counter
        toastLoading(`${step} [${index + 1}/${total}]`, {
          id: "bulk-processing-toast",
          videoMetadata: meta || metadata || undefined,
        });
      });
      results.push(result);
    }

    // Dismiss bulk processing toast
    toastDismiss("bulk-processing-toast");

    // Show batch completion dialog
    setBatchResults(results);
    setShowBatchDialog(true);
    setIsLoading(false);
    setUrl("");
  };

  // Format duration for display
  const formatDuration = (duration?: string): string => {
    if (!duration) return "--:--";
    return duration;
  };

  // Handle adding videos to collections
  const handleAddToCollections = async (selectedCollectionIds: string[]) => {
    setIsAddingToCollection(true);
    setShowCollectionSelector(false);

    try {
      // Get successfully processed video IDs
      const videoIds = batchResults
        .filter((r) => r.success && r.videoId)
        .map((r) => r.videoId!);

      if (videoIds.length === 0) {
        toastError("No videos to add to collections");
        return;
      }

      // Show loading toast
      toastLoading("Adding videos to collections...", {
        id: "add-to-collection-toast",
      });

      // Add videos to each selected collection
      for (const collectionId of selectedCollectionIds) {
        await addVideosToCollection(collectionId, videoIds);
      }

      // Dismiss loading toast
      toastDismiss("add-to-collection-toast");

      // Show success toast
      toastSuccess({
        message: `Added ${videoIds.length} video${videoIds.length !== 1 ? "s" : ""} to ${selectedCollectionIds.length} collection${selectedCollectionIds.length !== 1 ? "s" : ""}`,
      });
    } catch (error) {
      console.error("Failed to add videos to collections:", error);
      toastError("Failed to add videos to collections", {
        id: "add-to-collection-toast",
      });
    } finally {
      setIsAddingToCollection(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              <div>
                <Link className="inline" /> Scan Video(s)
              </div>
            </DialogTitle>
            <DialogDescription>
              Enter one or more YouTube URLs to generate AI-powered insights.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="url" className="block font-bold text-white mb-2">
                YouTube URL(s)
              </label>
              <Textarea
                id="url"
                placeholder={`Enter one or more YouTube URLs:

Single URL:
https://www.youtube.com/watch?v=...

Multiple URLs (one per line or comma-separated):
https://www.youtube.com/watch?v=abc123
https://www.youtube.com/watch?v=def456`}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                disabled={isLoading}
                className="w-full min-h-[120px] bg-[#181c23] text-white border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !url}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? "Processing..." : "Get Transcript(s)"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Batch Completion Dialog */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Batch Processing Complete
            </DialogTitle>
            <DialogDescription>
              {batchResults.filter((r) => r.success).length} of{" "}
              {batchResults.length} videos processed successfully
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-3">
              {batchResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/50"
                >
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    {result.thumbnail && (
                      <img
                        src={result.thumbnail}
                        alt={result.title || "Video"}
                        className="w-24 h-14 object-cover rounded-md mb-2"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                    <div className="font-medium text-sm text-foreground">
                      {result.title || "Unknown Video"}
                    </div>
                    {result.duration && (
                      <div className="text-xs text-muted-foreground">
                        {formatDuration(result.duration)}
                      </div>
                    )}
                    {!result.success && result.error && (
                      <div className="text-xs text-red-500 mt-1">
                        {result.error}
                      </div>
                    )}
                  </div>
                  {result.success && result.videoId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/videos/${result.videoId}`)}
                      className="flex-shrink-0"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            {batchResults.filter((r) => r.success && r.videoId).length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowCollectionSelector(true)}
                disabled={isAddingToCollection}
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Add to Collection
              </Button>
            )}
            <Button onClick={() => setShowBatchDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Collection Selector Dialog */}
      <CollectionSelectorDialog
        open={showCollectionSelector}
        onOpenChange={setShowCollectionSelector}
        onConfirm={handleAddToCollections}
      />
    </>
  );
}
