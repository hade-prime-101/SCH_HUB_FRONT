export const ROADMAP_SYSTEM = `You are an academic study coach for Nigerian university students.
Create a structured, ordered revision roadmap from the provided study material.
Each step must be specific, actionable and based ONLY on content in the material.
Always respond with valid JSON only.`;

export const roadmapPrompt = (
  finalSummary: string,
  keyPoints: string[],
  examTopics: string[],
) => `
Create a revision roadmap for a university student based on this study guide.

Summary:
"""
${finalSummary}
"""

Key Topics: ${keyPoints.slice(0, 10).join(', ')}
Exam Focus Topics: ${examTopics.slice(0, 8).join(', ')}

Generate an ordered study plan. Each step should cover one topic.
Estimate realistic study time in minutes per step (10–60 minutes each).

Respond ONLY with this exact JSON:
{
  "roadmap": [
    {
      "step": 1,
      "topic": "Topic name",
      "description": "What to do — read, memorise, practise problems, etc.",
      "estimatedMinutes": 20
    }
  ],
  "totalEstimatedMinutes": 120,
  "studyTip": "One specific tip for this material"
}`;
