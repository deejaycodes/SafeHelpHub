import { Injectable } from '@nestjs/common';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class NgoInstrumentation {
  private readonly scope = 'ngo';

  constructor(@InjectPinoLogger(NgoInstrumentation.name) private readonly logger: PinoLogger) {}

  ngoRegistered(ngoId: string, name: string, state: string): void {
    this.logger.info({ scope: this.scope, event: 'ngo.registered', ngoId, name, state }, 'NGO registered');
  }

  ngoAssignedReport(ngoId: string, reportId: string): void {
    this.logger.info({ scope: this.scope, event: 'ngo.assigned_report', ngoId, reportId }, 'NGO assigned to report');
  }

  ngoAcceptedReport(ngoId: string, reportId: string): void {
    this.logger.info({ scope: this.scope, event: 'ngo.accepted_report', ngoId, reportId }, 'NGO accepted report');
  }

  ngoResolvedReport(ngoId: string, reportId: string): void {
    this.logger.info({ scope: this.scope, event: 'ngo.resolved_report', ngoId, reportId }, 'NGO resolved report');
  }

  ngoReferredReport(ngoId: string, reportId: string, reason: string): void {
    this.logger.info({ scope: this.scope, event: 'ngo.referred_report', ngoId, reportId, reason }, 'NGO referred report');
  }
}
