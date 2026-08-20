/**
 * groq.ts — AI text completions with automatic fallback chain
 *
 * Provider priority (text / chat / completion):
 *   1. Groq          — fast inference, llama-3.3-70b-versatile
 *                      Requires: GROQ_API_KEY
 *   2. OpenRouter    — 300+ models, OpenAI-compatible REST API
 *                      Requires: OPENROUTER_API_KEY
 *                      Default model: meta-llama/llama-3.3-70b-instruct:free
 *                      Override: OPENROUTER_MODEL
 *   3. DeepSeek      — cost-effective, strong reasoning, OpenAI-compatible REST API
 *                      Requires: DEEPSEEK_API_KEY
 *                      Default model: deepseek-chat
 *                      Override: DEEPSEEK_MODEL
 *   4. Dev/test stub — returns a clearly labelled mock JSON response
 *
 * Each provider is tried in order; on failure the next is attempted.
 * If all configured providers fail, the stub is returned so the server
 * never crashes due to a missing or temporarily unavailable AI key.
 *
 * All calls request JSON output (response_format: json_object) for
 * consistency with the existing prompt contracts.
 */

import Groq from 'groq-sdk';
import { env } from '@/config/env.js';

// ── Groq client ───────────────────────────────────────────────────────────

export const groq = env.GROQ_API_KEY
  ? new Groq({ apiKey: env.GROQ_API_KEY })
  : null;

const GROQ_MODEL = 'llama-3.3-70b-versatile';

// ── Model defaults ────────────────────────────────────────────────────────

const OPENROUTER_MODEL = env.OPENROUTER_MODEL ?? 'meta-llama/llama-3.3-70b-instruct:free';
const DEEPSEEK_MODEL   = env.DEEPSEEK_MODEL   ?? 'deepseek-chat';

// ── OpenRouter ────────────────────────────────────────────────────────────

async function openRouterChat(system: string, user: string): Promise<string> {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error('OpenRouter not configured — OPENROUTER_API_KEY is missing');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://sch-hub.app',
      'X-Title':      'SCH Hub',
    },
    body: JSON.stringify({
      model:           OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user',   content: user   },
      ],
      temperature:     0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`OpenRouter request failed (${response.status}): ${errText}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenRouter returned an empty response');
  return content;
}

// ── DeepSeek ──────────────────────────────────────────────────────────────
// DeepSeek exposes an OpenAI-compatible REST API — no extra SDK needed.

async function deepSeekChat(system: string, user: string): Promise<string> {
  if (!env.DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek not configured — DEEPSEEK_API_KEY is missing');
  }

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model:           DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user',   content: user   },
      ],
      temperature:     0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`DeepSeek request failed (${response.status}): ${errText}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('DeepSeek returned an empty response');
  return content;
}

// ── Dev / test stub ───────────────────────────────────────────────────────

function mockResponse(): string {
  return JSON.stringify({
    summary:             'Mock summary — configure GROQ_API_KEY, OPENROUTER_API_KEY, or DEEPSEEK_API_KEY in .env',
    keyPoints:           ['Key point 1', 'Key point 2'],
    examTopics:          ['Topic 1', 'Topic 2'],
    beginnerExplanation: 'Mock explanation — AI not configured',
  });
}

// ── Main export ───────────────────────────────────────────────────────────

/**
 * groqChat — primary AI text-completion entry point used throughout the codebase.
 *
 * Tries each configured provider in order:
 *   Groq → OpenRouter → DeepSeek → mock stub
 *
 * Returns a JSON string matching the prompt contract for the caller.
 * Never throws — falls back to the mock stub if all providers fail.
 */
export const groqChat = async (system: string, user: string): Promise<string> => {
  // ── 1. Groq ───────────────────────────────────────────────────────────────
  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        model:           GROQ_MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user',   content: user   },
        ],
        temperature:     0.3,
        response_format: { type: 'json_object' },
      });
      return completion.choices[0].message.content ?? '{}';
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[ai] Groq failed (${msg}), trying OpenRouter`);
    }
  }

  // ── 2. OpenRouter ─────────────────────────────────────────────────────────
  if (env.OPENROUTER_API_KEY) {
    try {
      return await openRouterChat(system, user);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[ai] OpenRouter failed (${msg}), trying DeepSeek`);
    }
  }

  // ── 3. DeepSeek ───────────────────────────────────────────────────────────
  if (env.DEEPSEEK_API_KEY) {
    try {
      return await deepSeekChat(system, user);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[ai] DeepSeek failed (${msg}), falling back to mock`);
    }
  }

  // ── 4. Dev / test stub ────────────────────────────────────────────────────
  console.log('[ai] No AI provider available — returning mock response');
  return mockResponse();
};
