# Database Schema Plan

## Overview
This document outlines all database changes needed for the Dashboard-First Architecture, including Insight Reports, Streams, and Sentiment tracking.

---

## Migration 1: Insight Reports Table

**File:** `supabase/migrations/001_insight_reports.sql`

```sql
-- Insight Reports Table
-- Stores AI-generated analysis reports for collections or ad-hoc video selections
CREATE TABLE insight_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Identity
  title TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN (
    'executive_summary',
    'sentiment_analysis', 
    'key_themes',
    'timeline_trends',
    'comparison_matrix',
    'contradictions',
    'knowledge_graph',
    'action_items',
    'research_synthesis',
    'custom'
  )),
  
  -- Source tracking
  source_collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  video_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- AI Configuration
  prompt_template_id UUID,  -- Future: link to reusable templates
  custom_prompt TEXT,
  
  -- Content
  result_content TEXT NOT NULL,
  result_structured JSONB,  -- For structured data like sentiment analysis
  
  -- Technical metadata
  model_used TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash-lite-preview-09-2025',
  token_usage INTEGER,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ  -- Soft delete for history
);

-- Indexes for performance
CREATE INDEX idx_insight_reports_user_id ON insight_reports(user_id);
CREATE INDEX idx_insight_reports_collection_id ON insight_reports(source_collection_id) 
  WHERE source_collection_id IS NOT NULL;
CREATE INDEX idx_insight_reports_type ON insight_reports(report_type);
CREATE INDEX idx_insight_reports_status ON insight_reports(status);
CREATE INDEX idx_insight_reports_created_at ON insight_reports(created_at DESC);

-- Enable RLS
ALTER TABLE insight_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own reports
CREATE POLICY "Users can CRUD own insight reports"
  ON insight_reports FOR ALL USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_insight_reports_updated_at
  BEFORE UPDATE ON insight_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Migration 2: Streams Table

**File:** `supabase/migrations/002_streams.sql`

```sql
-- Streams Table
-- Automated monitoring that adds matching videos to a linked collection
CREATE TABLE streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Configuration
  name TEXT NOT NULL,
  description TEXT,
  search_query TEXT NOT NULL,
  
  -- Filters (stored as JSON for flexibility)
  filters JSONB DEFAULT '{
    "max_results_per_run": 10,
    "min_duration_seconds": null,
    "max_duration_seconds": null,
    "language": "en",
    "exclude_keywords": [],
    "channel_ids": []
  }'::jsonb,
  
  -- Scheduling
  schedule JSONB DEFAULT '{"frequency": "daily"}'::jsonb,
  
  -- Linked Collection (auto-created on stream creation)
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  is_auto_processing BOOLEAN DEFAULT false,
  
  -- Stats
  stats JSONB DEFAULT '{
    "total_videos_collected": 0,
    "total_runs": 0,
    "last_run_videos_found": 0,
    "last_run_videos_added": 0
  }'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_streams_user_id ON streams(user_id);
CREATE INDEX idx_streams_collection_id ON streams(collection_id);
CREATE INDEX idx_streams_status ON streams(status);

-- Enable RLS
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own streams
CREATE POLICY "Users can CRUD own streams"
  ON streams FOR ALL USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_streams_updated_at
  BEFORE UPDATE ON streams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Migration 3: Video Sentiment Cache

**File:** `supabase/migrations/003_video_sentiment.sql`

```sql
-- Video Sentiment Cache
-- Stores pre-computed sentiment analysis for individual videos
-- This can be computed on-demand initially, cached here for performance
CREATE TABLE video_sentiment_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Sentiment scores
  overall_score DECIMAL(3,2),  -- -1.00 to +1.00
  overall_label TEXT CHECK (overall_label IN ('positive', 'neutral', 'negative')),
  confidence DECIMAL(3,2),  -- 0.00 to 1.00
  
  -- Distribution (simplified)
  positive_segments INTEGER DEFAULT 0,
  neutral_segments INTEGER DEFAULT 0,
  negative_segments INTEGER DEFAULT 0,
  
  -- Key quotes (stored as JSON array)
  positive_quotes JSONB DEFAULT '[]'::jsonb,
  negative_quotes JSONB DEFAULT '[]'::jsonb,
  
  -- Technical
  model_used TEXT NOT NULL,
  token_usage INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Each user can have sentiment analysis for same video
  UNIQUE(video_id, user_id)
);

-- Indexes
CREATE INDEX idx_video_sentiment_video_id ON video_sentiment_cache(video_id);
CREATE INDEX idx_video_sentiment_user_id ON video_sentiment_cache(user_id);
CREATE INDEX idx_video_sentiment_label ON video_sentiment_cache(overall_label);

-- Enable RLS
ALTER TABLE video_sentiment_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own sentiment data
CREATE POLICY "Users can CRUD own video sentiment"
  ON video_sentiment_cache FOR ALL USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_video_sentiment_updated_at
  BEFORE UPDATE ON video_sentiment_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Migration 4: Collection Stats Cache

**File:** `supabase/migrations/004_collection_stats.sql`

```sql
-- Collection Stats Cache
-- Pre-computed statistics for fast dashboard loading
CREATE TABLE collection_stats_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Video counts
  total_videos INTEGER DEFAULT 0,
  total_duration_seconds INTEGER DEFAULT 0,
  
  -- Channel diversity
  unique_channels INTEGER DEFAULT 0,
  channel_ids JSONB DEFAULT '[]'::jsonb,
  
  -- Date range
  earliest_video_date TIMESTAMPTZ,
  latest_video_date TIMESTAMPTZ,
  
  -- Sentiment aggregation (if videos have sentiment)
  avg_sentiment_score DECIMAL(3,2),
  sentiment_distribution JSONB DEFAULT '{"positive": 0, "neutral": 0, "negative": 0}'::jsonb,
  sentiment_trend TEXT CHECK (sentiment_trend IN ('improving', 'stable', 'declining')),
  
  -- Top themes (computed by periodic analysis)
  top_themes JSONB DEFAULT '[]'::jsonb,
  
  -- Last calculation
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(collection_id, user_id)
);

