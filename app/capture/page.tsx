"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

export interface TranscriptEntry {
  start: number;
  text: string;
}

function ExploreTranscriptPage() {
  const router = useRouter();
  const {
    setTranscript,
    setYoutubeUrl,
    setYoutubeId,
    youtubeId,
    setVideoUuid,
    setAiSummary,
  } = useVideoContext();

  const searchParams = useSearchParams();
  const videoIdParam = searchParams.get("videoId");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [videoMeta, setVideoMeta] = useState<any | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Redirect to /library if no videoId is present
  useEffect(() => {
    if (!videoIdParam) {
      router.push("/library");
    }
  }, [videoIdParam, router]);

  // Load video by videoId from query param
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

        setIsLoading(false);
      } catch (err) {
        setError("Failed to load video data.");
        setIsLoading(false);
      }
    };

    if (videoIdParam) {
      fetchVideoById(videoIdParam);
    }
  }, [videoIdParam]);

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

  return (
    <>
      <div className="flex flex-col max-w-5xl w-full mx-auto px-4 sm:px-6">
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
        {error && <div className="text-red-500 mt-4">{error}</div>}
      </div>

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
      <ExploreTranscriptPage />
    </VideoProvider>
  );
}
