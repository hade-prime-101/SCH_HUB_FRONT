export const QUIZ_SYSTEM = `You are an exam question generator for Nigerian university students.
Generate specific multiple-choice questions based ONLY on the provided text content.
Never generate questions about topics not mentioned in the text.
Always respond with valid JSON only.`;

export const quizPrompt = (text: string, count: number = 3) => `
Generate ${count} multiple-choice exam questions based ONLY on this exact text:

"""
${text}
"""

Rules:
- Questions must be about specific facts, definitions or concepts IN the text
- Do NOT ask about topics not mentioned in the text
- correctAnswer is the index (0-3) of the correct option
- Make all 4 options plausible but only one correct
- Include a clear explanation

Respond ONLY with this exact JSON array:
[
  {
    "question": "Specific question about content in the text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Why this answer is correct based on the text"
  }
]`;
