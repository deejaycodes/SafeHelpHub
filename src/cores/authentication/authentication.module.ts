import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationService } from './authentication.service';
import { UsersService } from 'src/basics/users/users.service';
import { User } from 'src/common/entities/user.entity';
import { IncidentType } from 'src/common/entities/incident-type.entity';
import { Report } from 'src/common/entities/report.entity';
import { UsersRepository } from 'src/basics/users/users.repository';
import { LocalStrategy } from './strategy/local-strategy';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/basics/email/email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, IncidentType, Report]),
  ],
  providers: [
    AuthenticationService,
    UsersService,
    UsersRepository,
    LocalStrategy,
    JwtService,
    EmailService,
  ],
  exports: [AuthenticationService],
})
export class AuthenticationModule {}
