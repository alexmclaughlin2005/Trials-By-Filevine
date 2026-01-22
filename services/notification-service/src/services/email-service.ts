import { Resend } from 'resend';
import { EmailNotification } from '../types/notification';

export class EmailService {
  private resend: Resend | null;
  private defaultFrom: string;
  private defaultFromName: string;
  private enabled: boolean;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.warn('RESEND_API_KEY not set - email notifications will be disabled');
      this.resend = null;
      this.enabled = false;
    } else {
      this.resend = new Resend(apiKey);
      this.enabled = true;
    }

    this.defaultFrom = process.env.DEFAULT_FROM_EMAIL || 'notifications@trialforge.ai';
    this.defaultFromName = process.env.DEFAULT_FROM_NAME || 'TrialForge AI';
  }

  /**
   * Send an email
   */
  async sendEmail(email: EmailNotification): Promise<{ id: string }> {
    if (!this.enabled || !this.resend) {
      console.warn('Email service is disabled - skipping email send');
      return { id: 'disabled' };
    }

    try {
      const result = await this.resend.emails.send({
        from: email.from
          ? `${email.fromName || this.defaultFromName} <${email.from}>`
          : `${this.defaultFromName} <${this.defaultFrom}>`,
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
        reply_to: email.replyTo,
      });

      return { id: result.data?.id || 'unknown' };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Generate email HTML for notification
   */
  generateNotificationEmail(params: {
    title: string;
    message: string;
    actionUrl?: string;
    actionLabel?: string;
  }): string {
    const { title, message, actionUrl, actionLabel } = params;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }
    h1 {
      color: #1f2937;
      font-size: 24px;
      margin-bottom: 20px;
    }
    .message {
      color: #4b5563;
      font-size: 16px;
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">TrialForge AI</div>
    </div>
    <h1>${title}</h1>
    <div class="message">
      ${message}
    </div>
    ${
      actionUrl && actionLabel
        ? `<div style="text-align: center;">
             <a href="${actionUrl}" class="button">${actionLabel}</a>
           </div>`
        : ''
    }
    <div class="footer">
      <p>This is an automated notification from TrialForge AI.</p>
      <p>If you have questions, please contact your team administrator.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate plain text version of notification email
   */
  generateNotificationText(params: {
    title: string;
    message: string;
    actionUrl?: string;
    actionLabel?: string;
  }): string {
    const { title, message, actionUrl, actionLabel } = params;

    let text = `${title}\n\n${message}\n\n`;

    if (actionUrl && actionLabel) {
      text += `${actionLabel}: ${actionUrl}\n\n`;
    }

    text += `---\nThis is an automated notification from TrialForge AI.\nIf you have questions, please contact your team administrator.`;

    return text;
  }
}
