import { Injectable } from '@nestjs/common';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class AuthInstrumentation {
  private readonly scope = 'auth';

  constructor(@InjectPinoLogger(AuthInstrumentation.name) private readonly logger: PinoLogger) {}

  loginSuccess(userId: string, email: string): void {
    this.logger.info({ scope: this.scope, event: 'auth.login_success', userId, email }, 'User logged in');
  }

  loginFailed(email: string, reason: string): void {
    this.logger.warn({ scope: this.scope, event: 'auth.login_failed', email, reason }, 'Login failed');
  }

  registrationSuccess(userId: string, email: string): void {
    this.logger.info({ scope: this.scope, event: 'auth.registration_success', userId, email }, 'User registered');
  }

  registrationFailed(email: string, error: unknown): void {
    this.logger.error({ scope: this.scope, event: 'auth.registration_failed', email, error }, 'Registration failed');
  }

  tokenRefreshed(userId: string): void {
    this.logger.debug({ scope: this.scope, event: 'auth.token_refreshed', userId }, 'Token refreshed');
  }

  unauthorizedAccess(path: string, method: string): void {
    this.logger.warn({ scope: this.scope, event: 'auth.unauthorized', path, method }, 'Unauthorized access attempt');
  }
}
