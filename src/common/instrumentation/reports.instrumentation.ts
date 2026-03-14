import { Injectable } from '@nestjs/common';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class ReportsInstrumentation {
  private readonly scope = 'reports';

  constructor(@InjectPinoLogger(ReportsInstrumentation.name) private readonly logger: PinoLogger) {}

  reportCreated(reportId: string, incidentType: string, location: string): void {
    this.logger.info({ scope: this.scope, event: 'report.created', reportId, incidentType, location }, 'Report created');
  }

  reportCreationFailed(error: unknown): void {
    this.logger.error({ scope: this.scope, event: 'report.creation_failed', error }, 'Report creation failed');
  }

  reportAnalysisStarted(reportId: string): void {
    this.logger.debug({ scope: this.scope, event: 'report.analysis_started', reportId }, 'AI analysis started');
  }

  reportAnalysisCompleted(reportId: string, urgency: string, classification: string, immediateDanger: boolean): void {
    this.logger.info({ scope: this.scope, event: 'report.analysis_completed', reportId, urgency, classification, immediateDanger }, 'AI analysis completed');
  }

  reportAnalysisFailed(reportId: string, error: unknown): void {
    this.logger.error({ scope: this.scope, event: 'report.analysis_failed', reportId, error }, 'AI analysis failed');
  }

  reportNotFound(reportId: string): void {
    this.logger.warn({ scope: this.scope, event: 'report.not_found', reportId }, 'Report not found');
  }

  reportTransitioned(reportId: string, from: string, to: string, by: string): void {
    this.logger.info({ scope: this.scope, event: 'report.transitioned', reportId, from, to, by }, 'Report status transitioned');
  }

  reportTransitionDenied(reportId: string, from: string, attemptedEvent: string): void {
    this.logger.warn({ scope: this.scope, event: 'report.transition_denied', reportId, from, attemptedEvent }, 'Report transition denied');
  }

  urgentReportDetected(reportId: string, urgency: string, location: string): void {
    this.logger.warn({ scope: this.scope, event: 'report.urgent', reportId, urgency, location }, 'Urgent report detected');
  }

  spamReportRejected(reportId: string, reason: string): void {
    this.logger.info({ scope: this.scope, event: 'report.spam_rejected', reportId, reason }, 'Spam report rejected');
  }
}
