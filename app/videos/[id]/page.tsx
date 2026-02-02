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
import { 
  FolderPlus, 
  Folder, 
  X, 
  Loader2, 
  Video, 
  Plus, 
  FolderOpen,
  ArrowUpRight,
  Sparkles
} from "lucide-react";
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

        // Get video metadata with channel title
        console.log("Fetching video with ID:", videoId);
        const { data: videoData, error: videoError } = await supabase
          .from("videos")
          .select(
            `id, youtube_url, youtube_id, title, youtube_thumbnail, channel_id, published_at, description, duration, view_count, like_count, comment_count,
            channels(title)`,
          )
          .eq("id", videoId)
          .single();
        
        if (videoError) {
          console.error("Video fetch error:", videoError);
          setError(`Video fetch error: ${videoError.message}`);
          setIsLoading(false);
          return;
        }
        
        if (!videoData) {
          console.error("No video data returned for ID:", videoId);
          setError("Video not found in database.");
          setIsLoading(false);
          return;
        }
        
        console.log("Video data found:", videoData.title);
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
      } catch (err: any) {
        console.error("Exception in fetchVideoById:", err);
        setError(`Failed to load video data: ${err?.message || "Unknown error"}`);
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

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="relative min-h-screen">
        {/* Background Orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        
        <div className="relative z-10 flex flex-col max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Video Panel Skeleton */}
            <div className="glass-strong rounded-3xl p-6 space-y-4 animate-pulse">
              <div className="aspect-video bg-white/5 rounded-2xl" />
              <div className="h-6 bg-white/5 rounded w-3/4" />
              <div className="h-4 bg-white/5 rounded w-1/2" />
              <div className="flex gap-2">
                <div className="h-8 w-20 bg-white/5 rounded-full" />
                <div className="h-8 w-20 bg-white/5 rounded-full" />
              </div>
            </div>

            {/* Insights Panel Skeleton */}
            <div className="glass-strong rounded-3xl p-6">
              <div className="h-10 bg-white/5 rounded-xl mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-white/5 rounded w-full" />
                <div className="h-4 bg-white/5 rounded w-5/6" />
                <div className="h-4 bg-white/5 rounded w-4/6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-12">
      {/* Background Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="relative z-10 flex flex-col max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Error State */}
        {error ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-full blur-3xl opacity-20" />
              <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center border border-red-500/20">
                <Video className="w-12 h-12 text-red-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Video Not Found</h1>
            <p className="text-gray-400 max-w-md mb-2 leading-relaxed">{error}</p>
            <p className="text-sm text-gray-500 mb-8">Video ID: {videoId}</p>
            <Link href="/library">
              <Button variant="outline" size="lg" className="border-white/10 hover:bg-white/5 px-6">
                <FolderOpen className="w-5 h-5 mr-2" />
                Go to Library
              </Button>
            </Link>
          </div>
        ) : videoId && videoMeta ? (
          /* Video Content */
          <div className="space-y-8">
            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Video Panel */}
              <div className="order-1">
                <VideoInfoPanel
                  url={videoMeta.youtube_url}
                  isLoading={isLoading}
                  error={error}
                  lastUrl={videoMeta.youtube_url}
                  videoMeta={videoMeta}
                  youtubeId={youtubeId}
                />
              </div>

              {/* Insights Panel */}
              <div className="order-2">
                <VideoInsightsPanel />
              </div>
            </div>

            {/* Collections Section */}
            <div className="glass rounded-2xl border-white/10 p-6 card-lift">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Collections</h3>
                    <p className="text-xs text-muted-foreground">
                      {videoCollections.length > 0 
                        ? `In ${videoCollections.length} collection${videoCollections.length > 1 ? "s" : ""}`
                        : "Not in any collections yet"}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={openCollectionSelector}
                  disabled={isUpdatingCollections}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 transition-all"
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Add to Collection
                </Button>
              </div>

              {isCollectionsLoading ? (
                <div className="flex items-center gap-3 py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                  <span className="text-sm text-gray-400">Loading collections...</span>
                </div>
              ) : videoCollections.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {videoCollections.map((collection, index) => (
                    <div
                      key={collection.id}
                      className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-all"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <Folder className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-gray-200">
                        {collection.name}
                      </span>
                      <Link href={`/library/collections/${collection.id}`}>
                        <ArrowUpRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                      </Link>
                      <button
                        onClick={() => handleRemoveFromCollection(collection.id)}
                        className="ml-1 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all"
                        disabled={isUpdatingCollections}
                        title="Remove from collection"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                  <Folder className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">This video isn&apos;t in any collections yet.</p>
                  <button 
                    onClick={openCollectionSelector}
                    className="text-sm text-blue-400 hover:text-blue-300 mt-1 transition-colors"
                  >
                    Add it to one now →
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty State - No Video Selected */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            {/* Animated Background Element */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-3xl opacity-20 animate-pulse" />
              <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                <Video className="w-12 h-12 text-gray-400" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-white mb-3">No Video Selected</h1>
            <p className="text-gray-400 max-w-md mb-8 leading-relaxed">
              Capture a new video to analyze its content with AI, or browse your library to revisit previous insights.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => {
                  const captureEvent = new CustomEvent("openCapture");
                  window.dispatchEvent(captureEvent);
                }}
                className="btn-gradient glow-primary px-6"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Capture Video
              </Button>
              <Link href="/library">
                <Button variant="outline" size="lg" className="border-white/10 hover:bg-white/5 px-6">
                  <FolderOpen className="w-5 h-5 mr-2" />
                  Browse Library
                </Button>
              </Link>
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
    </div>
  );
}

export default function ProtectedPage() {
  return (
    <VideoProvider>
      <VideoDetailPage />
    </VideoProvider>
  );
}
