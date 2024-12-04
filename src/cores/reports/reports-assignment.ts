import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User} from 'src/common/schemas/users.schema';
import { Report, } from './schemas/reports.schemas';
import { Notification,  } from 'src/common/schemas/notification.schema';

@Injectable()
export class ReportAssignmentService {
  private readonly logger = new Logger(ReportAssignmentService.name);

  constructor(
    @InjectModel(Report.name) private reportModel: Model<Report>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
  ) {}

  // Cron job to assign reports to NGOs
  @Cron(CronExpression.EVERY_MINUTE)
  async assignReportsToNGOs() {
    this.logger.debug('Running report assignment job...');

    const unassignedReports = await this.reportModel
      .find({
        status: 'submitted',
        isProcessing: false, 
      })
      .exec();

    for (const report of unassignedReports) {
      const updatedReport = await this.reportModel.findOneAndUpdate(
        { _id: report._id, isProcessing: false },
        { $set: { isProcessing: true } },
        { new: true },
      );

      if (!updatedReport) {
        this.logger.debug(`Report ${report._id} is already being processed.`);
        continue;
      }

      const ngosByCriteria = await this.userModel
        .find({
          role: 'ngo',
          'primary_location.state': report.location,
          isHandlingReport: false,
        })
        .sort({
          rank: -1,
          resolvedReportsCount: -1,
          rejectedReportsCount: 1,
        })
        .exec();

      if (ngosByCriteria.length > 0) {
        const highestRank = ngosByCriteria[0].rank;
        const highestRankNgos = ngosByCriteria.filter(
          (ngo) => ngo.rank === highestRank,
        );

        const selectedNgo =
          highestRankNgos[Math.floor(Math.random() * highestRankNgos.length)];

        this.logger.debug(
          `Report ${report._id} located in ${report.location} matched to NGO ${selectedNgo._id} with rank ${selectedNgo.rank}, ` +
            `${selectedNgo.resolvedReportsCount} resolved cases, and ${selectedNgo.rejectedReportsCount} rejected cases.`,
        );
        await this.reportModel.updateOne(
          { _id: report._id }, 
          {
            $set: {
              ngo_dashboard_ids: [selectedNgo._id.toString()],
            },
          },
        );
        selectedNgo.isHandlingReport = false;
        await selectedNgo.save();

        for (const ngo of highestRankNgos) {
          await this.notificationModel.create({
            ngoId: ngo._id.toString(),
            reportId: report._id.toString(),
            message: `A new report has been assigned. You can accept it. Report ID: ${report._id} located in ${report.location}.`,
            status: 'unread',
          });
        }
      } else {
        this.logger.debug(
          `No suitable available NGO found for Report ${report._id} in ${report.location}.`,
        );
      }
      report.isProcessing = false;
      await report.save();
    }
  }

  @Cron('*/90 * * * * *') 
  async reassignRejectedReports() {
    this.logger.debug('Running rejected report reassignment job...');

    const rejectedReports = await this.reportModel
      .find({
        status: 'rejected',
        isProcessing: false, 
      })
      .exec();

    for (const report of rejectedReports) {
      const updatedReport = await this.reportModel.findOneAndUpdate(
        { _id: report._id, isProcessing: false },
        { $set: { isProcessing: true } },
        { new: true },
      );

      if (!updatedReport) {
        this.logger.debug(`Report ${report._id} is already being processed.`);
        continue;
      }

      const ngosByCriteria = await this.userModel
        .find({
          role: 'ngo',
          'primary_location.state': report.location,
          isHandlingReport: false,
          _id: { $nin: report.rejected_by }, 
        })
        .sort({
          rank: -1,
          resolvedReportsCount: -1,
          rejectedReportsCount: 1,
        })
        .exec();

      if (ngosByCriteria.length > 0) {
        const highestRank = ngosByCriteria[0].rank;
        const highestRankNgos = ngosByCriteria.filter(
          (ngo) => ngo.rank === highestRank,
        );
        const selectedNgo =
          highestRankNgos[Math.floor(Math.random() * highestRankNgos.length)];

        this.logger.debug(
          `Reassigning report ${report._id} located in ${report.location} to NGO ${selectedNgo._id} with rank ${selectedNgo.rank}, ` +
            `${selectedNgo.resolvedReportsCount} resolved cases, and ${selectedNgo.rejectedReportsCount} rejected cases.`,
        );

        report.ngo_dashboard_ids = [selectedNgo._id.toString()];
        report.assignedUsers=  [selectedNgo._id.toString()];
        await report.save();
        await selectedNgo.save();

        for (const ngo of highestRankNgos) {
          const notification = new this.notificationModel({
            ngoId: ngo._id.toString(),
            reportId: report._id.toString(),
            message: `A new report has been assigned. You can accept it. Report ID: ${report._id} located in ${report.location}.`,
            status: 'unread',
          });
          await notification.save();
        }
      } else {
        this.logger.debug(
          `No suitable available NGO found for reassigning Report ${report._id} in ${report.location}.`,
        );
      }
      report.isProcessing = false;
      await report.save();
    }
  }
}