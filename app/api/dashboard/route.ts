import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET /api/dashboard - Get all dashboard data
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Fetch dashboard stats
    const [
      newVideosResult,
      collectionsResult,
      newReportsResult,
      activeStreamsResult,
    ] = await Promise.all([
      // New videos this week
      supabase
        .from("videos")
        .select("count", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      // Total collections
      supabase
        .from("collections")
        .select("count", { count: "exact", head: true })
        .eq("user_id", user.id),
      // New reports this week
      supabase
        .from("insight_reports")
        .select("count", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      // Active streams
      supabase
        .from("streams")
        .select("count", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "active"),
    ]);

    // Fetch collections with stats
    const { data: collections } = await supabase
      .from("collections")
      .select(`
        *,
        video_collections(count)
      `)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(6);

    // Fetch recent reports
    const { data: recentReports } = await supabase
      .from("insight_reports")
      .select(`
        *,
        collection:source_collection_id(id, name)
      `)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5);

    // Fetch active streams
    const { data: activeStreams } = await supabase
      .from("streams")
      .select(`
        *,
        collection:collections(id, name)
      `)
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(5);

    const stats = {
      new_videos_this_week: newVideosResult.count || 0,
      total_collections: collectionsResult.count || 0,
      new_reports_this_week: newReportsResult.count || 0,
      active_streams: activeStreamsResult.count || 0,
    };

    const formattedCollections = (collections || []).map((c: any) => ({
      ...c,
      video_count: c.video_collections?.[0]?.count || 0,
    }));

    const formattedReports = (recentReports || []).map((r: any) => ({
      ...r,
      collection: r.collection?.[0] || null,
    }));

    const formattedStreams = (activeStreams || []).map((s: any) => ({
      ...s,
      collection: s.collection?.[0] || null,
    }));

    // Generate alerts based on data
    const alerts = [];
    if (stats.new_videos_this_week > 0) {
      alerts.push({
        type: "new_videos" as const,
        message: `${stats.new_videos_this_week} new videos added this week`,
      });
    }

    return NextResponse.json({
      stats,
      collections: formattedCollections,
      recent_reports: formattedReports,
      active_streams: formattedStreams,
      alerts,
    });
  } catch (error) {
    console.error("Error in GET /api/dashboard:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
