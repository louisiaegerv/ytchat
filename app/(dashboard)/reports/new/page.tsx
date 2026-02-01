"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, FileText, Check, Loader2 } from "lucide-react";
import type { InsightReportType } from "@/types/insightReports";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const reportTypes: { id: InsightReportType; name: string; description: string; icon: string; minVideos: number }[] = [
  { id: "executive_summary", name: "Executive Summary", description: "High-level synthesis of key insights", icon: "📄", minVideos: 2 },
  { id: "sentiment_analysis", name: "Sentiment Analysis", description: "Overall sentiment and key positive/negative points", icon: "🎭", minVideos: 1 },
  { id: "comparison_matrix", name: "Comparison Matrix", description: "Side-by-side comparison of videos", icon: "⚖️", minVideos: 2 },
  { id: "custom", name: "Custom Analysis", description: "Ask anything about the videos", icon: "✏️", minVideos: 1 },
];

const steps = [
  { id: "videos", title: "Select Videos" },
  { id: "type", title: "Choose Type" },
  { id: "configure", title: "Configure" },
  { id: "review", title: "Review" },
];

export default function NewReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const collectionId = searchParams.get("collection");
  const regenerateId = searchParams.get("regenerate");

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collections, setCollections] = useState<{ id: string; name: string; videoCount: number }[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>(collectionId || "");
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [videos, setVideos] = useState<{ id: string; title: string; channel_title?: string }[]>([]);

  const [reportType, setReportType] = useState<InsightReportType>("executive_summary");
  const [customPrompt, setCustomPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [selectedCollectionName, setSelectedCollectionName] = useState<string>("");

  useEffect(() => {
    fetchCollections();
  }, []);

  // When collections load and we have a collectionId from URL, set the name
  useEffect(() => {
    if (collectionId && collections.length > 0) {
      const collection = collections.find((c) => c.id === collectionId);
      if (collection) {
        setSelectedCollectionName(collection.name);
        fetchCollectionVideos(collectionId);
      }
    }
  }, [collectionId, collections]);

  const fetchCollections = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("collections")
        .select("id, name")
        .eq("user_id", user.id);

      if (error) throw error;

      // Get video counts for each collection
      const collectionsWithCounts = await Promise.all(
        (data || []).map(async (collection) => {
          const { count } = await supabase
            .from("video_collections")
            .select("*", { count: "exact", head: true })
            .eq("collection_id", collection.id);
          return { ...collection, videoCount: count || 0 };
        })
      );

      setCollections(collectionsWithCounts);
    } catch (error) {
      console.error("Error fetching collections:", error);
    }
  };

  const fetchCollectionVideos = async (collectionId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("video_collections")
        .select(`
          video_id,
          videos(id, title, youtube_id, channel_id)
        `)
        .eq("collection_id", collectionId);

      if (error) throw error;

      // The data structure from Supabase join - videos is returned as an array
      const videoList: { id: string; title: string; channel_title?: string }[] = [];
      
      data?.forEach((v: any) => {
        const videoData = v.videos;
        // Handle both array and object returns from Supabase
        const video = Array.isArray(videoData) ? videoData[0] : videoData;
        if (video) {
          videoList.push({
            id: video.id,
            title: video.title || "Untitled",
            channel_title: video.channel_id || "Unknown channel"
          });
        }
      });
      
      setVideos(videoList);
      // Auto-select all videos initially
      setSelectedVideos(videoList.map((v: any) => v.id));
    } catch (error) {
      console.error("Error fetching videos:", error);
      toast.error("Failed to load videos");
    }
  };

  const handleCollectionChange = (collectionId: string) => {
    setSelectedCollection(collectionId);
    const collection = collections.find((c) => c.id === collectionId);
    setSelectedCollectionName(collection?.name || "");
    fetchCollectionVideos(collectionId);
  };

  const handleVideoToggle = (videoId: string) => {
    setSelectedVideos((prev) =>
      prev.includes(videoId)
        ? prev.filter((id) => id !== videoId)
        : [...prev, videoId]
    );
  };

  const handleNext = () => {
    if (currentStep === 0 && selectedVideos.length === 0) {
      toast.error("Please select at least one video");
      return;
    }
    if (currentStep === 1) {
      const selectedType = reportTypes.find((t) => t.id === reportType);
      if (selectedType && selectedVideos.length < selectedType.minVideos) {
        toast.error(`${selectedType.name} requires at least ${selectedType.minVideos} videos`);
        return;
      }
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const reportTypeName = reportTypes.find(t => t.id === reportType)?.name;
      
      // Format: MMDDYYYY_HHMMSSam (e.g., 02012026_042045am)
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const year = now.getFullYear();
      let hour = now.getHours();
      const isPm = hour >= 12;
      const ampm = isPm ? "pm" : "am";
      hour = hour % 12 || 12; // Convert to 12-hour format, 0 becomes 12
      const hourStr = String(hour).padStart(2, "0"); // Pad single digit hours with leading zero
      const minute = String(now.getMinutes()).padStart(2, "0");
      const second = String(now.getSeconds()).padStart(2, "0");
      const formattedDateTime = `${month}${day}${year}_${hourStr}${minute}${second}${ampm}`;
      
      const defaultTitle = selectedCollectionName 
        ? `${reportTypeName} - ${selectedCollectionName} - ${formattedDateTime}`
        : `${reportTypeName} - ${formattedDateTime}`;
      
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || defaultTitle,
          report_type: reportType,
          source_collection_id: selectedCollection || null,
          video_ids: selectedVideos,
          custom_prompt: reportType === "custom" ? customPrompt : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to create report");
      }

      const data = await response.json();
      toast.success("Report generation started");
      router.push(`/reports/${data.report.id}`);
    } catch (error) {
      console.error("Error creating report:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Collection (Optional)</Label>
              <select
                value={selectedCollection}
                onChange={(e) => handleCollectionChange(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">All videos...</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name} ({collection.videoCount} videos)
                  </option>
                ))}
              </select>
            </div>

            {videos.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Select Videos</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSelectedVideos(
                        selectedVideos.length === videos.length
                          ? []
                          : videos.map((v) => v.id)
                      )
                    }
                  >
                    {selectedVideos.length === videos.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                </div>
                <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                  {videos.map((video) => (
                    <label
                      key={video.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedVideos.includes(video.id)}
                        onCheckedChange={() => handleVideoToggle(video.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{video.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {video.channel_title || "Unknown channel"}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedVideos.length} of {videos.length} selected
                </p>
              </div>
            )}
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <RadioGroup
              value={reportType}
              onValueChange={(value) => setReportType(value as InsightReportType)}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {reportTypes.map((type) => (
                <div key={type.id}>
                  <RadioGroupItem
                    value={type.id}
                    id={type.id}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={type.id}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors",
                      "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                    )}
                  >
                    <span className="text-3xl mb-2">{type.icon}</span>
                    <span className="font-semibold">{type.name}</span>
                    <span className="text-xs text-muted-foreground text-center mt-1">
                      {type.description}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Min {type.minVideos} video{type.minVideos > 1 ? "s" : ""}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            {reportType === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="customPrompt">
                  Your Question <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="customPrompt"
                  placeholder="What would you like to know about these videos?"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  Ask any question and the AI will analyze the video transcripts to answer it.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Report Title (Optional)</Label>
              <Input
                id="title"
                placeholder={`${reportTypes.find(t => t.id === reportType)?.name} - ${selectedCollectionName || "..."} - 02012026_042045am`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Default format: Report Type - {selectedCollectionName ? "Collection Name - " : ""}MMDDYYYY_HMMam
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Report Type</span>
                <p className="font-medium">
                  {reportTypes.find((t) => t.id === reportType)?.name}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Videos Selected</span>
                <p className="font-medium">{selectedVideos.length} videos</p>
              </div>
              {selectedCollection && (
                <div>
                  <span className="text-sm text-muted-foreground">Collection</span>
                  <p className="font-medium">
                    {collections.find((c) => c.id === selectedCollection)?.name}
                  </p>
                </div>
              )}
              {reportType === "custom" && customPrompt && (
                <div>
                  <span className="text-sm text-muted-foreground">Question</span>
                  <p className="text-sm">{customPrompt}</p>
                </div>
              )}
            </div>

            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Note:</strong> Report generation typically takes 30-60 seconds. You can navigate away and check back later.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/reports")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reports
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Generate New Report</h1>
        <p className="text-muted-foreground">
          Create an AI-powered analysis of your videos
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                  index === currentStep
                    ? "bg-primary text-primary-foreground"
                    : index < currentStep
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {index < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-12 sm:w-20 h-0.5 mx-2",
                    index < currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs sm:text-sm">
          {steps.map((step, index) => (
            <span
              key={step.id}
              className={cn(
                index === currentStep
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              )}
              style={{ width: index === 0 || index === steps.length - 1 ? "auto" : `${100 / steps.length}%`, textAlign: index === 0 ? "left" : index === steps.length - 1 ? "right" : "center" }}
            >
              {step.title}
            </span>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
          <CardDescription>
            {currentStep === 0 && "Choose which videos to analyze"}
            {currentStep === 1 && "Select the type of analysis you want"}
            {currentStep === 2 && "Configure your report"}
            {currentStep === 3 && "Review and generate your report"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {getStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || (reportType === "custom" && !customPrompt.trim())}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
