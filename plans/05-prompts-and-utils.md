# Prompts and Utilities

## Overview
LLM prompts and utility functions for report generation and sentiment analysis.

---

## Report Generation Prompts

**File:** `utils/reports/prompts.ts`

### Executive Summary Prompt

```typescript
export const executiveSummaryPrompt = (videoCount: number, transcriptsText: string) => `
You are a professional research analyst. Analyze ${videoCount} video transcripts and create a concise executive summary.

**Task:**
Synthesize the key information across all videos into a structured summary.

**Output Format:**
## Overview
[2-3 sentences describing the overall topic and scope]

## Key Findings
[5-7 bullet points of the most important insights, with citations like [Video Title, HH:MM]]

## Common Themes
[3-5 recurring topics with brief explanations]

## Notable Perspectives
[Any significant disagreements or unique viewpoints]

## Conclusion
[1-2 sentences summarizing the overall takeaway]

**Guidelines:**
- Use neutral, professional language
- Include specific citations with timestamps
- Highlight consensus and disagreements
- Note any gaps in coverage

**Transcripts:**
${transcriptsText}
`;
```

### Sentiment Analysis Prompt

```typescript
export const sentimentAnalysisPrompt = (videoCount: number, transcriptsText: string) => `
You are a sentiment analysis expert. Analyze ${videoCount} video transcripts and provide sentiment insights.

**Task:**
Determine the overall sentiment and identify key positive and negative points.

**Output Format (JSON):**
{
  "overall_score": [number between -1.0 and 1.0],
  "overall_label": ["positive" | "neutral" | "negative"],
  "confidence": [number between 0.0 and 1.0],
  "distribution": {
    "positive_segments": [number],
    "neutral_segments": [number],
    "negative_segments": [number]
  },
  "positive_quotes": [
    {
      "text": [exact quote],
      "context": [brief context],
      "intensity": ["high" | "medium" | "low"]
    }
  ],
  "negative_quotes": [
    {
      "text": [exact quote],
      "context": [brief context],
      "intensity": ["high" | "medium" | "low"]
    }
  ],
  "key_themes": [
    {
      "theme": [theme name],
      "sentiment": [number between -1.0 and 1.0],
      "mentions": [number]
    }
  ]
}

**Guidelines:**
- Be objective and balanced
- Include exact quotes with context
- Identify 3-5 key themes
- Rate intensity of sentiment

**Transcripts:**
${transcriptsText}
`;
```

### Comparison Matrix Prompt

```typescript
export const comparisonMatrixPrompt = (videos: {id: string, title: string}[], transcriptsText: string) => `
You are a comparative analyst. Compare ${videos.length} videos side-by-side.

**Videos:**
${videos.map((v, i) => `${i + 1}. ${v.title}`).join('\n')}

**Task:**
Create a detailed comparison matrix analyzing the videos across multiple dimensions.

**Output Format:**
## Comparison Matrix

| Dimension | ${videos.map(v => v.title.substring(0, 20)).join(' | ')} |
|-----------|${videos.map(() => '----------').join('|')}|
| Main Thesis | [for each] | [for each] | ... |
| Key Arguments | [for each] | [for each] | ... |
| Evidence Quality | [for each] | [for each] | ... |
| Perspective | [for each] | [for each] | ... |
| Unique Insights | [for each] | [for each] | ... |

## Similarities
[Common ground across videos]

## Differences
[Key points of divergence]

## Synthesis
[Which video adds what to the overall understanding]

**Transcripts:**
${transcriptsText}
`;
```

### Custom Report Prompt

```typescript
export const customReportPrompt = (
  userPrompt: string, 
  videoCount: number, 
  transcriptsText: string
) => `
You are an AI research assistant. Analyze ${videoCount} video transcripts based on the user's request.

**User Request:**
${userPrompt}

**Context:**
You have access to transcripts from ${videoCount} videos. Use this information to provide a comprehensive response.

**Guidelines:**
- Be thorough but concise
- Cite specific videos and timestamps when referencing information
- Use markdown formatting for readability
- If the request cannot be fully answered with the provided transcripts, note what information is missing

**Transcripts:**
${transcriptsText}
`;
```

---

## Utility Functions

### Report Generator

**File:** `utils/reports/generator.ts`

