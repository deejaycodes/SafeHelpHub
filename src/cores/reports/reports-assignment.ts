import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/common/schemas/users.schema';
import { Report, ReportDocument } from './schemas/reports.schemas';

@Injectable()
export class ReportAssignmentService {
  private readonly logger = new Logger(ReportAssignmentService.name);

  constructor(
    @InjectModel(Report.name) private readonly reportModel: Model<ReportDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async assignReportsToNGOs() {
      this.logger.debug('Running report assignment job...');
  
      const unassignedReports = await this.reportModel.find({ status: 'submitted' }).exec();
  
      for (const report of unassignedReports) {
          const suitableNgos = await this.userModel.find({
              role: 'ngo',
              'primary_location.city': report.location,
          }).exec();
  
          const ngoIds: string[] = suitableNgos.map(ngo => ngo._id.toString()); 
          this.logger.debug(
              `Report ${report._id} located in ${report.location} matched to ${ngoIds.length} NGOs.`,
          );
  
          report.ngo_dashboard_ids = ngoIds;
          await report.save(); 
      }
  }  
}
