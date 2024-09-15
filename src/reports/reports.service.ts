import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Report, ReportDocument } from './schemas/reports.schemas';
import { Model, Types } from 'mongoose';
import { CreateIncidentDto } from './dtos/reports.dto';
import { UsersService } from 'src/users/users.service';

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
}