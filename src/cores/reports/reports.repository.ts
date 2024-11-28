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
import { NigerianStates } from 'src/common/enums/nigeria-states.enum';
import { IncidentType, IncidentTypeDocument } from 'src/basics/incident/schemas/incident.schema';

@Injectable()
export class ReportsRepository {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    @InjectModel( IncidentType.name) private incidentModel: Model<IncidentTypeDocument>
  ) {}

  async createIncident(createIncidentDto: CreateIncidentDto): Promise<Report> {

    const { incident_type } = createIncidentDto;
    const existingIncidentType = await this.incidentModel.findById(incident_type);
    console.log(existingIncidentType)
    if (!existingIncidentType) {
      throw new NotFoundException(`IncidentType with ID ${incident_type} not found`);
    }

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

  // private generateMockReports(): Report[] {
  //   const mockReports: Report[] = [];
    
  //   const incidentTypes = ['harassment', 'child_abuse', 'sexual_assault', 'FGM', 'trafficking'];
  //   const states = Object.values(NigerianStates); // Assuming NigerianStates is an enum
  //   const statuses = [ReportStatus.SUBMITTED];
    
  //   for (let i = 0; i < 25; i++) {
  //     mockReports.push({
  //       incident_type: incidentTypes[i % incidentTypes.length],
  //       description: `Sample description for incident number ${i + 1}. This is an example of the description.`,
  //       location: states[i % states.length],
  //       contact_info: `contact${i + 1}@example.com`,
  //       files: [
  //         { file_path: `uploads/sample_file_${i + 1}.pdf`, uploaded_at: new Date() },
  //       ],
  //       status: statuses[i % statuses.length],
  //       created_at: new Date(),
  //       updated_at: new Date(),
  //       isProcessing:false,
  //       user_id: null, // Set user_id to null
  //       rejected_by: [],
  //       rejection_reasons: [],
  //     });
  //   }

  //   return mockReports;
  // }

  // async createMockReports(): Promise<Report[]> {
  //   const reports = this.generateMockReports();
  //   return this.reportModel.insertMany(reports);
  // }
}
