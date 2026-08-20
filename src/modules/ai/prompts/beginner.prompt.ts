export const BEGINNER_SYSTEM = `You are a patient teacher explaining complex university topics to beginners.
Use simple language, analogies and examples a first-year student can understand.
Always respond with valid JSON only.`;

export const beginnerPrompt = (text: string) => `
Explain this study material in the simplest way possible for a beginner student.

Text:
"""
${text}
"""

Respond ONLY with this exact JSON:
{
  "simpleExplanation": "Plain language explanation using simple words",
  "analogy": "A real-world analogy to help understand the concept",
  "keyTerms": [
    { "term": "technical term", "meaning": "simple definition" }
  ],
  "rememberThis": "One sentence the student must never forget"
}`;
