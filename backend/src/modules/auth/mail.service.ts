import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

/**
 * Sends mail through Gmail with OAuth2 when GMAIL_REFRESH_TOKEN is set, or over
 * plain SMTP (user + password) when only SMTP_HOST is set. With neither (local
 * dev) the message is written to the log instead, so the flow still works end to end.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor(config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    const port = Number(config.get<string>('SMTP_PORT', '587'));
    const user = config.get<string>('SMTP_USER');
    const refreshToken = config.get<string>('GMAIL_REFRESH_TOKEN');
    // || rather than a default: docker-compose passes unset vars as empty strings.
    this.from = config.get<string>('MAIL_FROM') || user || 'no-reply@localhost';
    if (refreshToken) {
      this.transporter = createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user,
          clientId: config.get<string>('GMAIL_CLIENT_ID'),
          clientSecret: config.get<string>('GMAIL_CLIENT_SECRET'),
          refreshToken,
        },
      });
    } else if (host) {
      this.transporter = createTransport({
        host,
        port,
        secure: port === 465,
        auth: user ? { user, pass: config.get<string>('SMTP_PASSWORD') } : undefined,
      });
    } else {
      this.transporter = null;
    }
  }

  async send(to: string, subject: string, text: string, html?: string) {
    if (!this.transporter) {
      this.logger.warn(`Mail not configured - mail to ${to} not sent.\n${subject}\n${text}`);
      return;
    }
    await this.transporter.sendMail({ from: this.from, to, subject, text, html });
  }
}
