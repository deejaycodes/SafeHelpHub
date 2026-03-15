import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { REPORT_EVENTS, NOTIFICATION_EVENTS } from 'src/common/events/event-names';
import { ReportAnalyzedEvent } from 'src/common/events/event-payloads';
import { ReportsRepository } from '../reports/reports.repository';
import { UsersRepository } from 'src/basics/users/users.repository';

@Injectable()
export class AssignmentService {
  private readonly logger = new Logger(AssignmentService.name);

  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Auto-assign report to top 3 matching NGOs after AI analysis
   */
  @OnEvent(REPORT_EVENTS.ANALYZED)
  async autoAssignReport(payload: ReportAnalyzedEvent) {
    this.logger.log(`Auto-assigning report ${payload.reportId}`);

    try {
      const report = await this.reportsRepository.fetchSingleReportById(payload.reportId);
      
      if (!report) {
        this.logger.error(`Report ${payload.reportId} not found`);
        return;
      }

      // Find eligible NGOs
      const eligibleNgos = await this.findEligibleNgos(report);

      if (eligibleNgos.length === 0) {
        this.logger.warn(`No eligible NGOs found for report ${payload.reportId}`);
        return;
      }

      // Assign to top 3 NGOs
      const topNgos = eligibleNgos.slice(0, 3);
      report.ngo_dashboard_ids = topNgos.map(ngo => ngo.id);

      await this.reportsRepository.save(report);

      this.logger.log(`Report ${payload.reportId} assigned to ${topNgos.length} NGOs`);

      // Notify assigned NGOs
      for (const ngo of topNgos) {
        this.eventEmitter.emit(NOTIFICATION_EVENTS.NGO_ALERT, {
          ngoId: ngo.id,
          reportId: report.id,
          urgency: payload.urgency,
          classification: payload.classification,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to auto-assign report ${payload.reportId}: ${error.message}`);
    }
  }

  /**
   * Find and score eligible NGOs
   */
  private async findEligibleNgos(report: any) {
    // Get all NGOs
    const ngos = await this.usersRepository.findAllNgos();

    if (ngos.length === 0) {
      return [];
    }

    // Score each NGO
    const scoredNgos = ngos.map(ngo => ({
      ...ngo,
      score: this.calculateScore(ngo, report),
    }));

    // Sort by score (highest first)
    return scoredNgos
      .filter(ngo => ngo.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate NGO match score
   */
  private calculateScore(ngo: any, report: any): number {
    let score = 0;

    // Base score for all NGOs
    score += 10;

    // Location match (40 points) — compare address text
    const ngoAddr = (ngo.primary_location?.address || ngo.primary_location?.state || '').toLowerCase();
    const reportLoc = (report.location || '').toLowerCase();
    if (ngoAddr && reportLoc) {
      // Exact state/city match
      if (ngoAddr.includes(reportLoc) || reportLoc.includes(ngoAddr)) {
        score += 40;
      } else {
        // Partial match — check if any word overlaps (e.g. "Lagos" in both)
        const ngoWords = ngoAddr.split(/[\s,]+/).filter((w: string) => w.length > 3);
        const reportWords = reportLoc.split(/[\s,]+/).filter((w: string) => w.length > 3);
        if (ngoWords.some((w: string) => reportWords.includes(w))) {
          score += 25;
        }
      }
    }

    // Specialization match (30 points) — use incident_types_supported
    if (ngo.incident_types_supported?.length) {
      const reportType = (report.incident_type || '').toLowerCase();
      const match = ngo.incident_types_supported.some(
        (s: string) => s.toLowerCase() === reportType || reportType.includes(s.toLowerCase())
      );
      if (match) score += 30;
    }

    // Low workload bonus (20 points)
    const activeReports = ngo.acceptReportsCount || 0;
    if (activeReports < 5) {
      score += 20;
    } else if (activeReports < 10) {
      score += 10;
    }

    // Success rate bonus (10 points)
    const resolvedCount = ngo.resolvedReportsCount || 0;
    const acceptedCount = ngo.acceptReportsCount || 1;
    const successRate = resolvedCount / acceptedCount;
    score += Math.floor(successRate * 10);

    return score;
  }
}
