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
import { models } from "@/utils/openrouter";
import type { ChatMessage } from "@/types/transcript";
import type { TranscriptEntry } from "@/utils/transcriptUtils";
interface ChatPanelProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  model: string;
  setModel: (m: string) => void;
  parsedTranscript: TranscriptEntry[];
  onSendMessage: (input: string) => Promise<void>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
}

export function ChatPanel({
  messages,
  setMessages,
  model,
  setModel,
  parsedTranscript,
  onSendMessage,
  input,
  setInput,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <>
      <div
        className="flex-1 overflow-y-auto p-3"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="flex flex-col gap-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-blue-500 text-primary-white"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="flex items-center gap-4 p-3">
        <Select value={model} onValueChange={setModel}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {models.map((modelOption) => (
              <SelectItem key={modelOption.id} value={modelOption.id}>
                {modelOption.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1"
          onKeyDown={async (e) => {
            if (e.key === "Enter") {
              await onSendMessage(input);
              setInput("");
            }
          }}
        />
        <Button
          disabled={!input}
          onClick={async () => {
            await onSendMessage(input);
            setInput("");
          }}
        >
          Send
        </Button>
      </div>
    </>
  );
}
