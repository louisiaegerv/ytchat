# Implementation Phases

## Overview
Step-by-step implementation plan for the Dashboard-First Architecture.

---

## Phase 1: Foundation (Week 1)
**Goal:** Database, types, navigation shell

### Day 1-2: Database & Types

**Tasks:**
1. Create migration files
   - [ ] `supabase/migrations/001_insight_reports.sql`
   - [ ] `supabase/migrations/002_streams.sql`
   - [ ] `supabase/migrations/003_video_sentiment.sql`
   - [ ] `supabase/migrations/004_collection_stats.sql`

2. Create TypeScript types
   - [ ] `types/insightReports.ts`
   - [ ] `types/streams.ts`
   - [ ] `types/sentiment.ts`

3. Run migrations locally
   ```bash
   supabase migration up
   ```

**Verification:**
- Tables exist in Supabase dashboard
- RLS policies active
- Can insert test data via SQL editor

---

### Day 3-4: Navigation & Layout

**Tasks:**
1. Update mobile bottom navigation
   - [ ] Modify `components/bottom-navigation.tsx`
   - [ ] Add Home, Library, FAB, Streams, More tabs
   - [ ] Update FAB menu: Video Scan, New Stream

2. Create sidebar component (desktop)
   - [ ] `components/navigation/Sidebar.tsx`
   - [ ] Navigation items: Dashboard, Collections, Streams, Reports, Videos, Settings
   - [ ] Collapsible on smaller desktop screens

3. Create dashboard layout
   - [ ] `app/(dashboard)/layout.tsx`
   - [ ] Responsive: sidebar (desktop) / bottom nav (mobile)
   - [ ] Consistent padding and background

4. Create dashboard home page shell
   - [ ] `app/(dashboard)/page.tsx`
   - [ ] Basic layout with header
   - [ ] Placeholder sections

**Verification:**
- Navigation works on mobile and desktop
- Route transitions smooth
- Active state shows correctly

---

### Day 5: Dashboard Empty State

**Tasks:**
1. Create empty state component
   - [ ] `components/dashboard/EmptyState.tsx`
   - [ ] Illustration/icon
   - [ ] Primary CTA: "Create Your First Stream"
   - [ ] Secondary CTA: "Add Single Video"

2. Wire up CTAs
   - [ ] New Stream → navigate to `/streams/new`
   - [ ] Add Video → open CaptureModal

3. Show empty state conditionally
   - [ ] Check if user has any streams or collections
   - [ ] Show empty state if none

**Verification:**
- New user sees empty state
- CTAs navigate correctly
- Existing user sees dashboard content

---

## Phase 2: Streams (Week 2)
**Goal:** Stream creation and listing

### Day 1-2: Stream API

**Tasks:**
1. Create stream API routes
   - [ ] `app/api/streams/route.ts` (GET, POST)
   - [ ] `app/api/streams/[id]/route.ts` (GET, PATCH, DELETE)

2. Implement POST /api/streams
   - [ ] Validate input
   - [ ] Create collection automatically
   - [ ] Create stream with collection_id
   - [ ] Return both stream and collection

3. Implement GET /api/streams
   - [ ] List user's streams
   - [ ] Include collection data (joined)

**Verification:**
- Can create stream via API
- Collection auto-created
- Can list streams

---

### Day 3-4: Stream UI

**Tasks:**
1. Create streams list page
   - [ ] `app/(dashboard)/streams/page.tsx`
   - [ ] Stream cards list
   - [ ] Empty state

2. Create stream card component
   - [ ] `components/streams/StreamCard.tsx`
   - [ ] Status badge
   - [ ] Stats display
   - [ ] Action buttons (pause/resume, edit, delete)

3. Create create stream form
   - [ ] `app/(dashboard)/streams/new/page.tsx`
   - [ ] Step 1: Search query
   - [ ] Step 2: Filters (collapsible)
   - [ ] Step 3: Schedule
   - [ ] Step 4: Review

4. Create React Query hooks
   - [ ] `hooks/queries/useStreamsQuery.ts`
   - [ ] `hooks/mutations/useStreamMutations.ts`

**Verification:**
- Can create stream via UI
- Form validation works
- Stream appears in list
- Can pause/resume stream

---

### Day 5: Stream Polish

**Tasks:**
1. Add stream status indicators
   - [ ] `components/streams/StreamStatusBadge.tsx`
   - [ ] Visual states for active/paused/error

2. Add manual run button (UI only, no backend yet)
   - [ ] Button on stream card
   - [ ] Shows "coming soon" or mock response

3. Handle edge cases
   - [ ] Duplicate stream names
   - [ ] Invalid search queries
   - [ ] Network errors

**Verification:**
- All stream states display correctly
- Error handling works
- Mobile responsive

---

## Phase 3: Collections Redesign (Week 3)
**Goal:** New collection detail page with tabs

### Day 1-2: Collections List & Navigation

