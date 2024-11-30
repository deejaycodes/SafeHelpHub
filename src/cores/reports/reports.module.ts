import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportSchema, Report } from './schemas/reports.schemas';
import { User, UserSchema } from 'src/common/schemas/users.schema';
import { UsersRepository } from 'src/basics/users/users.repository';
import { ReportsRepository } from './reports.repository';
import { ReportAssignmentService } from './reports-assignment';
import { ScheduleModule } from '@nestjs/schedule';
import {Notification,  NotificationSchema } from 'src/common/schemas/notification.schema';
import { IncidentType, IncidentTypeSchema } from 'src/basics/incident/entities/incident.schema';
import { ReportAssignment, ReportAssignmentSchema } from './schemas/report_status.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema },
      { name:Notification.name, schema: NotificationSchema},
      { name: User.name, schema: UserSchema },
      {name:IncidentType.name, schema:IncidentTypeSchema},
      {name:ReportAssignment.name, schema:ReportAssignmentSchema}
    ]),
    ScheduleModule.forRoot(),
  ],
  providers: [
    UsersRepository,
    ReportsRepository,
    ReportAssignmentService,
    ReportsService,
  ],
  controllers: [ReportsController],
})
export class ReportsModule {}
