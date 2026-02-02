import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import type { ChatSession, ChatMessage } from "@/types/chat";

const supabase = createClient();

// Query keys
export const chatSessionKeys = {
  all: ["chat-sessions"] as const,
  byVideo: (videoId: string) => [...chatSessionKeys.all, "video", videoId] as const,
  byId: (sessionId: string) => [...chatSessionKeys.all, "session", sessionId] as const,
  messages: (sessionId: string) => [...chatSessionKeys.all, "messages", sessionId] as const,
};

// Fetch chat sessions for a video
export function useChatSessionsQuery(videoId: string) {
  return useQuery({
    queryKey: chatSessionKeys.byVideo(videoId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("video_id", videoId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as ChatSession[];
    },
    enabled: !!videoId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Fetch messages for a session
export function useChatMessagesQuery(sessionId: string | null) {
  return useQuery({
    queryKey: chatSessionKeys.messages(sessionId || ""),
    queryFn: async () => {
      if (!sessionId) return [];
      
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .eq("session_id", sessionId)
        .order("timestamp", { ascending: true });

      if (error) throw error;
      
      // Transform to ChatMessage format
      // message field = user message, response field = AI response
      return (data || []).flatMap((chat: any, index: number): ChatMessage[] => {
        const messages: ChatMessage[] = [];
        if (chat.message) {
          messages.push({
            id: `${chat.id}-user`,
            session_id: chat.session_id,
            role: "user",
            content: chat.message,
            created_at: chat.timestamp || chat.created_at,
          });
        }
        if (chat.response) {
          messages.push({
            id: `${chat.id}-assistant`,
            session_id: chat.session_id,
            role: "assistant",
            content: chat.response,
            created_at: chat.timestamp || chat.created_at,
          });
        }
        return messages;
      });
    },
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Create a new chat session (now typically after first message)
export function useCreateChatSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      videoId,
      title,
    }: {
      videoId: string;
      title: string;
    }) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase
        .from("chat_sessions")
        .insert({
          video_id: videoId,
          user_id: userData.user.id,
          title,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ChatSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: chatSessionKeys.byVideo(data.video_id),
      });
    },
  });
}

// Create session and save first message + generate title
export function useCreateSessionWithFirstMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      videoId,
      title,
      userMessage,
      aiResponse,
    }: {
      videoId: string;
      title: string;
      userMessage: string;
      aiResponse: string;
    }) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        throw new Error("Not authenticated");
      }

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

      // Save first message pair (no role column - message field = user, response field = AI)
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
          response: aiResponse,
        },
      ]);

      if (chatError) throw chatError;

      return session as ChatSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: chatSessionKeys.byVideo(data.video_id),
      });
      queryClient.invalidateQueries({
        queryKey: chatSessionKeys.messages(data.id),
      });
    },
  });
}

// Update chat session title
export function useUpdateChatSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      title,
      videoId,
    }: {
      sessionId: string;
      title: string;
      videoId: string;
    }) => {
      const { data, error } = await supabase
        .from("chat_sessions")
        .update({ title })
        .eq("id", sessionId)
        .select()
        .single();

      if (error) throw error;
      return data as ChatSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: chatSessionKeys.byVideo(data.video_id),
      });
      queryClient.invalidateQueries({
        queryKey: chatSessionKeys.byId(data.id),
      });
    },
  });
}

// Delete chat session
export function useDeleteChatSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      videoId,
    }: {
      sessionId: string;
      videoId: string;
    }) => {
      const { error } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", sessionId);

      if (error) throw error;
      return { sessionId, videoId };
    },
    onSuccess: ({ videoId }) => {
      queryClient.invalidateQueries({
        queryKey: chatSessionKeys.byVideo(videoId),
      });
    },
  });
}

// Save a chat message
export function useSaveChatMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      videoId,
      message,
      response,
    }: {
      sessionId: string;
      videoId: string;
      message: string;
      response: string;
    }) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        throw new Error("Not authenticated");
      }

      // Insert both user message and assistant response
      const { error } = await supabase.from("chats").insert([
        {
          session_id: sessionId,
          video_id: videoId,
          user_id: userData.user.id,
          message: message,
          response: null,
        },
        {
          session_id: sessionId,
          video_id: videoId,
          user_id: userData.user.id,
          message: null,
          response: response,
        },
      ]);

      if (error) throw error;
      
      // Update session's updated_at
      await supabase
        .from("chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId);

      return { sessionId };
    },
    onSuccess: ({ sessionId }) => {
      queryClient.invalidateQueries({
        queryKey: chatSessionKeys.messages(sessionId),
      });
      // Also invalidate the sessions list to update the "last updated" time
      queryClient.invalidateQueries({
        queryKey: chatSessionKeys.all,
      });
    },
  });
}
