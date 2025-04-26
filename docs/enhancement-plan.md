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

## 2. Supabase Integration for Persistent Storage (Done)

### Supabase Setup

- Tables: use Supabase MCP Server tool to read the table schemas

### Auto-save Functionality

- Save transcript (pulled from 3rd party API) and video metadata (using YouTube Data v3 API) after extraction.
- Save summary after generation.
- Save chat exchanges.
- Use Supabase client SDK for CRUD.

---

### 2.1. Supabase Project Setup (Done)

- **Create a Supabase Project:**

  - Go to [supabase.com](https://supabase.com/) and sign in.
  - Create a new project and note your Project URL and anon/public API key.

- **Install Supabase Client SDK:**

  ```bash
  npm install @supabase/supabase-js
  ```

  - Store your Supabase URL and API key in environment variables (e.g., `.env.local`):
    ```
    NEXT_PUBLIC_SUPABASE_URL=your-project-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
    ```

- **Initialize Supabase Client:**

  - Create a utility (e.g., `utils/supabase/client.ts`):

    **For classic client-only or simple SSR:**

    ```ts
    import { createClient } from "@supabase/supabase-js";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    export const supabase = createClient(supabaseUrl, supabaseAnonKey);
    ```

    **For modern Next.js apps with SSR/server components (recommended):**

    ```ts
    import { createBrowserClient } from "@supabase/ssr";

    export const createClient = () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    ```

    - The SSR-friendly pattern avoids sharing a singleton between requests and is compatible with Next.js app directory/server components.
    - Use `createClient()` wherever you need a Supabase client instance.
    - Choose the pattern that best fits your app architecture.

---

### 2.2. Database Schema (Done)

- [x] **Created Tables:**

  - created the following tables in Supabase:

    ```sql

    -- groups table
    create table groups (
      id uuid primary key default uuid_generate_v4(),
      user_id uuid references auth.users not null,
      name text,
      description text
    );

    -- videos table
    create table videos (
      id uuid primary key default uuid_generate_v4(),
      user_id uuid references auth.users not null,
      youtube_url text not null,
      youtube_id text not null unique,
      title text,
      tags text[],
      created_at timestamp with time zone default now()
    );

    -- video_groups join table for many-to-many relationship
    create table video_groups (
      video_id uuid references videos not null,
      group_id uuid references groups not null,
      primary key (video_id, group_id)
    );

    -- transcripts table
    create table transcripts (
      id uuid primary key default uuid_generate_v4(),
      video_id uuid references videos not null,
      content text,
      saved_at timestamp with time zone default now()
    );

    -- summaries table
    create table summaries (
      id uuid primary key default uuid_generate_v4(),
      video_id uuid references videos not null,
      content text,
      saved_at timestamp with time zone default now()
    );

    -- chats table
    create table chats (
      id uuid primary key default uuid_generate_v4(),
      video_id uuid references videos not null,
      user_id uuid references auth.users not null,
      message text,
      response text,
      timestamp timestamp with time zone default now()
    );

    ```

---

### 2.3. Row Level Security (Done)

- [x] **Enabled RLS:**
  - enabled Row Level Security (RLS) for each table
- [x] **Added RLS Policies:**
  - Example: Only allow users to access their own data.

---

### 2.4. Auto-save Functionality (Done)

- **Save Transcript After Extraction:**

  - After extracting a transcript, insert into `transcripts` and `videos` tables.
    ```ts
    // Example: Save transcript
    const { data, error } = await supabase
      .from("transcripts")
      .insert([{ video_id, content }]);
    ```

- **Save Summary After Generation:**

  ```ts
  // Example: Save summary
  const { data, error } = await supabase
    .from("summaries")
    .insert([{ video_id, content }]);
  ```

- **Save Chat Exchanges:**

  ```ts
  // Example: Save chat
  const { data, error } = await supabase
    .from("chats")
    .insert([{ video_id, user_id, message, response }]);
  ```

- **Best Practices:**
  - Use upsert for idempotency if needed.
  - Handle errors and show user feedback.
  - Use Supabase's real-time features for live updates if desired.

---

### 2.5. CRUD Operations

- **Fetch Data:**

  ```ts
  // Fetch all videos for current user
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false });
  ```

- **Update Data:**

  ```ts
  // Update video tags
  const { data, error } = await supabase
    .from("videos")
    .update({ tags: ["tag1", "tag2"] })
    .eq("id", videoId);
  ```

- **Delete Data:**
  ```ts
  // Delete a video
  const { data, error } = await supabase
    .from("videos")
    .delete()
    .eq("id", videoId);
  ```

---

## 3. Saved Videos Library

Library = list of videos that user has processed in the past (will be saved in the `videos` table). Offer 2 view options a list view and a 2 column card view.

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
