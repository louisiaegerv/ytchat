import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();

    const headers: Record<string, string> = {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    };

    if (process.env.SITE_URL) {
      headers["HTTP-Referer"] = process.env.SITE_URL;
    }

    if (process.env.SITE_NAME) {
      headers["X-Title"] = process.env.SITE_NAME;
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data.choices[0].message);
  } catch (error) {
    console.error("OpenRouter API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
