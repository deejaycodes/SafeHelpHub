import { Module } from '@nestjs/common';
import { AuthsController } from '../../cores/authentication/auths.controller';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../common/schemas/users.schema';
import { LocalStrategy } from '../../cores/authentication/strategy/local-strategy';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersRepository } from './users.repository';
import { AuthenticationService } from 'src/cores/authentication/authentication.service';
import { EmailService } from '../email/email.service';
import { IncidentType, IncidentTypeSchema } from '../incident/entities/incident.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema },
       { name: 'IncidentType', schema: IncidentTypeSchema },
    ]),
    PassportModule,
    UsersModule,
  ],
  controllers: [AuthsController],
  providers: [
    UsersRepository,
    UsersService,
    LocalStrategy,
    AuthenticationService,
    JwtService,
    EmailService,
  ],
})
export class UsersModule {}
