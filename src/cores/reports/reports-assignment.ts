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
          const ngosByCriteria = await this.userModel.find({
              role: 'ngo',
              'primary_location.city': report.location,
              isHandlingReport: false,
          })
          .sort({ 
              rank: -1,               
              resolvedReportsCount: -1, 
              rejectedReportsCount: 1   
          })
          .exec();
          
  
          if (ngosByCriteria.length > 0) {
              const highestRank = ngosByCriteria[0].rank;
              const highestRankNgos = ngosByCriteria.filter(ngo => ngo.rank === highestRank);

              const selectedNgo = highestRankNgos[Math.floor(Math.random() * highestRankNgos.length)];
  
              this.logger.debug(
                  `Report ${report._id} located in ${report.location} matched to NGO ${selectedNgo._id} with rank ${selectedNgo.rank}, 
                  ${selectedNgo.resolvedReportsCount} resolved cases, and ${selectedNgo.rejectedReportsCount} rejected cases.`
              );
  
              report.ngo_dashboard_ids = [selectedNgo._id.toString()];
              await report.save();
  
              selectedNgo.isHandlingReport = true;
              await selectedNgo.save();
          } else {
              this.logger.debug(`No suitable available NGO found for Report ${report._id} in ${report.location}.`);
          }
      }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async reassignRejectedReports() {
    this.logger.debug('Running rejected report reassignment job...');
    
    const rejectedReports = await this.reportModel.find({ status: 'rejected' }).exec();

    for (const report of rejectedReports) {
      const ngosByCriteria = await this.userModel.find({
        role: 'ngo',
        'primary_location.city': report.location,
        isHandlingReport: false,
        _id: { $nin: report.rejected_by }
      })
      .sort({
        rank: -1,
        resolvedReportsCount: -1,
        rejectedReportsCount: 1
      })
      .exec();

      if (ngosByCriteria.length > 0) {
        const highestRank = ngosByCriteria[0].rank;
        const highestRankNgos = ngosByCriteria.filter(ngo => ngo.rank === highestRank);
        const selectedNgo = highestRankNgos[Math.floor(Math.random() * highestRankNgos.length)];

        this.logger.debug(
          `Reassigning report ${report._id} located in ${report.location} to NGO ${selectedNgo._id} with rank ${selectedNgo.rank}, ` +
          `${selectedNgo.resolvedReportsCount} resolved cases, and ${selectedNgo.rejectedReportsCount} rejected cases.`
        );

        report.ngo_dashboard_ids = [selectedNgo._id.toString()];
        await report.save();
        await selectedNgo.save();
      } else {
        this.logger.debug(`No suitable available NGO found for reassigning Report ${report._id} in ${report.location}.`);
      }
    }
  }
}