```typescript
import { createClient } from '@/utils/supabase/client';
import { openRouterChat } from '@/utils/openrouter';
import { 
  executiveSummaryPrompt, 
  sentimentAnalysisPrompt,
  comparisonMatrixPrompt,
  customReportPrompt 
} from './prompts';
import type { InsightReportType, InsightReport } from '@/types/insightReports';

interface GenerateReportOptions {
  reportId: string;
  videoIds: string[];
  reportType: InsightReportType;
  customPrompt?: string;
  model?: string;
}

export async function generateReport(options: GenerateReportOptions): Promise<void> {
  const supabase = createClient();
  const { reportId, videoIds, reportType, customPrompt, model } = options;
  
  try {
    // 1. Fetch transcripts
    const transcripts = await fetchTranscripts(videoIds);
    
    // 2. Build prompt
    const prompt = buildPrompt(reportType, transcripts, customPrompt);
    
    // 3. Call LLM
    const response = await openRouterChat(
      (model || 'google/gemini-2.5-flash-lite-preview-09-2025') as any,
      [
        { role: 'system', content: 'You are a professional research analyst.' },
        { role: 'user', content: prompt }
      ]
    );
    
    // 4. Parse result
    const { content, structured } = parseResponse(reportType, response.content);
    
    // 5. Update report in database
    await supabase
      .from('insight_reports')
      .update({
        result_content: content,
        result_structured: structured,
        status: 'completed',
        token_usage: response.usage?.total_tokens
      })
      .eq('id', reportId);
      
  } catch (error) {
    // Update with error
    await supabase
      .from('insight_reports')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', reportId);
    throw error;
  }
}

async function fetchTranscripts(videoIds: string[]) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('transcripts')
    .select('video_id, content, videos(title)')
    .in('video_id', videoIds);
    
  if (error) throw error;
  
  return data.map(t => ({
    videoId: t.video_id,
    title: (t.videos as any)?.title || 'Unknown',
    segments: JSON.parse(t.content as string)
  }));
}

function buildPrompt(
  type: InsightReportType, 
  transcripts: any[],
  customPrompt?: string
): string {
  const videoCount = transcripts.length;
  const transcriptsText = transcripts.map(t => `
--- VIDEO: ${t.title} ---
${t.segments.map((s: any) => `[${formatTime(s.start)}] ${s.text}`).join('\n')}
`).join('\n\n');

  switch (type) {
    case 'executive_summary':
      return executiveSummaryPrompt(videoCount, transcriptsText);
    case 'sentiment_analysis':
      return sentimentAnalysisPrompt(videoCount, transcriptsText);
    case 'comparison_matrix':
      return comparisonMatrixPrompt(
        transcripts.map(t => ({ id: t.videoId, title: t.title })),
        transcriptsText
      );
    case 'custom':
      return customReportPrompt(customPrompt || '', videoCount, transcriptsText);
    default:
      return executiveSummaryPrompt(videoCount, transcriptsText);
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function parseResponse(type: InsightReportType, content: string) {
  // For sentiment analysis, try to parse JSON
  if (type === 'sentiment_analysis') {
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                       content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const structured = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        return { 
          content: formatSentimentReport(structured),
          structured 
        };
      }
    } catch {
      // Fall through to raw content
    }
  }
  
  return { content, structured: null };
}

function formatSentimentReport(data: any): string {
  return `
## Sentiment Analysis

### Overall Score: ${data.overall_score > 0 ? '😊' : data.overall_score < 0 ? '😠' : '😐'} ${data.overall_score}
**Label:** ${data.overall_label}  
**Confidence:** ${(data.confidence * 100).toFixed(0)}%

### Distribution
- Positive segments: ${data.distribution.positive_segments}
- Neutral segments: ${data.distribution.neutral_segments}
- Negative segments: ${data.distribution.negative_segments}

### Key Positive Points
${data.positive_quotes.map((q: any) => `- "${q.text}" (${q.intensity})`).join('\n')}

### Key Negative Points
${data.negative_quotes.map((q: any) => `- "${q.text}" (${q.intensity})`).join('\n')}

### Themes by Sentiment
${data.key_themes.map((t: any) => `- **${t.theme}**: ${t.sentiment > 0 ? '+' : ''}${t.sentiment} (${t.mentions} mentions)`).join('\n')}
`;
}
```

---

### Sentiment Analyzer

**File:** `utils/sentiment/analyzer.ts`

