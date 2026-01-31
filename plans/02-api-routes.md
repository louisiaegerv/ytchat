# API Routes Plan

## Overview
All new API endpoints for Insight Reports, Streams, and Sentiment functionality.

---

## Insight Reports API

### Base: `/api/reports`

#### GET `/api/reports`
List all reports for the current user.

**Query Parameters:**
- `collection_id` (optional) - Filter by collection
- `type` (optional) - Filter by report type
- `status` (optional) - Filter by status
- `limit` (optional, default: 20) - Pagination limit
- `offset` (optional, default: 0) - Pagination offset

**Response:**
```typescript
{
  reports: InsightReport[];
  total: number;
  hasMore: boolean;
}
```

**File:** `app/api/reports/route.ts`

---

#### POST `/api/reports`
Create a new report (starts async generation).

**Request Body:**
```typescript
{
  title?: string;           // Auto-generated if not provided
  description?: string;
  report_type: InsightReportType;
  source_collection_id?: string;
  video_ids: string[];      // Required - which videos to analyze
  custom_prompt?: string;   // For 'custom' type
  model_used?: string;      // Defaults to user preference
}
```

**Response:**
```typescript
{
  report: InsightReport;    // Status will be 'generating'
}
```

**File:** `app/api/reports/route.ts`

---

#### GET `/api/reports/[id]`
Get a specific report with full content.

**Response:**
```typescript
{
  report: InsightReport;
}
```

**File:** `app/api/reports/[id]/route.ts`

---

#### PATCH `/api/reports/[id]`
Update report metadata (title, description only).

**Request Body:**
```typescript
{
  title?: string;
  description?: string;
}
```

**File:** `app/api/reports/[id]/route.ts`

---

#### DELETE `/api/reports/[id]`
Soft delete a report (sets deleted_at).

**File:** `app/api/reports/[id]/route.ts`

---

#### POST `/api/reports/[id]/regenerate`
Create a new report with the same parameters as an existing one.

**Response:**
```typescript
{
  report: InsightReport;  // New report with 'generating' status
}
```

**File:** `app/api/reports/[id]/regenerate/route.ts`

---

### Report Generation

#### POST `/api/reports/generate`
Internal endpoint for report generation (called by client or background job).

**Request Body:**
```typescript
{
  report_id: string;
}
```

**Process:**
1. Fetch report configuration
2. Fetch transcripts for all video_ids
3. Build prompt based on report_type
4. Call OpenRouter API
5. Parse and store result
6. Update status to 'completed' or 'failed'

**File:** `app/api/reports/generate/route.ts`

---

## Streams API

### Base: `/api/streams`

#### GET `/api/streams`
List all streams for the current user.

**Response:**
```typescript
{
  streams: Stream[];
}
```

**File:** `app/api/streams/route.ts`

---

#### POST `/api/streams`
Create a new stream (auto-creates linked collection).

**Request Body:**
```typescript
{
  name?: string;                    // Auto-generated from query if empty
  description?: string;
  search_query: string;
  filters?: {
    max_results_per_run?: number;   // Default: 10
    min_duration_seconds?: number;
    max_duration_seconds?: number;
    language?: string;              // Default: 'en'
    exclude_keywords?: string[];
  };
  schedule?: {
    frequency?: 'hourly' | 'daily' | 'weekly' | 'manual';  // Default: 'daily'
  };
  is_auto_processing?: boolean;     // Default: false
}
```

**Process:**
1. Create collection with name matching stream
2. Create stream with collection_id reference
3. If frequency != 'manual', schedule first run

**Response:**
```typescript
{
  stream: Stream;
  collection: Collection;
}
```

**File:** `app/api/streams/route.ts`

---

#### GET `/api/streams/[id]`
Get stream details with collection info.

**Response:**
```typescript
{
  stream: Stream;
}
```

**File:** `app/api/streams/[id]/route.ts`

---

#### PATCH `/api/streams/[id]`
Update stream configuration.

**Request Body:**
```typescript
{
  name?: string;
  description?: string;
  search_query?: string;
  filters?: Partial<StreamFilters>;
  schedule?: Partial<StreamSchedule>;
  is_auto_processing?: boolean;
  status?: 'active' | 'paused';
}
```

**File:** `app/api/streams/[id]/route.ts`

---

#### DELETE `/api/streams/[id]`
Delete stream and optionally its linked collection.

**Query Parameters:**
- `delete_collection` (optional, default: false) - Also delete linked collection

**File:** `app/api/streams/[id]/route.ts`

---

#### POST `/api/streams/[id]/run`
Manually trigger a stream run.

**Response:**
```typescript
{
  run_id: string;
  videos_found: number;
  videos_added: number;
}
```

**File:** `app/api/streams/[id]/run/route.ts`

---

## Sentiment API

### Base: `/api/sentiment`

#### POST `/api/sentiment/analyze`
Analyze sentiment for a single video (on-demand).

**Request Body:**
```typescript
{
  video_id: string;
}
```

**Process:**
1. Check cache first
2. If not cached, fetch transcript
3. Run sentiment analysis via LLM
4. Cache result
5. Return sentiment data

**Response:**
```typescript
{
  sentiment: VideoSentiment;
}
```

**File:** `app/api/sentiment/analyze/route.ts`

---

#### GET `/api/sentiment/collection/[collection_id]`
Get aggregated sentiment for a collection.

**Response:**
```typescript
{
  sentiment: CollectionSentiment;
  video_sentiments: {
    video_id: string;
    title: string;
    sentiment: VideoSentiment;
  }[];
}
```

**File:** `app/api/sentiment/collection/[collection_id]/route.ts`

---

## Dashboard API

### GET `/api/dashboard`
Get all data needed for dashboard in one request.

**Response:**
```typescript
{
  stats: {
    new_videos_this_week: number;
    total_collections: number;
    new_reports_this_week: number;
    active_streams: number;
  };
  collections: Array<Collection & {
    video_count: number;
    sentiment?: SimpleSentiment;
  }>;
  recent_reports: InsightReport[];
  active_streams: Stream[];
  alerts: Array<{
    type: 'sentiment_drop' | 'new_videos' | 'report_ready';
    message: string;
    collection_id?: string;
    report_id?: string;
  }>;
}
```

**File:** `app/api/dashboard/route.ts`

---

## Implementation Notes

### Error Handling
All endpoints should use consistent error format:

```typescript
// Error Response
{
  error: {
    code: string;        // 'UNAUTHORIZED' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 'INTERNAL_ERROR'
    message: string;
    details?: unknown;
  }
}
```

### Authentication
All endpoints require authentication via Supabase session. Use existing pattern:

```typescript
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return Response.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  }
  
  // ... handler logic
}
```

### Rate Limiting
Consider adding rate limiting for:
- Report generation: 5 per hour per user
- Stream runs: 10 per hour per user
- Sentiment analysis: 20 per hour per user

### Background Jobs
For Phase 1, run generation synchronously with timeout handling. In future, move to background jobs using:
- Vercel Background Functions
- Inngest
- QStash

### Response Caching
Cache dashboard data for 1 minute:
```typescript
export const revalidate = 60; // 1 minute
```
