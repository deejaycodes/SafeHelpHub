import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateIncidentDto } from '../../common/dtos/reportsDto';
import { Report, ReportDocument } from './schemas/reports.schemas';
import { Model, Types, isValidObjectId } from 'mongoose';
import { ReportStatus } from 'src/common/enums/report-status.enum';

@Injectable()
export class ReportsRepository {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
  ) {}

  async createIncident(createIncidentDto: CreateIncidentDto): Promise<Report> {
    const createdIncident = new this.reportModel(createIncidentDto);
    return await createdIncident.save();
  }

  async fetchSingleReportById(
    reportId: Types.ObjectId | string,
  ): Promise<Report | null> {
    try {
      if (!isValidObjectId(reportId)) {
        throw new BadRequestException(
          'Invalid ID format. Must be a 24-character hex string.',
        );
      }
      const objectId =
        typeof reportId === 'string' ? new Types.ObjectId(reportId) : reportId;

      const report = await this.reportModel.findById(objectId).exec();

      if (!report) {
        throw new NotFoundException(`Report with ID ${objectId} not found`);
      }
      return report;
    } catch (error) {
      throw new NotFoundException(`Error fetching report: ${error.message}`);
    }
  }

  async updateReportFiles(
    reportId: Types.ObjectId | string,
    filePath: string,
  ): Promise<Report> {
    if (!isValidObjectId(reportId)) {
      throw new BadRequestException(
        'Invalid ID format. Must be a 24-character hex string.',
      );
    }
    const objectId =
      typeof reportId === 'string' ? new Types.ObjectId(reportId) : reportId;

    const updatedReport = await this.reportModel
      .findByIdAndUpdate(
        objectId,
        { $push: { files: { file_path: filePath, uploaded_at: new Date() } } },
        { new: true },
      )
      .exec();

    if (!updatedReport) {
      throw new NotFoundException(`report ${reportId} not found`);
    }

    return updatedReport;
  }

  async handleReport(
    report: ReportDocument,
    ngoId: any,
    action: 'accept' | 'reject',
  ): Promise<ReportDocument> {
    if (report.status !== ReportStatus.SUBMITTED) {
      throw new ConflictException(
        'Report cannot be modified in its current state.',
      );
    }

    if (action === 'accept') {
      report.status = ReportStatus.ACCEPTED;

      report.ngo_dashboard_ids = report.ngo_dashboard_ids.filter(
        (id) => id !== ngoId,
      );
    } else if (action === 'reject') {
      report.status = ReportStatus.REJECTED;
    } else {
      throw new BadRequestException('Invalid action specified.');
    }

    return await report.save();
  }
  async save(report: ReportDocument): Promise<ReportDocument> {
    return report.save();
  }

  async findAll(): Promise<ReportDocument[]> {
    const reports = await this.reportModel.find().exec();
    return reports || [];  
  }
}
