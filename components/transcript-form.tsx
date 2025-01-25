"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { TranscriptEntry } from "@/app/protected/page"
import { Input } from "./ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "./ui/label"

interface TranscriptFormProps {
  setTranscript: (transcript: TranscriptEntry[]) => void;
  setVideoId: (videoId: string) => void;
  transcript?: TranscriptEntry[];
}

export function TranscriptForm({ setTranscript, setVideoId, transcript }: TranscriptFormProps) {
  const [url, setUrl] = useState("")
  const [lastUrl, setLastUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (url !== lastUrl) {
      setLastUrl("")
    }
  }, [url, lastUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    try {
      const response = await fetch("http://localhost:8000/transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({url}),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch transcript")
      }

      const data = await response.json()
      console.log(`Data received.\ndata: `,data);
      
      setTranscript(data.transcript)
      
      // Extract video ID from YouTube URL
      const videoIdMatch = url.match(/v=([^&]+)/)
      if (videoIdMatch && videoIdMatch[1]) {
        setVideoId(videoIdMatch[1])
      }
    } catch (err) {
      setError("Failed to get transcript. Please check the URL and try again.")
      console.error(err)
    } finally {
      setIsLoading(false)
      setLastUrl(url)
    }
  }

  return (
    <Card className="">
      <CardHeader>
        <CardTitle>YouTube Transcript</CardTitle>
        <CardDescription>
          Get the transcript for any YouTube video
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">YouTube URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
            <Button type="submit" disabled={isLoading || lastUrl == url}>
              {isLoading ? "Loading..." : "Get Transcript"}
            </Button>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}

        </form>
      </CardContent>
    </Card>
  )
}
