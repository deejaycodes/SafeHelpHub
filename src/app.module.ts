import { Module, ValidationPipe } from '@nestjs/common';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthsController } from './cores/authentication/auths.controller';
import { UsersService } from './basics/users/users.service';
import { UsersModule } from './basics/users/users.module';
import { User, UserSchema } from './common/schemas/users.schema';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './cores/authentication/strategy/local-strategy';
import { JwtStrategy } from './cores/authentication/strategy/jwtStrategy';
import { ReportsModule } from './cores/reports/reports.module';
import { UsersRepository } from './basics/users/users.repository';
import { ChatsModule } from './basics/chats/chats.module';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { AuthenticationService } from './cores/authentication/authentication.service';
import { AuthenticationModule } from './cores/authentication/authentication.module';
import { jwtConstants } from './cores/authentication/strategy/constants';
import { EmailModule } from './basics/email/email.module';
import { EmailService } from './basics/email/email.service';
import { NgoModule } from './cores/ngo/ngo.module';
import { NgoService } from './cores/ngo/ngo.service';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: jwtConstants.LOGIN_EXPIRY },
    }),
    SentryModule.forRoot(),
    //EmailModule,
    UsersModule,
    PassportModule,
    ChatsModule,
    NgoModule,
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forRoot(process.env.MONGO_URI),
    ReportsModule,
    AuthenticationModule,
    EmailModule,
  ],
  controllers: [AppController, AuthsController],
  providers: [
    UsersRepository,
    AppService,
    AuthenticationService,
    UsersService,
    JwtService,
    EmailService,
    LocalStrategy,
    JwtStrategy,
    NgoService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    AuthenticationService,
  ],
})
export class AppModule {}
