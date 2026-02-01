export type SentimentLabel = 'positive' | 'neutral' | 'negative';
export type SentimentTrend = 'improving' | 'stable' | 'declining';

export interface SentimentQuote {
  text: string;
  timestamp?: string;
  score: number;
  context?: string;
  intensity?: 'high' | 'medium' | 'low';
}

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
  token_usage?: number;
  created_at: string;
  updated_at: string;
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

// Collection stats with sentiment
export interface CollectionStats {
  collection_id: string;
  user_id: string;
  total_videos: number;
  total_duration_seconds: number;
  unique_channels: number;
  channel_ids: string[];
  earliest_video_date?: string;
  latest_video_date?: string;
  avg_sentiment_score?: number;
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  sentiment_trend?: SentimentTrend;
  top_themes?: string[];
  calculated_at: string;
}

// Sentiment analysis result from LLM
export interface SentimentAnalysisResult {
  overall_score: number;
  overall_label: SentimentLabel;
  confidence: number;
  positive_segments: number;
  neutral_segments: number;
  negative_segments: number;
  positive_quotes: SentimentQuote[];
  negative_quotes: SentimentQuote[];
  key_themes?: Array<{
    theme: string;
    sentiment: number;
    mentions: number;
  }>;
}
