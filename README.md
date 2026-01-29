# Slipstream - YouTube Intelligence Platform

A Next.js + Supabase application that extracts YouTube video transcripts, provides AI-powered analysis, and enables persistent, multi-video insights with advanced LLM features.

---

## Vision

Transform YouTube content into a searchable, organized, and insightful knowledge base powered by AI.  
Save, analyze, and revisit transcripts, summaries, and conversations — across single videos or entire collections.  
Leverage AI to uncover themes, generate meta-summaries, and gain deep insights from your video library.

---

## Key Features Summary

- 🔐 **Full Authentication System** - Secure sign up, sign in, and password management
- 📹 **Smart Video Capture** - Extract transcripts from YouTube videos with automatic metadata
- 📚 **Video Library** - Organize videos with search, filters, and collections
- 🤖 **AI-Powered Analysis** - Summarize and chat with video content using 8+ AI models
- 🏷️ **Collections** - Group videos into custom collections for easy organization
- 💾 **Persistent Storage** - All data saved to Supabase with user-specific isolation
- 🎨 **Modern UI** - Built with Shadcn UI and Tailwind CSS

---

## Current Features

### Authentication & User Management

- **Full Supabase Authentication**
  - Sign up with email/password
  - Sign in with email/password
  - Password reset functionality
  - Email verification support
- **Protected Routes**
  - Middleware-based route protection
  - Automatic redirects for unauthenticated users
- **User-Specific Data Isolation**
  - All data scoped to authenticated users
  - Row-Level Security (RLS) policies enforced

### Video Capture & Transcript Extraction

- **Single Video Processing**
  - Extract full transcripts from YouTube videos
  - Support for youtube.com and youtu.be URL formats
  - Live stream support
- **Bulk Video Processing**
  - Process multiple videos at once
  - Queue-based processing system
  - Progress tracking for bulk operations
- **Automatic Metadata Fetching**
  - Video title and channel name
  - View count, like count, and publish date
  - Thumbnail images (multiple resolutions)
- **Duplicate Detection**
  - Automatic detection of previously processed videos
  - Prevents duplicate entries in library
- **Transcript Auto-Save**
  - Transcripts automatically saved to database
  - Persistent storage across sessions

### Video Library

- **View Modes**
  - Grid view with visual thumbnails
  - List view with detailed information
- **Navigation**
  - Infinite scroll pagination
  - Smooth loading experience
- **Search Functionality**
  - Real-time search across video titles
  - Instant filtering results
- **Advanced Filtering**
  - Filter by tags
  - Filter by collections
  - Multiple filter combinations
- **Bulk Operations**
  - Select multiple videos at once
  - Bulk delete videos
  - Bulk blur/unblur thumbnails
- **Per-User Preferences**
  - Save view mode preference
  - Remember filter selections
  - Personalized library experience

### Collections (Video Groups)

- **Full CRUD Operations**
  - Create new collections
  - Read/view collections
  - Update collection names
  - Delete collections
- **Video Management**
  - Add videos to collections
  - Remove videos from collections
  - Manage multiple collections per video
- **Collection Management UI**
  - Collection cards with video counts
  - Collection selector dialog
  - Create and rename dialogs
  - Delete confirmation

### AI-Powered Features

- **AI Summarization**
  - 8+ AI models via OpenRouter API
  - Structured summaries with timestamps
  - Overview, key points, and examples
  - HTML-formatted output
  - Auto-generation option (user preference)
  - Model selection in settings
- **Interactive Chat**
  - Ask questions about video content
  - Context-aware responses using transcript
  - Conversation history persistence
  - Real-time streaming responses
- **Available AI Models**
  - GPT-4o, GPT-4o Mini
  - Claude 3.5 Sonnet
  - Gemini Pro
  - DeepSeek V3
  - Groq models (Llama 3, Mixtral)
  - And more via OpenRouter

### Video Detail View

- **Embedded YouTube Player**
  - Watch video directly in app
  - Synchronized with transcript timestamps
- **Three-Tab Interface**
  - **Raw Transcript** - Full transcript with clickable timestamps
  - **AI Summary** - Structured AI-generated summary
  - **Chat** - Interactive Q&A with video content
- **Transcript Search**
  - Search within transcript text
  - Highlight matching terms
  - Jump to relevant sections
- **Collection Management**
  - Add video to collections
  - Remove from collections
  - View associated collections

### User Preferences

- **Settings Page**
  - Access via sidebar navigation
  - Persistent preferences
- **Auto-Generate Summary**
  - Toggle automatic summary generation
  - Applied to all new videos
- **Model Selection**
  - Choose preferred AI model
  - Per-user default setting
- **Storage**
  - All preferences saved to Supabase
  - Synced across devices

### Navigation & UI

- **Sidebar Navigation**
  - Collapsible sidebar
  - Quick access to all sections
  - Mobile-responsive design
- **Main Navigation Items**
  - Capture - Add new videos
  - Library - Browse saved videos
  - Stream Hub - Live stream monitoring (coming soon)
  - Settings - User preferences
- **Bottom Navigation**
  - Mobile-optimized navigation
  - Quick access to main features
