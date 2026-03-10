import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthsController } from '../../cores/authentication/auths.controller';
import { UsersService } from './users.service';
import { User } from '../../common/entities/user.entity';
import { IncidentType } from 'src/common/entities/incident-type.entity';
import { Report } from 'src/common/entities/report.entity';
import { LocalStrategy } from '../../cores/authentication/strategy/local-strategy';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersRepository } from './users.repository';
import { AuthenticationService } from 'src/cores/authentication/authentication.service';
import { EmailService } from '../email/email.service';
import { ReportsRepository } from 'src/cores/reports/reports.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, IncidentType, Report]),
    PassportModule,
  ],
  controllers: [AuthsController],
  providers: [
    UsersRepository,
    ReportsRepository,
    UsersService,
    LocalStrategy,
    AuthenticationService,
    JwtService,
    EmailService,
  ],
  exports: [UsersRepository, UsersService],
})
export class UsersModule {}
