import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/users.schema';
import { LocalStrategy } from './strategy/local-strategy';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { jwtConstants } from './strategy/constants';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersRepository } from './users.repository';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        PassportModule,
       JwtModule.register({
      secret: jwtConstants.secret|| 'secret',
      signOptions: { expiresIn: jwtConstants.LOGIN_EXPIRY },
    }),
    JwtModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          secret: configService.get('JWT_KEY'),
        }),
      }),
      ],
    controllers: [ UsersController],
    providers: [UsersRepository, UsersService, LocalStrategy]
})
export class UsersModule {}