- **Shadcn UI Components**
  - Modern, accessible components
  - Consistent design system
  - Dark mode support

---

## Tech Stack

### Frontend

- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn UI** - Pre-built React components
- **Radix UI** - Unstyled, accessible primitives

### Backend & Database

- **Supabase** - Backend-as-a-Service
  - PostgreSQL - Relational database
  - Supabase Auth - Authentication system
  - Supabase Storage - File storage
  - Row-Level Security (RLS) - Data access control

### AI & APIs

- **OpenRouter API** - Unified access to 8+ AI models
  - GPT-4o, GPT-4o Mini
  - Claude 3.5 Sonnet
  - Gemini Pro
  - DeepSeek V3
  - Groq models
- **YouTube Data API v3** - Video metadata and transcripts
- **YouTube Transcript API** - Transcript extraction

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **PostCSS** - CSS processing
- **pnpm** - Package manager

---

## Database Schema

### Core Tables

**videos**

- Stores video metadata and transcripts
- Fields: id, user_id, video_id, title, channel, transcript, summary, etc.
- RLS: Users can only access their own videos

**collections**

- User-created video collections
- Fields: id, user_id, name, created_at
- RLS: Users can only access their own collections

**collection_videos**

- Many-to-many relationship between videos and collections
- Fields: id, collection_id, video_id
- RLS: Enforced through parent table policies

**user_preferences**

- User-specific settings
- Fields: id, user_id, auto_generate_summary, preferred_model
- RLS: Users can only access their own preferences

---

## Setup

### Prerequisites

- Node.js 18+ installed
- Supabase account and project
- OpenRouter API key
- YouTube Data API v3 key

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd slipstream
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   Copy `.env.example` to `.env.local` and fill in the required values:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENROUTER_API_KEY=your_openrouter_key
   YOUTUBE_API_KEY=your_youtube_api_key
   ```

4. **Set up Supabase database**

   - Create tables: `videos`, `collections`, `collection_videos`, `user_preferences`
   - Enable Row-Level Security (RLS)
   - Create appropriate RLS policies
   - See `plans/collections-feature-implementation.md` for detailed schema

5. **Run the development server**

   ```bash
   npm run dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## Usage

### Getting Started

1. **Sign Up or Sign In**

   - Create an account with email/password
   - Or sign in if you already have an account

2. **Capture Your First Video**

   - Click "Capture" in the sidebar
   - Enter a YouTube URL
   - Wait for transcript extraction
   - Video is automatically saved to your library

3. **Explore Video Details**

   - Click on any video in your library
   - View the raw transcript with timestamps
   - Generate an AI summary
   - Chat with the video content

4. **Organize Your Videos**

   - Create collections to group related videos
   - Add videos to collections
   - Use search and filters to find videos
   - Bulk manage multiple videos

5. **Configure Preferences**
   - Go to Settings
   - Enable auto-generate summary for new videos
   - Choose your preferred AI model

### Advanced Features

**Bulk Processing**

- Select multiple videos to process at once
- Use bulk actions to delete or blur thumbnails
- Efficiently manage large libraries

**Collection Management**

- Create thematic collections (e.g., "Tutorials", "Interviews")
- Add videos to multiple collections
- Rename or delete collections as needed

**AI Chat**

- Ask specific questions about video content
- Get context-aware answers
- Maintain conversation history across sessions

---

## API Endpoints

### Internal API Routes

**POST /api/transcript**

- Extract transcript from YouTube video
- Returns full transcript text

**POST /api/youtube/metadata**

- Fetch video metadata from YouTube
- Returns title, channel, stats, thumbnails

**POST /api/openrouter**

- Generate AI summary or chat response
- Supports multiple AI models
- Streaming responses supported

**POST /api/deepseek**

- Alternative AI endpoint for DeepSeek models

### Supabase Client

The app uses Supabase client for all database operations:

- Authentication (sign up, sign in, sign out)
- CRUD operations on videos, collections, preferences
- Real-time subscriptions (where applicable)

---

## Future Enhancements

### Planned Features

- **Stream Hub** - Allow users to set up automated radar/monitors to track new videos based on a specific keyword. Background microservice/cron will run, collect and process the data/summaries, and then insert the data into the db for the user so they can view the Daily results. Videos will be stored in their own Automated collection and custom UI will be displayed showing the summary/trends/insights for the automated results over the past day, week, and month.
- **AI Highlights** - Automatic extraction of key moments and quotable segments
- **Advanced Analytics** - Dashboard with viewing patterns, engagement metrics
- **Teams** - Share collections and insights with other team members

See project plans in the `plans/` directory for detailed implementation roadmaps.

---

## Contributing

Contributions welcome!  
Please open an issue or submit a pull request to help improve this platform.

### Development Guidelines

- Follow existing code style and conventions
- Use TypeScript for type safety
- Write clear, descriptive commit messages
- Test changes thoroughly before submitting
- Update documentation as needed

---

## License

[Add your license information here]

---

## Support

For issues, questions, or suggestions:

- Open an issue on GitHub
- Check existing documentation
- Review the implementation plans in `plans/`

---

**Built with ❤️ using Next.js, Supabase, and modern AI technologies**
