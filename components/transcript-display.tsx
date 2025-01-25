"use client"

import { useState, useRef, useEffect, FormEvent } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SummaryButton } from "@/components/summary-button"

import { TranscriptEntry } from "@/app/protected/page"

export interface TranscriptDisplayProps {
  transcript?: string | TranscriptEntry[]
  videoId?: string
  onLoadingComplete?: () => void
}

function parseTranscript(transcript: string | TranscriptEntry[]): TranscriptEntry[] {
  if (Array.isArray(transcript)) return transcript;
  
  try {
    const lines = transcript.trim().split('\n');
    
    return lines.map(line => {
      const match = line.match(/^\[(\d+\.\d+)\]\s+(.*?)\s*$/);
      if (!match) throw new Error('Invalid transcript format');
      return {
        start: parseFloat(match[1]),
        text: match[2].trim()
      };
    });
  } catch (error) {
    console.error('Failed to parse transcript:', error);
    return [];
  }
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export function TranscriptDisplay({ 
  transcript = '', 
  videoId = '',
  onLoadingComplete 
}: TranscriptDisplayProps) {
  const [aiSummary, setAiSummary] = useState<string>('')
  const [activeTab, setActiveTab] = useState("raw")
  const [model, setModel] = useState<"deepseek-reasoner" | "deepseek-chat">("deepseek-chat")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const parsedTranscript = parseTranscript(transcript)
  const rawTabRef = useRef<HTMLButtonElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    try {
      const response = await fetch('/api/deepseek', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
              {role: 'system', content: `You are a helpful youtube video transcript assistant. Users will ask send messages about a video transcript and your goal is to use the transcript to answer their question. Past user messages and your responses are included for context.`},
              ...messages,
              userMessage,
              { role: 'user', content: `Transcript: ${parsedTranscript.map(t => t.text).join('\n')}` }
            ],
            model
        })
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      const data = await response.json();
      console.log(`data log: `, data);
      
      const assistantMessage: ChatMessage = { role: 'assistant', content: data.content };
      
      
      // const response = {
      //   "role": "assistant",
      //   "content": "**Instagram Post:**\n\n🚀✨ BIG NEWS ALERT! ✨🚀  \nPerplexity AI x TikTok = Your new favorite way to learn while you scroll! 🧠📱  \n\nImagine this: You’re watching a TikTok about a mind-blowing science experiment 🧪, a viral dance trend 💃, or a mouth-watering recipe 🍳… but you’re left with SO many questions. 🤔  \n\nEnter **Perplexity AI** – your supercharged research buddy! 🤖💡 This game-changing collaboration brings instant, detailed answers *right* to your TikTok feed. Dive deeper into the science, history, or travel tips behind the content you love – all without leaving the app. 🌍🔍  \n\nIt’s like having a genius in your pocket, making learning fun, fast, and seamless. 🎓✨  \n\nWhat do YOU think? How would you use this feature? Let me know in the comments! 👇  \n\n#PerplexityAI #TikTok #AI #TechInnovation #LearnOnTikTok #CuriosityMeetsKnowledge  \n\n📲 Don’t forget to like, save, and share this post to spread the word! 💌  \n\n---  \nWhat do you think? Would you like me to tweak it further? 😊"
      // }
      
      // const assistantMessage: ChatMessage = { role: 'assistant', content: response.content };

      console.log(`AI response: `, assistantMessage, `\nmessages before: `,messages);
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, something went wrong. Please try again.' 
      }]);
    }
  }

  useEffect(() => {
    if (transcript) {
      setActiveTab("raw")
      setTimeout(() => {
        rawTabRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        onLoadingComplete?.()
      }, 100)
    }
  }, [transcript, onLoadingComplete])

  // Auto-scroll to bottom when messages change or chat tab is opened
  useEffect(() => {
    console.log(`messages update: `,messages);
    
    if (activeTab === 'chat') {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    }
  }, [messages, activeTab])

  // Clear AI summary when transcript changes
  useEffect(() => {
    setAiSummary('')
  }, [transcript])
  
  return (
    <div className="w-full space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="px-4 py-2 bg-muted rounded-lg">
          {activeTab === "raw" && (
            <TabsContent value="raw" className="h-96 flex flex-col">
              <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                <div className="prose dark:prose-invert">
                  {parsedTranscript.map((entry, i) => (
                    <p key={i} className="mb-2 text-lg">
                      <a
                        href={`https://www.youtube.com/watch?v=${videoId}&t=${Math.round(entry.start)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 hover:underline"
                      >
                        [{entry.start}s]
                      </a> {entry.text}
                    </p>
                  ))}
                </div>
              </div>
            </TabsContent>
          )}

          {activeTab === "ai" && (
            <TabsContent value="ai" className="h-96 flex flex-col">
              {aiSummary && (
                <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                  <div 
                    className="prose dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: aiSummary }}
                  />
                </div>
              )}
              {!aiSummary && (
              <div className="h-full flex flex-col items-center justify-center gap-4 mt-4">
                <h1 className="text-2xl">No Summary Generated</h1>
                <p>Generate a new one below.</p>
                <div className="flex items-center justify-center gap-4 mt-4">
                  <Select value={model} onValueChange={(value: "deepseek-reasoner" | "deepseek-chat") => setModel(value)}>
                    <SelectTrigger className="w-[75px]">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deepseek-reasoner">R1</SelectItem>
                      <SelectItem value="deepseek-chat">V3</SelectItem>
                    </SelectContent>
                  </Select>
                  <SummaryButton transcript={parsedTranscript} setAiSummary={(summary) => setAiSummary(summary)} model={model} />
                </div>
              </div>
              )}
            </TabsContent>
          )}

          {activeTab === "chat" && (
            <TabsContent value="chat" className="h-96 flex flex-col">
              <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                <div className="flex flex-col gap-4">
                  {messages.map((message, i) => (
                    <div key={i} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user' 
                          ? 'bg-blue-500 text-primary-white' 
                          : 'bg-primary text-primary-foreground'
                      }`}>
                        {message.content}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              <div className="flex items-center gap-4 p-4">
                <Select value={model} onValueChange={(value: "deepseek-reasoner" | "deepseek-chat") => setModel(value)}>
                  <SelectTrigger className="w-[75px]">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deepseek-reasoner">R1</SelectItem>
                    <SelectItem value="deepseek-chat">V3</SelectItem>
                  </SelectContent>
                </Select>
                <Input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                />
                <Button disabled={!input} onClick={handleSendMessage}>Send</Button>
              </div>
            </TabsContent>
          )}
        </div>

        <TabsList className="w-full">
          <TabsTrigger ref={rawTabRef} className="flex-1" value="raw">Raw Transcript</TabsTrigger>
          <TabsTrigger className="flex-1" value="ai">AI Summary</TabsTrigger>
          <TabsTrigger className="flex-1" value="chat">Chat</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