```typescript
import { createClient } from '@/utils/supabase/client';
import { openRouterChat } from '@/utils/openrouter';
import type { VideoSentiment, SentimentLabel } from '@/types/sentiment';

interface AnalyzeSentimentOptions {
  videoId: string;
  userId: string;
  forceRefresh?: boolean;
}

export async function analyzeVideoSentiment(
  options: AnalyzeSentimentOptions
): Promise<VideoSentiment> {
  const { videoId, userId, forceRefresh = false } = options;
  const supabase = createClient();
  
  // 1. Check cache first
  if (!forceRefresh) {
    const { data: cached } = await supabase
      .from('video_sentiment_cache')
      .select('*')
      .eq('video_id', videoId)
      .eq('user_id', userId)
      .single();
      
    if (cached) {
      return cached as VideoSentiment;
    }
  }
  
  // 2. Fetch transcript
  const { data: transcriptData, error: transcriptError } = await supabase
    .from('transcripts')
    .select('content')
    .eq('video_id', videoId)
    .order('saved_at', { ascending: false })
    .limit(1)
    .single();
    
  if (transcriptError || !transcriptData) {
    throw new Error('Transcript not found');
  }
  
  const segments = JSON.parse(transcriptData.content as string);
  
  // 3. Call LLM for sentiment
  const prompt = buildSentimentPrompt(segments);
  const response = await openRouterChat(
    'google/gemini-2.5-flash-lite-preview-09-2025',
    [
      { role: 'system', content: 'You are a sentiment analysis expert. Analyze the sentiment of video transcript segments.' },
      { role: 'user', content: prompt }
    ]
  );
  
  // 4. Parse result
  const sentiment = parseSentimentResponse(response.content);
  
  // 5. Cache result
  const { data, error } = await supabase
    .from('video_sentiment_cache')
    .upsert({
      video_id: videoId,
      user_id: userId,
      overall_score: sentiment.overall_score,
      overall_label: sentiment.overall_label,
      confidence: sentiment.confidence,
      positive_segments: sentiment.positive_segments,
      neutral_segments: sentiment.neutral_segments,
      negative_segments: sentiment.negative_segments,
      positive_quotes: sentiment.positive_quotes,
      negative_quotes: sentiment.negative_quotes,
      model_used: 'google/gemini-2.5-flash-lite-preview-09-2025',
      token_usage: response.usage?.total_tokens
    }, { onConflict: 'video_id,user_id' })
    .select()
    .single();
    
  if (error) throw error;
  
  return data as VideoSentiment;
}

function buildSentimentPrompt(segments: Array<{start: number, text: string}>): string {
  const transcriptText = segments
    .map(s => `[${formatTime(s.start)}] ${s.text}`)
    .join('\n');
    
  return `Analyze the sentiment of this video transcript.

For the entire transcript, provide:
1. Overall sentiment score (-1.0 to +1.0)
2. Overall label (positive, neutral, negative)
3. Confidence (0.0 to 1.0)
4. Segment counts (positive, neutral, negative)
5. Top 3 positive quotes with timestamps
6. Top 3 negative quotes with timestamps

Respond in this JSON format:
{
  "overall_score": number,
  "overall_label": "positive" | "neutral" | "negative",
  "confidence": number,
  "positive_segments": number,
  "neutral_segments": number,
  "negative_segments": number,
  "positive_quotes": [{"text": "...", "timestamp": "MM:SS"}],
  "negative_quotes": [{"text": "...", "timestamp": "MM:SS"}]
}

Transcript:
${transcriptText}`;
}

function parseSentimentResponse(content: string) {
  try {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                     content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse sentiment response:', e);
  }
  
  // Fallback
  return {
    overall_score: 0,
    overall_label: 'neutral' as SentimentLabel,
    confidence: 0.5,
    positive_segments: 0,
    neutral_segments: 0,
    negative_segments: 0,
    positive_quotes: [],
    negative_quotes: []
  };
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
```

---

### Collection Stats Calculator

**File:** `utils/collections/calculateStats.ts`

