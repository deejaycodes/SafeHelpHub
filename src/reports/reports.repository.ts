import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { CreateIncidentDto } from "./dtos/reports.dto";
import { Report, ReportDocument } from './schemas/reports.schemas';
import { Model, Types } from 'mongoose';



@Injectable()
export class ReportsRepository {
    constructor(
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    ) {}
    

     async createIncident(createIncidentDto: CreateIncidentDto): Promise<Report>{
     const createdIncident = new this.reportModel(createIncidentDto);
     return await createdIncident.save();
    }

    async fetchSingleReportById(reportId: Types.ObjectId | string): Promise<Report | null> {
    try {
    const objectId = typeof reportId === 'string' ? new Types.ObjectId(reportId) : reportId;
  
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
    const objectId = typeof reportId === 'string' ? new Types.ObjectId(reportId) : reportId;

    const updatedReport = await this.reportModel.findByIdAndUpdate(
      objectId,
      { $push: { files: { file_path: filePath, uploaded_at: new Date() } } }, 
      { new: true }, 
    ).exec();

    if (!updatedReport) {
      throw new NotFoundException(`report ${reportId} not found`);
    }

    return updatedReport;
  }
}