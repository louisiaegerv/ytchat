# Slipstream - AI Coding Agent Guide

## Project Overview

Slipstream is a **YouTube Intelligence Platform** built with Next.js and Supabase. It extracts YouTube video transcripts, provides AI-powered analysis, and enables persistent, multi-video insights with advanced LLM features.

### Core Purpose

Transform YouTube content into a searchable, organized, and insightful knowledge base powered by AI. Users can save, analyze, and revisit transcripts, summaries, and conversations across single videos or entire collections.

---

## Technology Stack

### Frontend

- **Next.js 15+** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5.7** - Type-safe development
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Shadcn UI** - Pre-built React components (using Radix UI primitives)

### Backend & Database

- **Supabase** - Backend-as-a-Service
  - PostgreSQL - Relational database
  - Supabase Auth - Authentication system
  - Row-Level Security (RLS) - Data access control
- **@supabase/ssr** - Server-side rendering support

### AI & APIs

- **OpenRouter API** - Unified access to 8+ AI models (GPT-4o, Claude, Gemini, Groq)
- **YouTube Data API v3** - Video metadata
- **External Transcript Service** - Python service running on port 8000 for transcript extraction

### Key Dependencies

- `@tanstack/react-query` - Server state management with caching
- `@dnd-kit/*` - Drag and drop for collection reordering
- `@radix-ui/*` - Accessible UI primitives
- `lucide-react` - Icon library
- `sonner` - Toast notifications
- `next-themes` - Dark/light mode
- `date-fns` - Date formatting
- `markdown-to-jsx` - Markdown rendering

---

## Project Structure

```
app/                          # Next.js App Router
├── (auth-pages)/            # Auth page group
│   ├── forgot-password/
│   ├── sign-in/
│   ├── sign-up/
│   └── layout.tsx
├── api/                     # API routes
│   ├── transcript/         # Transcript extraction proxy
│   ├── openrouter/         # AI completion endpoint
│   ├── youtube/metadata/   # YouTube metadata fetch
│   └── auth/callback/      # OAuth callback
├── capture/                # Video capture page
├── library/                # Video library & collections
│   └── collections/[id]/   # Collection detail view
├── settings/               # User settings page
├── stream-hub/             # Stream monitoring (future)
├── videos/[id]/            # Video detail view
├── actions.ts              # Server actions (auth, collections)
├── layout.tsx              # Root layout with providers
├── page.tsx                # Home (redirects to library/login)
└── globals.css             # Global styles + CSS variables

components/                   # React components
├── ui/                     # Shadcn UI components
├── library/                # Library-specific components
├── transcript/             # Transcript view components
├── settings/               # Settings components
├── sidebar/                # Sidebar navigation
├── tutorial/               # Onboarding tutorial
├── typography/             # Text components
├── bottom-navigation.tsx   # Mobile navigation
├── capture-modal.tsx       # Video capture modal
├── radar-modal.tsx         # Stream automation modal
├── settings-modal.tsx      # Settings modal
├── GlobalDataContext.tsx   # Global UI state provider
└── VideoContext.tsx        # Video playback state

utils/                        # Utility functions
├── supabase/               # Supabase clients
│   ├── client.ts          # Browser client
│   ├── server.ts          # Server client
│   ├── middleware.ts      # Auth middleware
│   ├── auth-cache.ts      # Auth caching
│   └── pinned-collections.ts  # Pinned collections DB
├── transcriptUtils.ts      # Transcript parsing
├── userPreferences.ts      # User settings
├── youtubeMetadata.ts      # YouTube API helpers
├── summaryGenerator.ts     # AI summary generation
├── sendMessage.ts          # Chat message handling
├── openrouter.ts           # OpenRouter API client
└── groq.ts                 # Groq API client

hooks/                        # Custom React hooks
├── queries/                # React Query data fetching hooks
│   ├── useCollectionsQuery.ts       # Fetch collections
│   ├── usePinnedCollectionsQuery.ts # Fetch pinned collections
│   ├── useVideosQuery.ts            # Fetch videos with infinite scroll
│   └── useUserQuery.ts              # Fetch user auth data
├── mutations/              # React Query mutation hooks
│   ├── useCollectionMutations.ts       # Create, rename, delete collections
│   ├── usePinnedCollectionMutations.ts # Pin, unpin, reorder
│   └── useVideoMutations.ts            # Delete videos, blur flags
├── use-mobile.tsx          # Mobile detection
└── useKeyboardShortcut.tsx # Keyboard shortcuts

lib/                          # Shared utilities
├── utils.ts                # cn(), date formatting, number formatting
├── queryClient.ts          # React Query client configuration
└── queryKeys.ts            # Type-safe query key factories

types/                        # TypeScript types
├── library.ts              # Video, Collection types
├── transcript.ts           # Chat message types
└── youtube-transcript-api.d.ts

lib/                          # Shared utilities
└── utils.ts                # cn(), date formatting, number formatting

plans/                        # Implementation plans
docs/                         # Documentation assets
public/                       # Static assets
```

