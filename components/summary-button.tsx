"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deepseekChat } from "@/utils/deepseek";
import type { TranscriptEntry } from "@/app/protected/page";

interface SummaryButtonProps {
  transcript: TranscriptEntry[];
  setAiSummary: (summary: string) => void;
  model: "deepseek-reasoner" | "deepseek-chat";
}

export function SummaryButton({ transcript, setAiSummary, model }: SummaryButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    setLoading(true);
    try {
      const response = await deepseekChat(model, [
        {
          role: "system",
          content: `Act as a professional content summarizer. I will provide you with the transcript of a YouTube video. Your task is to generate a concise, structured summary by following these guidelines:\n\nStructure:\n- Overview: Start with a creative title for the summary, followed by a 1-2 sentence overview of the video’s primary topic and purpose.\n- Key Points: Identify 3-5 main sections or arguments. For each, include:\n  - A brief description of the idea.\n  - Timestamps (e.g., 05:30-10:00) if available.\n  - Supporting examples, data, or quotes (if critical).\n- relevant emojis\n- Conclusion: Summarize the video’s closing message, call-to-action, or final takeaways.\n\nHTML Formatting Requirements:\n- Use proper HTML structure with semantic tags\n- Main title: <h2 class="text-2xl font-bold mb-4">Title</h2>\n- Section headers: <h3 class="text-xl font-semibold mt-6 mb-2">Section Title</h3>\n- Paragraphs: <p class="mb-4">Text</p>\n- Lists: <ul class="list-disc pl-6 mb-4"><li class="mb-2">Item</li></ul>\n- Bold text: <strong>important</strong>\n- Ensure proper hierarchy: h2 > h3 > p/ul\n- Add spacing classes between elements for better readability\n\nStyle:\n- Use clear, neutral language. Avoid jargon unless the video is technical.\n- Keep paragraphs short and scannable.\n- Highlight key terms or phrases in <strong>bold</strong> using HTML tags.\n\nExclusions:\n- Omit sponsor ads, intros/outros, or repetitive content unless critical.\n- Avoid subjective opinions or analysis—focus on factual content from the transcript.`
        },
        {
          role: "user",
          content: transcript.map(t => t.text).join(" ")
        }
      ]);

      setAiSummary(response.content || "");
//       const msg = `<h2 class="text-2xl font-bold mb-4">Perplexity AI x TikTok: Revolutionizing Content Discovery 🚀</h2>
// <p class="mb-4">This video explores the exciting collaboration between <strong>Perplexity AI</strong> and <strong>TikTok</strong>, aiming to enhance how users interact with and learn from short-form video content. The partnership integrates AI-powered insights directly into TikTok, making it easier to dive deeper into topics while scrolling.</p>

// <h3 class="text-xl font-semibold mt-6 mb-2">What is Perplexity AI? 🤖</h3>
// <p class="mb-4">Perplexity AI is described as a <strong>superpowered assistant</strong> for finding answers. Unlike traditional search engines, it provides detailed, context-rich responses instead of just links, making it easier to explore topics thoroughly.</p>

// <h3 class="text-xl font-semibold mt-6 mb-2">The TikTok Collaboration 🎥</h3>
// <p class="mb-4">TikTok, known for its short-form videos, is partnering with Perplexity AI to enhance user experience. This collaboration allows users to get <strong>instant, detailed answers</strong> related to the content they’re watching. For example, if you see a science experiment video, you can instantly learn the science behind it without leaving the app.</p>

// <h3 class="text-xl font-semibold mt-6 mb-2">Practical Use Cases 🌍</h3>
// <ul class="list-disc pl-6 mb-4">
//   <li class="mb-2">Watching a travel vlog? Perplexity AI can provide quick insights like <strong>must-see spots</strong> or the best time to visit.</li>
//   <li class="mb-2">Curious about a dance trend? Get the <strong>history and context</strong> behind it instantly.</li>
// </ul>

// <h3 class="text-xl font-semibold mt-6 mb-2">Seamless Integration 🔄</h3>
// <p class="mb-4">The collaboration feels natural, as Perplexity AI fits into TikTok’s <strong>quick, bite-sized content</strong> flow. It enriches the experience by providing deeper context without disrupting the scrolling experience.</p>

// <h3 class="text-xl font-semibold mt-6 mb-2">The Bigger Trend: AI in Everyday Life 🌐</h3>
// <p class="mb-4">This partnership highlights how AI is becoming a <strong>natural part of daily interactions</strong>, enhancing how we connect with the world. Perplexity AI and TikTok are making learning fun and accessible by bridging the gap between curiosity and instant knowledge.</p>

// <h3 class="text-xl font-semibold mt-6 mb-2">Conclusion & Call-to-Action 🎬</h3>
// <p class="mb-4">The video concludes by encouraging viewers to share their thoughts on this collaboration in the comments and to <strong>like, subscribe, and stay tuned</strong> for more updates. The partnership between Perplexity AI and TikTok promises to make content discovery and learning more interactive and engaging.</p>`
//       console.log(`deepseekChat: model: `,model,"\nInput: ", msg);
      // setAiSummary(msg);
    } catch (error) {
      console.error("Summary error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleSummarize} disabled={loading}>
      {loading ? 'Generating...' : 'Summarize with AI'}
    </Button>
  );
}
