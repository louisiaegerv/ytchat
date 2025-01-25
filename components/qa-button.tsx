"use client"

import { Button } from "./ui/button"
import { TranscriptEntry } from "@/app/protected/page"

interface QaButtonProps {
  transcript: TranscriptEntry[]
  model: "deepseek-reasoner" | "deepseek-chat"
}

export function QaButton({ transcript, model }: QaButtonProps) {
  const handleClick = async () => {
    try {
      const response = await fetch("/api/deepseek", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Here is a transcript: ${JSON.stringify(transcript)}. Please provide a summary and answer any questions I have.`
            }
          ],
          model
        })
      })

      if (!response.ok) {
        throw new Error("Failed to start Q&A session")
      }

      const data = await response.json()
      console.log("Q&A response:", data)
    } catch (error) {
      console.error("Q&A error:", error)
    }
  }

  return (
    <Button onClick={handleClick}>
      Start Q&A
    </Button>
  )
}
