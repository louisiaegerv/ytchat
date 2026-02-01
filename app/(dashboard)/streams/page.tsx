"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { StreamCard } from "@/components/streams/StreamCard";
import type { Stream } from "@/types/streams";
import { Plus, RefreshCw, WifiCog } from "lucide-react";
import { toast } from "sonner";

export default function StreamsPage() {
  const router = useRouter();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    try {
      const response = await fetch("/api/streams");
      if (!response.ok) throw new Error("Failed to fetch streams");
      const data = await response.json();
      setStreams(data.streams);
    } catch (error) {
      console.error("Error fetching streams:", error);
      toast.error("Failed to load streams");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunStream = async (streamId: string) => {
    try {
      const response = await fetch(`/api/streams/${streamId}/run`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to run stream");
      toast.success("Stream run started");
      fetchStreams(); // Refresh list
    } catch (error) {
      console.error("Error running stream:", error);
      toast.error("Failed to run stream");
    }
  };

  const handlePauseStream = async (streamId: string) => {
    try {
      const response = await fetch(`/api/streams/${streamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paused" }),
      });
      if (!response.ok) throw new Error("Failed to pause stream");
      toast.success("Stream paused");
      fetchStreams(); // Refresh list
    } catch (error) {
      console.error("Error pausing stream:", error);
      toast.error("Failed to pause stream");
    }
  };

  const handleDeleteStream = async (streamId: string) => {
    if (!confirm("Are you sure you want to delete this stream?")) return;

    try {
      const response = await fetch(`/api/streams/${streamId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete stream");
      toast.success("Stream deleted");
      fetchStreams(); // Refresh list
    } catch (error) {
      console.error("Error deleting stream:", error);
      toast.error("Failed to delete stream");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Streams</h1>
            <p className="text-muted-foreground">
              Automated video collection from YouTube
            </p>
          </div>
          <Link href="/streams/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Stream
            </Button>
          </Link>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
            <WifiCog className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No streams yet</h2>
          <p className="text-muted-foreground max-w-sm mb-6">
            Streams automatically collect YouTube videos based on your search criteria. 
            Create your first stream to start building collections.
          </p>
          <Link href="/streams/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Stream
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Streams</h1>
          <p className="text-muted-foreground">
            Automated video collection from YouTube
          </p>
        </div>
        <Link href="/streams/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Stream
          </Button>
        </Link>
      </div>

      {/* Streams List */}
      <div className="space-y-4">
        {streams.map((stream) => (
          <StreamCard
            key={stream.id}
            stream={stream}
            onRun={() => handleRunStream(stream.id)}
            onPause={() => handlePauseStream(stream.id)}
            onEdit={() => router.push(`/streams/${stream.id}`)}
            onDelete={() => handleDeleteStream(stream.id)}
          />
        ))}
      </div>
    </div>
  );
}
