"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { Copy, Check, TextSearch, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input"; // Import Input component
import { models } from "@/utils/openrouter";

import { useVideoContext } from "@/components/VideoContext";
import { parseTranscript } from "@/utils/transcriptUtils";
import { sendMessage } from "@/utils/sendMessage";
import type { ChatMessage } from "@/types/transcript";
import { TranscriptText } from "@/components/transcript/TranscriptText";
import { AISummaryPanel } from "@/components/transcript/AISummaryPanel";
import { ChatPanel } from "@/components/transcript/ChatPanel";
import { createClient } from "@/utils/supabase/client";

export function VideoInsightsPanel() {
  const { transcript, youtubeId, videoUuid, aiSummary, setAiSummary } =
    useVideoContext();

  const [loadingSummary, setLoadingSummary] = useState(false);
  const [activeTab, setActiveTab] = useState("raw");
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [model, setModel] = useState<string>(models[0].id);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const parsedTranscript = parseTranscript(transcript || []);
  const rawTabRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // State for search functionality
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { entryIndex: number; startIndex: number; endIndex: number }[]
  >([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Function to handle search
  const handleSearch = () => {
    if (!searchQuery) {
      setSearchResults([]);
      setCurrentMatchIndex(0);
      return;
    }

    const results: {
      entryIndex: number;
      startIndex: number;
      endIndex: number;
    }[] = [];
    parsedTranscript.forEach((entry, entryIndex) => {
      const text = entry.text.toLowerCase();
      const query = searchQuery.toLowerCase();
      let startIndex = -1;
      while ((startIndex = text.indexOf(query, startIndex + 1)) !== -1) {
        results.push({
          entryIndex,
          startIndex,
          endIndex: startIndex + query.length,
        });
      }
    });

    setSearchResults(results);
    setCurrentMatchIndex(results.length > 0 ? 0 : -1); // Reset to first match or -1 if no results
  };

  // Function to navigate to the next search result
  const handleNextMatch = () => {
    if (searchResults.length > 0) {
      setCurrentMatchIndex((prevIndex) =>
        prevIndex < searchResults.length - 1 ? prevIndex + 1 : 0
      );
    }
  };

  // Function to clear search
  const handleClearSearch = () => {
    setIsSearching(false);
    setSearchQuery("");
    setSearchResults([]);
    setCurrentMatchIndex(0);
  };

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

      // --- Supabase auto-save logic for chat ---
      try {
        const supabase = createClient();
        // Get current user (for RLS)
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError || !userData?.user) {
          throw new Error("Could not get current user for saving chat.");
        }
        const user_id = userData.user.id;
        // Insert chat exchange
        const { error: chatError } = await supabase.from("chats").insert([
          {
            video_id: videoUuid,
            user_id,
            message: input,
            response: assistantContent,
            // timestamp will be set by default in DB
          },
        ]);
        if (chatError) {
          throw new Error("Could not save chat exchange.");
        }
      } catch (saveError) {
        // Optionally show a toast or error message
        console.error("Chat auto-save error:", saveError);
      }
      // --- End Supabase auto-save logic ---
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
      }, 100);
    }
  }, [transcript]);

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
    <div className="w-full h-full flex flex-col space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4 flex-1 flex flex-col"
      >
        <div className="flex flex-col gap-4 basis-0 grow min-h-[450px]">
          {activeTab === "raw" && (
            <>
              <TabsContent
                value="raw"
                className="px-4 py-2 bg-muted rounded-lg flex-1 flex flex-col overflow-y-auto mt-0"
              >
                <TranscriptText
                  entries={parsedTranscript}
                  videoId={youtubeId || ""}
                  searchQuery={searchQuery}
                  searchResults={searchResults}
                  currentMatchIndex={currentMatchIndex}
                />
              </TabsContent>
              <div className={`flex gap-2 ${isSearching ? "flex-col" : ""}`}>
                {isSearching ? (
                  <div className="flex items-center w-full border rounded-md bg-background pr-2">
                    <Input
                      type="text"
                      placeholder="Search transcript..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleSearch();
                        }
                      }}
                      className="flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleNextMatch}
                      className="h-auto w-auto"
                      disabled={!searchQuery}
                    >
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleClearSearch}
                          className="h-auto w-auto"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <TextSearch className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setIsSearching(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <TextSearch className="h-4 w-4" />
                      <span>Search Transcript</span>
                    </div>
                  </Button>
                )}
                <Button
                  onClick={() => {
                    const text = parsedTranscript
                      .map((entry) => entry.text)
                      .join("\n");
                    navigator.clipboard.writeText(text);
                    setCopiedTranscript(true);
                    setTimeout(() => setCopiedTranscript(false), 2000);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <div className="flex items-center justify-center gap-2">
                    {copiedTranscript ? (
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
              </div>
            </>
          )}

          {activeTab === "ai" && (
            <>
              <TabsContent
                value="ai"
                className="px-4 py-2 bg-muted rounded-lg mt-0 flex-1 flex flex-col overflow-y-auto"
                style={{ scrollbarWidth: "thin" }}
              >
                <AISummaryPanel
                  loadingSummary={loadingSummary}
                  parsedTranscript={parsedTranscript}
                  model={model}
                  setModel={setModel}
                  setLoadingSummary={setLoadingSummary}
                  videoId={videoUuid || ""}
                />
              </TabsContent>
              <Button
                onClick={() => {
                  const summaryText = aiSummary || "No summary available.";
                  navigator.clipboard.writeText(summaryText);
                  setCopiedSummary(true);
                  setTimeout(() => setCopiedSummary(false), 2000);
                }}
                variant="outline"
                className="w-full"
                disabled={!aiSummary}
              >
                <div className="flex items-center justify-center gap-2">
                  {copiedSummary ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy Summary</span>
                    </>
                  )}
                </div>
              </Button>
            </>
          )}

          {activeTab === "chat" && (
            <TabsContent
              value="chat"
              className="bg-muted rounded-lg flex-1 flex flex-col overflow-y-auto mt-0"
            >
              <ChatPanel
                messages={messages}
                setMessages={setMessages}
                model={model}
                setModel={setModel}
                parsedTranscript={parsedTranscript}
                onSendMessage={handleSendMessage}
                input={input}
                setInput={setInput}
              />
            </TabsContent>
          )}
        </div>

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
