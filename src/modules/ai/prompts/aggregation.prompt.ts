export const AGGREGATION_SYSTEM = `You are an academic content aggregator for Nigerian university students.
Merge multiple section summaries into one cohesive study guide.
Be specific and detailed. Never generate generic content.
Always respond with valid JSON only.`;

export const aggregationPrompt = (chunkSummaries: string[]) => `
Merge these specific section summaries from a university study material into one cohesive study guide.

Sections:
"""
${chunkSummaries.map((s, i) => `Section ${i + 1}: ${s}`).join('\n\n')}
"""

Create a unified study guide based ONLY on the content in these sections.

Respond ONLY with this exact JSON:
{
  "finalSummary": "Detailed 4-5 sentence summary covering ALL the specific topics mentioned across sections",
  "combinedKeyPoints": [
    "Specific key point 1",
    "Specific key point 2",
    "Specific key point 3",
    "Specific key point 4",
    "Specific key point 5",
    "Specific key point 6",
    "Specific key point 7",
    "Specific key point 8"
  ],
  "combinedExamTopics": [
    "Specific examinable topic 1",
    "Specific examinable topic 2",
    "Specific examinable topic 3",
    "Specific examinable topic 4",
    "Specific examinable topic 5"
  ],
  "revisionSheet": "Detailed revision notes covering all major concepts, definitions and formulas from the material in 250 words or less"
}`;
