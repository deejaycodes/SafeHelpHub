import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersController } from './cores/authentication/auths.controller';
import { UsersService } from './cores/users/users.service';
import { UsersModule } from './cores/users/users.module';
import { User, UserSchema } from './common/schemas/users.schema';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './cores/authentication/strategy/local-strategy';
import { JwtStrategy } from './cores/authentication/strategy/jwtStrategy';
import { ReportsModule } from './cores/reports/reports.module';
import { UsersRepository } from './cores/users/users.repository';
import { ChatsModule } from './basics/chats/chats.module';

@Module({
  imports: [
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
  controllers: [AppController, UsersController],
  providers: [
    UsersRepository,
    AppService,
    UsersService,
    JwtService,
    LocalStrategy,
    JwtStrategy,
  ],
})
export class AppModule {}
