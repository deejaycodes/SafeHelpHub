import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { REPORT_EVENTS } from '../events/event-names';
import { ReportSubmittedEvent, ReportAnalyzedEvent, ReportUrgentEvent } from '../events/event-payloads';

@Injectable()
export class AuditLoggerService {
  constructor(@InjectPinoLogger(AuditLoggerService.name) private readonly logger: PinoLogger) {}

  @OnEvent(REPORT_EVENTS.SUBMITTED)
  logReportSubmitted(payload: ReportSubmittedEvent) {
    this.logger.info({ event: 'report.submitted', reportId: payload.reportId, incidentType: payload.incidentType, location: payload.location }, 'Report submitted');
  }

  @OnEvent(REPORT_EVENTS.ANALYZED)
  logReportAnalyzed(payload: ReportAnalyzedEvent) {
    this.logger.info({ event: 'report.analyzed', reportId: payload.reportId, urgency: payload.urgency, classification: payload.classification, immediateDanger: payload.immediateDanger }, 'Report analyzed');
  }

  @OnEvent(REPORT_EVENTS.URGENT)
  logUrgentReport(payload: ReportUrgentEvent) {
    this.logger.warn({ event: 'report.urgent', reportId: payload.reportId, urgency: payload.urgency, classification: payload.classification, location: payload.location }, 'Urgent report detected');
  }

  @OnEvent(REPORT_EVENTS.ACCEPTED)
  logReportAccepted(payload: { reportId: string; ngoId: string }) {
    this.logger.info({ event: 'report.accepted', reportId: payload.reportId, ngoId: payload.ngoId }, 'Report accepted by NGO');
  }

  @OnEvent(REPORT_EVENTS.RESOLVED)
  logReportResolved(payload: { reportId: string; ngoId: string }) {
    this.logger.info({ event: 'report.resolved', reportId: payload.reportId, ngoId: payload.ngoId }, 'Report resolved');
  }
}
