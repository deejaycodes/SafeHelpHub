import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ReportsRepository } from '../reports/reports.repository';
import { ReportStatus } from 'src/common/enums/report-status.enum';

@ApiTags('NGO Stats')
@Controller('ngo/stats')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('jwt')
export class NgoStatsController {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  // Helper to create base query
  private getBaseQuery(ngoId: string) {
    return this.reportsRepository
      ['reportRepository'].createQueryBuilder('report')
      .where('report.ngo_dashboard_ids IS NOT NULL')
      .andWhere(':ngoId = ANY(report.ngo_dashboard_ids)', { ngoId });
  }

  @Get()
  @ApiOperation({ summary: 'Get NGO statistics' })
  async getStats(@Req() req) {
    const ngoId = req.user.id;

    // Use database aggregation for counts
    const baseQuery = this.getBaseQuery(ngoId);

    // Get counts by status in parallel
    const [totalCases, activeCases, resolvedCases, pendingCases] = await Promise.all([
      this.getBaseQuery(ngoId).getCount(),
      this.getBaseQuery(ngoId).andWhere('report.status = :status', { status: ReportStatus.ACCEPTED }).getCount(),
      this.getBaseQuery(ngoId).andWhere('report.status = :status', { status: ReportStatus.RESOLVED }).getCount(),
      this.getBaseQuery(ngoId).andWhere('report.status = :status', { status: ReportStatus.SUBMITTED }).getCount(),
    ]);

    // Get time-based counts
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [thisMonth, thisWeek] = await Promise.all([
      this.getBaseQuery(ngoId).andWhere('report.created_at >= :date', { date: firstDayOfMonth }).getCount(),
      this.getBaseQuery(ngoId).andWhere('report.created_at >= :date', { date: weekAgo }).getCount(),
    ]);

    // Only fetch minimal fields for grouping
    const reports = await this.getBaseQuery(ngoId)
      .select(['report.incident_type', 'report.ai_analysis'])
      .getMany();

    const stats = {
      totalCases,
      activeCases,
      resolvedCases,
      pendingCases,
      byType: this.groupByType(reports),
      byUrgency: this.groupByUrgency(reports),
      thisMonth,
      thisWeek,
    };

    return stats;
  }

  private groupByType(reports: any[]) {
    const grouped = {};
    reports.forEach(r => {
      const type = r.incident_type || 'unknown';
      grouped[type] = (grouped[type] || 0) + 1;
    });
    return grouped;
  }

  private groupByUrgency(reports: any[]) {
    const grouped = { critical: 0, high: 0, medium: 0, low: 0 };
    reports.forEach(r => {
      const urgency = r.ai_analysis?.urgency || 'medium';
      grouped[urgency] = (grouped[urgency] || 0) + 1;
    });
    return grouped;
  }

  private countThisMonth(reports: any[]) {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return reports.filter(r => new Date(r.created_at) >= firstDay).length;
  }

  private countThisWeek(reports: any[]) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return reports.filter(r => new Date(r.created_at) >= weekAgo).length;
  }
}
