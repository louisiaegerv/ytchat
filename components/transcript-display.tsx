"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { models } from "@/utils/openrouter";

import { parseTranscript } from "@/utils/transcriptUtils";
import { sendMessage } from "@/utils/sendMessage";
import type { TranscriptDisplayProps, ChatMessage } from "@/types/transcript";
import { TranscriptText } from "@/components/transcript/TranscriptText";
import { AISummaryPanel } from "@/components/transcript/AISummaryPanel";
import { ChatPanel } from "@/components/transcript/ChatPanel";

export function TranscriptDisplay({
  transcript = "",
  videoId = "",
  onLoadingComplete,
}: TranscriptDisplayProps) {
  const [aiSummary, setAiSummary] = useState<string>("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [activeTab, setActiveTab] = useState("raw");
  const [copied, setCopied] = useState(false);
  const [model, setModel] = useState<string>(models[0].id);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const parsedTranscript = parseTranscript(transcript);
  const rawTabRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const assistantContent = await sendMessage(
        input,
        messages,
        model,
        parsedTranscript
      );

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: assistantContent,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    }
  };

  useEffect(() => {
    if (transcript) {
      setActiveTab("raw");
      setTimeout(() => {
        rawTabRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        onLoadingComplete?.();
      }, 100);
    }
  }, [transcript, onLoadingComplete]);

  // Auto-scroll to bottom when messages change or chat tab is opened
  useEffect(() => {
    console.log(`messages update: `, messages);

    if (activeTab === "chat") {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }, [messages, activeTab]);

  // Clear AI summary when transcript changes
  useEffect(() => {
    setAiSummary("");
  }, [transcript]);

  return (
    <div className="w-full space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <div className="px-4 py-2 bg-muted rounded-lg">
          {activeTab === "raw" && (
            <TabsContent value="raw" className="h-96 flex flex-col">
              <div
                className="flex-1 overflow-y-auto"
                style={{ scrollbarWidth: "none" }}
              >
                <TranscriptText entries={parsedTranscript} videoId={videoId} />
              </div>
            </TabsContent>
          )}

          {activeTab === "ai" && (
            <TabsContent value="ai" className="h-96 flex flex-col">
              <AISummaryPanel
                aiSummary={aiSummary}
                loadingSummary={loadingSummary}
                parsedTranscript={parsedTranscript}
                model={model}
                setAiSummary={setAiSummary}
                setModel={setModel}
                setLoadingSummary={setLoadingSummary}
              />
            </TabsContent>
          )}

          {activeTab === "chat" && (
            <TabsContent value="chat" className="h-96 flex flex-col">
              <ChatPanel
                messages={messages}
                setMessages={setMessages}
                model={model}
                setModel={setModel}
                parsedTranscript={parsedTranscript}
                onSendMessage={handleSendMessage}
              />
            </TabsContent>
          )}
        </div>

        {activeTab === "raw" && (
          <Button
            onClick={() => {
              const text = parsedTranscript
                .map((entry) => entry.text)
                .join("\n");
              navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            variant="outline"
            className="w-full"
          >
            <div className="flex items-center justify-center gap-2">
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy Transcript</span>
                </>
              )}
            </div>
          </Button>
        )}

        <TabsList className="w-full">
          <TabsTrigger ref={rawTabRef} className="flex-1" value="raw">
            Raw Transcript
          </TabsTrigger>
          <TabsTrigger className="flex-1" value="ai">
            AI Summary
          </TabsTrigger>
          <TabsTrigger className="flex-1" value="chat">
            Chat
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
