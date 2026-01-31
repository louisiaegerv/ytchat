# Implementation Checklist

Quick reference for implementation. Check off items as you complete them.

## Phase 1: Foundation

### Database
- [ ] `supabase/migrations/001_insight_reports.sql`
- [ ] `supabase/migrations/002_streams.sql`
- [ ] `supabase/migrations/003_video_sentiment.sql`
- [ ] `supabase/migrations/004_collection_stats.sql`
- [ ] Run migrations: `supabase migration up`

### Types
- [ ] `types/insightReports.ts`
- [ ] `types/streams.ts`
- [ ] `types/sentiment.ts`

### Navigation
- [ ] `components/navigation/Sidebar.tsx`
- [ ] Update `components/bottom-navigation.tsx`

### Layout
- [ ] `app/(dashboard)/layout.tsx`
- [ ] `app/(dashboard)/page.tsx`
- [ ] `components/dashboard/EmptyState.tsx`

---

## Phase 2: Streams

### API
- [ ] `app/api/streams/route.ts`
- [ ] `app/api/streams/[id]/route.ts`

### UI
- [ ] `app/(dashboard)/streams/page.tsx`
- [ ] `app/(dashboard)/streams/new/page.tsx`
- [ ] `components/streams/StreamCard.tsx`
- [ ] `components/streams/StreamStatusBadge.tsx`

### Hooks
- [ ] `hooks/queries/useStreamsQuery.ts`
- [ ] `hooks/mutations/useStreamMutations.ts`

---

## Phase 3: Collections

### Pages
- [ ] `app/(dashboard)/collections/page.tsx`
- [ ] `app/(dashboard)/collections/[id]/page.tsx`

### Components
- [ ] `components/collections/CollectionDetail.tsx`
- [ ] `components/collections/CollectionStats.tsx`
- [ ] `components/collections/CollectionInsightsPanel.tsx`
- [ ] `components/collections/CollectionVideoList.tsx`

### API
- [ ] `app/api/collections/[id]/stats/route.ts`

### Hooks
- [ ] `hooks/queries/useCollectionStats.ts`
- [ ] `hooks/queries/useCollectionReports.ts`

---

## Phase 4: Reports

### API
- [ ] `app/api/reports/route.ts`
- [ ] `app/api/reports/[id]/route.ts`
- [ ] `app/api/reports/[id]/regenerate/route.ts`

### Utilities
- [ ] `utils/reports/prompts.ts`
- [ ] `utils/reports/generator.ts`
- [ ] `utils/reports/config.ts`

### UI
- [ ] `app/(dashboard)/reports/page.tsx`
- [ ] `app/(dashboard)/reports/[id]/page.tsx`
- [ ] `components/reports/ReportCard.tsx`
- [ ] `components/reports/ReportViewer.tsx`
- [ ] `components/reports/GenerateReportDialog.tsx`
- [ ] `components/reports/ExecutiveSummaryReport.tsx`

### Hooks
- [ ] `hooks/queries/useReportsQuery.ts`
- [ ] `hooks/queries/useReport.ts`
- [ ] `hooks/mutations/useGenerateReport.ts`
- [ ] `hooks/mutations/useDeleteReport.ts`

---

## Phase 5: Sentiment

### API
- [ ] `app/api/sentiment/analyze/route.ts`
- [ ] `app/api/sentiment/collection/[id]/route.ts`

### Utilities
- [ ] `utils/sentiment/analyzer.ts`
- [ ] `utils/collections/calculateStats.ts`

### Components
- [ ] `components/sentiment/SentimentBadge.tsx`
- [ ] `components/sentiment/SentimentMini.tsx`
- [ ] `components/sentiment/SentimentBar.tsx`
- [ ] `components/reports/SentimentReport.tsx`

### Hooks
- [ ] `hooks/queries/useSentiment.ts`

---

## Phase 6: Dashboard Integration

### API
- [ ] `app/api/dashboard/route.ts`

### Components
- [ ] `components/dashboard/CollectionPreviewCard.tsx`
- [ ] `components/dashboard/QuickActions.tsx`
- [ ] `components/dashboard/StatsRow.tsx`
- [ ] `components/dashboard/RecentReportsList.tsx`

### Hooks
- [ ] `hooks/queries/useDashboard.ts`

---

## Shared Components

- [ ] `components/shared/VideoSelector.tsx`
- [ ] `components/shared/ReportTypeSelector.tsx`
- [ ] `components/shared/EmptyState.tsx`
- [ ] `components/shared/SkeletonCard.tsx`
- [ ] `components/shared/SkeletonList.tsx`
- [ ] `components/shared/GeneratingIndicator.tsx`

---

## Modified Files

- [ ] `components/library/CollectionCard.tsx` - Add sentiment
- [ ] `components/library/VideoCard.tsx` - Add sentiment badge
- [ ] `app/library/page.tsx` - Keep for backward compatibility

---

## Testing

### Functional
- [ ] Create stream → collection auto-created
- [ ] Generate report from collection
- [ ] View report
- [ ] Delete report
- [ ] Navigate all pages
- [ ] Mobile navigation

### Edge Cases
- [ ] Empty states display
- [ ] Error handling
- [ ] Loading states
- [ ] Mobile responsive

---

## Final Steps

- [ ] Update README with new features
- [ ] Test on mobile device
- [ ] Test on desktop
- [ ] Deploy to preview
- [ ] Verify all routes work
