import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();
    
    const response = await openai.chat.completions.create({
      messages,
      model,
    });

    return NextResponse.json(response.choices[0].message);
  } catch (error) {
    console.error('DeepSeek API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