```typescript
import { createClient } from '@/utils/supabase/client';
import type { CollectionStats } from '@/types/sentiment';

interface CalculateCollectionStatsOptions {
  collectionId: string;
  userId: string;
  forceRefresh?: boolean;
}

export async function calculateCollectionStats(
  options: CalculateCollectionStatsOptions
): Promise<CollectionStats> {
  const { collectionId, userId, forceRefresh = false } = options;
  const supabase = createClient();
  
  // 1. Check cache
  if (!forceRefresh) {
    const { data: cached } = await supabase
      .from('collection_stats_cache')
      .select('*')
      .eq('collection_id', collectionId)
      .eq('user_id', userId)
      .single();
      
    // Cache valid for 1 hour
    if (cached && new Date(cached.calculated_at).getTime() > Date.now() - 3600000) {
      return cached as CollectionStats;
    }
  }
  
  // 2. Fetch collection videos
  const { data: videos, error } = await supabase
    .from('video_collections')
    .select('videos(id, duration, channel_id, published_at, created_at)')
    .eq('collection_id', collectionId);
    
  if (error) throw error;
  
  const videoList = videos.map(v => (v.videos as any));
  
  // 3. Calculate basic stats
  const totalVideos = videoList.length;
  const totalDuration = videoList.reduce((sum, v) => sum + (v.duration || 0), 0);
  const channelIds = [...new Set(videoList.map(v => v.channel_id).filter(Boolean))];
  const dates = videoList.map(v => new Date(v.published_at || v.created_at)).filter(d => !isNaN(d.getTime()));
  
  // 4. Fetch sentiment data
  const { data: sentiments } = await supabase
    .from('video_sentiment_cache')
    .select('overall_score, overall_label')
    .in('video_id', videoList.map(v => v.id))
    .eq('user_id', userId);
    
  const sentimentScores = sentiments?.map(s => s.overall_score) || [];
  const avgSentiment = sentimentScores.length > 0 
    ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length 
    : null;
    
  const sentimentDistribution = {
    positive: sentiments?.filter(s => s.overall_label === 'positive').length || 0,
    neutral: sentiments?.filter(s => s.overall_label === 'neutral').length || 0,
    negative: sentiments?.filter(s => s.overall_label === 'negative').length || 0
  };
  
  // 5. Calculate trend (simplified: compare first half vs second half)
  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (sentimentScores.length >= 4) {
    const mid = Math.floor(sentimentScores.length / 2);
    const firstHalf = sentimentScores.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
    const secondHalf = sentimentScores.slice(mid).reduce((a, b) => a + b, 0) / (sentimentScores.length - mid);
    const diff = secondHalf - firstHalf;
    trend = diff > 0.2 ? 'improving' : diff < -0.2 ? 'declining' : 'stable';
  }
  
  // 6. Save to cache
  const stats = {
    collection_id: collectionId,
    user_id: userId,
    total_videos: totalVideos,
    total_duration_seconds: totalDuration,
    unique_channels: channelIds.length,
    channel_ids: channelIds,
    earliest_video_date: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))).toISOString() : null,
    latest_video_date: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))).toISOString() : null,
    avg_sentiment_score: avgSentiment,
    sentiment_distribution: sentimentDistribution,
    sentiment_trend: trend,
    calculated_at: new Date().toISOString()
  };
  
  await supabase
    .from('collection_stats_cache')
    .upsert(stats, { onConflict: 'collection_id,user_id' });
    
  return stats as CollectionStats;
}
```

---

## Constants and Configuration

**File:** `utils/reports/config.ts`

```typescript
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
```

---

## React Query Hooks

**File:** `hooks/queries/useDashboard.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';

export function useDashboard(userId: string | null) {
  return useQuery({
    queryKey: ['dashboard', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const response = await fetch('/api/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard');
      
      return response.json();
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
  });
}
```

**File:** `hooks/queries/useReports.ts`

```typescript
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';

export function useReports(options: { 
  collectionId?: string; 
  limit?: number;
}) {
  const { collectionId, limit = 20 } = options;
  
  return useQuery({
    queryKey: ['reports', { collectionId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (collectionId) params.set('collection_id', collectionId);
      params.set('limit', limit.toString());
      
      const response = await fetch(`/api/reports?${params}`);
      if (!response.ok) throw new Error('Failed to fetch reports');
      
      return response.json();
    },
  });
}

export function useReport(reportId: string) {
  return useQuery({
    queryKey: ['reports', reportId],
    queryFn: async () => {
      const response = await fetch(`/api/reports/${reportId}`);
      if (!response.ok) throw new Error('Failed to fetch report');
      
      return response.json();
    },
  });
}
```

**File:** `hooks/mutations/useGenerateReport.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateInsightReportInput, InsightReport } from '@/types/insightReports';

export function useGenerateReport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateInsightReportInput) => {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate report');
      }
      
      return response.json() as Promise<{ report: InsightReport }>;
    },
    onSuccess: (data, variables) => {
      // Invalidate reports list
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      
      // Invalidate collection reports if applicable
      if (variables.source_collection_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['reports', { collectionId: variables.source_collection_id }] 
        });
      }
    },
  });
}
```
