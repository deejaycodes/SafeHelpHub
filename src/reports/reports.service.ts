import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Report, ReportDocument } from './schemas/reports.schemas';
import { Model, Types } from 'mongoose';
import { CreateIncidentDto } from './dtos/reports.dto';
import { UsersService } from 'src/users/users.service';
import { uploadObject } from 'src/utils/upload';

@Injectable()

export class ReportsService {
    constructor(
    @InjectModel(Report.name) private incidentModel: Model<ReportDocument>,
    private readonly userService: UsersService
      ) {}
    async createIncident(createIncidentDto: CreateIncidentDto, userId: string | null): Promise<Report> {
        try {
    // Ensure userId is a valid ObjectId
    const userObjectId = userId ? new Types.ObjectId(userId) : null;  
    // Fetch user by ObjectId
    const user = userObjectId ? await this.userService.fetchSingleUserById(userObjectId) : null
    if (userObjectId && !user) {
        throw new BadRequestException('User not found');
    }

    const userIdString = userObjectId ? userObjectId.toString() : null;
    // Create a new incident
    const newIncident = new this.incidentModel({
        ...createIncidentDto,
        user_id:userIdString, 
    });

    return await newIncident.save();
     } catch (error) {
    throw new BadRequestException(`Error creating incident: ${error.message}`);
     }
  }

  async uploadReportFile(
    reportId: Types.ObjectId | string,
    file: Express.Multer.File,
  ): Promise<Report> {
    const { originalname, buffer } = file;
    const idFileType = originalname.slice(originalname.lastIndexOf('.'));
    const objectId = typeof reportId === 'string' ? new Types.ObjectId(reportId) : reportId
    const report = await this.incidentModel.findById(objectId).exec();
    if (!report) {
      throw new NotFoundException(`report ${reportId} not found`);
    }

    const documentPath = `file-identification/${reportId}${idFileType}`;

    const uploadResponse = await uploadObject({
      Bucket: 'sportycredit',
      Key: documentPath,
      Body: buffer,
      ACL: 'public-read',
    });

    if (uploadResponse?.$metadata?.httpStatusCode === 200) {
        // Update the report's files array directly
        const updatedReport = await this.incidentModel.findByIdAndUpdate(
          objectId,
          { $push: { files: { file_path: `${process.env.STORAGE_URL}/${documentPath}`, uploaded_at: new Date() } } },
          { new: true } 
        ).exec();
  
        if (!updatedReport) {
          throw new NotFoundException(`Report ${reportId} not found`);
        }
  
        return updatedReport;
      }
  
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: {
            identity: uploadResponse,
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }
}