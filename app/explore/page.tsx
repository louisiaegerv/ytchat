"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { VideoInfoPanel } from "@/components/video-info-panel";
import { VideoInsightsPanel } from "@/components/video-insights-panel";
import { VideoProvider, useVideoContext } from "@/components/VideoContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useGlobalData } from "@/components/GlobalDataContext";

export interface TranscriptEntry {
  start: number;
  text: string;
}

function ExploreTranscriptPage() {
  const {
    setTranscript,
    setYoutubeUrl,
    setYoutubeId,
    youtubeId,
    setVideoUuid,
    setAiSummary,
  } = useVideoContext();
  const { existingTags, setExistingTags } = useGlobalData();

  const searchParams = useSearchParams();
  const videoIdParam = searchParams.get("videoId");

  const [url, setUrl] = useState("");
  const [lastUrl, setLastUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [videoMeta, setVideoMeta] = useState<any | null>(null);

  // Load video by videoId from query param
  useEffect(() => {
    const fetchVideoById = async (videoId: string) => {
      setIsLoading(true);
      setError("");
      try {
        const supabase = createClient();
        // Get video metadata
        const { data: videoData, error: videoError } = await supabase
          .from("videos")
          .select(
            "id, youtube_url, youtube_id, title, youtube_thumbnail, channel_id, published_at, description, duration, view_count, like_count, comment_count"
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
        setUrl(videoData.youtube_url);

        // Get transcript
        const { data: transcriptData } = await supabase
          .from("transcripts")
          .select("content")
          .eq("video_id", videoId)
          .order("saved_at", { ascending: false })
          .limit(1)
          .single();
        if (transcriptData?.content) {
          setTranscript(JSON.parse(transcriptData.content));
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
        setLastUrl(videoData.youtube_url);
      } catch (err) {
        setError("Failed to load video data.");
        setIsLoading(false);
      }
    };

    if (videoIdParam) {
      fetchVideoById(videoIdParam);
    }
  }, [videoIdParam]);

  // Fetch all existing tags once when the component mounts
  useEffect(() => {
    const fetchExistingTags = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("tags").select("name");
      if (error) {
        console.error("Error fetching existing tags:", error);
        return;
      }
      const tagNames = new Set(data.map((tag) => tag.name));
      setExistingTags(tagNames);
    };

    if (existingTags.size === 0) {
      // Only fetch if the set is empty (first load)
      fetchExistingTags();
    }
  }, [setExistingTags, existingTags.size]);

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

  const extractYouTubeVideoId = (url: string): string | null => {
    try {
      const parsed = new URL(url.trim());
      if (parsed.hostname === "youtu.be") {
        return parsed.pathname.replace("/", "");
      }
      if (
        parsed.hostname === "www.youtube.com" ||
        parsed.hostname === "youtube.com"
      ) {
        if (parsed.pathname === "/watch") {
          return parsed.searchParams.get("v") ?? null;
        } else if (parsed.pathname.startsWith("/live/")) {
          return parsed.pathname.split("/").pop() ?? null;
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const normalizedUrl = normalizeYouTubeUrl(url);
    if (!normalizedUrl) {
      setError("Invalid YouTube URL.");
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient(); // Use createClient here
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
          "id, youtube_url, youtube_id, title, youtube_thumbnail, channel_id, published_at, description, duration, view_count, like_count, comment_count"
        )
        .eq("user_id", user_id)
        .eq("youtube_url", normalizedUrl)
        .single();

      if (videoData?.id) {
        setVideoUuid(videoData.id);
        setYoutubeUrl(videoData.youtube_url);
        setYoutubeId(videoData.youtube_id);
        setVideoMeta(videoData);

        // Found video, check for transcript
        const { data: transcriptData } = await supabase
          .from("transcripts")
          .select("content")
          .eq("video_id", videoData.id)
          .order("saved_at", { ascending: false })
          .limit(1)
          .single();

        if (transcriptData?.content) {
          setTranscript(JSON.parse(transcriptData.content));
          // check for summary
          const { data: summaryData } = await supabase
            .from("summaries")
            .select("content")
            .eq("video_id", videoData.id)
            .order("saved_at", { ascending: false })
            .limit(1)
            .single();
          summaryData?.content && setAiSummary(summaryData.content);

          setIsLoading(false);
          setLastUrl(url);
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

      setTranscript(data.transcript);

      // Extract video ID
      const extractedVideoId = extractYouTubeVideoId(normalizedUrl);
      if (extractedVideoId) {
        setYoutubeId(extractedVideoId);
        setYoutubeUrl(normalizedUrl);

        // Fetch YouTube metadata from API route
        let meta: any = null;
        try {
          const metaRes = await fetch("/api/youtube/metadata", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ videoId: extractedVideoId }),
          });
          if (!metaRes.ok) throw new Error("Failed to fetch YouTube metadata");
          meta = await metaRes.json();
          setVideoMeta(meta);
        } catch (err) {
          setError("Failed to fetch YouTube metadata.");
          console.error(err);
        }

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
              { onConflict: "id" }
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
          setVideoUuid(upsertedVideo.id);
          setYoutubeUrl(upsertedVideo.youtube_url);
          setYoutubeId(upsertedVideo.youtube_id);
          const video_id = upsertedVideo.id;

          // Upsert tags and video_tags
          if (meta?.tags && Array.isArray(meta.tags)) {
            const newTagsToUpsert = [];
            for (const tagName of meta.tags) {
              if (!existingTags.has(tagName)) {
                newTagsToUpsert.push({ name: tagName });
              }
            }

            if (newTagsToUpsert.length > 0) {
              const { data: upsertedTags, error: upsertTagsError } =
                await supabase
                  .from("tags")
                  .upsert(newTagsToUpsert, { onConflict: "name" })
                  .select("id, name");

              if (upsertTagsError) {
                console.error("Error upserting new tags:", upsertTagsError);
              } else if (upsertedTags) {
                // Update the global existingTags set with newly upserted tags
                setExistingTags((prevTags) => {
                  const newSet = new Set(prevTags);
                  upsertedTags.forEach((tag) => newSet.add(tag.name));
                  return newSet;
                });
              }
            }

            // Now upsert video_tags for all tags (new and existing)
            for (const tagName of meta.tags) {
              const { data: tag } = await supabase
                .from("tags")
                .select("id")
                .eq("name", tagName)
                .single();

              if (tag && tag.id) {
                await supabase
                  .from("video_tags")
                  .upsert([{ video_id, tag_id: tag.id }], {
                    onConflict: "video_id,tag_id",
                  });
              }
            }
          }

          // Insert transcript
          await supabase.from("transcripts").insert([
            {
              video_id,
              content: JSON.stringify(data.transcript),
            },
          ]);
        } catch (saveError) {
          setError("Transcript loaded, but failed to auto-save to Supabase.");
          console.error(saveError);
        }
      }
    } catch (err) {
      setError("Failed to get transcript. Please check the URL and try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
      setLastUrl(url);
    }
  };

  return (
    <div className="flex flex-col max-w-5xl w-full mx-auto px-4 sm:px-6">
      {/* Header, description, input, and button */}
      <div className="pt-10 pb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Explore Video</h1>
        <p className="text-lg text-gray-400 mb-8">
          Enter a YouTube video URL to begin interacting with the transcript, or
          select a video from your library.
        </p>
        {/* Always show the input */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 md:flex-row md:items-end"
        >
          <div className="flex-1">
            <label
              htmlFor="url"
              className="block font-bold text-white mb-2 text-lg"
            >
              YouTube URL
            </label>
            <Input
              id="url"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="w-full bg-[#181c23] text-white border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg px-5 py-4"
              style={{ minHeight: "56px" }}
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || lastUrl === url}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold px-8 py-4 rounded-lg min-h-[56px] md:ml-4"
            style={{ minHeight: "56px" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 mr-1"
            >
              <path d="M21.8 7.2c-.2-.8-.8-1.4-1.6-1.6C18.1 5 12 5 12 5s-6.1 0-8.2.6c-.8.2-1.4.8-1.6 1.6C2 9.3 2 12 2 12s0 2.7.2 4.8c.2.8.8 1.4 1.6 1.6C5.9 19 12 19 12 19s6.1 0 8.2-.6c.8-.2 1.4-.8 1.6-1.6.2-2.1.2-4.8.2-4.8s0-2.7-.2-4.8zM10 15V9l6 3-6 3z" />
            </svg>
            {isLoading ? "Loading..." : "Get Transcript"}
          </Button>
        </form>
      </div>
      {/* Main content */}
      {videoMeta && (
        <div className="w-full gap-6 flex flex-col md:flex-row md:space-y-0 md:h-full">
          <VideoInfoPanel
            url={url}
            isLoading={isLoading}
            error={error}
            lastUrl={lastUrl}
            videoMeta={videoMeta}
            youtubeId={youtubeId}
          />
          <VideoInsightsPanel />
        </div>
      )}
      {error && <div className="text-red-500 mt-4">{error}</div>}
    </div>
  );
}

export default function ProtectedPage() {
  return (
    <VideoProvider>
      <ExploreTranscriptPage />
    </VideoProvider>
  );
}
