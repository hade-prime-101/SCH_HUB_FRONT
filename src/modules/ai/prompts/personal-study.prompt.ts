export const PERSONAL_QUIZ_SYSTEM = `You are a personalised exam question generator for university students.
Generate targeted multiple-choice questions based ONLY on the provided text.
Tailor difficulty to challenge the student but keep questions fair and specific.
Always respond with valid JSON only.`;

export const personalQuizPrompt = (text: string, count: number, focusTopics?: string) => `
Generate ${count} multiple-choice exam questions from this study material.
${focusTopics ? `\nFocus especially on these topics: ${focusTopics}` : ''}

Material:
"""
${text.slice(0, 6000)}
"""

Rules:
- Questions must be directly about facts in the material
- correctAnswer is 0-based index of the correct option
- Provide 4 plausible options per question
- Include a brief explanation referencing the material
- Include a short "topic" label for each question (2–5 words)

Respond ONLY with valid JSON:
[
  {
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0,
    "explanation": "...",
    "topic": "..."
  }
]`;

export const PERSONAL_ASK_SYSTEM = `You are a personal AI tutor for a university student.
Answer questions using the study material provided as context.
If the answer is not in the material, say so clearly but try to help from general knowledge.
Be concise, clear, and encourage the student.
Always respond with valid JSON only.`;

export const personalAskPrompt = (question: string, context: string, history: Array<{ role: string; content: string }>) => {
  const historyText = history.length
    ? `\nConversation so far:\n${history.map((h) => `${h.role === 'USER' ? 'Student' : 'AI'}: ${h.content}`).join('\n')}\n`
    : '';

  return `${historyText}
Study material (use as primary source):
"""
${context.slice(0, 5000)}
"""

Student question: ${question}

Respond ONLY with valid JSON:
{
  "answer": "Your detailed answer here",
  "foundInMaterial": true,
  "followUpSuggestions": ["What else would you like to know?"]
}`;
};
