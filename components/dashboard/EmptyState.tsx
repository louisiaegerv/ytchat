"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WifiCog, LinkIcon, Sparkles, Zap } from "lucide-react";

interface EmptyStateProps {
  onCreateStream: () => void;
  onAddVideo: () => void;
}

export function EmptyState({ onCreateStream, onAddVideo }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="text-center max-w-md mx-auto">
        {/* Animated Logo */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-2xl animate-pulse-slow" />
            <div className="absolute inset-0 bg-violet-500/30 rounded-full blur-2xl animate-pulse-slow delay-1000" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl logo-gradient shadow-2xl shadow-blue-500/30">
              <Zap className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold mb-3">
          <span className="gradient-text">Welcome to Slipstream</span>
        </h1>

        {/* Description */}
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Transform YouTube content into actionable intelligence. 
          Start by creating a stream to automatically collect videos 
          or add a single video to analyze.
        </p>

        {/* CTAs */}
        <div className="space-y-3">
          <Card 
            className="cursor-pointer hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] glass-card group"
            onClick={onCreateStream}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 group-hover:from-blue-500/30 group-hover:to-violet-500/30 transition-colors">
                <WifiCog className="h-6 w-6 text-blue-400" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-foreground">Create Your First Stream</h3>
                <p className="text-sm text-muted-foreground">
                  Auto-collect videos by keyword or topic
                </p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] glass-card group"
            onClick={onAddVideo}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary group-hover:bg-secondary/80 transition-colors">
                <LinkIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-foreground">Add Single Video</h3>
                <p className="text-sm text-muted-foreground">
                  Analyze a specific YouTube video
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tip */}
        <p className="mt-6 text-xs text-muted-foreground">
          💡 Tip: Streams automatically collect new videos matching your criteria
        </p>
      </div>
    </div>
  );
}
