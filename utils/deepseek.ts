export async function deepseekChat(
  model: "deepseek-reasoner" | "deepseek-chat",
  messages: { role: string; content: string }[]
) {
  try {
    const response = await fetch('/api/deepseek', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, model }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch DeepSeek response');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('DeepSeek API error:', error);
    throw error;
  }
}
