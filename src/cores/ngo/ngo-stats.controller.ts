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

  @Get()
  @ApiOperation({ summary: 'Get NGO statistics' })
  async getStats(@Req() req) {
    try {
      const ngoId = req.user.role === 'staff' ? req.user.ngoId : req.user.id;

      const allReports = await this.reportsRepository.findReportsByNgo(ngoId);
    
    const stats = {
      totalCases: allReports.length,
      activeCases: allReports.filter(r => ['under_review', 'active', 'on_hold'].includes(r.status)).length,
      resolvedCases: allReports.filter(r => r.status === ReportStatus.RESOLVED).length,
      pendingCases: allReports.filter(r => r.status === ReportStatus.SUBMITTED).length,
      byStatus: {
        submitted: allReports.filter(r => r.status === ReportStatus.SUBMITTED).length,
        under_review: allReports.filter(r => r.status === ReportStatus.UNDER_REVIEW).length,
        active: allReports.filter(r => r.status === ReportStatus.ACTIVE).length,
        on_hold: allReports.filter(r => r.status === ReportStatus.ON_HOLD).length,
        resolved: allReports.filter(r => r.status === ReportStatus.RESOLVED).length,
        referred: allReports.filter(r => r.status === ReportStatus.REFERRED).length,
        closed: allReports.filter(r => r.status === ReportStatus.CLOSED).length,
      },
      byType: this.groupByType(allReports),
      byUrgency: this.groupByUrgency(allReports),
      thisMonth: this.countThisMonth(allReports),
      thisWeek: this.countThisWeek(allReports),
      avgResponseHours: this.avgResponseTime(allReports),
    };

      return stats;
    } catch (error) {
      console.error('Error in getStats:', error);
      throw error;
    }
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

  private avgResponseTime(reports: any[]): number {
    const responded = reports.filter(r => r.status_history?.length > 1);
    if (responded.length === 0) return 0;
    const total = responded.reduce((sum, r) => {
      const created = new Date(r.status_history[0]?.at || r.created_at).getTime();
      const firstAction = new Date(r.status_history[1]?.at || r.updated_at).getTime();
      return sum + (firstAction - created);
    }, 0);
    return Math.round(total / responded.length / (1000 * 60 * 60)); // hours
  }
}
