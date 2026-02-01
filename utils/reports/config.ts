// Report generation configuration
export const REPORT_CONFIG = {
  // Maximum videos per report (to avoid token limits)
  MAX_VIDEOS_PER_REPORT: 50,
  
  // Default model
  DEFAULT_MODEL: 'google/gemini-2.5-flash-lite-preview-09-2025',
  
  // Cost estimates (for user transparency)
  COST_PER_1K_INPUT_TOKENS: 0.10,
  COST_PER_1K_OUTPUT_TOKENS: 0.50,
  
  // Estimated tokens per video (rough estimate)
  ESTIMATED_TOKENS_PER_VIDEO: 2000,
  
  // Generation timeout (30 seconds for MVP)
  GENERATION_TIMEOUT_MS: 30000,
  
  // Report types with metadata
  REPORT_TYPES: {
    executive_summary: {
      name: 'Executive Summary',
      description: 'High-level synthesis of key insights',
      icon: '📄',
      estimatedTime: '30-60 seconds',
      minVideos: 2,
      maxVideos: 50
    },
    sentiment_analysis: {
      name: 'Sentiment Analysis',
      description: 'Overall sentiment and key positive/negative points',
      icon: '🎭',
      estimatedTime: '30-60 seconds',
      minVideos: 1,
      maxVideos: 50
    },
    comparison_matrix: {
      name: 'Comparison Matrix',
      description: 'Side-by-side comparison of videos',
      icon: '⚖️',
      estimatedTime: '45-90 seconds',
      minVideos: 2,
      maxVideos: 10
    },
    custom: {
      name: 'Custom Analysis',
      description: 'Ask anything about the videos',
      icon: '✏️',
      estimatedTime: '30-90 seconds',
      minVideos: 1,
      maxVideos: 50
    }
  } as const
};

// Stream configuration
export const STREAM_CONFIG = {
  // Maximum results per run (avoid rate limits)
  MAX_RESULTS_PER_RUN: 50,
  
  // Default schedule
  DEFAULT_FREQUENCY: 'daily',
  
  // Minimum interval between manual runs (5 minutes)
  MIN_RUN_INTERVAL_MS: 300000,
  
  // Frequency options
  FREQUENCIES: {
    hourly: { label: 'Hourly', cron: '0 * * * *' },
    daily: { label: 'Daily', cron: '0 0 * * *' },
    weekly: { label: 'Weekly', cron: '0 0 * * 0' },
    manual: { label: 'Manual Only', cron: null }
  }
};
