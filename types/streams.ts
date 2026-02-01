export type StreamFrequency = 'hourly' | 'daily' | 'weekly' | 'manual';
export type StreamStatus = 'active' | 'paused' | 'error';

export interface StreamFilters {
  max_results_per_run?: number;
  min_duration_seconds?: number;
  max_duration_seconds?: number;
  language?: string;
  channel_ids?: string[];
  exclude_keywords?: string[];
}

export interface StreamSchedule {
  frequency: StreamFrequency;
  last_run_at?: string;
  next_run_at?: string;
}

export interface StreamStats {
  total_videos_collected: number;
  total_runs: number;
  last_run_videos_found: number;
  last_run_videos_added: number;
}

export interface Stream {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  search_query: string;
  filters: StreamFilters;
  schedule: StreamSchedule;
  collection_id: string;
  status: StreamStatus;
  is_auto_processing: boolean;
  stats: StreamStats;
  created_at: string;
  updated_at: string;
  last_run_at?: string;
  next_run_at?: string;
  
  // Joined fields
  collection?: {
    id: string;
    name: string;
    video_count: number;
  };
}

export interface CreateStreamInput {
  name: string;
  description?: string;
  search_query: string;
  filters?: Partial<StreamFilters>;
  schedule?: Partial<StreamSchedule>;
  is_auto_processing?: boolean;
}

export interface StreamFormData {
  searchQuery: string;
  filters: {
    maxResultsPerRun: number;
    minDuration?: number;
    maxDuration?: number;
    language: string;
    excludeKeywords: string[];
  };
  schedule: {
    frequency: StreamFrequency;
    autoGenerateInsights: boolean;
  };
}
