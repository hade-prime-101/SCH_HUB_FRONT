export const EXAM_SYSTEM = `You are an exam prediction expert for Nigerian university courses.
Identify the most likely exam topics based on the study material.
Always respond with valid JSON only.`;

export const examPrompt = (text: string) => `
Analyze this study material and identify likely exam topics.

Text:
"""
${text}
"""

Respond ONLY with this exact JSON:
{
  "likelyExamTopics": ["topic 1", "topic 2", "topic 3", "topic 4", "topic 5"],
  "highPriorityTopics": ["most important topic 1", "most important topic 2"],
  "examTips": ["tip 1", "tip 2", "tip 3"]
}`;
