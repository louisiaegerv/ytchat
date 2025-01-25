"use client"

import { TranscriptForm } from "@/components/transcript-form"
import { useState } from "react"
import { TranscriptDisplay } from "@/components/transcript-display"

export interface TranscriptEntry {
  start: number
  text: string
}

function parseTranscript(rawTranscript: string): TranscriptEntry[] {
  if (!rawTranscript) return []
  
  return rawTranscript.split('\n').map(line => {
    const match = line.match(/^\[(\d+\.\d+)\] (.*)$/)
    if (!match) return null
    
    return {
      start: parseFloat(match[1]),
      text: match[2].trim()
    }
  }).filter(Boolean) as TranscriptEntry[]
}

export default function ProtectedPage() {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [videoId, setVideoId] = useState('')

  return (
    <div className="max-w-5xl w-full mx-auto px-4 sm:px-6">
        <div className={`${transcript.length > 0 ? 'md:grid md:grid-cols-2' : 'mx-auto'} w-full gap-6 flex flex-col md:flex-row md:space-y-0`}>
          <TranscriptForm 
            setTranscript={setTranscript}
            setVideoId={setVideoId}
            transcript={transcript}
          />
          
          {transcript.length > 0 && (
          <TranscriptDisplay 
            transcript={transcript}
            videoId={videoId}
          />
          )}
      </div>
    </div>
  )
}
