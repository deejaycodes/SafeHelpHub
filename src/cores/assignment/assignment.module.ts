import { Module } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { ReportsRepository } from '../reports/reports.repository';
import { UsersRepository } from 'src/basics/users/users.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from 'src/common/entities/report.entity';
import { User } from 'src/common/entities/user.entity';
import { IncidentType } from 'src/common/entities/incident-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Report, User, IncidentType])],
  providers: [AssignmentService, ReportsRepository, UsersRepository],
  exports: [AssignmentService],
})
export class AssignmentModule {}
