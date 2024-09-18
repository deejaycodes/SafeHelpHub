import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class EmailService {
  private transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.titan.email',
      port: 465,
      secure: true,
      auth: {
        user: 'support@sportycredit.com',
        pass: 'avaU#yhcbSm7ht!',
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

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `http://localhost:3000/verify-email?token=${token}`;

    const mailOptions = {
      to: email,
      from: this.configService.get<string>('EMAIL_USER'),
      subject: 'Email Verification',
      html: `
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">Verify Email</a>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${email}: ${error.message}`,
      );
      throw new Error('Could not send verification email');
    }
  }
}
