"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  getUserPreferences,
  saveUserPreferences,
  type UserPreferences,
} from "@/utils/userPreferences";
import { models } from "@/utils/openrouter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Preferences() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    auto_generate_summary: false,
    summary_model: models[0].id,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const supabase = createClient();
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError || !userData?.user) {
          console.error("Could not get current user");
          return;
        }

        const userPrefs = await getUserPreferences(userData.user.id);
        setPreferences(userPrefs);
      } catch (error) {
        console.error("Error loading preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const supabase = createClient();
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData?.user) {
        throw new Error("Could not get current user");
      }

      await saveUserPreferences(userData.user.id, preferences);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving preferences:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading preferences...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="auto-generate-summary"
            checked={preferences.auto_generate_summary}
            onCheckedChange={(checked) =>
              setPreferences((prev) => ({
                ...prev,
                auto_generate_summary: checked as boolean,
              }))
            }
          />
          <Label
            htmlFor="auto-generate-summary"
            className="text-base font-normal cursor-pointer"
          >
            Auto-generate AI summaries
          </Label>
        </div>
        <p className="text-sm text-muted-foreground pl-6">
          Automatically generate AI summaries when you add a new video
        </p>
      </div>

      {preferences.auto_generate_summary && (
        <div className="space-y-4 pl-6 border-l-2 border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            <Label htmlFor="summary-model">AI Model for Summaries</Label>
            <Select
              value={preferences.summary_model}
              onValueChange={(value) =>
                setPreferences((prev) => ({
                  ...prev,
                  summary_model: value,
                }))
              }
            >
              <SelectTrigger id="summary-model" className="w-full max-w-md">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose the AI model to use for generating summaries
            </p>
          </div>
        </div>
      )}

      <div className="pt-4 border-t">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="min-w-[120px]"
        >
          {isSaving ? "Saving..." : "Save Preferences"}
        </Button>
        {saveSuccess && (
          <span className="ml-3 text-sm text-green-600 dark:text-green-400">
            Preferences saved!
          </span>
        )}
      </div>
    </div>
  );
}
