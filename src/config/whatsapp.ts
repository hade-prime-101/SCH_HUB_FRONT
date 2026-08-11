/**
 * whatsapp.ts — WhatsApp broadcast provider
 *
 * Supported providers (set WHATSAPP_PROVIDER in env):
 *   fonnte  — open-source friendly, self-managed WA device via fonnte.com
 *             Requires: FONNTE_TOKEN
 *   twilio  — Twilio WhatsApp sandbox / business API
 *             Requires: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
 *   wati    — WATI SaaS platform
 *             Requires: WATI_API_URL, WATI_API_TOKEN
 *
 * If WHATSAPP_PROVIDER is unset, messages are printed to console (dev stub).
 *
 * Fonnte API reference: https://docs.fonnte.com
 *   POST https://api.fonnte.com/send
 *   Headers: Authorization: <token>
 *   Body (multipart/form-data or application/x-www-form-urlencoded):
 *     target  — phone number with country code, e.g. 234XXXXXXXXXX
 *     message — plain text body
 */

import { env } from './env.js';

// ── Types ─────────────────────────────────────────────────────────────────

type WhatsAppMessage = {
  to: string;
  body: string;
};

type SendResult = {
  sent: boolean;
  provider: 'fonnte' | 'twilio' | 'wati' | 'dev';
};

// ── Helpers ───────────────────────────────────────────────────────────────

function normalizeWhatsAppNumber(phone: string): string {
  return phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;
}

function sanitizeLog(value: string): string {
  return value.replace(/[\r\n\t\x00-\x1F\x7F]/g, ' ').trim();
}

// ── Providers ─────────────────────────────────────────────────────────────

/**
 * Fonnte — open-source friendly WA gateway.
 *
 * You connect your own WhatsApp number (or a cheap Android device) to fonnte.com
 * via QR scan, then use the API token generated in the dashboard.
 * No per-message fee beyond the Fonnte plan cost.
 *
 * Fonnte expects the target as a plain phone number with country code.
 * Strips any existing "whatsapp:" prefix if present.
 */
async function sendViaFonnte({ to, body }: WhatsAppMessage): Promise<SendResult> {
  if (!env.FONNTE_TOKEN) {
    console.warn('[whatsapp] Fonnte selected but FONNTE_TOKEN is not set.');
    return { sent: false, provider: 'fonnte' };
  }

  // Fonnte expects bare number — strip whatsapp: prefix if caller added it
  const target = to.replace(/^whatsapp:/i, '');

  const params = new URLSearchParams({ target, message: body });

  const response = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: {
      Authorization: env.FONNTE_TOKEN,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    console.warn(`[whatsapp:fonnte] Send failed (${response.status}): ${sanitizeLog(errText)}`);
    return { sent: false, provider: 'fonnte' };
  }

  // Fonnte returns { status: true/false, ... }
  const json = await response.json().catch(() => ({ status: false })) as { status?: boolean };
  if (!json.status) {
    console.warn('[whatsapp:fonnte] API returned status false');
    return { sent: false, provider: 'fonnte' };
  }

  return { sent: true, provider: 'fonnte' };
}

async function sendViaTwilio({ to, body }: WhatsAppMessage): Promise<SendResult> {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_WHATSAPP_FROM) {
    console.warn('[whatsapp] Twilio selected but not fully configured.');
    return { sent: false, provider: 'twilio' };
  }

  const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');
  const params = new URLSearchParams({
    From: normalizeWhatsAppNumber(env.TWILIO_WHATSAPP_FROM),
    To:   normalizeWhatsAppNumber(to),
    Body: body,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    },
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    console.warn(`[whatsapp:twilio] Send failed (${response.status}): ${sanitizeLog(errText)}`);
    return { sent: false, provider: 'twilio' };
  }

  return { sent: true, provider: 'twilio' };
}

async function sendViaWati({ to, body }: WhatsAppMessage): Promise<SendResult> {
  if (!env.WATI_API_URL || !env.WATI_API_TOKEN) {
    console.warn('[whatsapp] WATI selected but not fully configured.');
    return { sent: false, provider: 'wati' };
  }

  const response = await fetch(
    `${env.WATI_API_URL.replace(/\/$/, '')}/api/v1/sendSessionMessage/${encodeURIComponent(to)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.WATI_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messageText: body }),
    },
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    console.warn(`[whatsapp:wati] Send failed (${response.status}): ${sanitizeLog(errText)}`);
    return { sent: false, provider: 'wati' };
  }

  return { sent: true, provider: 'wati' };
}

// ── Public API ────────────────────────────────────────────────────────────

export const whatsapp = {
  async sendMessage(msg: WhatsAppMessage): Promise<SendResult> {
    switch (env.WHATSAPP_PROVIDER) {
      case 'fonnte':
        return sendViaFonnte(msg);
      case 'twilio':
        return sendViaTwilio(msg);
      case 'wati':
        return sendViaWati(msg);
      default:
        // Dev stub — print to console so local development doesn't need any config
        console.log(
          `[whatsapp:dev] → ${sanitizeLog(msg.to)}: ${sanitizeLog(msg.body)}`,
        );
        return { sent: false, provider: 'dev' };
    }
  },
};
