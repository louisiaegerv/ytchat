import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET /api/streams/[id] - Get a specific stream
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const { id } = await params;

    const { data: stream, error } = await supabase
      .from("streams")
      .select(`
        *,
        collection:collections(id, name)
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: "Stream not found" } },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ 
      stream: {
        ...stream,
        collection: stream.collection?.[0] || null,
      }
    });
  } catch (error) {
    console.error("Error in GET /api/streams/[id]:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// PATCH /api/streams/[id] - Update a stream
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Check if stream exists and belongs to user
    const { data: existingStream, error: checkError } = await supabase
      .from("streams")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (checkError || !existingStream) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Stream not found" } },
        { status: 404 }
      );
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.search_query !== undefined) updateData.search_query = body.search_query;
    if (body.filters !== undefined) updateData.filters = body.filters;
    if (body.schedule !== undefined) updateData.schedule = body.schedule;
    if (body.is_auto_processing !== undefined) updateData.is_auto_processing = body.is_auto_processing;
    if (body.status !== undefined) updateData.status = body.status;

    const { data: stream, error } = await supabase
      .from("streams")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating stream:", error);
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to update stream" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ stream });
  } catch (error) {
    console.error("Error in PATCH /api/streams/[id]:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// DELETE /api/streams/[id] - Delete a stream
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const deleteCollection = searchParams.get("delete_collection") === "true";

    // Get stream to check ownership and get collection_id
    const { data: stream, error: checkError } = await supabase
      .from("streams")
      .select("id, collection_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (checkError || !stream) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Stream not found" } },
        { status: 404 }
      );
    }

    // Delete stream
    const { error: deleteError } = await supabase
      .from("streams")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting stream:", deleteError);
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to delete stream" } },
        { status: 500 }
      );
    }

    // Optionally delete linked collection
    if (deleteCollection) {
      await supabase
        .from("collections")
        .delete()
        .eq("id", stream.collection_id)
        .eq("user_id", user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/streams/[id]:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
