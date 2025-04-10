# YouTube Transcript Analysis Tool — Enhancement Plan

---

## 1. UI Enhancements

### Add ShadCN Sidebar

- Use `npx shadcn@latest add sidebar-07` to scaffold a sidebar.
- Sidebar navigation:
  - Home (current video analysis)
  - Saved Videos Library
  - Multi-Video Summarizer
  - Dashboard / Analytics
  - Account/Profile
  - Settings
- Sidebar should be collapsible and responsive.

---

## 2. Supabase Integration for Persistent Storage

### Supabase Setup

- Tables:
  - **videos**: id, user_id, youtube_url, title, tags, group_id, created_at
  - **transcripts**: id, video_id, content, saved_at
  - **summaries**: id, video_id, content, saved_at
  - **chats**: id, video_id, user_id, message, response, timestamp
  - **groups**: id, user_id, name, description
- Add RLS policies to restrict data per user.

### Auto-save Functionality

- Save transcript after extraction.
- Save summary after generation.
- Save chat exchanges.
- Use Supabase client SDK for CRUD.

---

## 3. Saved Videos Library

### Search, Filter, Tagging

- Search by title, tags, transcript, summary.
- Filter by tags, groups, date.
- Tagging system.
- Group assignment (folders/collections).

### View Saved Video

- Load transcript, summary, chat history from Supabase.
- Display in existing UI components.
- Option to re-run AI summary or chat.

### Organize Videos into Groups

- Create/edit/delete groups.
- Assign videos to groups.
- Filter by group.

---

## 4. Multi-Video Summarizer

### Batch Selection

- Select multiple saved videos.
- Select by tag, group, or manual multi-select.

### Summary Pipeline

- For each video:
  - Generate summary if missing.
- Aggregate summaries.
- Generate **Meta Summary** (name ideas: **Insight Fusion**, **ThemeSynth**, **CrossCut**, **Synthesis**, **Mosaic Summary**).
- Display meta summary with references.

### Use Cases

- Find common topics.
- Extract trends, contradictions, insights.

---

## 5. Dashboard & Analytics

### User Stats

- Total videos processed
- Total summaries generated
- Total chat messages sent
- Most common tags/groups
- Time saved (estimate)
- AI usage breakdown

### Visualizations

- Charts (bar, pie, line)
- Tag clouds
- Group distribution

### Tech

- Use React charting library (Recharts, Chart.js, Visx).
- Fetch aggregated data from Supabase.

---

## 6. Additional Creative AI Features

### Smart Tagging

- AI suggests tags based on content.
- Auto-tag on save, user can edit.

### Topic Detection & Clustering

- Cluster videos by topic/theme using embeddings.
- Visualize clusters.

### Semantic Search

- Use vector embeddings (Supabase pgvector).
- Search by meaning, not just keywords.

### Chat Memory

- Include past chat context.
- Continue conversations across sessions.

### AI-Powered Highlights

- Extract key quotes/moments.
- Generate shareable snippets.

### Export & Share

- Export summaries/insights as PDF/Markdown.
- Share links with permissions.

---

## 7. Implementation Phases

### Phase 1: Foundation

- Add sidebar
- Set up Supabase schema & RLS
- Implement auto-save

### Phase 2: Saved Video Library

- UI for browsing/searching
- Load saved data
- Tagging & grouping

### Phase 3: Multi-Video Summarizer

- Batch select
- Generate meta summaries

### Phase 4: Dashboard & Analytics

- Aggregate data
- Visualize

### Phase 5: AI Enhancements

- Smart tagging
- Semantic search
- Topic clustering
- AI highlights
- Export/share

---

## Summary

Transform the current single-session tool into a full-featured, persistent, multi-video analysis platform with rich AI capabilities, user data management, and insightful analytics.
