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

export interface ReportTypeConfig {
  name: string;
  description: string;
  icon: string;
  estimatedTime: string;
  minVideos: number;
  maxVideos: number;
}
