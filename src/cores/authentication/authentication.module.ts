import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { UsersService } from 'src/basics/users/users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/common/schemas/users.schema';
import { UsersRepository } from 'src/basics/users/users.repository';
import { LocalStrategy } from './strategy/local-strategy';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { jwtConstants } from './strategy/constants';
import { EmailService } from 'src/basics/email/email.service';
import { EmailModule } from 'src/basics/email/email.module';

@Module({
  imports: [
    EmailModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
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
