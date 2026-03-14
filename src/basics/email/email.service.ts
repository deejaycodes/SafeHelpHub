import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import HTML_TEMPLATE from 'src/common/utils/template/mail-template';
import FORGOT_PASSWORD_TEMPLATE from 'src/common/utils/template/forgotpassword-emailtemplate';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromEmail = this.configService.get<string>('EMAIL_FROM') || 'onboarding@resend.dev';
    
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not configured. Email functionality will be disabled.');
    } else {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend email service initialized');
    }
  }

  async sendVerificationEmail(email: string, code: string): Promise<void> {
    if (!this.resend) {
      this.logger.warn('Resend not configured. Skipping verification email.');
      return;
    }

    const htmlMessage = HTML_TEMPLATE(code);

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Email Verification - SafeHelpHub',
        html: htmlMessage,
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.warn(
        `Failed to send verification email to ${email}: ${error.message}`,
      );
    }
  }

  async sendForgotPasswordEmail(email: string, code: string): Promise<void> {
    if (!this.resend) {
      this.logger.warn('Resend not configured. Skipping password reset email.');
      return;
    }

    const htmlMessage = FORGOT_PASSWORD_TEMPLATE(code);

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Password Reset - SafeHelpHub',
        html: htmlMessage,
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.warn(
        `Failed to send password reset email to ${email}: ${error.message}`,
      );
    }
  }

  async sendReporterNotification(email: string, reportId: string): Promise<void> {
    if (!this.resend) return;
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Update on your report - SafeHelpHub',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #1a1a1a;">You have a new message</h2>
            <p style="color: #555;">A case worker has responded to your report. Open the app and use your tracking ID to view the message.</p>
            <p style="color: #999; font-size: 13px;">For your safety, no case details are included in this email.</p>
            <p style="color: #999; font-size: 12px;">If you did not submit a report, please ignore this email.</p>
          </div>
        `,
      });
      this.logger.log(`Reporter notification sent to ${email}`);
    } catch (error) {
      this.logger.warn(`Failed to send reporter notification: ${error.message}`);
    }
  }
}
