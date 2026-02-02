import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { models } from "@/utils/openrouter";
import type { ChatMessage } from "@/types/chat";
import type { TranscriptEntry } from "@/utils/transcriptUtils";
import { 
  Bot, 
  MessageSquare, 
  Send, 
  Trash2,
  Sparkles,
  ChevronLeft,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatMessagesQuery, useSaveChatMessageMutation } from "@/hooks/queries/useChatSessionsQuery";
import { generateChatTitle } from "@/utils/titleGenerator";

interface ChatPanelProps {
  sessionId: string | null;
  videoId: string;
  onBackToSessions: () => void;
  model: string;
  setModel: (m: string) => void;
  parsedTranscript: TranscriptEntry[];
  onSendMessage: (input: string, sessionId: string | null) => Promise<string>;
  onSessionCreated?: (sessionId: string) => void;
  isTemporary?: boolean;
}

const suggestedQuestions = [
  "What are the main points?",
  "Summarize in 3 sentences",
  "What action items are mentioned?",
  "Explain the key concepts",
];

export function ChatPanel({
  sessionId,
  videoId,
  onBackToSessions,
  model,
  setModel,
  parsedTranscript,
  onSendMessage,
  onSessionCreated,
  isTemporary = false,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages from database (only for saved sessions)
  const { data: dbMessages, isLoading: isLoadingMessages } = useChatMessagesQuery(
    isTemporary ? null : sessionId
  );
  const saveMessage = useSaveChatMessageMutation();

  // Use local messages for temporary sessions, database messages for saved sessions
  const messages = isTemporary ? localMessages : (dbMessages || []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Clear local messages when starting a new temporary session
  useEffect(() => {
    if (isTemporary) {
      setLocalMessages([]);
    }
  }, [isTemporary, sessionId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // Add user message immediately to UI
    const userMsg: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    
    if (isTemporary) {
      setLocalMessages(prev => [...prev, userMsg]);
    }

    try {
      // Get AI response
      const response = await onSendMessage(userMessage, isTemporary ? null : sessionId);
      
      // Add AI response to UI
      const aiMsg: ChatMessage = {
        id: `temp-assistant-${Date.now()}`,
        role: "assistant",
        content: response,
        created_at: new Date().toISOString(),
      };

      if (isTemporary) {
        setLocalMessages(prev => [...prev, aiMsg]);
        
        // Generate title based on first exchange
        setIsGeneratingTitle(true);
        try {
          const title = await generateChatTitle(userMessage, response);
          
          // Create session with generated title and messages
          const { createClient } = await import("@/utils/supabase/client");
          const supabase = createClient();
          const { data: userData } = await supabase.auth.getUser();
          
          if (!userData?.user) throw new Error("Not authenticated");
          
          // Create session
          const { data: session, error: sessionError } = await supabase
            .from("chat_sessions")
            .insert({
              video_id: videoId,
              user_id: userData.user.id,
              title,
            })
            .select()
            .single();
          
          if (sessionError) throw sessionError;
          
          // Save messages to the new session
          const { error: chatError } = await supabase.from("chats").insert([
            {
              session_id: session.id,
              video_id: videoId,
              user_id: userData.user.id,
              message: userMessage,
              response: null,
            },
            {
              session_id: session.id,
              video_id: videoId,
              user_id: userData.user.id,
              message: null,
              response: response,
            },
          ]);
          
          if (chatError) throw chatError;
          
          // Notify parent about the new session
          if (onSessionCreated) {
            onSessionCreated(session.id);
          }
        } catch (error: any) {
          console.error("Failed to create session:", {
            message: error?.message,
            details: error?.details,
            hint: error?.hint,
            code: error?.code,
            error: error,
          });
          // Still create the session even if title generation failed
          try {
            const { createClient } = await import("@/utils/supabase/client");
            const supabase = createClient();
            const { data: userData } = await supabase.auth.getUser();
            
            if (!userData?.user) throw new Error("Not authenticated");
            
            const { data: session, error: sessionError } = await supabase
              .from("chat_sessions")
              .insert({
                video_id: videoId,
                user_id: userData.user.id,
                title: userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : ""),
              })
              .select()
              .single();
            
            if (sessionError) throw sessionError;
            
            await supabase.from("chats").insert([
              {
                session_id: session.id,
                video_id: videoId,
                user_id: userData.user.id,
                message: userMessage,
                response: null,
              },
              {
                session_id: session.id,
                video_id: videoId,
                user_id: userData.user.id,
                message: null,
                response: response,
              },
            ]);
            
            if (onSessionCreated) {
              onSessionCreated(session.id);
            }
          } catch (fallbackError: any) {
            console.error("Fallback session creation also failed:", fallbackError);
          }
        } finally {
          setIsGeneratingTitle(false);
        }
      } else if (sessionId && !isTemporary) {
        // Save to existing session
        await saveMessage.mutateAsync({
          sessionId,
          videoId,
          message: userMessage,
          response,
        });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const askSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <div className="h-full flex flex-col glass rounded-2xl border-white/5 overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-white"
            onClick={onBackToSessions}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-card" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {isTemporary ? "New Chat" : "AI Assistant"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isGeneratingTitle ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Generating title...
                </span>
              ) : (
                `${messages.length} message${messages.length !== 1 ? "s" : ""}`
              )}
            </p>
          </div>
        </div>
        <Select value={model} onValueChange={setModel}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-white/5 border-white/10">
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

      {/* Messages Area */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4 min-h-[200px]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-sm text-gray-400 mb-4">Start a new conversation</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => askSuggestedQuestion(q)}
                    className="px-3 py-1.5 text-xs rounded-full bg-white/5 text-gray-400 border border-white/5 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, i) => (
                <div
                  key={message.id || i}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                  style={{
                    animation: `fadeIn 0.3s ease-out ${i * 0.05}s both`,
                  }}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3",
                      message.role === "user"
                        ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md"
                        : "glass-light rounded-bl-md"
                    )}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mr-2 flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="glass-light rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isTemporary ? "Start your first message..." : "Ask about this video..."}
              className="pr-12 bg-white/5 border-white/10 focus:border-blue-500/50 rounded-xl"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isLoading || isGeneratingTitle}
            />
            <Button
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-blue-600 hover:bg-blue-500 rounded-lg"
              disabled={!input.trim() || isLoading || isGeneratingTitle}
              onClick={handleSend}
            >
              {isGeneratingTitle ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">
          {isTemporary 
            ? "Send a message to create this chat session"
            : "AI may produce inaccurate information. Verify important details."}
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