**Tasks:**
1. Create collections list page
   - [ ] `app/(dashboard)/collections/page.tsx`
   - [ ] Grid/list toggle
   - [ ] Sort options

2. Update collection card
   - [ ] Modify `components/library/CollectionCard.tsx`
   - [ ] Add sentiment indicator
   - [ ] Add video count badge

3. Update routing
   - [ ] Collection click → `/collections/[id]`
   - [ ] Ensure old `/library` still works

**Verification:**
- Collections list displays correctly
- Cards show sentiment
- Navigation works

---

### Day 3-4: Collection Detail Page

**Tasks:**
1. Create collection detail layout
   - [ ] `app/(dashboard)/collections/[id]/page.tsx`
   - [ ] Header with name, stats
   - [ ] Tab navigation: Overview, Videos, Insights

2. Create Overview tab
   - [ ] `components/collections/CollectionStats.tsx`
   - [ ] Key metrics display
   - [ ] Sentiment distribution
   - [ ] Recent videos preview

3. Create Videos tab
   - [ ] Video grid/list
   - [ ] Selection mode
   - [ ] Remove from collection

4. Create Insights tab (placeholder)
   - [ ] Empty state: "Generate your first insight"
   - [ ] Button to open report generation

**Verification:**
- All three tabs work
- Stats display correctly
- Videos can be removed
- Mobile responsive

---

### Day 5: Collection Stats API

**Tasks:**
1. Create stats calculation function
   - [ ] `utils/collections/calculateStats.ts`
   - [ ] Aggregate video data
   - [ ] Calculate sentiment averages

2. Create/update API
   - [ ] `app/api/collections/[id]/stats/route.ts`
   - [ ] Return computed stats

3. Create React Query hook
   - [ ] `hooks/queries/useCollectionStats.ts`

**Verification:**
- Stats load on collection page
- Update when videos change

---

## Phase 4: Reports Foundation (Week 4)
**Goal:** Report generation and viewing

### Day 1-2: Report API

**Tasks:**
1. Create report API routes
   - [ ] `app/api/reports/route.ts` (GET, POST)
   - [ ] `app/api/reports/[id]/route.ts` (GET, PATCH, DELETE)

2. Implement POST /api/reports
   - [ ] Validate video_ids
   - [ ] Create report with 'generating' status
   - [ ] Trigger generation (synchronous for MVP)

3. Implement generation logic
   - [ ] `utils/reports/generator.ts`
   - [ ] Fetch transcripts
   - [ ] Build prompts
   - [ ] Call OpenRouter
   - [ ] Store result

4. Implement GET /api/reports
   - [ ] List user's reports
   - [ ] Filter by collection
   - [ ] Pagination

**Verification:**
- Can create report via API
- Generation completes
- Can list reports

---

### Day 3-4: Report UI

**Tasks:**
1. Create reports list page
   - [ ] `app/(dashboard)/reports/page.tsx`
   - [ ] Filter bar
   - [ ] Report cards

2. Create report card component
   - [ ] `components/reports/ReportCard.tsx`
   - [ ] Type icon
   - [ ] Status indicator
   - [ ] Actions menu

3. Create report viewer
   - [ ] `app/(dashboard)/reports/[id]/page.tsx`
   - [ ] Markdown rendering
   - [ ] Metadata display
   - [ ] Source videos list

4. Create React Query hooks
   - [ ] `hooks/queries/useReportsQuery.ts`
   - [ ] `hooks/mutations/useGenerateReport.ts`

**Verification:**
- Reports list displays
- Can view report
- Markdown renders correctly

---

### Day 5: Generate Report Dialog

**Tasks:**
1. Create report generation dialog
   - [ ] `components/reports/GenerateReportDialog.tsx`
   - [ ] Step 1: Select videos
   - [ ] Step 2: Choose type
   - [ ] Step 3: Configure (custom prompt)
   - [ ] Step 4: Generate

2. Create report type selector
   - [ ] `components/shared/ReportTypeSelector.tsx`
   - [ ] Cards for: Executive Summary, Sentiment Analysis, Custom

3. Wire up to collection insights tab
   - [ ] "Generate New Insight" button opens dialog
   - [ ] Pre-fill collection videos

**Verification:**
- Can generate report from collection
- Dialog steps work
- Report appears after generation

---

## Phase 5: Sentiment Analysis (Week 5)
**Goal:** Simple sentiment for videos and collections

### Day 1-2: Sentiment API

**Tasks:**
1. Create sentiment analysis function
   - [ ] `utils/sentiment/analyzer.ts`
   - [ ] LLM prompt for sentiment
   - [ ] Parse response
   - [ ] Return structured data

2. Create sentiment API routes
   - [ ] `app/api/sentiment/analyze/route.ts`
   - [ ] POST: Analyze video
   - [ ] Cache results

3. Create collection sentiment endpoint
   - [ ] `app/api/sentiment/collection/[id]/route.ts`
   - [ ] Aggregate video sentiments
   - [ ] Calculate trend

