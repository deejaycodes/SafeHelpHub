import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Report, ReportDocument } from './schemas/reports.schemas';
import { Model, Types } from 'mongoose';
import { CreateIncidentDto } from '../../common/dtos/reportsDto';
import { uploadObject } from 'src/common/utils/upload';
import { UsersRepository } from 'src/basics/users/users.repository';
import { ReportsRepository } from './reports.repository';
import { ReportStatus } from 'src/common/enums/report-status.enum';
import { NigerianStates } from 'src/common/enums/nigeria-states.enum';
import { ReportAssignment } from './schemas/report_status.schema';
import { InjectModel } from '@nestjs/mongoose';
import { AIChatbotService } from 'src/basics/chats/ai-chatbot.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly usersRepository: UsersRepository,
    @InjectModel('ReportAssignment') private reportAssignmentRepository: Model<ReportAssignment>,
    private readonly aiChatbotService: AIChatbotService,
  ) {}

  async createIncidentWithFile(
    createIncidentDto: CreateIncidentDto,
    files?: any,
  ): Promise<Report> {
    try {
      const fileUrls: string[] = [];
      if (files && files.length > 0) {
        for (const file of files) {
          const { originalname, buffer } = file;
          const fileType = originalname.slice(originalname.lastIndexOf('.'));
          const documentPath = `file-identification/${Date.now()}-${originalname}`;
  
          const uploadResponse = await uploadObject({
            Bucket: 'sportycredit',
            Key: documentPath,
            Body: buffer,
            ACL: 'public-read',
          });
  
          if (uploadResponse?.$metadata?.httpStatusCode === 200) {
            const fileUrl = `${process.env.STORAGE_URL}/${documentPath}`;
            fileUrls.push(fileUrl);
          } else {
            throw new HttpException(
              {
                status: HttpStatus.BAD_REQUEST,
                error: `Failed to upload file: ${originalname}`,
              },
              HttpStatus.BAD_REQUEST,
            );
          }
        }
      }

      // AI Analysis of the incident report
      const aiAnalysis = await this.aiChatbotService.analyzeIncidentUrgency(
        createIncidentDto.description || createIncidentDto.incident_type,
      );
  
      // Create a new incident with AI analysis
      const newIncident = {
        ...createIncidentDto,
        files: fileUrls,
        ai_analysis: {
          urgency: aiAnalysis.urgency,
          classification: aiAnalysis.classification,
          extracted_entities: aiAnalysis.extractedEntities,
          recommended_actions: aiAnalysis.recommendedActions,
          analyzed_at: new Date(),
        },
        // Set initial status based on AI urgency
        status: ReportStatus.SUBMITTED,
      };
  
      return await this.reportsRepository.createIncident(newIncident);
    } catch (error) {
      throw new BadRequestException(
        `Error creating incident: ${error.message}`,
      );
    }
  }
  
  async fetchReportStatus(reportId: Types.ObjectId | string) {
    const report = await this.reportsRepository.fetchSingleReportById(reportId);

    return report;
  }

  async updateReport(
    reportId: string,
    ngoId: any,
    updateData: Partial<ReportDocument> & { rejection_reason?: string },
  ): Promise<ReportDocument> {
    const report = await this.reportsRepository.fetchSingleReportById(reportId);

    if (!report) {
      throw new NotFoundException('Report not found');
    }
    const user = await this.usersRepository.fetchSingleUserById(ngoId)
    if(!user) {
      throw new UnauthorizedException('You are not authorized')
    }

    if (updateData.status === ReportStatus.ACCEPTED && report.accepted_by?.includes(ngoId)) {
      throw new ConflictException('You have already accepted this report');
    }
  
    if (updateData.status === ReportStatus.REJECTED && report.rejected_by?.includes(ngoId)) {
      throw new ConflictException('You have already rejected this report');
    }
    if (
      updateData.status === ReportStatus.RESOLVED &&
      report.status !== ReportStatus.ACCEPTED
    ) {
      throw new ConflictException(
        'Only reports with status "accepted" can be marked as resolved.',
      );
    } else if (updateData.status === ReportStatus.ACCEPTED) {

      ngoId = ngoId.trim();
    report.rejected_by = report.rejected_by.map(id => id.trim());

    if (report.rejected_by.includes(ngoId)) {
      console.log("Removing ngoId from rejected_by:", ngoId);
      report.rejected_by = report.rejected_by.filter(id => id !== ngoId);
    }
      report.status = ReportStatus.ACCEPTED;
      report.ngo_dashboard_ids = [];
      const ngo = await this.usersRepository.fetchSingleUserById(ngoId);
      ngo.acceptReportsCount = (ngo.acceptReportsCount || 0) + 1;
      ngo.isHandlingReport = true;
      await this.usersRepository.findUserByIdAndUpdate(ngoId, ngo);

      report.accepted_by =report.accepted_by || [];
      report.accepted_by.push(ngoId);
      await this.reportAssignmentRepository.create({
        ngoId: ngoId,
        reportId: reportId,
        status: ReportStatus.ACCEPTED,
        assignedAt: new Date(),
      });
    } else if (updateData.status === ReportStatus.RESOLVED) {

     

      report.status = ReportStatus.RESOLVED;

      const ngo = await this.usersRepository.fetchSingleUserById(ngoId);
      ngo.resolvedReportsCount = (ngo.resolvedReportsCount || 0) + 1;
      await this.usersRepository.findUserByIdAndUpdate(ngoId, ngo);

      await this.reportAssignmentRepository.create({
        ngoId: ngoId,
        reportId: reportId,
        status: ReportStatus.RESOLVED,
        assignedAt: new Date(),
      });

    } else if (updateData.status === ReportStatus.REJECTED) {

      ngoId = ngoId.trim();
      report.accepted_by = report.accepted_by.map(id => id.trim());
  
      if (report.accepted_by.includes(ngoId)) {
        report.accepted_by = report.accepted_by.filter(id => id !== ngoId);
      }
      report.status = ReportStatus.REJECTED;
      const ngo = await this.usersRepository.fetchSingleUserById(ngoId);
      ngo.rejectedReportsCount = (ngo.rejectedReportsCount || 0) + 1;
      ngo.isHandlingReport = false;
      await this.usersRepository.findUserByIdAndUpdate(ngoId, ngo);
      report.ngo_dashboard_ids = []
      report.rejected_by = report.rejected_by || [];
      report.rejected_by.push(ngoId);

      report.rejection_reasons = report.rejection_reasons || [];
      report.rejection_reasons.push({
        reason: updateData.rejection_reason || 'No reason provided',
        rejected_by: ngoId,
        rejected_at: new Date(),
      });
    }

    await this.reportAssignmentRepository.create({
      ngoId: ngoId,
      reportId: reportId,
      status: ReportStatus.REJECTED,
      assignedAt: new Date(),
    });
    Object.assign(report, updateData);

    return this.reportsRepository.save(report as ReportDocument);
  }

  async findAll(){
    return this.reportsRepository.findAll()
  }

}
