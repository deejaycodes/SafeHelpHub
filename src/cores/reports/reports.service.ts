import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Report, ReportDocument } from './schemas/reports.schemas';
import { Types } from 'mongoose';
import { CreateIncidentDto } from '../../common/dtos/reportsDto';
import { uploadObject } from 'src/common/utils/upload';
import { UsersRepository } from 'src/basics/users/users.repository';
import { ReportsRepository } from './reports.repository';
import { ReportStatus } from 'src/common/enums/report-status.enum';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}
  async createIncident(
    createIncidentDto: CreateIncidentDto,
    userId: string | null,
  ): Promise<Report> {
    try {
      // Ensure userId is a valid ObjectId
      const userObjectId = userId ? new Types.ObjectId(userId) : null;
      // Fetch user by ObjectId
      const user = userObjectId
        ? await this.usersRepository.fetchSingleUserById(userObjectId)
        : null;
      if (userObjectId && !user) {
        throw new BadRequestException('User not found');
      }

      const userIdString = userObjectId ? userObjectId.toString() : null;
      // Create a new incident
      const newIncident = {
        ...createIncidentDto,
        user_id: userIdString,
      };

      return await this.reportsRepository.createIncident(newIncident);
    } catch (error) {
      throw new BadRequestException(
        `Error creating incident: ${error.message}`,
      );
    }
  }

  async uploadReportFile(
    reportId: Types.ObjectId | string,
    file: any,
  ): Promise<Report> {
    const { originalname, buffer } = file;
    const idFileType = originalname.slice(originalname.lastIndexOf('.'));
    const objectId =
      typeof reportId === 'string' ? new Types.ObjectId(reportId) : reportId;

    // Ensure the report exists
    const report = await this.reportsRepository.fetchSingleReportById(objectId);
    if (!report) {
      throw new NotFoundException(`Report ${reportId} not found`);
    }

    // Create the document path for the file
    const documentPath = `file-identification/${reportId}${idFileType}`;

    // Upload the file to the storage bucket
    const uploadResponse = await uploadObject({
      Bucket: 'sportycredit',
      Key: documentPath,
      Body: buffer,
      ACL: 'public-read',
    });

    // Check if the upload was successful
    if (uploadResponse?.$metadata?.httpStatusCode === 200) {
      const fileUrl = `${process.env.STORAGE_URL}/${documentPath}`;

      // Update the report's files array using repository method
      return await this.reportsRepository.updateReportFiles(objectId, fileUrl);
    }

    // Throw error if file upload failed
    throw new HttpException(
      {
        status: HttpStatus.BAD_REQUEST,
        error: 'File upload failed',
      },
      HttpStatus.BAD_REQUEST,
    );
  }

  async fetchReportStatus(reportId: Types.ObjectId | string,) {

    const report = await this.reportsRepository.fetchSingleReportById(reportId)

    return {status: report.status}
  }

  public async acceptOrRejectReport(
    reportId: string,
    ngoId: any,
    action: 'accept' | 'reject',
): Promise<ReportDocument> {
    // Fetch the report using the repository
    const report = await this.reportsRepository.fetchSingleReportById(reportId);

    if (!report) {
        throw new NotFoundException('Report not found.');
    }

    // Ensure the NGO has access to this report
    if (!report.ngo_dashboard_ids || !report.ngo_dashboard_ids.includes(ngoId)) {
        throw new ForbiddenException('You do not have access to this report.');
    }

    // Call the handleReport method to accept or reject
    return this.reportsRepository.handleReport(report as any, ngoId, action);
}


  async updateReport(reportId: string, ngoId: any, updateData: Partial<ReportDocument>): Promise<ReportDocument> {
    const report = await this.reportsRepository.fetchSingleReportById(reportId);
    
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.status === ReportStatus.ACCEPTED && report.user_id as unknown as any !== ngoId) {
      throw new ForbiddenException('Only the accepting NGO can update this report.');
    }

    if (report.status === ReportStatus.REJECTED) {
      throw new ConflictException('This report has been rejected and cannot be updated.');
    }
    Object.assign(report, updateData);

    return this.reportsRepository.save(report as ReportDocument);
  }
   
}
