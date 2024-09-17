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

@Module({
  imports: [
    SentryModule.forRoot(),
    UsersModule,
    PassportModule,
    ChatsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'defaultSecretKey',
      signOptions: { expiresIn: '1h' },
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forRoot(process.env.MONGO_URI),
    ReportsModule,
  ],
  controllers: [AppController, AuthsController],
  providers: [
    UsersRepository,
    AppService,
    UsersService,
    JwtService,
    LocalStrategy,
    JwtStrategy,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}
