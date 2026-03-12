import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Report } from 'src/common/entities/report.entity';
import { CreateIncidentDto } from '../../common/dtos/reportsDto';
import { uploadObject } from 'src/common/utils/upload';
import { UsersRepository } from 'src/basics/users/users.repository';
import { ReportsRepository } from './reports.repository';
import { ReportStatus } from 'src/common/enums/report-status.enum';
import { NigerianStates } from 'src/common/enums/nigeria-states.enum';
import { AIAnalysisService } from 'src/basics/ai/ai-analysis.service';
import { REPORT_EVENTS } from 'src/common/events/event-names';
import { ReportSubmittedEvent } from 'src/common/events/event-payloads';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly aiAnalysisService: AIAnalysisService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createIncidentWithFile(
    createIncidentDto: CreateIncidentDto,
    files?: any,
    userId?: string,
  ): Promise<Report> {
    try {
      const fileUrls: Array<{ file_path: string; uploaded_at: Date }> = [];
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
            fileUrls.push({ file_path: fileUrl, uploaded_at: new Date() });
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

      // Step 1: Validate report (spam detection)
      const validation = await this.aiAnalysisService.validateReport(
        createIncidentDto.description || createIncidentDto.incident_type,
        createIncidentDto.incident_type,
      );

      // If spam, reject immediately
      if (!validation.isValid) {
        throw new BadRequestException({
          success: false,
          message: 'Report could not be submitted. Please provide a detailed description of the incident.',
          validation: {
            status: validation.status,
            reason: validation.reason,
          },
        });
      }

      // Step 2: Create report with PENDING_ANALYSIS status (instant response to user)
      const newIncident = {
        ...createIncidentDto,
        files: fileUrls,
        user_id: userId || 'anonymous',
        validation: {
          is_valid: validation.isValid,
          status: validation.status,
          reason: validation.reason,
          confidence: validation.confidence,
          validated_at: new Date(),
        },
        status: validation.status === 'UNCLEAR' 
          ? ReportStatus.PENDING_REVIEW 
          : ReportStatus.SUBMITTED,
      };

      const createdReport = await this.reportsRepository.createIncident(newIncident);

      // Step 3: Emit event for async AI analysis (don't block user)
      this.eventEmitter.emit(REPORT_EVENTS.SUBMITTED, {
        reportId: createdReport.id,
        description: createIncidentDto.description,
        incidentType: createIncidentDto.incident_type,
        location: createIncidentDto.location,
      } as ReportSubmittedEvent);

      // Return immediately to user (they don't wait for AI analysis)
      return createdReport;
    } catch (error) {
      throw new BadRequestException(
        `Error creating incident: ${error.message}`,
      );
    }
  }
  
  async fetchReportStatus(reportId: string) {
    const report = await this.reportsRepository.fetchSingleReportById(reportId);

    return report;
  }

  async updateReport(
    reportId: string,
    ngoId: any,
    updateData: Partial<Report> & { rejection_reason?: string },
  ): Promise<Report> {
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
      // TODO: Migrate ReportAssignment to TypeORM
      // await this.reportAssignmentRepository.create({
      //   ngoId: ngoId,
      //   reportId: reportId,
      //   status: ReportStatus.ACCEPTED,
      //   assignedAt: new Date(),
      // });
    } else if (updateData.status === ReportStatus.RESOLVED) {

     

      report.status = ReportStatus.RESOLVED;

      const ngo = await this.usersRepository.fetchSingleUserById(ngoId);
      ngo.resolvedReportsCount = (ngo.resolvedReportsCount || 0) + 1;
      await this.usersRepository.findUserByIdAndUpdate(ngoId, ngo);

      // TODO: Migrate ReportAssignment to TypeORM
      // await this.reportAssignmentRepository.create({
      //   ngoId: ngoId,
      //   reportId: reportId,
      //   status: ReportStatus.RESOLVED,
      //   assignedAt: new Date(),
      // });

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

    // TODO: Migrate ReportAssignment to TypeORM
    // await this.reportAssignmentRepository.create({
    //   ngoId: ngoId,
    //   reportId: reportId,
    //   status: ReportStatus.REJECTED,
    //   assignedAt: new Date(),
    // });
    Object.assign(report, updateData);

    return this.reportsRepository.save(report);
  }

  async findAll(){
    return this.reportsRepository.findAll()
  }

}
