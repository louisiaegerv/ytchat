import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { generateReport } from "@/utils/reports/generator";
import type { InsightReportType } from "@/types/insightReports";

// GET /api/reports - List all reports for the current user
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

    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get("collection_id");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("insight_reports")
      .select(`
        *,
        collection:source_collection_id(id, name)
      `, { count: "exact" })
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (collectionId) {
      query = query.eq("source_collection_id", collectionId);
    }

    if (type) {
      query = query.eq("report_type", type);
    }

    if (status) {
      query = query.eq("status", status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: reports, error, count } = await query;

    if (error) {
      console.error("Error fetching reports:", error);
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to fetch reports" } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      reports: reports?.map(r => ({
        ...r,
        collection: r.collection?.[0] || null,
      })) || [],
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    });
  } catch (error) {
    console.error("Error in GET /api/reports:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// POST /api/reports - Create a new report
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
      title,
      description,
      report_type,
      source_collection_id,
      video_ids,
      custom_prompt,
      model_used,
    } = body;

    // Validate required fields
    if (!report_type || !video_ids || video_ids.length === 0) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Report type and video_ids are required" } },
        { status: 400 }
      );
    }

    // Generate title if not provided
    const reportTitle = title || `${report_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} - ${new Date().toLocaleDateString()}`;

    // Create report
    const { data: report, error } = await supabase
      .from("insight_reports")
      .insert({
        user_id: user.id,
        title: reportTitle,
        description: description || "",
        report_type,
        source_collection_id: source_collection_id || null,
        video_ids,
        custom_prompt: custom_prompt || null,
        model_used: model_used || 'google/gemini-2.5-flash-lite-preview-09-2025',
        result_content: "Generating report...",
        status: "generating",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating report:", error);
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to create report" } },
        { status: 500 }
      );
    }

    // Trigger generation asynchronously (don't await - let it run in background)
    generateReport({
      reportId: report.id,
      videoIds: video_ids,
      reportType: report_type,
      customPrompt: custom_prompt || undefined,
      model: model_used || undefined,
    }).catch((error) => {
      console.error("Background report generation failed:", error);
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Error in POST /api/reports:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
