# Slipstream Dashboard-First Implementation Plans

This directory contains detailed implementation plans for the Dashboard-First Architecture.

## Overview

We're transforming Slipstream from a **video library browser** to an **intelligence dashboard** that prioritizes insights over raw video browsing.

## Plan Documents

### 1. [Database Schema](./01-database-schema.md)
- Migration files for new tables
- TypeScript type definitions
- Query patterns
- Rollback procedures

**New Tables:**
- `insight_reports` - AI-generated analysis reports
- `streams` - Automated video capture rules
- `video_sentiment_cache` - Cached sentiment analysis
- `collection_stats_cache` - Pre-computed collection statistics

### 2. [API Routes](./02-api-routes.md)
- REST endpoint specifications
- Request/response types
- Error handling patterns
- Rate limiting recommendations

**New Endpoints:**
- `/api/reports` - CRUD for insight reports
- `/api/streams` - Stream management
- `/api/sentiment` - Sentiment analysis
- `/api/dashboard` - Dashboard data aggregation

### 3. [Component Structure](./03-component-structure.md)
- Component hierarchy
- Props interfaces
- Directory structure
- Styling guidelines

**New Component Areas:**
- Dashboard
- Streams
- Reports
- Sentiment
- Navigation

### 4. [Implementation Phases](./04-implementation-phases.md)
- Week-by-week breakdown
- Day-by-day tasks
- Verification steps
- Testing checklist

**6-Week Timeline:**
- Week 1: Foundation (Database, Navigation, Layout)
- Week 2: Streams
- Week 3: Collections Redesign
- Week 4: Reports Foundation
- Week 5: Sentiment Analysis
- Week 6: Polish & Integration

### 5. [Prompts and Utilities](./05-prompts-and-utils.md)
- LLM prompts for each report type
- Report generation logic
- Sentiment analysis implementation
- Collection stats calculation
- React Query hooks

**Report Types:**
- Executive Summary
- Sentiment Analysis
- Comparison Matrix
- Custom Analysis

### 6. [Implementation Checklist](./06-implementation-checklist.md)
- Quick-reference checklist
- File-by-file tracking
- Testing verification

## Architecture Highlights

### Key Decisions

| Decision | Rationale |
|----------|-----------|
| **Dashboard as Home** | Intelligence-first, not video-first |
| **Decoupled Reports** | Reports live independently, can link to collections |
| **Stream-Collection Link** | Every stream creates a collection |
| **Simple Sentiment (MVP)** | 😊 😐 😠 badges + basic distribution |
| **Mobile 5-Tab Nav** | Home, Library, FAB, Streams, More |
| **Empty State → Streams** | Guide new users to automation |

### Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Stream    │────→│ Collection  │────→│   Report    │
│  (Config)   │     │  (Videos)   │     │ (Analysis)  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   ↑                  │
       │                   │                  │
       └───────────────────┴──────────────────┘
                   Dashboard
```

### Video Detail Preservation

The existing video detail page at `/videos/[id]` is **preserved unchanged**. It's accessed from:
- Dashboard video cards
- Collection video lists
- Report video citations

## Getting Started

### 1. Start with Database

```bash
# Create migration files from plans/01-database-schema.md
# Then run:
supabase migration up
```

### 2. Implement Navigation

```bash
# Update mobile nav
# Create sidebar
# Set up dashboard layout
```

### 3. Follow Weekly Plan

See [Implementation Phases](./04-implementation-phases.md) for detailed week-by-week tasks.

### 4. Track Progress

Use [Implementation Checklist](./06-implementation-checklist.md) to track completion.

## Cost Considerations

Using **Gemini 2.5 Flash Lite**:
- $0.10/M input tokens
- $0.50/M output tokens
- 1M token context window

Example costs:
- 10 video report (~20K tokens): ~$0.02
- 50 video report (~100K tokens): ~$0.10
- Single video sentiment (~2K tokens): ~$0.002

## Post-MVP Enhancements

See Phase 7+ in [Implementation Phases](./04-implementation-phases.md):
- Background job processing
- Actual YouTube API polling for streams
- Advanced sentiment (aspect-based)
- Knowledge graph visualization
- Report export (PDF, Markdown)
- Trend detection and alerts

## Questions?

Refer to the specific plan documents for detailed information on each area.
