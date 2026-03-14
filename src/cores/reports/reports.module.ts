import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Report } from 'src/common/entities/report.entity';
import { User } from 'src/common/entities/user.entity';
import { Notification } from 'src/common/entities/notification.entity';
import { IncidentType } from 'src/common/entities/incident-type.entity';
import { UsersRepository } from 'src/basics/users/users.repository';
import { ReportsRepository } from './reports.repository';
import { ScheduleModule } from '@nestjs/schedule';
import { AIAnalysisModule } from 'src/basics/ai/ai-analysis.module';
import { EventsGateway } from 'src/common/gateways/events.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, Notification, User, IncidentType]),
    ScheduleModule.forRoot(),
    AIAnalysisModule,
  ],
  providers: [
    UsersRepository,
    ReportsRepository,
    ReportsService,
    EventsGateway,
  ],
  controllers: [ReportsController],
  exports: [ReportsRepository, ReportsService],
})
export class ReportsModule {}
