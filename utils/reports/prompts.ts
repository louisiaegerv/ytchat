export const executiveSummaryPrompt = (videoCount: number, transcriptsText: string) => `
You are a professional research analyst. Analyze ${videoCount} video transcripts and create a concise executive summary.

**Task:**
Synthesize the key information across all videos into a structured summary.

**Output Format:**
## Overview
[2-3 sentences describing the overall topic and scope]

## Key Findings
[5-7 bullet points of the most important insights, with citations like [Video Title, HH:MM]]

## Common Themes
[3-5 recurring topics with brief explanations]

## Notable Perspectives
[Any significant disagreements or unique viewpoints]

## Conclusion
[1-2 sentences summarizing the overall takeaway]

**Guidelines:**
- Use neutral, professional language
- Include specific citations with timestamps
- Highlight consensus and disagreements
- Note any gaps in coverage

**Transcripts:**
${transcriptsText}
`;

export const sentimentAnalysisPrompt = (videoCount: number, transcriptsText: string) => `
You are a sentiment analysis expert. Analyze ${videoCount} video transcripts and provide sentiment insights.

**Task:**
Determine the overall sentiment and identify key positive and negative points.

**Output Format (JSON):**
{
  "overall_score": [number between -1.0 and 1.0],
  "overall_label": ["positive" | "neutral" | "negative"],
  "confidence": [number between 0.0 and 1.0],
  "distribution": {
    "positive_segments": [number],
    "neutral_segments": [number],
    "negative_segments": [number]
  },
  "positive_quotes": [
    {
      "text": [exact quote],
      "context": [brief context],
      "intensity": ["high" | "medium" | "low"]
    }
  ],
  "negative_quotes": [
    {
      "text": [exact quote],
      "context": [brief context],
      "intensity": ["high" | "medium" | "low"]
    }
  ],
  "key_themes": [
    {
      "theme": [theme name],
      "sentiment": [number between -1.0 and 1.0],
      "mentions": [number]
    }
  ]
}

**Guidelines:**
- Be objective and balanced
- Include exact quotes with context
- Identify 3-5 key themes
- Rate intensity of sentiment

**Transcripts:**
${transcriptsText}
`;

export const comparisonMatrixPrompt = (videos: {id: string, title: string}[], transcriptsText: string) => `
You are a comparative analyst. Compare ${videos.length} videos side-by-side.

**Videos:**
${videos.map((v, i) => `${i + 1}. ${v.title}`).join('\n')}

**Task:**
Create a detailed comparison matrix analyzing the videos across multiple dimensions.

**Output Format:**
## Comparison Matrix

| Dimension | ${videos.map(v => v.title.substring(0, 20)).join(' | ')} |
|-----------|${videos.map(() => '----------').join('|')}|
| Main Thesis | [for each] | [for each] | ... |
| Key Arguments | [for each] | [for each] | ... |
| Evidence Quality | [for each] | [for each] | ... |
| Perspective | [for each] | [for each] | ... |
| Unique Insights | [for each] | [for each] | ... |

## Similarities
[Common ground across videos]

## Differences
[Key points of divergence]

## Synthesis
[Which video adds what to the overall understanding]

**Transcripts:**
${transcriptsText}
`;

export const customReportPrompt = (
  userPrompt: string, 
  videoCount: number, 
  transcriptsText: string
) => `
You are an AI research assistant. Analyze ${videoCount} video transcripts based on the user's request.

**User Request:**
${userPrompt}

**Context:**
You have access to transcripts from ${videoCount} videos. Use this information to provide a comprehensive response.

**Guidelines:**
- Be thorough but concise
- Cite specific videos and timestamps when referencing information
- Use markdown formatting for readability
- If the request cannot be fully answered with the provided transcripts, note what information is missing

**Transcripts:**
${transcriptsText}
`;
