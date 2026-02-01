"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StreamStatusBadge } from "./StreamStatusBadge";
import type { Stream } from "@/types/streams";
import {
  MoreHorizontal,
  Play,
  Pause,
  Edit,
  Trash2,
  ExternalLink,
  Folder,
} from "lucide-react";

interface StreamCardProps {
  stream: Stream;
  onRun?: () => void;
  onPause?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function StreamCard({ stream, onRun, onPause, onEdit, onDelete }: StreamCardProps) {
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = async () => {
    setIsRunning(true);
    try {
      await onRun?.();
    } finally {
      setIsRunning(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">
                {stream.name}
              </h3>
              <StreamStatusBadge status={stream.status} lastRunAt={stream.last_run_at} />
            </div>

            {/* Search Query */}
            <p className="text-sm text-muted-foreground mb-3 truncate">
              &ldquo;{stream.search_query}&rdquo;
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <span>{stream.stats.total_videos_collected} videos collected</span>
              <span>•</span>
              <span>{stream.stats.total_runs} runs</span>
            </div>

            {/* Collection Link */}
            {stream.collection && (
              <Link 
                href={`/collections/${stream.collection.id}`}
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Folder className="h-3.5 w-3.5" />
                {stream.collection.name}
              </Link>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-4">
            {stream.status === "active" ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onPause}
                title="Pause stream"
              >
                <Pause className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onRun}
                disabled={isRunning}
                title="Run stream now"
              >
                <Play className="h-4 w-4" />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                {stream.collection && (
                  <DropdownMenuItem asChild>
                    <Link href={`/collections/${stream.collection.id}`}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Collection
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Last Run */}
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Last run: {formatDate(stream.last_run_at)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
