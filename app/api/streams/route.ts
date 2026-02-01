import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import type { StreamFrequency } from "@/types/streams";

// GET /api/streams - List all streams for the current user
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

    // Fetch streams with collection info
    const { data: streams, error } = await supabase
      .from("streams")
      .select(`
        *,
        collection:collections(id, name)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching streams:", error);
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to fetch streams" } },
        { status: 500 }
      );
    }

    // Format response
    const formattedStreams = streams.map((stream) => ({
      ...stream,
      collection: stream.collection?.[0] || null,
    }));

    return NextResponse.json({ streams: formattedStreams });
  } catch (error) {
    console.error("Error in GET /api/streams:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// POST /api/streams - Create a new stream
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      search_query, 
      filters, 
      schedule, 
      is_auto_processing 
    } = body;

    // Validate required fields
    if (!search_query) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Search query is required" } },
        { status: 400 }
      );
    }

    // Generate name from search query if not provided
    const streamName = name || `${search_query} Stream`;

    // 1. Create collection for the stream
    const { data: collection, error: collectionError } = await supabase
      .from("collections")
      .insert({
        user_id: user.id,
        name: streamName,
        description: description || `Auto-generated collection for "${search_query}" stream`,
      })
      .select()
      .single();

    if (collectionError) {
      console.error("Error creating collection:", collectionError);
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to create collection" } },
        { status: 500 }
      );
    }

    // 2. Create stream with collection reference
    const { data: stream, error: streamError } = await supabase
      .from("streams")
      .insert({
        user_id: user.id,
        name: streamName,
        description: description || "",
        search_query,
        filters: {
          max_results_per_run: 10,
          min_duration_seconds: null,
          max_duration_seconds: null,
          language: "en",
          exclude_keywords: [],
          channel_ids: [],
          ...filters,
        },
        schedule: {
          frequency: "daily",
          ...schedule,
        },
        collection_id: collection.id,
        status: "active",
        is_auto_processing: is_auto_processing || false,
        stats: {
          total_videos_collected: 0,
          total_runs: 0,
          last_run_videos_found: 0,
          last_run_videos_added: 0,
        },
      })
      .select()
      .single();

    if (streamError) {
      // Rollback: delete the collection we just created
      await supabase.from("collections").delete().eq("id", collection.id);
      
      console.error("Error creating stream:", streamError);
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to create stream" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      stream: {
        ...stream,
        collection: {
          id: collection.id,
          name: collection.name,
          video_count: 0,
        },
      },
      collection 
    });
  } catch (error) {
    console.error("Error in POST /api/streams:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
