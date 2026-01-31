# Component Structure Plan

## Overview
All new and modified components for the Dashboard-First Architecture.

---

## Navigation Components

### Sidebar (Desktop)
**File:** `components/navigation/Sidebar.tsx`

```typescript
interface SidebarProps {
  user: User;
}

// Primary navigation for desktop
// Items: Dashboard, Collections, Streams, Reports, Videos, Settings
```

**Sections:**
- Logo/Brand
- Main Nav Items
- Pinned Collections (subset)
- User Menu

---

### Bottom Navigation (Mobile) - UPDATED
**File:** `components/navigation/BottomNavigation.tsx` (MODIFY)

**New Tabs:**
1. 🏠 Home (Dashboard)
2. 📁 Library (Collections + Videos combined)
3. ➕ FAB (Add menu)
4. 🔄 Streams
5. 👤 More (Sheet with Reports, Settings)

**Add Menu Options:**
- Video Scan (existing CaptureModal)
- New Stream (redirect to `/streams/new`)

---

## Dashboard Components

### Dashboard Layout
**File:** `app/(dashboard)/layout.tsx`

```typescript
// Wraps all dashboard pages
// Includes Sidebar (desktop) or BottomNavigation (mobile)
// Consistent padding and background
```

---

### Dashboard Home
**File:** `app/(dashboard)/page.tsx`

**Sections:**
1. Header with greeting
2. At-a-Glance stats row
3. Quick Actions buttons
4. Collection Preview Cards (horizontal scroll on mobile)
5. Recent Reports list
6. Alerts/Notifications

---

### Dashboard Empty State
**File:** `components/dashboard/EmptyState.tsx`

```typescript
interface EmptyStateProps {
  onCreateStream: () => void;
  onAddVideo: () => void;
}

// Shown when user has no streams/collections
// Primary CTA: "Create Your First Stream"
// Secondary CTA: "Add Single Video"
```

---

### Collection Preview Card
**File:** `components/dashboard/CollectionPreviewCard.tsx`

```typescript
interface CollectionPreviewCardProps {
  collection: Collection & {
    video_count: number;
    sentiment?: SimpleSentiment;
    new_videos_count?: number;
  };
  onClick: () => void;
}

// Compact card showing:
// - Collection name
// - Video count
// - Sentiment badge (😊 +0.8)
// - Trend indicator (↗ ↘ →)
// - New videos badge (if any)
```

---

### Quick Actions
**File:** `components/dashboard/QuickActions.tsx`

```typescript
interface QuickActionsProps {
  onNewStream: () => void;
  onNewReport: () => void;
  onAddVideo: () => void;
}

// Row of action buttons for common tasks
```

---

## Collection Components

### Collections List Page
**File:** `app/(dashboard)/collections/page.tsx`

**Features:**
- Grid/list toggle
- Sort options (recent, name, video count)
- Create collection button
- Collection cards

---

### Collection Detail Page - REDESIGNED
**File:** `app/(dashboard)/collections/[id]/page.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Header: Name, Stats, Actions                        │
├─────────────────────────────────────────────────────┤
│ Stats Row: Videos | Duration | Avg Sentiment        │
├─────────────────────────────────────────────────────┤
│ Tabs: [Overview] [Videos] [Insights/Reports]        │
├─────────────────────────────────────────────────────┤
│ Tab Content                                         │
└─────────────────────────────────────────────────────┘
```

**Tab: Overview**
- Mini dashboard with key metrics
- Sentiment distribution bar
- Recent videos preview
- Quick actions

**Tab: Videos**
- Full video grid/list
- Selection mode for bulk actions
- Sort/filter options

**Tab: Insights**
- List of reports for this collection
- Generate new report button
- Report cards with preview

---

### Collection Stats
**File:** `components/collections/CollectionStats.tsx`

```typescript
interface CollectionStatsProps {
  collectionId: string;
}

// Displays:
// - Total videos
// - Total duration
// - Unique channels
// - Date range
// - Average sentiment (if available)
```

---

### Collection Insights Panel
**File:** `components/collections/CollectionInsightsPanel.tsx`

```typescript
interface CollectionInsightsPanelProps {
  collectionId: string;
  videoIds: string[];
}

// Shows:
// - List of existing reports
// - Generate new report button
// - Empty state if no reports
```

---

### Collection Video List (Compact)
**File:** `components/collections/CollectionVideoList.tsx`

```typescript
interface CollectionVideoListProps {
  videos: Video[];
  onVideoClick: (videoId: string) => void;
  onRemove?: (videoId: string) => void;
}

// Compact list view for collection detail
// Shows thumbnail, title, channel, duration, sentiment badge
```

---

## Stream Components

### Streams List Page
**File:** `app/(dashboard)/streams/page.tsx`

