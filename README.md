# YouTube Transcript Analysis Tool

A Next.js application that extracts YouTube video transcripts and provides AI-powered analysis features using DeepSeek models.

## Features

- **Transcript Extraction**: Get full transcripts from YouTube videos
![Transcript View](./public/transcription.png){: width="600"}
*Raw transcript display with clickable timestamps*
- **AI Summarization**: Generate structured summaries with:
![AI Summary](./public/ai-summary.png){: width="600"}
*Structured summary with key points and examples*
  - Overview
  - Key points with timestamps
  - Supporting examples
  - HTML-formatted output
- **Interactive Chat**: Ask questions about the video content
![Video Chat](./public/video-chat.png){: width="600"}
*Chat interface with conversation history*
- **DeepSeek Integration**: Choose between two AI models:
  - DeepSeek Reasoner (R1)
  - DeepSeek Chat (V3)

## How It Works

1. Enter a YouTube video URL
2. View the full transcript with clickable timestamps
3. Use AI features:
   - Generate summaries
   - Chat with the video content
4. Switch between DeepSeek models for different results

## Technical Details

- Built with Next.js and TypeScript
- Uses DeepSeek API for AI features
- Transcript processing via local API endpoint
- Responsive UI with:
  - Raw transcript view
  - AI summary view
  - Interactive chat interface

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables:
   - `DEEPSEEK_API_KEY`
4. Run the development server: `npm run dev`

## Usage

1. Start the application
2. Enter a YouTube video URL
3. Explore the transcript and AI features
4. Switch between models for different results

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