---

## Database Schema

### Core Tables

**videos**

- Stores video metadata and user associations
- Fields: `id`, `user_id`, `youtube_id`, `youtube_url`, `title`, `description`, `channel_id`, `published_at`, `duration`, `view_count`, `like_count`, `comment_count`, `youtube_thumbnail`, `created_at`
- RLS: Users can only access their own videos

**transcripts**

- Stores parsed transcript content as JSON
- Fields: `id`, `video_id`, `content` (JSON array), `saved_at`
- RLS: Linked to videos table policies

**summaries**

- Stores AI-generated summaries
- Fields: `id`, `video_id`, `content` (HTML), `saved_at`
- RLS: Linked to videos table policies

**chats**

- Stores chat conversations with videos
- Fields: `id`, `video_id`, `content` (JSON messages), `saved_at`
- RLS: Linked to videos table policies

**collections**

- User-created video collections
- Fields: `id`, `user_id`, `name`, `description`, `created_at`, `updated_at`
- RLS: Users can only access their own collections

**video_collections**

- Many-to-many relationship between videos and collections
- Fields: `id`, `video_id`, `collection_id`
- RLS: Enforced through parent table policies

**pinned_collections**

- User's pinned collections for sidebar
- Fields: `id`, `user_id`, `collection_id`, `position`, `created_at`
- RLS: Users can only access their own pins

**user_settings**

- User preferences and settings
- Fields: `id`, `user_id`, `auto_generate_summary`, `summary_model`, `blur_thumbnails`, `updated_at`
- RLS: Users can only access their own settings

**user_video_flags**

- Per-user video UI flags (blur thumbnail, etc.)
- Fields: `id`, `user_id`, `video_id`, `blur_thumbnail`
- RLS: Users can only access their own flags

**tags** / **video_tags**

- Video tagging system
- Fields: `id`, `name` (tags), `video_id`, `tag_id` (video_tags)

**channels**

- YouTube channel cache
- Fields: `id`, `youtube_channel_id`, `title`, `created_at`

---

## Environment Variables

Required in `.env.local`:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI APIs (Required for AI features)
OPENROUTER_API_KEY=your_openrouter_key

# YouTube (Required for video metadata)
YOUTUBE_API_KEY=your_youtube_api_key

# Optional
SITE_URL=your_site_url        # For OpenRouter analytics
SITE_NAME=your_site_name      # For OpenRouter analytics
```

---

## Build and Development Commands

```bash
# Development
npm run dev          # Start development server on localhost:3000

# Build
npm run build        # Production build
npm run start        # Start production server
```

**Note:** This project requires a separate Python transcript service running on port 8000. The transcript API route proxies requests to `http://localhost:8000/transcript`.

---

## Architecture Patterns

### Authentication Flow

- Supabase Auth with email/password
- Middleware (`middleware.ts`) checks session on every request
- Protected routes redirect to `/login` if not authenticated
- Auth routes redirect to `/library` if already authenticated
- Server actions in `app/actions.ts` handle auth operations