**Verification:**
- Can analyze single video
- Collection aggregate works
- Results cached

---

### Day 3-4: Sentiment UI

**Tasks:**
1. Create sentiment components
   - [ ] `components/sentiment/SentimentBadge.tsx`
   - [ ] `components/sentiment/SentimentMini.tsx`
   - [ ] `components/sentiment/SentimentBar.tsx`

2. Add sentiment to video cards
   - [ ] Update `components/library/VideoCard.tsx`
   - [ ] Show badge if analyzed

3. Add sentiment to collection cards
   - [ ] Update `components/library/CollectionCard.tsx`
   - [ ] Show mini sentiment

4. Create sentiment report viewer
   - [ ] `components/reports/SentimentReport.tsx`
   - [ ] Score display
   - [ ] Distribution bar
   - [ ] Quotes

**Verification:**
- Sentiment displays on cards
- Report viewer shows data
- Mobile responsive

---

### Day 5: Dashboard Integration

**Tasks:**
1. Update dashboard home
   - [ ] Show collection previews with sentiment
   - [ ] Show recent reports
   - [ ] Show quick stats

2. Create dashboard API
   - [ ] `app/api/dashboard/route.ts`
   - [ ] Aggregate all data
   - [ ] Return in single response

3. Create dashboard React Query hook
   - [ ] `hooks/queries/useDashboard.ts`

**Verification:**
- Dashboard loads with data
- Collections show sentiment
- Reports appear in list

---

## Phase 6: Polish & Integration (Week 6)
**Goal:** Connect everything, fix bugs, polish UX

### Day 1-2: Integration

**Tasks:**
1. Wire up all navigation
   - [ ] All links work
   - [ ] Breadcrumbs correct
   - [ ] Back buttons work

2. Connect collection to reports
   - [ ] Collection insights tab shows reports
   - [ ] Generate from collection pre-fills
   - [ ] Report shows collection link

3. Connect streams to collections
   - [ ] Stream card links to collection
   - [ ] Collection shows if it has a stream

**Verification:**
- All navigation flows work
- No broken links

---

### Day 3-4: Error Handling & Edge Cases

**Tasks:**
1. Add error boundaries
   - [ ] Dashboard error state
   - [ ] Collection detail error state
   - [ ] Report viewer error state

2. Handle loading states
   - [ ] Skeletons for all lists
   - [ ] Loading spinners for actions
   - [ ] Progress indicators for generation

3. Handle empty states
   - [ ] All pages have empty states
   - [ ] Helpful CTAs

**Verification:**
- Graceful error handling
- No infinite spinners

---

### Day 5: Testing & Polish

**Tasks:**
1. Mobile testing
   - [ ] All pages on mobile device
   - [ ] Touch targets work
   - [ ] Bottom nav accessible

2. Desktop testing
   - [ ] Sidebar works
   - [ ] Responsive breakpoints
   - [ ] Hover states

3. Performance check
   - [ ] Dashboard loads < 2s
   - [ ] Report generation shows progress
   - [ ] No unnecessary re-renders

4. Copy review
   - [ ] All labels clear
   - [ ] Empty states helpful
   - [ ] Error messages actionable

**Verification:**
- App feels polished
- No major bugs
- Ready for use

---

## Post-MVP Enhancements (Future)

### Phase 7: Enhanced Features
- [ ] Background job processing for reports
- [ ] Stream automation (actual YouTube API polling)
- [ ] Advanced sentiment (aspect-based)
- [ ] Knowledge graph visualization
- [ ] Report export (PDF, Markdown)

### Phase 8: Advanced Analytics
- [ ] Trend detection
- [ ] Anomaly alerts
- [ ] Comparative analysis
- [ ] Custom prompt templates

### Phase 9: Collaboration
- [ ] Share reports
- [ ] Team collections
- [ ] Comments on reports

---

## Testing Checklist

### Functional Tests
- [ ] Create stream → Collection auto-created
- [ ] Generate report from collection
- [ ] View report
- [ ] Delete report (soft delete)
- [ ] Navigate between all pages
- [ ] Mobile navigation works

### Edge Cases
- [ ] Empty collection → report generation
- [ ] Very long video transcripts
- [ ] Network failure during generation
- [ ] User with no data (empty states)
- [ ] User with 100+ collections

### Browser Testing
- [ ] Chrome (desktop)
- [ ] Safari (desktop)
- [ ] Chrome (mobile)
- [ ] Safari (iOS)

---

## Rollback Plan

If issues arise:
1. **Database:** Migrations are reversible
   ```bash
   supabase migration down
   ```

2. **Code:** Feature flags can disable new routes
   - Add `NEXT_PUBLIC_ENABLE_DASHBOARD=false` to disable
   - Fallback to existing `/library` as home

3. **Gradual Rollout:**
   - Deploy to preview first
   - Test with internal users
   - Enable for beta users
   - Full rollout
