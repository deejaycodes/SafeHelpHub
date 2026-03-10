import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import HTML_TEMPLATE from 'src/common/utils/template/mail-template';
import FORGOT_PASSWORD_TEMPLATE from 'src/common/utils/template/forgotpassword-emailtemplate';

dotenv.config();

@Injectable()
export class EmailService {
  private transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.email',
      service: 'gmail',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify transporter connection
    this.transporter.verify((error) => {
      if (error) {
        this.logger.error(`Email transporter error: ${error.message}`);
      } else {
        this.logger.log('Email transporter is ready to send messages');
      }
    });
  }

  async sendVerificationEmail(email: string, code: string): Promise<void> {
    const verificationUrl = `${code}`;
    const htmlMessage = HTML_TEMPLATE(verificationUrl);
    const mailOptions = {
      to: email,
      from: this.configService.get<string>('EMAIL_USER'),
      subject: 'Email Verification',
      text:
        'Please click the link below to verify your email address:\n' +
        verificationUrl,
      html: htmlMessage,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.warn(
        `Failed to send verification email to ${email}: ${error.message}. Continuing without email verification.`,
      );
    }
  }

  async sendForgotPasswordEmail(email: string, code) {
    const verificationUrl = `${code}`;
    const htmlMessage = FORGOT_PASSWORD_TEMPLATE(verificationUrl);

    const mailOptions = {
      to: email,
      from: this.configService.get<string>('EMAIL_USER'),
      subject: 'Forgot Password',
      text: `${code}. use the digit code provided to reset your password`,
      html: htmlMessage,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Forgotpassword email sent to ${email}`);
    } catch (error) {
      this.logger.warn(
        `Failed to send forgotpassword email to ${email}: ${error.message}. Continuing without email.`,
      );
    }
  }
}
