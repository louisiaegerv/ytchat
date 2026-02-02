"use client";

import { useState } from "react";
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Edit2, 
  Check, 
  X,
  Clock,
  MoreVertical,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatCompactDate } from "@/lib/utils";
import type { ChatSession } from "@/types/chat";
import {
  useChatSessionsQuery,
  useUpdateChatSessionMutation,
  useDeleteChatSessionMutation,
} from "@/hooks/queries/useChatSessionsQuery";

interface ChatSessionsPanelProps {
  videoId: string;
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string | null, isTemporary?: boolean) => void;
  onNewSession: () => void;
}

export function ChatSessionsPanel({
  videoId,
  currentSessionId,
  onSessionSelect,
  onNewSession,
}: ChatSessionsPanelProps) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const { data: sessions, isLoading } = useChatSessionsQuery(videoId);
  const updateSession = useUpdateChatSessionMutation();
  const deleteSession = useDeleteChatSessionMutation();

  const handleUpdateTitle = async (sessionId: string) => {
    if (!editTitle.trim()) return;
    
    try {
      await updateSession.mutateAsync({
        sessionId,
        title: editTitle.trim(),
        videoId,
      });
      setEditingSessionId(null);
      setEditTitle("");
    } catch (error) {
      console.error("Failed to update session:", error);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession.mutateAsync({ sessionId, videoId });
      if (currentSessionId === sessionId) {
        onSessionSelect(null);
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  const startEditing = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const cancelEditing = () => {
    setEditingSessionId(null);
    setEditTitle("");
  };

  return (
    <div className="h-full flex flex-col glass rounded-2xl border-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Chat Sessions</h3>
            <p className="text-xs text-muted-foreground">
              {sessions?.length || 0} conversation{sessions?.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={onNewSession}
          className="h-8 bg-blue-600 hover:bg-blue-500"
        >
          <Plus className="w-4 h-4 mr-1" />
          New
        </Button>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-400">
              Loading sessions...
            </div>
          ) : sessions?.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center mx-auto mb-3 border border-violet-500/20">
                <Sparkles className="w-6 h-6 text-violet-400" />
              </div>
              <p className="text-sm text-gray-300 font-medium mb-1">Start a conversation</p>
              <p className="text-xs text-gray-500 mb-4">
                Ask anything about this video
              </p>
              <Button
                size="sm"
                onClick={onNewSession}
                className="bg-blue-600 hover:bg-blue-500"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Chat
              </Button>
            </div>
          ) : (
            sessions?.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
                  currentSessionId === session.id
                    ? "bg-blue-500/10 border border-blue-500/30"
                    : "hover:bg-white/5 border border-transparent"
                )}
                onClick={() => onSessionSelect(session.id)}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    currentSessionId === session.id
                      ? "bg-blue-500/20"
                      : "bg-white/5"
                  )}
                >
                  <MessageSquare
                    className={cn(
                      "w-4 h-4",
                      currentSessionId === session.id
                        ? "text-blue-400"
                        : "text-gray-400"
                    )}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {editingSessionId === session.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdateTitle(session.id);
                          if (e.key === "Escape") cancelEditing();
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="h-7 text-sm bg-white/5 border-white/10"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-green-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateTitle(session.id);
                        }}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-gray-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelEditing();
                        }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h4
                        className={cn(
                          "text-sm font-medium truncate",
                          currentSessionId === session.id
                            ? "text-white"
                            : "text-gray-300"
                        )}
                      >
                        {session.title}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>
                          {formatCompactDate(new Date(session.updated_at))}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                {editingSessionId !== session.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="glass-strong border-white/10"
                    >
                      <DropdownMenuItem
                        onClick={(e) => startEditing(session, e)}
                        className="text-sm"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                        className="text-sm text-red-400 focus:text-red-400"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