**Features:**
- List of stream cards
- Status indicators (active/paused/error)
- Quick actions (run now, pause/resume, edit)
- Create stream button

---

### Stream Card
**File:** `components/streams/StreamCard.tsx`

```typescript
interface StreamCardProps {
  stream: Stream;
  onRun: () => void;
  onPause: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

// Shows:
// - Stream name
// - Search query
// - Status badge (active/paused/error)
// - Stats (videos collected, last run)
// - Linked collection link
// - Action buttons
```

---

### Create Stream Form
**File:** `app/(dashboard)/streams/new/page.tsx`

**Steps:**
1. Search Query
   - Text input
   - Test search button (mock results for now)

2. Filters (collapsible)
   - Max results per run (number input, default 10)
   - Duration range (optional min/max)
   - Language selector (default English)
   - Exclude keywords (tag input)

3. Schedule
   - Radio: Daily / Weekly / Manual
   - Checkbox: Auto-generate weekly insights

4. Review
   - Summary of configuration
   - Auto-generated collection name
   - Submit button

---

### Stream Status Badge
**File:** `components/streams/StreamStatusBadge.tsx`

```typescript
interface StreamStatusBadgeProps {
  status: StreamStatus;
  lastRunAt?: string;
}

// Visual indicator:
// - Active: Green dot
// - Paused: Gray dot
// - Error: Red dot with tooltip
```

---

## Report Components

### Reports List Page
**File:** `app/(dashboard)/reports/page.tsx`

**Features:**
- Filter by type, collection, date
- Sort by date (newest first)
- Search by title
- Report cards grid/list

---

### Report Card
**File:** `components/reports/ReportCard.tsx`

```typescript
interface ReportCardProps {
  report: InsightReport;
  onClick: () => void;
  onDelete: () => void;
  onRegenerate: () => void;
}

// Shows:
// - Report type icon
// - Title
// - Collection name (if linked)
// - Creation date
// - Status indicator (generating/completed)
// - Quick actions menu
```

---

### Report Viewer
**File:** `app/(dashboard)/reports/[id]/page.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ ← Back    Report Title              [⋮] [Regen]    │
├─────────────────────────────────────────────────────┤
│ Metadata: Type | Date | Model | Videos analyzed    │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Report Content (markdown rendered)                 │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Source Videos (collapsible)                        │
└─────────────────────────────────────────────────────┘
```

---

### Generate Report Dialog
**File:** `components/reports/GenerateReportDialog.tsx`

```typescript
interface GenerateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Optional pre-fill:
  initialCollectionId?: string;
  initialVideoIds?: string[];
  onSuccess: (report: InsightReport) => void;
}

// Steps:
// 1. Select videos (if not pre-filled)
//    - From collection dropdown
//    - Or manual multi-select
// 2. Choose report type
//    - Grid of cards with icons
//    - Executive Summary, Sentiment Analysis, Custom
// 3. Configure (if needed)
//    - Custom prompt textarea (for custom type)
//    - Model selector (optional)
// 4. Generate
//    - Title input (auto-generated suggested)
//    - Progress indicator
//    - Result preview
```

---

### Sentiment Report - Simplified
**File:** `components/reports/SentimentReport.tsx`

```typescript
interface SentimentReportProps {
  content: string;           // Markdown content
  structured?: SentimentStructuredResult;
}

// Displays:
// - Overall score (big number -1 to +1)
// - Distribution bar (😊 😐 😠)
// - Recent trend arrow
// - Top positive quotes (3)
// - Top negative quotes (3)
// - Simple aspect breakdown (if available)
```

---

### Executive Summary Report
**File:** `components/reports/ExecutiveSummaryReport.tsx`

```typescript
interface ExecutiveSummaryReportProps {
  content: string;
}

// Markdown rendering with:
// - Structured sections
// - Video citations as links
// - Collapsible details
```

---

## Sentiment Components

### Sentiment Badge
**File:** `components/sentiment/SentimentBadge.tsx`

```typescript
interface SentimentBadgeProps {
  score: number;        // -1 to +1
  label?: SentimentLabel;
  size?: 'sm' | 'md' | 'lg';
}

// Shows:
// - Emoji (😊 😐 😠)
// - Score (optional)
// - Label (optional)
// - Color-coded background
```

---

### Sentiment Mini
**File:** `components/sentiment/SentimentMini.tsx`

```typescript
interface SentimentMiniProps {
  score: number;
  trend?: SentimentTrend;
  videoCount?: number;
}

// Compact display for collection cards:
// "😊 +0.6 (↗) 24 videos"
```

---

### Sentiment Bar
**File:** `components/sentiment/SentimentBar.tsx`

```typescript
interface SentimentBarProps {
  distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

// Visual bar showing proportions
// [████████░░░░░░░░░░░░] 60% 😊
// [░░░░░░░░░░░░░░░░░░░░] 20% 😐
// [░░░░░░░░░░░░░░░░░░░░] 20% 😠
```

