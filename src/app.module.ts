import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { UsersModule } from './users/users.module';
import { User, UserSchema } from './users/schemas/users.schema';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './users/strategy/local-strategy';
import { JwtStrategy } from './users/strategy/jwtStrategy';

@Module({
  imports:  [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'defaultSecretKey',
      signOptions: { expiresIn: '1h' },
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forRoot(process.env.MONGO_URI),
    
  ],
  controllers: [AppController, UsersController],
  providers: [AppService, UsersService, JwtService, LocalStrategy, JwtStrategy],
})
export class AppModule {}
