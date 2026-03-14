import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { User } from 'src/common/entities/user.entity';
import { EmailModule } from 'src/basics/email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), EmailModule],
  controllers: [TeamController],
  providers: [TeamService],
})
export class TeamModule {}
