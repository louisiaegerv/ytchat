import { createClient } from "@/utils/supabase/client";

export interface UserPreferences {
  auto_generate_summary: boolean;
  summary_model: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  auto_generate_summary: false,
  summary_model: "google/gemini-2.5-flash-lite-preview-09-2025",
};

/**
 * Fetch user preferences from database.
 * Returns default preferences if user has no preferences record.
 */
export async function getUserPreferences(
  userId: string,
): Promise<UserPreferences> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_settings")
      .select("auto_generate_summary, summary_model")
      .eq("user_id", userId)
      .single();

    if (error) {
      // If no record found, return defaults
      if (error.code === "PGRST116") {
        return DEFAULT_PREFERENCES;
      }
      throw error;
    }

    return {
      auto_generate_summary: data?.auto_generate_summary ?? false,
      summary_model: data?.summary_model ?? DEFAULT_PREFERENCES.summary_model,
    };
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save/update user preferences.
 * Creates a new record if one doesn't exist.
 */
export async function saveUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>,
): Promise<void> {
  try {
    const supabase = createClient();

    // First, check if user has a preferences record
    const { data: existingData } = await supabase
      .from("user_settings")
      .select("user_id")
      .eq("user_id", userId)
      .single();

    if (existingData) {
      // Update existing record
      const { error } = await supabase
        .from("user_settings")
        .update({
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) throw error;
    } else {
      // Create new record
      const { error } = await supabase.from("user_settings").insert([
        {
          user_id: userId,
          ...preferences,
          blur_thumbnails: false, // Default value
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
    }
  } catch (error) {
    console.error("Error saving user preferences:", error);
    throw error;
  }
}
