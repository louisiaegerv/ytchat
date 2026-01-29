"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { VideoInfoPanel } from "@/components/video-info-panel";
import { VideoInsightsPanel } from "@/components/video-insights-panel";
import { VideoProvider, useVideoContext } from "@/components/VideoContext";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import {
  getUserPreferences,
  type UserPreferences,
} from "@/utils/userPreferences";
import { generateSummary } from "@/utils/summaryGenerator";
import { SettingsModal } from "@/components/settings-modal";
import CollectionSelectorDialog from "@/components/library/CollectionSelectorDialog";
import { FolderPlus, Folder, X, Loader2 } from "lucide-react";
import {
  addVideosToCollection,
  removeVideosFromCollection,
} from "@/app/actions";
import type { Collection } from "@/types/library";
import { toastSuccess, toastError } from "@/components/ui/toast";

export interface TranscriptEntry {
  start: number;
  text: string;
}

function VideoDetailPage() {
  const {
    setTranscript,
    setYoutubeUrl,
    setYoutubeId,
    youtubeId,
    setVideoUuid,
    setAiSummary,
  } = useVideoContext();

  const params = useParams();
  const videoId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [videoMeta, setVideoMeta] = useState<any | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Collection states
  const [isCollectionSelectorOpen, setIsCollectionSelectorOpen] =
    useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [videoCollections, setVideoCollections] = useState<Collection[]>([]);
  const [isCollectionsLoading, setIsCollectionsLoading] = useState(false);
  const [isUpdatingCollections, setIsUpdatingCollections] = useState(false);

  // Load video by id from URL parameter
  useEffect(() => {
    const fetchVideoById = async (videoId: string) => {
      setIsLoading(true);
      setError("");
      try {
        const supabase = createClient();
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError || !userData?.user) {
          console.error("Could not get current user");
        }
        const userId = userData?.user?.id;

        // Get video metadata
        const { data: videoData, error: videoError } = await supabase
          .from("videos")
          .select(
            "id, youtube_url, youtube_id, title, youtube_thumbnail, channel_id, published_at, description, duration, view_count, like_count, comment_count",
          )
          .eq("id", videoId)
          .single();
        if (videoError || !videoData) {
          setError("Video not found.");
          setIsLoading(false);
          return;
        }
        setVideoUuid(videoData.id);
        setYoutubeUrl(videoData.youtube_url);
        setYoutubeId(videoData.youtube_id);
        setVideoMeta(videoData);

        // Get transcript
        const { data: transcriptData } = await supabase
          .from("transcripts")
          .select("content")
          .eq("video_id", videoId)
          .order("saved_at", { ascending: false })
          .limit(1)
          .single();
        if (transcriptData?.content) {
          const parsedTranscript = JSON.parse(transcriptData.content);
          setTranscript(parsedTranscript);

          // Auto-generate summary if enabled
          if (userId) {
            autoGenerateSummary(parsedTranscript, videoId, userId);
          }
        } else {
          setTranscript(null);
        }

        // Get summary
        const { data: summaryData } = await supabase
          .from("summaries")
          .select("content")
          .eq("video_id", videoId)
          .order("saved_at", { ascending: false })
          .limit(1)
          .single();
        if (summaryData?.content) {
          setAiSummary(summaryData.content);
        } else {
          setAiSummary(null);
        }

        // Fetch collections if user is logged in
        if (userId) {
          await fetchCollections(userId);
          await fetchVideoCollections(videoId);
        }

        setIsLoading(false);
      } catch (err) {
        setError("Failed to load video data.");
        setIsLoading(false);
      }
    };

    if (videoId) {
      fetchVideoById(videoId);
    }
  }, [videoId]);

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
        setAiSummary(existingSummary.content);
        return;
      }

      // Generate new summary
      const summaryContent = await generateSummary(
        transcript,
        preferences.summary_model,
        videoId,
        userId,
      );
      setAiSummary(summaryContent);
    } catch (error) {
      console.error("Error auto-generating summary:", error);
      // Don't show error to user, just log it
    }
  };

  // Fetch user's collections
  const fetchCollections = async (userId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCollections(data || []);
    } catch (err) {
      console.error("Failed to fetch collections:", err);
    }
  };

  // Fetch collections that contain the current video
  const fetchVideoCollections = async (videoId: string) => {
    setIsCollectionsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("video_collections")
        .select(
          `
          collections (*)
        `,
        )
        .eq("video_id", videoId);

      if (error) throw error;
      const collectionData = (data || []).map((vg: any) => vg.collections);
      setVideoCollections(collectionData);
    } catch (err) {
      console.error("Failed to fetch video collections:", err);
    } finally {
      setIsCollectionsLoading(false);
    }
  };

  // Handle adding video to collections via VideoSelectorDialog
  const handleAddToCollections = async (selectedCollectionIds: string[]) => {
    if (selectedCollectionIds.length === 0) return;

    setIsUpdatingCollections(true);
    try {
      // Add video to each selected collection
      for (const collectionId of selectedCollectionIds) {
        await addVideosToCollection(collectionId, [videoId]);
      }

      // Refresh video collections
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        await fetchVideoCollections(videoId);
        await fetchCollections(userData.user.id);
      }

      toastSuccess({
        message: `Added to ${selectedCollectionIds.length} collection${selectedCollectionIds.length > 1 ? "s" : ""}`,
      });
    } catch (err: any) {
      console.error("Failed to add to collections:", err);
      toastError(err.message || "Failed to add to collections");
    } finally {
      setIsUpdatingCollections(false);
    }
  };

  // Handle removing video from a collection
  const handleRemoveFromCollection = async (collectionId: string) => {
    setIsUpdatingCollections(true);
    try {
      await removeVideosFromCollection(collectionId, [videoId]);

      // Refresh video collections
      await fetchVideoCollections(videoId);

      toastSuccess({
        message: "Removed from collection",
      });
    } catch (err: any) {
      console.error("Failed to remove from collection:", err);
      toastError(err.message || "Failed to remove from collection");
    } finally {
      setIsUpdatingCollections(false);
    }
  };

  // Open CollectionSelectorDialog
  const openCollectionSelector = () => {
    setIsCollectionSelectorOpen(true);
  };

  return (
    <>
      <div className="flex flex-col max-w-5xl w-full mx-auto px-4 sm:px-6">
        {/* Only show content when videoId is present */}
        {videoId ? (
          <>
            {/* Main content */}
            {videoMeta && (
              <div className="w-full gap-6 flex flex-col md:flex-row md:space-y-0 md:h-full">
                <VideoInfoPanel
                  url={videoMeta.youtube_url}
                  isLoading={isLoading}
                  error={error}
                  lastUrl={videoMeta.youtube_url}
                  videoMeta={videoMeta}
                  youtubeId={youtubeId}
                />
                <VideoInsightsPanel />
              </div>
            )}

            {/* Collections Section */}
            {videoMeta && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">Collections</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openCollectionSelector}
                    disabled={isUpdatingCollections}
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Add to Collection
                  </Button>
                </div>

                {/* Collections badges */}
                {isCollectionsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading collections...
                  </div>
                ) : videoCollections.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {videoCollections.map((collection) => (
                      <div
                        key={collection.id}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                      >
                        <span>{collection.name || "Untitled"}</span>
                        {!isUpdatingCollections && (
                          <button
                            onClick={() =>
                              handleRemoveFromCollection(collection.id)
                            }
                            className="ml-1 hover:text-destructive transition-colors"
                            title="Remove from collection"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                        {isUpdatingCollections && (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This video is not in any collections yet.
                  </p>
                )}
              </div>
            )}

            {error && <div className="text-red-500 mt-4">{error}</div>}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-center max-w-md">
              <h1 className="text-2xl font-semibold tracking-tight mb-4">
                No Video Selected
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                Use the Capture modal from the sidebar to add a new video, or go
                to your Library to view existing videos.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => {
                    const captureEvent = new CustomEvent("openCapture");
                    window.dispatchEvent(captureEvent);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Open Capture Modal
                </Button>
                <Link href="/library">
                  <Button variant="outline">Go to Library</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Collection Selector Dialog */}
      <CollectionSelectorDialog
        open={isCollectionSelectorOpen}
        onOpenChange={setIsCollectionSelectorOpen}
        onConfirm={handleAddToCollections}
      />

      {/* Settings Modal */}
      <SettingsModal
        open={isSettingsModalOpen}
        onOpenChange={setIsSettingsModalOpen}
      />
    </>
  );
}

export default function ProtectedPage() {
  return (
    <VideoProvider>
      <VideoDetailPage />
    </VideoProvider>
  );
}
