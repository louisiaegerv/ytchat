import { NextResponse } from "next/server";
import { parseTranscript } from "@/utils/transcriptUtils";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    // make a local request to another app running on port 8000, DO NOT REMOVE THIS PORT 8000 URL UNLESS YOU ARE MOVING IT SOMEWHERE ELSE, ITS CORRECT
    const response = await fetch("http://localhost:8000/transcript", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch transcript: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const data = await response.json();

    // Parse the transcript if it's a string, otherwise use it as-is
    if (data.transcript && typeof data.transcript === "string") {
      data.transcript = parseTranscript(data.transcript);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in transcript API route:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