-- Indexes
CREATE INDEX idx_collection_stats_collection_id ON collection_stats_cache(collection_id);
CREATE INDEX idx_collection_stats_user_id ON collection_stats_cache(user_id);

-- Enable RLS
ALTER TABLE collection_stats_cache ENABLE ROW LEVEL SECURITY;

-- Policy
CREATE POLICY "Users can access own collection stats"
  ON collection_stats_cache FOR ALL USING (user_id = auth.uid());
```

---

## TypeScript Types

**File:** `types/insightReports.ts`

```typescript
export type InsightReportType = 
  | 'executive_summary'
  | 'sentiment_analysis'
  | 'key_themes'
  | 'timeline_trends'
  | 'comparison_matrix'
  | 'contradictions'
  | 'knowledge_graph'
  | 'action_items'
  | 'research_synthesis'
  | 'custom';

export interface InsightReport {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  report_type: InsightReportType;
  source_collection_id?: string | null;
  video_ids: string[];
  prompt_template_id?: string | null;
  custom_prompt?: string | null;
  result_content: string;
  result_structured?: Record<string, unknown> | null;
  model_used: string;
  token_usage?: number;
  status: 'generating' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  
  // Joined fields
  collection?: {
    id: string;
    name: string;
  } | null;
}

export interface CreateInsightReportInput {
  title: string;
  description?: string;
  report_type: InsightReportType;
  source_collection_id?: string;
  video_ids: string[];
  custom_prompt?: string;
  model_used?: string;
}
```

**File:** `types/streams.ts`

```typescript
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
```

**File:** `types/sentiment.ts`

```typescript
export type SentimentLabel = 'positive' | 'neutral' | 'negative';
export type SentimentTrend = 'improving' | 'stable' | 'declining';

export interface VideoSentiment {
  id: string;
  video_id: string;
  user_id: string;
  overall_score: number;  // -1 to +1
  overall_label: SentimentLabel;
  confidence: number;
  positive_segments: number;
  neutral_segments: number;
  negative_segments: number;
  positive_quotes: SentimentQuote[];
  negative_quotes: SentimentQuote[];
  model_used: string;
  created_at: string;
}

export interface SentimentQuote {
  text: string;
  timestamp?: string;
  score: number;
}

export interface CollectionSentiment {
  average_score: number;
  distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  trend: SentimentTrend;
  video_count: number;
}

// Simple sentiment result for UI display
export interface SimpleSentiment {
  score: number;
  label: SentimentLabel;
  trend?: SentimentTrend;
}
```

---

## Query Patterns

### Dashboard Query
```sql
-- Get dashboard data in one query
SELECT 
  (SELECT COUNT(*) FROM videos WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days') as new_videos_count,
  (SELECT COUNT(*) FROM collections WHERE user_id = $1) as collections_count,
  (SELECT COUNT(*) FROM insight_reports WHERE user_id = $1 AND status = 'completed' AND created_at > NOW() - INTERVAL '7 days') as new_reports_count,
  (SELECT COUNT(*) FROM streams WHERE user_id = $1 AND status = 'active') as active_streams_count;
```

### Collection with Stats
```sql
SELECT 
  c.*,
  COALESCE(cs.total_videos, 0) as video_count,
  cs.avg_sentiment_score,
  cs.sentiment_trend,
  cs.top_themes
FROM collections c
LEFT JOIN collection_stats_cache cs ON cs.collection_id = c.id AND cs.user_id = c.user_id
WHERE c.user_id = $1
ORDER BY c.updated_at DESC;
```

---

## Rollback Plan

If needed, migrations can be rolled back with:

```sql
-- Rollback order (reverse of creation)
DROP TABLE IF EXISTS collection_stats_cache;
DROP TABLE IF EXISTS video_sentiment_cache;
DROP TABLE IF EXISTS streams;
DROP TABLE IF EXISTS insight_reports;
DROP FUNCTION IF EXISTS update_updated_at_column();
```
