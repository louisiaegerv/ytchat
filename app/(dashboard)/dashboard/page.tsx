"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  RefreshCw,
  FileText,
  Video,
  Folder,
  ArrowRight,
  TrendingUp,
  Clock,
} from "lucide-react";
import { CollectionThumbnailGrid } from "@/components/collections/CollectionThumbnailGrid";
import { CaptureModal } from "@/components/capture-modal";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DashboardStats {
  new_videos_this_week: number;
  total_collections: number;
  new_reports_this_week: number;
  active_streams: number;
}

interface CollectionPreview {
  id: string;
  name: string;
  video_count: number;
  sentiment?: {
    score: number;
    label: "positive" | "neutral" | "negative";
  };
  updated_at: string;
}

interface RecentReport {
  id: string;
  title: string;
  report_type: string;
  created_at: string;
  status: "generating" | "completed" | "failed";
  collection?: { id: string; name: string } | null;
}

// Gradient backgrounds for stat cards
const statCardGradients = [
  "stat-card-gradient-1 glow-blue",
  "stat-card-gradient-2 glow-purple",
  "stat-card-gradient-3 glow-green",
  "stat-card-gradient-4",
];

const statIconColors = [
  "text-blue-400",
  "text-violet-400",
  "text-emerald-400",
  "text-amber-400",
];

const statBgColors = [
  "bg-blue-500/10",
  "bg-violet-500/10",
  "bg-emerald-500/10",
  "bg-amber-500/10",
];

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    new_videos_this_week: 0,
    total_collections: 0,
    new_reports_this_week: 0,
    active_streams: 0,
  });
  const [collections, setCollections] = useState<CollectionPreview[]>([]);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);

  useEffect(() => {
    checkUserData();
  }, []);

  const checkUserData = async () => {
    try {
      const response = await fetch("/api/dashboard");
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();

      setStats(data.stats);
      setCollections(data.collections || []);
      setRecentReports(data.recent_reports || []);

      const hasAnyData =
        data.stats.total_collections > 0 ||
        data.stats.active_streams > 0 ||
        data.stats.new_videos_this_week > 0;

      setHasData(hasAnyData);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      toast.error("Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStream = () => {
    router.push("/streams/new");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!hasData) {
    return (
      <EmptyState
        onCreateStream={handleCreateStream}
        onAddVideo={() => setIsCaptureModalOpen(true)}
      />
    );
  }

  const statItems = [
    {
      label: "New Videos",
      value: stats.new_videos_this_week,
      sublabel: "this week",
      icon: Video,
    },
    {
      label: "Collections",
      value: stats.total_collections,
      sublabel: "total",
      icon: Folder,
    },
    {
      label: "Reports",
      value: stats.new_reports_this_week,
      sublabel: "this week",
      icon: FileText,
    },
    {
      label: "Streams",
      value: stats.active_streams,
      sublabel: "active",
      icon: RefreshCw,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Your intelligence overview at a glance
          </p>
        </div>
        {/* <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCaptureModalOpen(true)}>
            <Video className="mr-2 h-4 w-4" />
            Add Video
          </Button>
          <Button className="btn-gradient" onClick={handleCreateStream}>
            <Plus className="mr-2 h-4 w-4" />
            New Stream
          </Button>
        </div> */}
      </div>

      {/* Stats Row with Gradient Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className={cn(
                "relative overflow-hidden border-border/50 transition-all duration-300 hover:scale-[1.02] hover:border-border",
                statCardGradients[index],
              )}
            >
              {/* Background decoration */}
              <div
                className={cn(
                  "absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-30",
                  index === 0 && "bg-blue-500",
                  index === 1 && "bg-violet-500",
                  index === 2 && "bg-emerald-500",
                  index === 3 && "bg-amber-500",
                )}
              />

              <CardContent className="p-5 relative z-10">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2.5 rounded-xl flex items-center justify-center",
                      statBgColors[index],
                    )}
                  >
                    <Icon className={cn("h-5 w-5", statIconColors[index])} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stat.sublabel}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Collection Previews */}
      {collections.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Your Collections
            </h2>
            <Link href="/collections">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.slice(0, 6).map((collection) => (
              <Link key={collection.id} href={`/collections/${collection.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer overflow-hidden glass-card">
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <h3 className="font-semibold text-foreground truncate">
                        {collection.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {collection.video_count} video
                        {collection.video_count !== 1 ? "s" : ""}
                      </p>
                    </div>

                    <CollectionThumbnailGrid
                      collectionId={collection.id}
                      videoCount={collection.video_count}
                      size="md"
                    />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Reports */}
      {recentReports.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Reports</h2>
            <Link href="/reports">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="space-y-2">
            {recentReports.map((report) => (
              <Link key={report.id} href={`/reports/${report.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-500/10 rounded-lg">
                          <FileText className="h-4 w-4 text-violet-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">
                            {report.title}
                          </h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {report.report_type.replace("_", " ")}
                            {report.collection &&
                              ` • ${report.collection.name}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{formatDate(report.created_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <CaptureModal
        open={isCaptureModalOpen}
        onOpenChange={setIsCaptureModalOpen}
      />
    </div>
  );
}
