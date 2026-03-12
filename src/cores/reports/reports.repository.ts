import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from 'src/common/entities/report.entity';
import { ReportStatus } from 'src/common/enums/report-status.enum';

@Injectable()
export class ReportsRepository {
  constructor(
    @InjectRepository(Report) private reportRepository: Repository<Report>
  ) {}

  async createReport(reportData: Partial<Report>): Promise<Report> {
    const report = this.reportRepository.create(reportData);
    return await this.reportRepository.save(report);
  }

  async findReportById(reportId: string): Promise<Report> {
    const report = await this.reportRepository.findOne({ where: { id: reportId } });
    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }
    return report;
  }

  async findAllReports(): Promise<Report[]> {
    return await this.reportRepository.find();
  }

  async findReportsByStatus(status: ReportStatus): Promise<Report[]> {
    return await this.reportRepository.find({ where: { status } });
  }

  async findReportsByLocation(location: string): Promise<Report[]> {
    return await this.reportRepository.find({ where: { location: location as any } });
  }

  async updateReportStatus(reportId: string, status: ReportStatus): Promise<Report> {
    const report = await this.findReportById(reportId);
    report.status = status;
    return await this.reportRepository.save(report);
  }

  async assignReportToNgo(reportId: string, ngoId: string): Promise<Report> {
    const report = await this.findReportById(reportId);
    if (!report.ngo_dashboard_ids) {
      report.ngo_dashboard_ids = [];
    }
    if (!report.ngo_dashboard_ids.includes(ngoId)) {
      report.ngo_dashboard_ids.push(ngoId);
    }
    return await this.reportRepository.save(report);
  }

  async addRejectionReason(reportId: string, reason: string, rejectedBy: string): Promise<Report> {
    const report = await this.findReportById(reportId);
    if (!report.rejection_reasons) {
      report.rejection_reasons = [];
    }
    report.rejection_reasons.push({
      reason,
      rejected_by: rejectedBy,
      rejected_at: new Date(),
    });
    if (!report.rejected_by) {
      report.rejected_by = [];
    }
    if (!report.rejected_by.includes(rejectedBy)) {
      report.rejected_by.push(rejectedBy);
    }
    return await this.reportRepository.save(report);
  }

  async markReportAsProcessing(reportId: string, isProcessing: boolean): Promise<Report> {
    const report = await this.findReportById(reportId);
    report.isProcessing = isProcessing;
    return await this.reportRepository.save(report);
  }

  async deleteReport(reportId: string): Promise<void> {
    await this.reportRepository.delete(reportId);
  }

  async findReportsByNgo(ngoId: string): Promise<Report[]> {
    try {
      // Simpler query without array operators
      const reports = await this.reportRepository
        .createQueryBuilder('report')
        .where('report.ngo_dashboard_ids IS NOT NULL')
        .getMany();
      
      // Filter in JavaScript
      return reports.filter(r => 
        r.ngo_dashboard_ids && r.ngo_dashboard_ids.includes(ngoId)
      );
    } catch (error) {
      console.error('Error in findReportsByNgo:', error);
      throw error;
    }
  }

  async createIncident(reportData: Partial<Report>): Promise<Report> {
    return await this.createReport(reportData);
  }

  async fetchSingleReportById(reportId: string): Promise<Report> {
    return await this.findReportById(reportId);
  }

  async save(report: Report): Promise<Report> {
    return await this.reportRepository.save(report);
  }

  async findAll(): Promise<Report[]> {
    return await this.findAllReports();
  }

  async findReports(userId: string, query: any): Promise<Report[]> {
    const queryBuilder = this.reportRepository.createQueryBuilder('report');
    
    if (query.status) {
      queryBuilder.andWhere('report.status = :status', { status: query.status });
    }
    
    if (query.location) {
      queryBuilder.andWhere('report.location = :location', { location: query.location });
    }
    
    queryBuilder.andWhere(':userId = ANY(report.ngo_dashboard_ids)', { userId });
    
    return await queryBuilder.getMany();
  }

  async countUserAssignments(userId: string): Promise<number> {
    try {
      const count = await this.reportRepository
        .createQueryBuilder('report')
        .where('report.ngo_dashboard_ids @> ARRAY[:userId]::uuid[]', { userId })
        .getCount();
      return count;
    } catch (error) {
      console.error('Error counting user assignments:', error);
      return 0; // Return 0 if query fails
    }
  }
}