### Data Fetching

- **React Query (TanStack Query)** for all client-side server state:
  - Query hooks in `hooks/queries/` for data fetching
  - Mutation hooks in `hooks/mutations/` for CRUD operations
  - Optimistic updates for instant UI feedback
  - Automatic cache deduplication and background refetching
- Server Actions in `app/actions.ts` for server-side mutations
- Server Components use `createClient()` from `utils/supabase/server.ts` for initial data

### State Management

- **React Query** for server state (collections, videos, pinned collections, user data):
  - Automatic caching with configurable stale times
  - Optimistic updates for mutations
  - Cache invalidation patterns for data consistency
- React Context for client-only state:
  - `GlobalDataContext` - UI state (existingTags)
  - `VideoContext` - Current video playback/form state
- Local state with `useState` for component-level UI state

### React Query Patterns

All server data fetching uses React Query with the following conventions:

**Query Hooks** (`hooks/queries/`)
- Use `useQuery` for single data fetches
- Use `useInfiniteQuery` for paginated data (videos)
- Return `{ data, isLoading, error, refetch }` pattern
- Configured with stale times:
  - Collections: 5 minutes
  - Pinned collections: 2 minutes
  - Videos: 2 minutes

**Mutation Hooks** (`hooks/mutations/`)
- Use `useMutation` with optimistic updates
- Pattern: `onMutate` (optimistic) → `onError` (rollback) → `onSettled` (invalidate)
- Return `{ mutateAsync, isPending }` for async/await usage
- Export `isCreating`, `isDeleting`, etc. for UI loading states

**Query Keys** (`lib/queryKeys.ts`)
- Type-safe factories for cache keys
- Hierarchical pattern: `['entity', 'filter', 'id']`
- Enables precise cache invalidation

**No Polling**
- All queries have `refetchInterval: false`
- Polling deferred until Teams/Automated Scans features
- Manual refresh via `refetch()` or `queryClient.invalidateQueries()`

### Component Organization

- **Shadcn UI components** in `components/ui/` - Unstyled, accessible primitives
- **Feature components** in subdirectories (library/, transcript/, etc.)
- **Page components** co-located with routes in `app/`

### Styling Conventions

- Tailwind CSS with CSS variables for theming
- Dark mode support via `next-themes`
- CSS variables defined in `app/globals.css`
- Component styling uses `cn()` utility for conditional classes

---

## Key Features & Implementation

### Video Capture

- Modal-based capture (`CaptureModal`)
- Supports YouTube URLs (youtube.com, youtu.be)
- Calls external Python service for transcript extraction
- Auto-saves to database with metadata

### Library Management

- Grid/List view modes
- Infinite scroll pagination (12 items per page)
- Search by title/channel (via PostgreSQL function)
- Filter by tags and collections
- Bulk selection and operations

### Collections

- Create, rename, delete collections
- Add/remove videos from collections
- Pin collections to sidebar (max 3)
- Drag-and-drop reordering for pinned collections

### AI Features

- Summary generation with multiple models
- Chat interface with video context
- Streaming responses
- Per-user model preferences
- Auto-generate summary option

### Keyboard Shortcuts

- `Alt + /` - Toggle sidebar
- `Alt + N` - Open New dropdown
- `Alt + V` - Open Video Scan modal
- `Alt + L` - Navigate to Library
- `Alt + H` - Navigate to Stream Hub
- `Alt + S` - Open Stream Automation modal

---

## Code Style Guidelines

### TypeScript

- Strict mode enabled
- Explicit return types on exported functions
- Interface naming: `PascalCase`
- Type naming: `PascalCase`

### Components

- Functional components with hooks
- Props interface named `{ComponentName}Props`
- Client components marked with `"use client"`
- Server components by default

### File Naming

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Hooks: `useCamelCase.ts`
- Types: `camelCase.ts` or `PascalCase.ts`

### Imports

