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
      const ngoId = req.user.id;
      console.log('Getting stats for NGO:', ngoId);

      const allReports = await this.reportsRepository.findReportsByNgo(ngoId);
      console.log('Found reports:', allReports.length);
    
    const stats = {
      totalCases: allReports.length,
      activeCases: allReports.filter(r => r.status === ReportStatus.ACCEPTED).length,
      resolvedCases: allReports.filter(r => r.status === ReportStatus.RESOLVED).length,
      pendingCases: allReports.filter(r => r.status === ReportStatus.SUBMITTED).length,
      byType: this.groupByType(allReports),
      byUrgency: this.groupByUrgency(allReports),
      thisMonth: this.countThisMonth(allReports),
      thisWeek: this.countThisWeek(allReports),
    };

      console.log('Stats calculated successfully');
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
}
