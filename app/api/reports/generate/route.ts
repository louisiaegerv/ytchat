import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { generateReport } from "@/utils/reports/generator";

// POST /api/reports/generate - Internal endpoint for report generation
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
    const { report_id } = body;

    if (!report_id) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Report ID is required" } },
        { status: 400 }
      );
    }

    // Fetch report configuration
    const { data: report, error } = await supabase
      .from("insight_reports")
      .select("*")
      .eq("id", report_id)
      .eq("user_id", user.id)
      .single();

    if (error || !report) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Report not found" } },
        { status: 404 }
      );
    }

    // Generate report (this runs synchronously for now)
    await generateReport({
      reportId: report_id,
      videoIds: report.video_ids,
      reportType: report.report_type,
      customPrompt: report.custom_prompt || undefined,
      model: report.model_used,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in POST /api/reports/generate:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to generate report" } },
      { status: 500 }
    );
  }
}
