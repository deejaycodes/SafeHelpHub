import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { UsersService } from 'src/basics/users/users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/common/schemas/users.schema';
import { UsersRepository } from 'src/basics/users/users.repository';
import { LocalStrategy } from './strategy/local-strategy';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/basics/email/email.service';
import { IncidentType, IncidentTypeSchema } from 'src/basics/incident/entities/incident.schema';

@Module({
  imports: [
    //EmailModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema },
      {name:IncidentType.name, schema:IncidentTypeSchema}
    ]),
  ],
  providers: [
    AuthenticationService,
    UsersService,
    UsersRepository,
    UsersService,
    LocalStrategy,
    JwtService,
    EmailService,
  ],
})
export class AuthenticationModule {}
