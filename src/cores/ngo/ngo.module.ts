import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NgoController } from './ngo.controller';
import { NgoStatsController } from './ngo-stats.controller';
import { NgoService } from './ngo.service';
import { User } from 'src/common/entities/user.entity';
import { Report } from 'src/common/entities/report.entity';
import { IncidentType } from 'src/common/entities/incident-type.entity';
import { UsersRepository } from 'src/basics/users/users.repository';
import { UsersService } from 'src/basics/users/users.service';
import { ReportsRepository } from '../reports/reports.repository';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/basics/email/email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Report, IncidentType]),
  ],
  controllers: [NgoController, NgoStatsController],
  providers: [
    NgoService,
    UsersRepository,
    ReportsRepository,
    UsersService,
    JwtService,
    EmailService,
  ],
  exports: [NgoService],
})
export class NgoModule {}
