"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Collection, Video } from "@/types/library";
import {
  ArrowLeft,
  Folder,
  Video as VideoIcon,
  FileText,
  BarChart3,
  MoreHorizontal,
  Edit,
  Trash2,
  Play,
  Plus,
  Pin,
  CheckSquare,
  X,
  Clock,
  TrendingUp,
  Calendar,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUserId } from "@/hooks/queries/useUserQuery";
import { useCollectionVideosQuery } from "@/hooks/queries/useCollectionsQuery";
import { usePinnedCollectionsQuery } from "@/hooks/queries/usePinnedCollectionsQuery";
import { usePinnedCollectionMutations } from "@/hooks/mutations/usePinnedCollectionMutations";
import { useCollectionMutations } from "@/hooks/mutations/useCollectionMutations";
import { useQuery } from "@tanstack/react-query";
import PinLimitDialog from "@/components/library/PinLimitDialog";

// Gradient backgrounds for stat cards
const statCardGradients = [
  "stat-card-gradient-1 glow-blue",
  "stat-card-gradient-2 glow-purple",
  "stat-card-gradient-3 glow-green",
];

const statIconColors = [
  "text-blue-400",
  "text-violet-400",
  "text-emerald-400",
];

const statBgColors = [
  "bg-blue-500/10",
  "bg-violet-500/10",
  "bg-emerald-500/10",
];

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id as string;
  const { userId } = useUserId();
  const supabase = useMemo(() => createClient(), []);

  const [activeTab, setActiveTab] = useState("videos");
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  
  // Pin limit dialog
  const [showPinLimitDialog, setShowPinLimitDialog] = useState(false);

  // React Query hooks
  const { data: pinnedCollections = [] } = usePinnedCollectionsQuery(userId);
  const { data: collectionVideos = [], isLoading: videosLoading, refetch: refetchVideos } = useCollectionVideosQuery(collectionId);
  const { pinCollection, unpinCollection, isPinning, isUnpinning } = usePinnedCollectionMutations();
  const { removeVideosFromCollection, isRemovingVideos } = useCollectionMutations();

  const isPinned = useMemo(() => {
    return pinnedCollections.some((p) => p.collection_id === collectionId);
  }, [pinnedCollections, collectionId]);

  const syncingCollectionId = isPinning || isUnpinning ? collectionId : null;

  // Fetch collection details with React Query
  const { data: collection, isLoading: collectionLoading } = useQuery({
    queryKey: ["collection", collectionId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("id", collectionId)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      
      // Update last accessed timestamp (fire and forget)
      supabase
        .from("collections")
        .update({ last_accessed_at: new Date().toISOString() })
        .eq("id", collectionId)
        .then(() => {});
      
      return data as Collection;
    },
    enabled: !!collectionId && !!userId,
  });

  // Calculate stats
  const stats = useMemo(() => {
    if (!collectionVideos.length) return { total: 0, withSummaries: 0, withChats: 0 };
    
    // Note: These would need to be fetched from the database in a real implementation
    // For now, we'll show placeholders
    return {
      total: collectionVideos.length,
      withSummaries: 0, // Would need additional query
      withChats: 0, // Would need additional query
    };
  }, [collectionVideos]);

  // Handle pin/unpin collection
  const handleTogglePin = async () => {
    if (!userId) return;
    
    try {
      if (isPinned) {
        await unpinCollection({ userId, collectionId });
        toast.success("Collection unpinned");
      } else {
        await pinCollection({ userId, collectionId });
        toast.success("Collection pinned to sidebar");
      }
    } catch (err: any) {
      if (err.message === "PIN_LIMIT_REACHED") {
        setShowPinLimitDialog(true);
      } else {
        toast.error(err.message || "Failed to update pin status");
      }
    }
  };

  // Handle replace from pin limit dialog
  const handleReplacePin = async (oldCollectionId: string) => {
    if (!userId) return;
    try {
      await unpinCollection({ userId, collectionId: oldCollectionId });
      await pinCollection({ userId, collectionId });
      setShowPinLimitDialog(false);
      toast.success("Collection pinned to sidebar");
    } catch (err: any) {
      toast.error(err.message || "Failed to pin collection");
    }
  };

  // Handle video selection toggle
  const handleVideoSelect = (videoId: string, checked: boolean) => {
    if (checked) {
      setSelectedVideos((prev) => [...prev, videoId]);
    } else {
      setSelectedVideos((prev) => prev.filter((id) => id !== videoId));
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedVideos.length === collectionVideos.length) {
      setSelectedVideos([]);
    } else {
      setSelectedVideos(collectionVideos.map((v) => v.id));
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedVideos([]);
  };

  // Toggle selection mode
  const handleToggleSelectionMode = () => {
    if (isSelectionMode) {
      clearSelection();
    }
    setIsSelectionMode(!isSelectionMode);
  };

  // Handle single video removal
  const handleRemoveVideo = async (videoId: string) => {
    if (!userId) return;
    
    try {
      await removeVideosFromCollection({
        collectionId,
        videoIds: [videoId],
        userId,
      });
      refetchVideos();
      toast.success("Video removed from collection");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove video");
    }
  };

  // Handle bulk remove
  const handleBulkRemove = async () => {
    if (!userId || selectedVideos.length === 0) return;

    try {
      await removeVideosFromCollection({
        collectionId,
        videoIds: selectedVideos,
        userId,
      });
      refetchVideos();
      clearSelection();
      setIsSelectionMode(false);
      setShowRemoveDialog(false);
      toast.success(`${selectedVideos.length} video${selectedVideos.length !== 1 ? "s" : ""} removed from collection`);
    } catch (err: any) {
      toast.error(err.message || "Failed to remove videos");
    }
  };

  // Handle delete collection
  const handleDeleteCollection = async () => {
    if (!confirm("Are you sure you want to delete this collection?")) return;

    try {
      const { error } = await supabase
        .from("collections")
        .delete()
        .eq("id", collectionId);

      if (error) throw error;

      toast.success("Collection deleted");
      router.push("/collections");
    } catch (error) {
      console.error("Error deleting collection:", error);
      toast.error("Failed to delete collection");
    }
  };

  const formatDuration = (duration?: string | null) => {
    if (!duration) return "--:--";
    if (duration.startsWith("PT")) {
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (match) {
        const hours = parseInt(match[1] || "0");
        const mins = parseInt(match[2] || "0");
        const secs = parseInt(match[3] || "0");
        if (hours > 0) {
          return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        }
        return `${mins}:${secs.toString().padStart(2, "0")}`;
      }
    }
    return duration;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isLoading = collectionLoading || videosLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-muted-foreground">Collection not found</p>
        <Button onClick={() => router.push("/collections")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Collections
        </Button>
      </div>
    );
  }

  const statItems = [
    { 
      label: "Videos", 
      value: stats.total, 
      icon: VideoIcon 
    },
    { 
      label: "Summaries", 
      value: stats.withSummaries, 
      icon: FileText 
    },
    { 
      label: "Chats", 
      value: stats.withChats, 
      icon: BarChart3 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/collections")}
            className="mt-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Folder className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="gradient-text">{collection.name}</span>
              </h1>
              {isPinned && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <Pin className="h-3 w-3 mr-1 fill-current" />
                  Pinned
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              {collection.description && (
                <p>{collection.description}</p>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Created {formatDate(collection.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isSelectionMode ? "default" : "outline"}
            size="sm"
            onClick={handleToggleSelectionMode}
          >
            <CheckSquare className="mr-2 h-4 w-4" />
            {isSelectionMode ? "Done" : "Select"}
          </Button>
          <Button
            variant={isPinned ? "default" : "outline"}
            size="sm"
            onClick={handleTogglePin}
            disabled={!!syncingCollectionId}
          >
            <Pin className={`mr-2 h-4 w-4 ${isPinned ? "fill-current" : ""}`} />
            {isPinned ? "Pinned" : "Pin"}
          </Button>
          <Link href={`/videos?collection=${collectionId}`}>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Videos
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDeleteCollection}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Collection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Row with Gradient Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statItems.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={stat.label}
              className={cn(
                "relative overflow-hidden border-border/50 transition-all duration-300 hover:scale-[1.02] hover:border-border",
                statCardGradients[index]
              )}
            >
              {/* Background decoration */}
              <div className={cn(
                "absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-30",
                index === 0 && "bg-blue-500",
                index === 1 && "bg-violet-500",
                index === 2 && "bg-emerald-500"
              )} />
              
              <CardContent className="p-5 relative z-10">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2.5 rounded-xl flex items-center justify-center",
                    statBgColors[index]
                  )}>
                    <Icon className={cn("h-5 w-5", statIconColors[index])} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selection Mode Bar */}
      {isSelectionMode && (
        <div className="p-4 bg-muted/50 border rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox 
                checked={selectedVideos.length === collectionVideos.length && collectionVideos.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="font-medium text-sm">
                {selectedVideos.length} selected
              </span>
            </div>
            {selectedVideos.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="h-8 px-2 text-muted-foreground"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowRemoveDialog(true)}
            disabled={selectedVideos.length === 0 || isRemovingVideos}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remove from Collection
          </Button>
        </div>
      )}

      {/* Error message */}
      {localError && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-destructive text-sm">{localError}</p>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="videos">
            Videos ({collectionVideos.length})
          </TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="space-y-4 mt-4">
          {collectionVideos.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <VideoIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2 text-white">No videos yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add videos to this collection from your library
                </p>
                <Link href={`/videos?collection=${collectionId}`}>
                  <Button className="btn-gradient">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Videos
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {collectionVideos.map((video) => (
                <div key={video.id} className="relative group">
                  {isSelectionMode ? (
                    <Card 
                      className={cn(
                        "overflow-hidden cursor-pointer transition-all duration-200 border-2",
                        selectedVideos.includes(video.id) 
                          ? "border-primary bg-primary/5" 
                          : "border-transparent hover:border-border"
                      )}
                      onClick={() => handleVideoSelect(video.id, !selectedVideos.includes(video.id))}
                    >
                      <div className="aspect-video bg-muted relative">
                        {video.youtube_thumbnail ? (
                          <img
                            src={video.youtube_thumbnail}
                            alt={video.title || "Video thumbnail"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <VideoIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          <Checkbox 
                            checked={selectedVideos.includes(video.id)}
                            onCheckedChange={(checked) => 
                              handleVideoSelect(video.id, checked as boolean)
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                          {formatDuration(video.duration)}
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-medium text-sm line-clamp-2 text-foreground">
                          {video.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {video.channel_title || "Unknown channel"}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <Link href={`/videos/${video.id}`}>
                        <Card className="hover:border-primary/50 transition-all duration-200 cursor-pointer overflow-hidden glass-card group-hover:shadow-lg">
                          <div className="aspect-video bg-muted relative">
                            {video.youtube_thumbnail ? (
                              <img
                                src={video.youtube_thumbnail}
                                alt={video.title || "Video thumbnail"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <VideoIcon className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                              {formatDuration(video.duration)}
                            </div>
                            {/* Play overlay on hover */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Play className="h-10 w-10 text-white fill-white" />
                            </div>
                          </div>
                          <CardContent className="p-3">
                            <h3 className="font-medium text-sm line-clamp-2 text-foreground">
                              {video.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {video.channel_title || "Unknown channel"}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                      {/* Remove button - appears on hover */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleRemoveVideo(video.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove from Collection
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4 mt-4">
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2 text-white">Collection Insights</h3>
              <p className="text-muted-foreground mb-4">
                Generate AI-powered reports to analyze your collection
              </p>
              <Link href={`/reports?collection=${collectionId}`}>
                <Button className="btn-gradient">
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Remove Confirmation Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Remove videos from collection?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedVideos.length} video{selectedVideos.length !== 1 ? "s" : ""} from this collection? 
              The videos will remain in your library.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRemoveDialog(false)}
              disabled={isRemovingVideos}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkRemove}
              disabled={isRemovingVideos}
            >
              {isRemovingVideos ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pin Limit Dialog */}
      <PinLimitDialog
        open={showPinLimitDialog}
        onOpenChange={setShowPinLimitDialog}
        pinnedCollections={pinnedCollections}
        onReplace={handleReplacePin}
        newCollectionId={collectionId}
      />
    </div>
  );
}
