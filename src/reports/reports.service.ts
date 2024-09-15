import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Report, ReportDocument } from './schemas/reports.schemas';
import { Model, Types } from 'mongoose';
import { CreateIncidentDto } from './dtos/reports.dto';
import { uploadObject } from 'src/utils/upload';
import { UsersRepository } from 'src/users/users.repository';
import { ReportsRepository } from './reports.repository';

@Injectable()

export class ReportsService {
    constructor(
    private readonly reportsRepository:ReportsRepository,
    private readonly usersRepository: UsersRepository
      ) {}
    async createIncident(createIncidentDto: CreateIncidentDto, userId: string | null): Promise<Report> {
        try {
    // Ensure userId is a valid ObjectId
    const userObjectId = userId ? new Types.ObjectId(userId) : null;  
    // Fetch user by ObjectId
    const user = userObjectId ? await this.usersRepository.fetchSingleUserById(userObjectId) : null
    if (userObjectId && !user) {
        throw new BadRequestException('User not found');
    }

    const userIdString = userObjectId ? userObjectId.toString() : null;
    // Create a new incident
    const newIncident = {
        ...createIncidentDto,
        user_id:userIdString, 
    }

    return await this.reportsRepository.createIncident(newIncident);
     } catch (error) {
    throw new BadRequestException(`Error creating incident: ${error.message}`);
     }
  }

  async uploadReportFile(
    reportId: Types.ObjectId | string,
    file: any,
  ): Promise<Report> {
    const { originalname, buffer } = file;
    const idFileType = originalname.slice(originalname.lastIndexOf('.'));
    const objectId = typeof reportId === 'string' ? new Types.ObjectId(reportId) : reportId;

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
}