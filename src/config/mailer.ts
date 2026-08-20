import * as Brevo from '@getbrevo/brevo';
import { env } from '@/config/env.js';

const { BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME } = env;

const isConfigured = Boolean(BREVO_API_KEY);

let apiInstance: Brevo.TransactionalEmailsApi | null = null;

if (isConfigured && BREVO_API_KEY) {
  apiInstance = new Brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, BREVO_API_KEY);
}

const senderEmail = BREVO_SENDER_EMAIL ?? 'no-reply@sch-hub.app';
const senderName = BREVO_SENDER_NAME ?? 'SCH Hub';

const sanitizeLog = (value: string) => value.replace(/[\r\n\t\x00-\x1F\x7F]/g, ' ').trim();

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

export const mailer = {
  async sendMail(to: string, subject: string, html: string, text?: string) {
    if (!apiInstance) {
      const body = text ?? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      console.log('\n' + '─'.repeat(60));
      console.log(`📧 MAIL STUB`);
      console.log(`   To:      ${sanitizeLog(to)}`);
      console.log(`   Subject: ${sanitizeLog(subject)}`);
      console.log(`   Body:    ${sanitizeLog(body)}`);
      console.log('─'.repeat(60) + '\n');
      return;
    }

    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { name: senderName, email: senderEmail };
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;
    if (text) sendSmtpEmail.textContent = text;

    await apiInstance.sendTransacEmail(sendSmtpEmail);
  },

  async sendOTP(to: string, fullName: string, otp: string, type: 'verification' | 'reset') {
    const subject =
      type === 'verification' ? 'Verify your SCH Hub account' : 'Reset your SCH Hub password';

    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#0F766E">SCH Hub</h2>
        <p>Hi ${escapeHtml(fullName)},</p>
        <p>${type === 'verification' ? 'Please verify your email address using the OTP below:' : 'Use the OTP below to reset your password:'}</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#111827;padding:16px 0">${escapeHtml(otp)}</div>
        <p style="color:#6B7280;font-size:14px">This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <p style="color:#6B7280;font-size:12px">If you didn't request this, ignore this email.</p>
      </div>
    `;

    await this.sendMail(to, subject, html, `Your SCH Hub OTP is ${otp}. It expires in 10 minutes.`);
  },

  async sendAnnouncement(to: string, fullName: string, title: string, body: string) {
    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#0F766E">SCH Hub Announcement</h2>
        <p>Hi ${escapeHtml(fullName)},</p>
        <h3 style="color:#111827">${escapeHtml(title)}</h3>
        <p style="line-height:1.6;color:#374151">${escapeHtml(body)}</p>
      </div>
    `;

    await this.sendMail(to, title, html, body);
  },

  async sendEventReminder(
    to: string,
    fullName: string,
    event: { title: string; startDate: Date; venue?: string | null },
  ) {
    const dateStr = event.startDate.toLocaleString('en-NG', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const venueRaw = event.venue ?? '';
    const subject = `Upcoming event: ${event.title}`;
    const text = `${event.title} starts ${dateStr}${venueRaw ? ` at ${venueRaw}` : ''}.`;

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#0F766E">SCH Hub Event Reminder</h2>
        <p>Hi ${escapeHtml(fullName)},</p>
        <h3 style="color:#111827">${escapeHtml(event.title)}</h3>
        <p style="line-height:1.6;color:#374151">${escapeHtml(event.title)} starts ${escapeHtml(dateStr)}${venueRaw ? ` at ${escapeHtml(venueRaw)}` : ''}.</p>
      </div>
    `;

    await this.sendMail(to, subject, html, text);
  },
};
