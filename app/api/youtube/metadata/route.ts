import { NextRequest, NextResponse } from "next/server";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
  throw new Error("YOUTUBE_API_KEY is not set in environment variables.");
}

function parseDuration(iso: string): string {
  // Example: PT1H2M10S
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return iso;
  const [, h, m, s] = match;
  return [h ? `${h}h` : "", m ? `${m}m` : "", s ? `${s}s` : ""]
    .filter(Boolean)
    .join(" ");
}

export async function POST(req: NextRequest) {
  try {
    const { videoId } = await req.json();
    if (!videoId) {
      return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
    }

    // Fetch video details from YouTube Data v3 API
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    const ytRes = await fetch(apiUrl);
    if (!ytRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from YouTube API" },
        { status: 500 }
      );
    }
    const ytData = await ytRes.json();
    if (!ytData.items || ytData.items.length === 0) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }
    const video = ytData.items[0];

    const snippet = video.snippet || {};
    const statistics = video.statistics || {};
    const contentDetails = video.contentDetails || {};

    const metadata = {
      title: snippet.title || "",
      description: snippet.description || "",
      youtube_thumbnail:
        snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || "",
      channel_id: snippet.channelId || "",
      channel_title: snippet.channelTitle || "",
      published_at: snippet.publishedAt || "",
      duration: contentDetails.duration
        ? parseDuration(contentDetails.duration)
        : "",
      view_count: statistics.viewCount
        ? parseInt(statistics.viewCount, 10)
        : null,
      like_count: statistics.likeCount
        ? parseInt(statistics.likeCount, 10)
        : null,
      comment_count: statistics.commentCount
        ? parseInt(statistics.commentCount, 10)
        : null,
      tags: snippet.tags || [],
    };

    return NextResponse.json(metadata);
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
