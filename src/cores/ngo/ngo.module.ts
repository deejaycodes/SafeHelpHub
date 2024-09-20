import { Module } from '@nestjs/common';
import { NgoController } from './ngo.controller';
import { NgoService } from './ngo.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/common/schemas/users.schema';
import { UsersRepository } from 'src/basics/users/users.repository';
import { UsersService } from 'src/basics/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/basics/email/email.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [NgoController],
  providers: [
    NgoService,
    UsersRepository,
    UsersService,
    JwtService,
    EmailService,
  ],
})
export class NgoModule {}
