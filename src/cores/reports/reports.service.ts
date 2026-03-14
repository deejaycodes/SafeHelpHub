import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Report } from 'src/common/entities/report.entity';
import { CreateIncidentDto } from '../../common/dtos/reportsDto';
import { uploadObject } from 'src/common/utils/upload';
import { UsersRepository } from 'src/basics/users/users.repository';
import { ReportsRepository } from './reports.repository';
import { ReportStatus, isValidTransition, getValidTransitions, getNextStatus, EVENTS_REQUIRING_REASON } from 'src/common/enums/report-status.enum';
import { AIAnalysisService } from 'src/basics/ai/ai-analysis.service';
import { REPORT_EVENTS } from 'src/common/events/event-names';
import { EventsGateway } from 'src/common/gateways/events.gateway';
import { ReportSubmittedEvent, ReportAnalyzedEvent } from 'src/common/events/event-payloads';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly aiAnalysisService: AIAnalysisService,
    private readonly eventEmitter: EventEmitter2,
    private readonly eventsGateway: EventsGateway,
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
        status_history: [{
          from: null,
          to: validation.status === 'UNCLEAR' ? ReportStatus.PENDING_REVIEW : ReportStatus.SUBMITTED,
          event: 'CREATE',
          reason: null,
          by: 'system',
          at: new Date(),
        }],
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
    updateData: Partial<Report> & { rejection_reason?: string; status?: string },
  ): Promise<Report> {
    // Legacy compatibility: map old status values to workflow events
    const statusToEvent: Record<string, string> = {
      accepted: 'ACCEPT',
      rejected: 'REFER',
      resolved: 'RESOLVE',
      in_progress: 'ACCEPT',
    };

    if (updateData.status) {
      const event = statusToEvent[updateData.status] || updateData.status;
      // If the report is in 'submitted' state and event is ACCEPT, auto-transition through REVIEW first
      const report = await this.reportsRepository.fetchSingleReportById(reportId);
      if (report && report.status === ReportStatus.SUBMITTED && event === 'ACCEPT') {
        await this.transitionReport(reportId, ngoId, 'REVIEW');
      }
      return this.transitionReport(reportId, ngoId, event, updateData.rejection_reason);
    }

    // If no status change, just save other fields
    const report = await this.reportsRepository.fetchSingleReportById(reportId);
    if (!report) throw new NotFoundException('Report not found');
    Object.assign(report, updateData);
    return this.reportsRepository.save(report);
  }

  async findAll(){
    return this.reportsRepository.findAll()
  }

  async findByNgo(ngoId: string) {
    return this.reportsRepository.findReportsByNgo(ngoId);
  }

  /**
   * Transition a report through the workflow state machine
   */
  async transitionReport(
    reportId: string,
    ngoId: string,
    event: string,
    reason?: string,
  ): Promise<Report> {
    const report = await this.reportsRepository.fetchSingleReportById(reportId);
    if (!report) throw new NotFoundException('Report not found');

    const user = await this.usersRepository.fetchSingleUserById(ngoId);
    if (!user) throw new UnauthorizedException('Not authorized');

    // Handle UNDO — roll back to previous status
    if (event === 'UNDO') {
      if (!report.status_history || report.status_history.length === 0) {
        throw new BadRequestException('Nothing to undo');
      }
      const lastEntry = report.status_history[report.status_history.length - 1];
      if (lastEntry.event === 'UNDO') {
        throw new BadRequestException('Cannot undo an undo');
      }
      const previousStatus = report.status;
      report.status = lastEntry.from as ReportStatus;
      report.status_history.push({
        from: previousStatus,
        to: lastEntry.from,
        event: 'UNDO',
        reason: reason || `Rolled back from ${previousStatus}`,
        by: user.admin_name || ngoId,
        at: new Date(),
      });
      return this.reportsRepository.save(report);
    }

    if (!isValidTransition(report.status, event)) {
      const valid = getValidTransitions(report.status);
      throw new BadRequestException(
        `Cannot perform "${event}" on a report with status "${report.status}". Valid actions: ${valid.join(', ') || 'none'}`,
      );
    }

    if (EVENTS_REQUIRING_REASON.includes(event) && !reason) {
      throw new BadRequestException(`A reason is required for "${event}"`);
    }

    const nextStatus = getNextStatus(report.status, event);
    const previousStatus = report.status;
    report.status = nextStatus;

    // Track status history
    if (!report.status_history) report.status_history = [];
    report.status_history.push({
      from: previousStatus,
      to: nextStatus,
      event,
      reason: reason || null,
      by: user.admin_name || ngoId,
      at: new Date(),
    });

    // Handle side effects per event
    if (event === 'ACCEPT') {
      report.accepted_by = report.accepted_by || [];
      if (!report.accepted_by.includes(ngoId)) report.accepted_by.push(ngoId);
      // Lock to this NGO only — remove other NGOs from dashboard
      const removedNgoIds = (report.ngo_dashboard_ids || []).filter(id => id !== ngoId);
      report.ngo_dashboard_ids = [ngoId];
      // Notify removed NGOs in real-time
      if (removedNgoIds.length > 0) {
        this.eventsGateway.notifyNgos(removedNgoIds, 'cases:refresh');
      }
      user.acceptReportsCount = (user.acceptReportsCount || 0) + 1;
      user.isHandlingReport = true;
      await this.usersRepository.findUserByIdAndUpdate(ngoId, user);
    } else if (event === 'RESOLVE') {
      user.resolvedReportsCount = (user.resolvedReportsCount || 0) + 1;
      await this.usersRepository.findUserByIdAndUpdate(ngoId, user);
    } else if (event === 'REFER') {
      report.rejection_reasons = report.rejection_reasons || [];
      report.rejection_reasons.push({ reason: reason || 'Referred', rejected_by: ngoId, rejected_at: new Date() });
    }

    const saved = await this.reportsRepository.save(report);
    // Notify all NGOs on this report's dashboard
    this.eventsGateway.notifyNgos(saved.ngo_dashboard_ids || [], 'cases:refresh');
    return saved;
  }

  /**
   * Event Listener: Update report after AI analysis completes
   */
  @OnEvent(REPORT_EVENTS.ANALYZED)
  async handleReportAnalyzed(payload: ReportAnalyzedEvent) {
    this.logger.log(`Updating report ${payload.reportId} with AI analysis results`);

    try {
      const report = await this.reportsRepository.fetchSingleReportById(payload.reportId);
      
      if (!report) {
        this.logger.error(`Report ${payload.reportId} not found`);
        return;
      }

      // Update report with FULL AI analysis from Python service
      report.ai_analysis = {
        urgency: payload.urgency,
        classification: payload.classification,
        immediate_danger: payload.immediateDanger,
        medical_attention_needed: payload.medicalAttentionNeeded,
        police_involvement_recommended: payload.policeInvolvementRecommended,
        extracted_entities: payload.extractedEntities,
        recommended_actions: payload.recommendedActions,
        recommended_ngo_types: payload.recommendedNgoTypes,
        psychological_state: payload.psychologicalState,
        action_plan: payload.actionPlan,
        analyzed_at: new Date(),
      };

      // Update status based on urgency
      if (payload.urgency === 'critical') {
        report.status = ReportStatus.SUBMITTED; // High priority for NGO
      }

      await this.reportsRepository.save(report);
      this.logger.log(`Report ${payload.reportId} updated with full AI analysis`);
    } catch (error) {
      this.logger.error(`Failed to update report ${payload.reportId}: ${error.message}`);
    }
  }

}
