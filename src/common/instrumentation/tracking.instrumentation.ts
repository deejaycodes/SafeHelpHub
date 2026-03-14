import { Injectable } from '@nestjs/common';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class TrackingInstrumentation {
  private readonly scope = 'tracking';

  constructor(@InjectPinoLogger(TrackingInstrumentation.name) private readonly logger: PinoLogger) {}

  reportLookedUp(reportId: string): void {
    this.logger.info({ scope: this.scope, event: 'tracking.lookup', reportId }, 'Report tracked');
  }

  reportLookupNotFound(reportId: string): void {
    this.logger.debug({ scope: this.scope, event: 'tracking.lookup_not_found', reportId }, 'Tracking lookup not found');
  }

  reporterMessageSent(reportId: string): void {
    this.logger.info({ scope: this.scope, event: 'tracking.reporter_message', reportId }, 'Reporter sent message');
  }

  caseworkerReplied(reportId: string, ngoId: string): void {
    this.logger.info({ scope: this.scope, event: 'tracking.caseworker_reply', reportId, ngoId }, 'Caseworker replied to reporter');
  }
}
