"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Check, TextSearch, X, Sparkles, Brain, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { models } from "@/utils/openrouter";

import { useVideoContext } from "@/components/VideoContext";
import { parseTranscript } from "@/utils/transcriptUtils";
import { sendMessage } from "@/utils/sendMessage";
import type { ChatMessage } from "@/types/chat";
import { TranscriptText } from "@/components/transcript/TranscriptText";
import { AISummaryPanel } from "@/components/transcript/AISummaryPanel";
import { ChatPanel } from "@/components/transcript/ChatPanel";
import { ChatSessionsPanel } from "@/components/transcript/ChatSessionsPanel";
import { createClient } from "@/utils/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { chatSessionKeys, useChatSessionsQuery } from "@/hooks/queries/useChatSessionsQuery";

export function VideoInsightsPanel() {
  const { transcript, youtubeId, videoUuid, aiSummary, setAiSummary } =
    useVideoContext();
  const queryClient = useQueryClient();

  const [loadingSummary, setLoadingSummary] = useState(false);
  const [activeTab, setActiveTab] = useState("ai");
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [model, setModel] = useState<string>(models[0].id);

  // Chat session state
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isTemporarySession, setIsTemporarySession] = useState(false);
  const [showSessionList, setShowSessionList] = useState(true);

  // Fetch sessions to check if we should auto-start a new chat
  const { data: sessions } = useChatSessionsQuery(videoUuid || "");

  // Auto-start new chat if no sessions exist when chat tab is opened
  useEffect(() => {
    if (activeTab === "chat" && sessions && sessions.length === 0 && !currentSessionId) {
      // No sessions exist - start a new chat immediately
      setCurrentSessionId(`temp-${Date.now()}`);
      setIsTemporarySession(true);
      setShowSessionList(false);
    }
  }, [activeTab, sessions, currentSessionId]);

  const parsedTranscript = parseTranscript(transcript || []);
  const aiTabRef = useRef<HTMLButtonElement>(null);

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
    setCurrentMatchIndex(results.length > 0 ? 0 : -1);
  };

  // Function to navigate to the next search result
  const handleNextMatch = () => {
    if (searchResults.length > 0) {
      setCurrentMatchIndex((prevIndex) =>
        prevIndex < searchResults.length - 1 ? prevIndex + 1 : 0,
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

  // Handle sending a message in a chat session
  const handleSendMessage = async (input: string, sessionId: string | null): Promise<string> => {
    // Get existing messages for context
    const supabase = createClient();
    
    let messageHistory: ChatMessage[] = [];
    
    if (sessionId) {
      const { data: existingMessages } = await supabase
        .from("chats")
        .select("message, response")
        .eq("session_id", sessionId)
        .order("timestamp", { ascending: true });

      messageHistory = (existingMessages || [])
        .flatMap((msg: any): ChatMessage[] => [
          msg.message ? { role: "user" as const, content: msg.message } : null,
          msg.response ? { role: "assistant" as const, content: msg.response } : null,
        ].filter((m): m is ChatMessage => m !== null));
    }

    // Get AI response
    const response = await sendMessage(
      input,
      messageHistory,
      model,
      parsedTranscript,
    );

    return response;
  };

  // Handle starting a new chat session (temporary until first message)
  const handleNewSession = () => {
    setCurrentSessionId(`temp-${Date.now()}`);
    setIsTemporarySession(true);
    setShowSessionList(false);
  };

  // Handle session selection from list
  const handleSessionSelect = (sessionId: string | null) => {
    setCurrentSessionId(sessionId);
    setIsTemporarySession(false);
    if (sessionId) {
      setShowSessionList(false);
    }
  };

  // Handle back to sessions
  const handleBackToSessions = () => {
    setShowSessionList(true);
    setCurrentSessionId(null);
    setIsTemporarySession(false);
  };

  // Handle session created after first message (with AI-generated title)
  const handleSessionCreated = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setIsTemporarySession(false);
    // Invalidate queries to refresh the session list
    queryClient.invalidateQueries({
      queryKey: chatSessionKeys.byVideo(videoUuid || ""),
    });
  };

  useEffect(() => {
    if (transcript) {
      setActiveTab("ai");
      setTimeout(() => {
        aiTabRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [transcript]);

  // Clear AI summary when transcript changes
  useEffect(() => {
    setAiSummary("");
  }, [transcript]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Main AI Panel with Animated Glow Border */}
      <div className="relative flex-1 glass-strong rounded-3xl border-white/10 overflow-hidden ai-glow-border flex flex-col">
        {/* Header with AI Badge */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center glow-accent">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">AI Insights</h2>
              <p className="text-xs text-muted-foreground">Powered by advanced analysis</p>
            </div>
          </div>
          
          {/* Model Selector */}
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="w-[140px] h-8 text-xs bg-white/5 border-white/10 hover:border-blue-500/50 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-strong border-white/10">
              {models.map((m) => (
                <SelectItem key={m.id} value={m.id} className="text-xs">
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Animated Tab Navigation */}
        <div className="px-4 pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3 bg-transparent p-0 gap-1">
              <TabsTrigger
                value="raw"
                className="tab-glow py-3 rounded-xl text-sm font-medium transition-all duration-300 data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 hover:text-white hover:bg-white/5 flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Transcript
              </TabsTrigger>
              <TabsTrigger
                ref={aiTabRef}
                value="ai"
                className="tab-glow py-3 rounded-xl text-sm font-medium transition-all duration-300 data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 hover:text-white hover:bg-white/5 flex items-center justify-center gap-2"
              >
                <Brain className="w-4 h-4" />
                Summary
              </TabsTrigger>
              <TabsTrigger
                value="chat"
                className="tab-glow py-3 rounded-xl text-sm font-medium transition-all duration-300 data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 hover:text-white hover:bg-white/5 flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Chat
              </TabsTrigger>
            </TabsList>

            {/* Tab Content Areas */}
            <div className="pt-4">
              {/* Transcript Tab */}
              <TabsContent value="raw" className="mt-0 h-full">
                <div className="h-full flex flex-col glass rounded-2xl border-white/5 overflow-hidden">
                  {/* Search Bar */}
                  <div className="p-3 border-b border-white/5">
                    {isSearching ? (
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <TextSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
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
                            className="pl-10 bg-white/5 border-white/10 focus:border-blue-500/50 rounded-xl"
                            autoFocus
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleNextMatch}
                          disabled={!searchQuery || searchResults.length === 0}
                          className="h-10 w-10"
                        >
                          <TextSearch className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleClearSearch}
                          className="h-10 w-10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setIsSearching(true)}
                          variant="outline"
                          className="flex-1 border-white/10 hover:bg-white/5 hover:border-blue-500/30 transition-all"
                        >
                          <TextSearch className="h-4 w-4 mr-2" />
                          Search Transcript
                        </Button>
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
                          className="flex-1 border-white/10 hover:bg-white/5 hover:border-blue-500/30 transition-all"
                        >
                          {copiedTranscript ? (
                            <>
                              <Check className="h-4 w-4 mr-2 text-green-400" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Transcript Content */}
                  <ScrollArea className="flex-1 h-[400px]">
                    <div className="p-4">
                      <TranscriptText
                        entries={parsedTranscript}
                        videoId={youtubeId || ""}
                        searchQuery={searchQuery}
                        searchResults={searchResults}
                        currentMatchIndex={currentMatchIndex}
                      />
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              {/* AI Summary Tab */}
              <TabsContent value="ai" className="mt-0">
                <div className="h-full flex flex-col glass rounded-2xl border-white/5 overflow-hidden">
                  {/* Summary Header */}
                  {aiSummary && (
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-xs font-medium text-green-400">AI Generated</span>
                      </div>
                      <Button
                        onClick={() => {
                          const summaryText = aiSummary || "No summary available.";
                          navigator.clipboard.writeText(summaryText);
                          setCopiedSummary(true);
                          setTimeout(() => setCopiedSummary(false), 2000);
                        }}
                        variant="ghost"
                        size="sm"
                        disabled={!aiSummary}
                        className="h-8 hover:bg-white/10"
                      >
                        {copiedSummary ? (
                          <>
                            <Check className="h-4 w-4 mr-2 text-green-400" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Summary Content */}
                  <ScrollArea className="flex-1 h-[400px]">
                    <div className="p-4">
                      <AISummaryPanel
                        loadingSummary={loadingSummary}
                        parsedTranscript={parsedTranscript}
                        model={model}
                        setModel={setModel}
                        setLoadingSummary={setLoadingSummary}
                        videoId={videoUuid || ""}
                      />
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              {/* Chat Tab with Session Management */}
              <TabsContent value="chat" className="mt-0">
                <div className="h-[480px]">
                  {showSessionList ? (
                    <ChatSessionsPanel
                      videoId={videoUuid || ""}
                      currentSessionId={currentSessionId}
                      onSessionSelect={handleSessionSelect}
                      onNewSession={handleNewSession}
                    />
                  ) : (
                    <ChatPanel
                      sessionId={currentSessionId}
                      videoId={videoUuid || ""}
                      onBackToSessions={handleBackToSessions}
                      model={model}
                      setModel={setModel}
                      parsedTranscript={parsedTranscript}
                      onSendMessage={handleSendMessage}
                      onSessionCreated={handleSessionCreated}
                      isTemporary={isTemporarySession}
                    />
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
