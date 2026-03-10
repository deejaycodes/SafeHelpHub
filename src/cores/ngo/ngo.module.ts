import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NgoController } from './ngo.controller';
import { NgoService } from './ngo.service';
import { User } from 'src/common/entities/user.entity';
import { IncidentType } from 'src/common/entities/incident-type.entity';
import { UsersRepository } from 'src/basics/users/users.repository';
import { UsersService } from 'src/basics/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/basics/email/email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, IncidentType]),
  ],
  controllers: [NgoController],
  providers: [
    NgoService,
    UsersRepository,
    UsersService,
    JwtService,
    EmailService,
  ],
  exports: [NgoService],
})
export class NgoModule {}
