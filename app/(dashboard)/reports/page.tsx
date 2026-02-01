"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { InsightReport } from "@/types/insightReports";
import {
  FileText,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

export default function ReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const collectionId = searchParams.get("collection");

  const [reports, setReports] = useState<InsightReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("");

  useEffect(() => {
    fetchReports();
  }, [collectionId]);

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams();
      if (collectionId) params.set("collection_id", collectionId);
      params.set("limit", "50");

      const response = await fetch(`/api/reports?${params}`);
      if (!response.ok) throw new Error("Failed to fetch reports");

      const data = await response.json();
      setReports(data.reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "generating":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/10 text-emerald-600";
      case "failed":
        return "bg-red-500/10 text-red-600";
      case "generating":
        return "bg-blue-500/10 text-blue-600";
      default:
        return "bg-gray-500/10 text-gray-600";
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = !filterType || report.report_type === filterType;
    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            AI-generated insights from your video collections
          </p>
        </div>
        <Link href={collectionId ? `/reports/new?collection=${collectionId}` : "/reports/new"}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Report
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="">All Types</option>
          {Object.entries(reportTypeLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-lg font-medium mb-2">No reports yet</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || filterType
              ? "No reports match your filters"
              : "Generate your first AI report to analyze your videos"}
          </p>
          {!searchQuery && !filterType && (
            <Link href={collectionId ? `/reports/new?collection=${collectionId}` : "/reports/new"}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <Link key={report.id} href={`/reports/${report.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg flex-shrink-0">
                        <FileText className="h-5 w-5 text-purple-500" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {report.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {reportTypeLabels[report.report_type] || report.report_type}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={cn("text-xs", getStatusColor(report.status))}
                          >
                            <span className="flex items-center gap-1">
                              {getStatusIcon(report.status)}
                              {report.status}
                            </span>
                          </Badge>
                          {report.collection && (
                            <span className="text-xs text-muted-foreground">
                              from {report.collection.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