---

## Shared Components

### Video Selector
**File:** `components/shared/VideoSelector.tsx`

```typescript
interface VideoSelectorProps {
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  collectionId?: string;  // Pre-filter to collection
}

// Reusable component for selecting videos
// Used in: Report generation, Bulk actions
```

---

### Report Type Selector
**File:** `components/shared/ReportTypeSelector.tsx`

```typescript
interface ReportTypeSelectorProps {
  value: InsightReportType;
  onChange: (type: InsightReportType) => void;
  allowedTypes?: InsightReportType[];
}

// Grid of report type cards
// Icons: 📄 Executive, 🎭 Sentiment, ✏️ Custom
```

---

### Empty State
**File:** `components/shared/EmptyState.tsx`

```typescript
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Reusable empty state pattern
```

---

### Loading States
**Files:**
- `components/shared/SkeletonCard.tsx`
- `components/shared/SkeletonList.tsx`
- `components/shared/GeneratingIndicator.tsx`

---

## Modified Existing Components

### CollectionCard - UPDATE
**File:** `components/library/CollectionCard.tsx` (MODIFY)

**Add:**
- Sentiment indicator (if available)
- New videos badge
- Click navigates to collection detail

---

### VideoCard - UPDATE
**File:** `components/library/VideoCard.tsx` (MODIFY)

**Add:**
- Sentiment badge overlay (if analyzed)
- Click navigates to `/videos/[id]` (preserved)

---

### CaptureModal - UPDATE
**File:** `components/capture-modal.tsx` (MODIFY)

**No structural changes**, ensure it still works from:
- Dashboard FAB
- Bottom navigation
- Direct navigation

---

## Component Directory Structure

```
components/
├── navigation/
│   ├── Sidebar.tsx              # Desktop navigation
│   └── BottomNavigation.tsx     # Mobile navigation (MODIFY)
│
├── dashboard/
│   ├── EmptyState.tsx           # New user onboarding
│   ├── CollectionPreviewCard.tsx
│   ├── QuickActions.tsx
│   ├── StatsRow.tsx
│   ├── RecentReportsList.tsx
│   └── AlertBanner.tsx
│
├── collections/
│   ├── CollectionDetail.tsx     # Main layout
│   ├── CollectionStats.tsx      # Metrics display
│   ├── CollectionInsightsPanel.tsx
│   ├── CollectionVideoList.tsx  # Compact list
│   ├── CollectionEmptyState.tsx
│   └── hooks/
│       ├── useCollectionStats.ts
│       └── useCollectionReports.ts
│
├── streams/
│   ├── StreamsList.tsx
│   ├── StreamCard.tsx
│   ├── CreateStreamForm.tsx     # Multi-step form
│   ├── StreamStatusBadge.tsx
│   ├── StreamEmptyState.tsx
│   └── hooks/
│       └── useStreamMutations.ts
│
├── reports/
│   ├── ReportsList.tsx
│   ├── ReportCard.tsx
│   ├── ReportViewer.tsx
│   ├── GenerateReportDialog.tsx # Multi-step dialog
│   ├── SentimentReport.tsx      # Specialized viewer
│   ├── ExecutiveSummaryReport.tsx
│   ├── ReportEmptyState.tsx
│   └── hooks/
│       ├── useReports.ts
│       ├── useGenerateReport.ts
│       └── useDeleteReport.ts
│
├── sentiment/
│   ├── SentimentBadge.tsx
│   ├── SentimentMini.tsx
│   ├── SentimentBar.tsx
│   └── hooks/
│       └── useSentiment.ts
│
├── shared/
│   ├── VideoSelector.tsx
│   ├── ReportTypeSelector.tsx
│   ├── EmptyState.tsx
│   ├── SkeletonCard.tsx
│   ├── SkeletonList.tsx
│   └── GeneratingIndicator.tsx
│
└── ui/                          # Existing shadcn components
    └── (no changes)
```

---

## Styling Guidelines

### Mobile-First Approach
- All cards should stack vertically on mobile
- Horizontal scroll only for collections row on dashboard
- Touch targets minimum 44px

### Responsive Breakpoints
- Mobile: < 640px (bottom nav)
- Tablet: 640px - 1024px (sidebar collapsed)
- Desktop: > 1024px (sidebar expanded)

### Color Coding
- Positive sentiment: Green (emerald-500)
- Neutral sentiment: Gray (gray-400)
- Negative sentiment: Red (rose-500)
- Active stream: Green dot
- Paused stream: Gray dot
- Error: Red dot

### Animation
- Report generation: Pulsing loader
- Stream running: Spinning refresh icon
- New content: Subtle highlight fade