- Use path aliases: `@/components`, `@/utils`, `@/types`
- Group imports: React/Next, third-party, local

### Error Handling

- Try/catch in async functions
- User-friendly error messages
- Console errors for debugging
- Graceful fallbacks where possible

---

## Testing Strategy

Currently, the project does not have an automated test suite. Testing is manual:

1. **Authentication flows** - Sign up, sign in, password reset
2. **Video capture** - Various YouTube URL formats
3. **Library operations** - Search, filter, bulk actions
4. **Collection management** - CRUD operations, pinning
5. **AI features** - Summary generation, chat
6. **Responsive design** - Mobile, tablet, desktop

---

## Security Considerations

### Authentication

- Row-Level Security (RLS) enabled on all tables
- Server-side session validation in middleware
- No sensitive data in client-side storage

### API Keys

- All API keys stored server-side only
- Client-side Supabase key is the public anon key
- OpenRouter/YouTube keys never exposed to client

### Data Access

- All database queries scoped to `user_id`
- Ownership verification before mutations
- RLS policies enforce user isolation

---

## Deployment Notes

### Prerequisites

- Node.js 18+
- Supabase project configured
- Python transcript service deployed (port 8000)
- Environment variables set

### Build Configuration

- `tsconfig.json` - Standard Next.js TypeScript config
- `tailwind.config.ts` - Custom theme with CSS variables

### Recommended Platforms

- **Vercel** - Optimized for Next.js
- **Supabase** - Database and auth hosting

---

## Common Development Tasks

### Adding a New AI Model

1. Update model list in `components/settings/Preferences.tsx`
2. Ensure model is available on OpenRouter

### Adding a New Database Table

1. Create table in Supabase with RLS enabled
2. Add TypeScript types to `types/`
3. Create server actions in `app/actions.ts` if needed
4. Add RLS policies for user isolation

### Adding a New Route

1. Create directory in `app/` with `page.tsx`
2. Add navigation item in `components/sidebar/app-sidebar.tsx`
3. Update middleware if route needs protection

### Adding a New Component

1. Create in appropriate `components/` subdirectory
2. Use Shadcn UI primitives where possible
3. Export from barrel file if applicable
4. Add TypeScript types

### Adding a New Query Hook

1. Create in `hooks/queries/use{Entity}Query.ts`
2. Import query key from `lib/queryKeys.ts`
3. Use `useQuery` with appropriate stale time
4. Export prefetch helper if needed
5. Use in component with `const { data, isLoading } = useHook()`

### Adding a New Mutation Hook

1. Create in `hooks/mutations/use{Entity}Mutations.ts`
2. Define TypeScript interfaces for variables
3. Use `useMutation` with optimistic update pattern:
   ```typescript
   onMutate: async (variables) => {
     await queryClient.cancelQueries({ queryKey: ... });
     const previous = queryClient.getQueryData(...);
     queryClient.setQueryData(..., newData);
     return { previous };
   },
   onError: (err, variables, context) => {
     if (context?.previous) queryClient.setQueryData(..., context.previous);
   },
   onSettled: () => {
     queryClient.invalidateQueries({ queryKey: ... });
   },
   ```
4. Export pending states (`isCreating`, `isDeleting`, etc.)

---

## Troubleshooting

### Common Issues

**"Cannot connect to transcript service"**

- Ensure Python service is running on port 8000
- Check `app/api/transcript/route.ts` proxy configuration

**"RLS policy violation"**

- Check that user is authenticated
- Verify RLS policies in Supabase dashboard
- Ensure `user_id` is set correctly on inserts

**"Environment variables not found"**

- Ensure `.env.local` exists and is not committed
- Check variable names match expected keys
- Restart dev server after changes

---

## Future Enhancements (Planned)

- **Stream Hub** - Automated monitoring for new videos by keyword
- **AI Highlights** - Automatic key moment extraction
- **Advanced Analytics** - Dashboard with viewing patterns
- **Teams** - Share collections with team members

See `plans/` directory for detailed implementation roadmaps.
