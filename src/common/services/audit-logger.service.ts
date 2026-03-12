import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { REPORT_EVENTS } from '../events/event-names';
import { ReportSubmittedEvent, ReportAnalyzedEvent, ReportUrgentEvent } from '../events/event-payloads';

@Injectable()
export class AuditLoggerService {
  private readonly logger = new Logger('AUDIT');

  @OnEvent(REPORT_EVENTS.SUBMITTED)
  logReportSubmitted(payload: ReportSubmittedEvent) {
    this.logger.log(`[SUBMITTED] Report ${payload.reportId} | Type: ${payload.incidentType} | Location: ${payload.location}`);
  }

  @OnEvent(REPORT_EVENTS.ANALYZED)
  logReportAnalyzed(payload: ReportAnalyzedEvent) {
    this.logger.log(`[ANALYZED] Report ${payload.reportId} | Urgency: ${payload.urgency} | Classification: ${payload.classification} | Danger: ${payload.immediateDanger}`);
  }

  @OnEvent(REPORT_EVENTS.URGENT)
  logUrgentReport(payload: ReportUrgentEvent) {
    this.logger.warn(`[URGENT] Report ${payload.reportId} | Urgency: ${payload.urgency} | Classification: ${payload.classification} | Location: ${payload.location}`);
  }

  @OnEvent(REPORT_EVENTS.ACCEPTED)
  logReportAccepted(payload: { reportId: string; ngoId: string }) {
    this.logger.log(`[ACCEPTED] Report ${payload.reportId} | NGO: ${payload.ngoId}`);
  }

  @OnEvent(REPORT_EVENTS.RESOLVED)
  logReportResolved(payload: { reportId: string; ngoId: string }) {
    this.logger.log(`[RESOLVED] Report ${payload.reportId} | NGO: ${payload.ngoId}`);
  }
}
