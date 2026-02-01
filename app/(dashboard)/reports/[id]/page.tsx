"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Markdown from "markdown-to-jsx";
import type { InsightReport } from "@/types/insightReports";
import {
  ArrowLeft,
  FileText,
  Clock,
  RefreshCw,
  MoreHorizontal,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Video,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const reportTypeLabels: Record<string, string> = {
  executive_summary: "Executive Summary",
  sentiment_analysis: "Sentiment Analysis",
  key_themes: "Key Themes",
  timeline_trends: "Timeline Trends",
  comparison_matrix: "Comparison Matrix",
  contradictions: "Contradictions",
  knowledge_graph: "Knowledge Graph",
  action_items: "Action Items",
  research_synthesis: "Research Synthesis",
  custom: "Custom Analysis",
};

export default function ReportViewerPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [report, setReport] = useState<InsightReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push("/reports");
          return;
        }
        throw new Error("Failed to fetch report");
      }
      const data = await response.json();
      setReport(data.report);
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to load report");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this report?")) return;

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete report");

      toast.success("Report deleted");
      router.push("/reports");
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Failed to delete report");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "generating":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/reports")}
            className="mt-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">
                {report.title}
              </h1>
              {getStatusIcon(report.status)}
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="secondary">
                {reportTypeLabels[report.report_type] || report.report_type}
              </Badge>
              {report.collection && (
                <Link href={`/collections/${report.collection.id}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                    {report.collection.name}
                  </Badge>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {report.status === "completed" && (
            <Link href={`/reports/new?regenerate=${report.id}`}>
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
            </Link>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Metadata */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>Created: {formatDate(report.created_at)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Video className="h-4 w-4" />
              <span>{report.video_ids.length} videos analyzed</span>
            </div>
            {report.token_usage && (
              <div>
                <span>{report.token_usage.toLocaleString()} tokens used</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <Card>
        <CardContent className="p-6">
          {report.status === "generating" ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">
                Generating your report... This may take a minute.
              </p>
            </div>
          ) : report.status === "failed" ? (
            <div className="flex flex-col items-center justify-center py-12">
              <XCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-600 font-medium">Report generation failed</p>
              {report.error_message && (
                <p className="text-muted-foreground mt-2 text-sm">
                  {report.error_message}
                </p>
              )}
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Markdown>{report.result_content}</Markdown>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Source Videos */}
      {report.video_ids.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Source Videos</h3>
            <p className="text-sm text-muted-foreground">
              This report was generated from {report.video_ids.length} video
              {report.video_ids.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
