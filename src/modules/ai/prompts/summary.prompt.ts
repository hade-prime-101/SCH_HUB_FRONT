export const SUMMARY_SYSTEM = `You are StudyAI, an expert academic assistant for Nigerian university students.
Your job is to extract and summarize ACTUAL content from study materials.
Never generate generic summaries. Only summarize what is explicitly in the text.
Always respond with valid JSON only. No markdown outside JSON.
Be specific, detailed and exam-focused.`;

export const summaryPrompt = (text: string, chunkNumber: number, totalChunks: number) => `
Analyze this EXACT text (chunk ${chunkNumber} of ${totalChunks}) from a university study material.

Text:
"""
${text}
"""

Extract ONLY what is explicitly stated in the text above. Do NOT make up content.

Respond ONLY with this exact JSON:
{
  "summary": "Specific 2-3 sentence summary of exactly what this section covers",
  "keyPoints": [
    "Specific concept 1 from the text",
    "Specific concept 2 from the text",
    "Specific concept 3 from the text"
  ],
  "examTopics": [
    "Specific examinable topic 1",
    "Specific examinable topic 2"
  ],
  "beginnerExplanation": "Simple plain-language explanation of the main concept using an analogy"
}`;
