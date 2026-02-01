"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight, Search, Filter, Calendar, Check } from "lucide-react";
import type { StreamFrequency } from "@/types/streams";
import { toast } from "sonner";

const steps = [
  { id: "query", title: "Search Query", icon: Search },
  { id: "filters", title: "Filters", icon: Filter },
  { id: "schedule", title: "Schedule", icon: Calendar },
  { id: "review", title: "Review", icon: Check },
];

export default function CreateStreamPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [searchQuery, setSearchQuery] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxResults, setMaxResults] = useState(10);
  const [minDuration, setMinDuration] = useState("");
  const [maxDuration, setMaxDuration] = useState("");
  const [language, setLanguage] = useState("en");
  const [excludeKeywords, setExcludeKeywords] = useState("");
  const [frequency, setFrequency] = useState<StreamFrequency>("daily");
  const [autoGenerateInsights, setAutoGenerateInsights] = useState(false);

  const handleNext = () => {
    if (currentStep === 0 && !searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
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
      const response = await fetch("/api/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || `${searchQuery} Stream`,
          description,
          search_query: searchQuery,
          filters: {
            max_results_per_run: maxResults,
            min_duration_seconds: minDuration ? parseInt(minDuration) * 60 : undefined,
            max_duration_seconds: maxDuration ? parseInt(maxDuration) * 60 : undefined,
            language,
            exclude_keywords: excludeKeywords.split(",").map(k => k.trim()).filter(Boolean),
          },
          schedule: {
            frequency,
          },
          is_auto_processing: autoGenerateInsights,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to create stream");
      }

      const data = await response.json();
      toast.success("Stream created successfully");
      router.push("/streams");
    } catch (error) {
      console.error("Error creating stream:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create stream");
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
              <Label htmlFor="searchQuery">
                Search Query <span className="text-destructive">*</span>
              </Label>
              <Input
                id="searchQuery"
                placeholder="e.g., AI technology reviews, React tutorials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                This query will be used to search for YouTube videos
              </p>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <Label htmlFor="name">Stream Name (Optional)</Label>
              <Input
                id="name"
                placeholder={searchQuery ? `${searchQuery} Stream` : "My Stream"}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Auto-generated from search query if left empty
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="What kind of videos should this stream collect?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxResults">Max Results Per Run</Label>
                <Input
                  id="maxResults"
                  type="number"
                  min={1}
                  max={50}
                  value={maxResults}
                  onChange={(e) => setMaxResults(parseInt(e.target.value) || 10)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="ja">Japanese</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minDuration">Min Duration (minutes)</Label>
                <Input
                  id="minDuration"
                  type="number"
                  placeholder="No minimum"
                  value={minDuration}
                  onChange={(e) => setMinDuration(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxDuration">Max Duration (minutes)</Label>
                <Input
                  id="maxDuration"
                  type="number"
                  placeholder="No maximum"
                  value={maxDuration}
                  onChange={(e) => setMaxDuration(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excludeKeywords">Exclude Keywords</Label>
              <Input
                id="excludeKeywords"
                placeholder="spam, clickbait, unrelated (comma separated)"
                value={excludeKeywords}
                onChange={(e) => setExcludeKeywords(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Videos containing these keywords will be excluded
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <RadioGroup
              value={frequency}
              onValueChange={(value) => setFrequency(value as StreamFrequency)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="hourly" id="hourly" />
                <Label htmlFor="hourly" className="flex-1 cursor-pointer">
                  <div className="font-medium">Hourly</div>
                  <div className="text-sm text-muted-foreground">
                    Check for new videos every hour
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="daily" id="daily" />
                <Label htmlFor="daily" className="flex-1 cursor-pointer">
                  <div className="font-medium">Daily</div>
                  <div className="text-sm text-muted-foreground">
                    Check for new videos once per day
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="flex-1 cursor-pointer">
                  <div className="font-medium">Weekly</div>
                  <div className="text-sm text-muted-foreground">
                    Check for new videos once per week
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="manual" id="manual" />
                <Label htmlFor="manual" className="flex-1 cursor-pointer">
                  <div className="font-medium">Manual Only</div>
                  <div className="text-sm text-muted-foreground">
                    Only run when you manually trigger it
                  </div>
                </Label>
              </div>
            </RadioGroup>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoGenerate"
                checked={autoGenerateInsights}
                onCheckedChange={(checked) => setAutoGenerateInsights(checked as boolean)}
              />
              <Label htmlFor="autoGenerate" className="text-sm cursor-pointer">
                Auto-generate weekly insights report
              </Label>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Stream Name</span>
                <p className="font-medium">{name || `${searchQuery} Stream`}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Search Query</span>
                <p className="font-medium">&ldquo;{searchQuery}&rdquo;</p>
              </div>
              {description && (
                <div>
                  <span className="text-sm text-muted-foreground">Description</span>
                  <p className="text-sm">{description}</p>
                </div>
              )}
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground">Filters</span>
                <ul className="text-sm space-y-1 mt-1">
                  <li>Max results: {maxResults}</li>
                  {minDuration && <li>Min duration: {minDuration} min</li>}
                  {maxDuration && <li>Max duration: {maxDuration} min</li>}
                  <li>Language: {language}</li>
                  {excludeKeywords && (
                    <li>Exclude: {excludeKeywords}</li>
                  )}
                </ul>
              </div>
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground">Schedule</span>
                <p className="capitalize">{frequency}</p>
                {autoGenerateInsights && (
                  <p className="text-sm text-emerald-600">✓ Auto-generate insights enabled</p>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Note:</strong> A collection named &ldquo;{name || `${searchQuery} Stream`}&rdquo; will be automatically created to store videos found by this stream.
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
          onClick={() => router.push("/streams")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Streams
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Create New Stream</h1>
        <p className="text-muted-foreground">
          Set up automated video collection from YouTube
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isCompleted
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 sm:w-20 h-0.5 mx-2 ${
                      isCompleted ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-sm">
          {steps.map((step, index) => (
            <span
              key={step.id}
              className={`${
                index === currentStep
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              } ${index > 0 ? "ml-4" : ""}`}
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
            {currentStep === 0 && "What videos are you looking for?"}
            {currentStep === 1 && "Refine your search criteria"}
            {currentStep === 2 && "How often should we check for new videos?"}
            {currentStep === 3 && "Review your stream configuration"}
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
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Create Stream
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
