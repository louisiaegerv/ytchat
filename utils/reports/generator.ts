import { createClient } from "@/utils/supabase/server";
import { 
  executiveSummaryPrompt, 
  sentimentAnalysisPrompt,
  comparisonMatrixPrompt,
  customReportPrompt 
} from "./prompts";
import type { InsightReportType } from "@/types/insightReports";

interface GenerateReportOptions {
  reportId: string;
  videoIds: string[];
  reportType: InsightReportType;
  customPrompt?: string;
  model?: string;
}

// OpenRouter API call - server-side direct call
async function callOpenRouter(
  model: string,
  messages: { role: string; content: string }[]
) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": "Slipstream",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();
  
  return {
    content: data.choices?.[0]?.message?.content || "",
    usage: data.usage,
  };
}

export async function generateReport(options: GenerateReportOptions): Promise<void> {
  // Use server-side client
  const supabase = await createClient();
  const { reportId, videoIds, reportType, customPrompt, model } = options;
  
  try {
    // 1. Fetch transcripts
    const transcripts = await fetchTranscripts(videoIds, supabase);
    
    if (transcripts.length === 0) {
      throw new Error("No transcripts found for the selected videos");
    }
    
    // 2. Build prompt
    const prompt = buildPrompt(reportType, transcripts, customPrompt);
    
    // 3. Call LLM directly
    const modelId = model || 'google/gemini-2.5-flash-lite-preview-09-2025';
    const response = await callOpenRouter(
      modelId,
      [
        { role: 'system', content: 'You are a professional research analyst.' },
        { role: 'user', content: prompt }
      ]
    );
    
    // 4. Parse result
    const { content, structured } = parseResponse(reportType, response.content);
    
    // 5. Update report in database
    const { error: updateError } = await supabase
      .from('insight_reports')
      .update({
        result_content: content,
        result_structured: structured,
        status: 'completed',
        token_usage: response.usage?.total_tokens,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);
      
    if (updateError) {
      throw updateError;
    }
    
    console.log(`Report ${reportId} generated successfully`);
      
  } catch (error) {
    console.error("Report generation error:", error);
    
    // Update with error
    await supabase
      .from('insight_reports')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);
    
    throw error;
  }
}

async function fetchTranscripts(videoIds: string[], supabase: any) {
  // First, get video titles
  const { data: videosData, error: videosError } = await supabase
    .from('videos')
    .select('id, title')
    .in('id', videoIds);
    
  if (videosError) throw videosError;
  
  const videoTitles = new Map(videosData?.map((v: any) => [v.id, v.title]) || []);
  
  // Then get transcripts
  const { data, error } = await supabase
    .from('transcripts')
    .select('video_id, content')
    .in('video_id', videoIds);
    
  if (error) throw error;
  
  if (!data || data.length === 0) {
    return [];
  }
  
  return data.map((t: any) => ({
    videoId: t.video_id,
    title: videoTitles.get(t.video_id) || 'Unknown',
    segments: typeof t.content === 'string' ? JSON.parse(t.content) : t.content
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
${t.segments.map((s: any) => `[${formatTime(s.offset || s.start)}] ${s.text}`).join('\n')}
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
- Positive segments: ${data.distribution?.positive_segments || 0}
- Neutral segments: ${data.distribution?.neutral_segments || 0}
- Negative segments: ${data.distribution?.negative_segments || 0}

### Key Positive Points
${(data.positive_quotes || []).map((q: any) => `- "${q.text}" (${q.intensity})`).join('\n') || 'None identified'}

### Key Negative Points
${(data.negative_quotes || []).map((q: any) => `- "${q.text}" (${q.intensity})`).join('\n') || 'None identified'}

### Themes by Sentiment
${(data.key_themes || []).map((t: any) => `- **${t.theme}**: ${t.sentiment > 0 ? '+' : ''}${t.sentiment} (${t.mentions} mentions)`).join('\n') || 'None identified'}
`;
}
